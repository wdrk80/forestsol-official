const SESSION_DAYS=30;
const PBKDF2_ITERATIONS=120000;
const enc=new TextEncoder();

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const cors=corsHeaders(request);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    try{
      const res=await route(request,env,url);
      const h=new Headers(res.headers);Object.entries(cors).forEach(([k,v])=>h.set(k,v));
      return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h});
    }catch(err){console.error(err);return json({ok:false,error:err.message||'Internal error'},Number(err&&err.status)||500,cors)}
  }
};

function corsHeaders(req){
  const origin=req.headers.get('Origin')||'';
  const allowed=origin==='https://forestsol.jp'||origin==='https://www.forestsol.jp'||/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {'Access-Control-Allow-Origin':allowed?origin:'https://forestsol.jp','Vary':'Origin','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS','Access-Control-Max-Age':'86400'};
}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}})}
function now(){return new Date().toISOString()}
function addDays(iso,days){const d=new Date(iso);d.setUTCDate(d.getUTCDate()+days);return d.toISOString()}
function b64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function fromB64url(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
function randomToken(n=32){const a=new Uint8Array(n);crypto.getRandomValues(a);return b64url(a)}
async function sha256Text(s){return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))))}
async function hashPassword(password,saltText){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:fromB64url(saltText),iterations:PBKDF2_ITERATIONS},key,256);return b64url(new Uint8Array(bits))}
async function readJson(req){try{return await req.json()}catch{throw new Error('JSONが不正です')}}
function cleanUsername(v){return String(v||'').trim()}
function publicUser(u){return {id:u.id,username:u.username,display_name:u.display_name,avatar_url:u.avatar_url||'',bio:u.bio||'',role:u.role||'user',created_at:u.created_at||null}}

async function sessionUser(request,env,required=false){
  const m=(request.headers.get('Authorization')||'').match(/^Bearer\s+(.+)$/i);
  if(!m){if(required)throw authError();return null}
  const th=await sha256Text(m[1]);
  const row=await env.DB.prepare(`SELECT u.* , s.id AS session_id, s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status='active'`).bind(th,now()).first();
  if(!row){if(required)throw authError();return null}
  env.DB.prepare('UPDATE sessions SET last_seen_at=? WHERE id=?').bind(now(),row.session_id).run().catch(()=>{});
  return row;
}
function authError(){const e=new Error('ログインが必要です');e.status=401;return e}
function forbidden(){const e=new Error('この操作を行う権限がありません');e.status=403;return e}
function ownerOrAdmin(user,post){if(!user||(!['admin','moderator'].includes(user.role)&&user.id!==post.user_id))throw forbidden()}
function bucketFor(env,type){if(type==='skin')return env.SKINS;if(type==='model')return env.MODELS;return env.ASSETS}
function validStorage(type){return ['skin','asset','model'].includes(type)}
function validCategory(c){return ['skin','item','block','model'].includes(c)}
function validVisibility(v){return ['public','private','unlisted'].includes(v)}
function validStatus(v){return ['draft','published','archived'].includes(v)}

async function route(req,env,url){
  const path=url.pathname.replace(/\/+$/,'')||'/';
  if(path==='/'&&req.method==='GET')return json({ok:true,name:'Forest Craft API',version:'2.0-auth',auth:'registered-users-only'});
  if(path==='/db-test'&&req.method==='GET'){const r=await env.DB.prepare('SELECT COUNT(*) AS post_count FROM posts').first();return json({ok:true,post_count:Number(r?.post_count||0)})}

  if(path==='/auth/register'&&req.method==='POST')return register(req,env);
  if(path==='/auth/login'&&req.method==='POST')return login(req,env);
  if(path==='/auth/me'&&req.method==='GET'){const u=await sessionUser(req,env,true);return json({ok:true,user:publicUser(u)})}
  if(path==='/auth/logout'&&req.method==='POST')return logout(req,env);
  if(path==='/me'&&req.method==='PATCH')return updateMe(req,env);
  if(path==='/me/posts'&&req.method==='GET')return myPosts(req,env);

  let m=path.match(/^\/users\/([^/]+)$/);if(m&&req.method==='GET')return getUser(env,decodeURIComponent(m[1]));
  m=path.match(/^\/users\/([^/]+)\/posts$/);if(m&&req.method==='GET')return getUserPosts(env,decodeURIComponent(m[1]));

  if(path==='/posts'&&req.method==='GET')return listPosts(env,url);
  if(path==='/posts'&&req.method==='POST')return createPost(req,env);
  m=path.match(/^\/posts\/([^/]+)$/);
  if(m&&req.method==='GET')return getPost(req,env,m[1]);
  if(m&&req.method==='PATCH')return patchPost(req,env,m[1]);
  if(m&&req.method==='DELETE')return deletePost(req,env,m[1]);
  m=path.match(/^\/posts\/([^/]+)\/files$/);if(m&&req.method==='POST')return addFile(req,env,url,m[1]);
  m=path.match(/^\/files\/([^/]+)$/);if(m&&req.method==='GET')return serveFile(req,env,m[1],false);
  m=path.match(/^\/download\/([^/]+)$/);if(m&&req.method==='GET')return serveFile(req,env,m[1],true);

  // Legacy admin upload remains available only with UPLOAD_SECRET.
  if(path==='/upload'&&req.method==='POST')return legacyUpload(req,env,url);
  return json({ok:false,error:'Not found'},404);
}

async function register(req,env){
  const b=await readJson(req),username=cleanUsername(b.username),display=String(b.display_name||'').trim(),password=String(b.password||'');
  if(!/^[A-Za-z0-9_-]{3,24}$/.test(username))return json({ok:false,error:'ユーザー名は3〜24文字の英数字・_・-で入力してください'},400);
  if(display.length<1||display.length>40)return json({ok:false,error:'表示名は1〜40文字で入力してください'},400);
  if(password.length<8||password.length>128)return json({ok:false,error:'パスワードは8〜128文字で入力してください'},400);
  const exists=await env.DB.prepare('SELECT id FROM users WHERE lower(username)=lower(?)').bind(username).first();if(exists)return json({ok:false,error:'そのユーザー名は使用されています'},409);
  const salt=randomToken(16),hash=await hashPassword(password,salt),id='user_'+crypto.randomUUID(),t=now();
  await env.DB.prepare(`INSERT INTO users(id,username,display_name,avatar_url,role,status,password_hash,password_salt,bio,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id,username,display,'','user','active',hash,salt,'',t,t).run();
  const sess=await createSession(env,id,req);const user=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();return json({ok:true,token:sess,user:publicUser(user)},201);
}
async function login(req,env){
  const b=await readJson(req),login=cleanUsername(b.login),password=String(b.password||'');
  const u=await env.DB.prepare(`SELECT * FROM users WHERE lower(username)=lower(?) AND status='active'`).bind(login).first();
  if(!u||!u.password_hash||!u.password_salt)return json({ok:false,error:'ユーザー名またはパスワードが違います'},401);
  const hash=await hashPassword(password,u.password_salt);if(hash!==u.password_hash)return json({ok:false,error:'ユーザー名またはパスワードが違います'},401);
  const t=await createSession(env,u.id,req);return json({ok:true,token:t,user:publicUser(u)});
}
async function createSession(env,userId,req){const token=randomToken(32),hash=await sha256Text(token),t=now(),exp=addDays(t,SESSION_DAYS),id='sess_'+crypto.randomUUID();const ua=(req.headers.get('User-Agent')||'').slice(0,180),ip=(req.headers.get('CF-Connecting-IP')||'').split('.').slice(0,2).join('.');await env.DB.prepare('INSERT INTO sessions(id,user_id,token_hash,created_at,expires_at,last_seen_at,user_agent,ip_hint) VALUES(?,?,?,?,?,?,?,?)').bind(id,userId,hash,t,exp,t,ua,ip).run();return token}
async function logout(req,env){const m=(req.headers.get('Authorization')||'').match(/^Bearer\s+(.+)$/i);if(m){const h=await sha256Text(m[1]);await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(h).run()}return json({ok:true})}
async function updateMe(req,env){const u=await sessionUser(req,env,true),b=await readJson(req),name=String(b.display_name??u.display_name).trim(),bio=String(b.bio??u.bio??'').trim(),avatar=String(b.avatar_url??u.avatar_url??'').trim();if(!name||name.length>40)return json({ok:false,error:'表示名は1〜40文字です'},400);if(bio.length>500)return json({ok:false,error:'自己紹介は500文字までです'},400);if(avatar.length>500)return json({ok:false,error:'画像URLが長すぎます'},400);await env.DB.prepare('UPDATE users SET display_name=?,bio=?,avatar_url=?,updated_at=? WHERE id=?').bind(name,bio,avatar,now(),u.id).run();const fresh=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(u.id).first();return json({ok:true,user:publicUser(fresh)})}

const POST_SELECT=`SELECT p.*,u.username,u.display_name,u.avatar_url,COALESCE(ps.download_count,0) AS download_count,COALESCE(ps.view_count,0) AS view_count,0 AS rating_average,0 AS rating_count,(SELECT id FROM post_files pf WHERE pf.post_id=p.id AND pf.file_role IN ('preview','thumbnail') ORDER BY CASE pf.file_role WHEN 'preview' THEN 0 ELSE 1 END LIMIT 1) AS preview_file_id FROM posts p JOIN users u ON u.id=p.user_id LEFT JOIN post_stats ps ON ps.post_id=p.id`;
async function listPosts(env,url){const cat=url.searchParams.get('category'),limit=Math.min(Math.max(Number(url.searchParams.get('limit')||24),1),50),offset=Math.max(Number(url.searchParams.get('offset')||0),0);let where=` WHERE p.visibility='public' AND p.status='published'`;const args=[];if(cat&&validCategory(cat)){where+=' AND p.category=?';args.push(cat)}args.push(limit,offset);const r=await env.DB.prepare(POST_SELECT+where+' ORDER BY p.created_at DESC LIMIT ? OFFSET ?').bind(...args).all();return json({ok:true,posts:r.results||[]})}
async function myPosts(req,env){const u=await sessionUser(req,env,true);const r=await env.DB.prepare(POST_SELECT+' WHERE p.user_id=? ORDER BY p.created_at DESC').bind(u.id).all();return json({ok:true,posts:r.results||[]})}
async function getUser(env,username){const u=await env.DB.prepare(`SELECT * FROM users WHERE lower(username)=lower(?) AND status='active'`).bind(username).first();if(!u)return json({ok:false,error:'ユーザーが見つかりません'},404);return json({ok:true,user:publicUser(u)})}
async function getUserPosts(env,username){const u=await env.DB.prepare(`SELECT id FROM users WHERE lower(username)=lower(?) AND status='active'`).bind(username).first();if(!u)return json({ok:false,error:'ユーザーが見つかりません'},404);const r=await env.DB.prepare(POST_SELECT+` WHERE p.user_id=? AND p.visibility='public' AND p.status='published' ORDER BY p.created_at DESC`).bind(u.id).all();return json({ok:true,posts:r.results||[]})}

async function createPost(req,env){const u=await sessionUser(req,env,true),b=await readJson(req),title=String(b.title||'').trim(),category=String(b.category||'');if(!title||title.length>120)return json({ok:false,error:'タイトルは1〜120文字です'},400);if(!validCategory(category))return json({ok:false,error:'カテゴリが不正です'},400);const visibility=validVisibility(b.visibility)?b.visibility:'public',status=validStatus(b.status)?b.status:'published',id='post_'+crypto.randomUUID(),t=now(),desc=String(b.description||'').slice(0,5000),tags=JSON.stringify(Array.isArray(b.tags)?b.tags.slice(0,20).map(x=>String(x).slice(0,40)):[]),classic=category==='skin'?(b.classic_slim==='slim'?'slim':'classic'):null;await env.DB.prepare('INSERT INTO posts(id,user_id,title,description,category,tags_json,visibility,status,classic_slim,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,u.id,title,desc,category,tags,visibility,status,classic,t,t).run();await env.DB.prepare('INSERT OR IGNORE INTO post_stats(post_id,download_count,view_count,favorite_count) VALUES(?,0,0,0)').bind(id).run();const post=await env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(id).first();return json({ok:true,post},201)}
async function getPost(req,env,id){const p=await env.DB.prepare(POST_SELECT+' WHERE p.id=?').bind(id).first();if(!p)return json({ok:false,error:'作品が見つかりません'},404);let user=null;if(p.visibility!=='public'||p.status!=='published'){user=await sessionUser(req,env,false);ownerOrAdmin(user,p)}else env.DB.prepare('UPDATE post_stats SET view_count=view_count+1 WHERE post_id=?').bind(id).run().catch(()=>{});const f=await env.DB.prepare('SELECT id,post_id,storage_type,file_role,object_key,filename AS original_filename,mime AS mime_type,size FROM post_files WHERE post_id=? ORDER BY file_role,id').bind(id).all();p.files=f.results||[];return json({ok:true,post:p})}
async function patchPost(req,env,id){const u=await sessionUser(req,env,true),p=await env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(id).first();if(!p)return json({ok:false,error:'作品が見つかりません'},404);ownerOrAdmin(u,p);const b=await readJson(req),title=b.title!==undefined?String(b.title).trim():p.title,description=b.description!==undefined?String(b.description).slice(0,5000):p.description,visibility=b.visibility!==undefined&&validVisibility(b.visibility)?b.visibility:p.visibility,status=b.status!==undefined&&validStatus(b.status)?b.status:p.status,tags=b.tags!==undefined?JSON.stringify(Array.isArray(b.tags)?b.tags.slice(0,20):[]):p.tags_json;if(!title)return json({ok:false,error:'タイトルは必須です'},400);await env.DB.prepare('UPDATE posts SET title=?,description=?,visibility=?,status=?,tags_json=?,updated_at=? WHERE id=?').bind(title,description,visibility,status,tags,now(),id).run();return json({ok:true,post:await env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(id).first()})}
async function deletePost(req,env,id){const u=await sessionUser(req,env,true),p=await env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(id).first();if(!p)return json({ok:false,error:'作品が見つかりません'},404);ownerOrAdmin(u,p);const files=(await env.DB.prepare('SELECT * FROM post_files WHERE post_id=?').bind(id).all()).results||[];for(const f of files){try{await bucketFor(env,f.storage_type).delete(f.object_key)}catch(e){console.warn('R2 delete',e)}}await env.DB.batch([env.DB.prepare('DELETE FROM post_files WHERE post_id=?').bind(id),env.DB.prepare('DELETE FROM ratings WHERE post_id=?').bind(id),env.DB.prepare('DELETE FROM comments WHERE post_id=?').bind(id),env.DB.prepare('DELETE FROM post_stats WHERE post_id=?').bind(id),env.DB.prepare('DELETE FROM download_daily WHERE post_id=?').bind(id),env.DB.prepare('DELETE FROM posts WHERE id=?').bind(id)]);return json({ok:true})}

async function addFile(req,env,url,postId){const u=await sessionUser(req,env,true),p=await env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(postId).first();if(!p)return json({ok:false,error:'作品が見つかりません'},404);ownerOrAdmin(u,p);const type=url.searchParams.get('type')||'asset',role=(url.searchParams.get('role')||'other').slice(0,30),filename=(url.searchParams.get('filename')||'file.bin').replace(/[\\/]/g,'_').slice(0,180);if(!validStorage(type))return json({ok:false,error:'storage typeが不正です'},400);const bytes=await req.arrayBuffer();if(bytes.byteLength>25*1024*1024)return json({ok:false,error:'1ファイル25MBまでです'},413);const id='file_'+crypto.randomUUID(),key=`${new Date().toISOString().slice(0,10).replace(/-/g,'/')}/${postId}/${id}_${filename}`,mime=(req.headers.get('Content-Type')||'application/octet-stream').slice(0,120),bucket=bucketFor(env,type);await bucket.put(key,bytes,{httpMetadata:{contentType:mime}});try{await env.DB.prepare('INSERT INTO post_files(id,post_id,storage_type,file_role,object_key,filename,mime,size) VALUES(?,?,?,?,?,?,?,?)').bind(id,postId,type,role,key,filename,mime,bytes.byteLength).run()}catch(e){await bucket.delete(key);throw e}return json({ok:true,file:{id,post_id:postId,storage_type:type,file_role:role,object_key:key,original_filename:filename,mime_type:mime,size:bytes.byteLength}},201)}
async function serveFile(req,env,id,download){const f=await env.DB.prepare(`SELECT pf.*,p.visibility,p.status,p.user_id FROM post_files pf JOIN posts p ON p.id=pf.post_id WHERE pf.id=?`).bind(id).first();if(!f)return json({ok:false,error:'ファイルが見つかりません'},404);if(f.visibility!=='public'||f.status!=='published'){const u=await sessionUser(req,env,false);ownerOrAdmin(u,f)}const obj=await bucketFor(env,f.storage_type).get(f.object_key);if(!obj)return json({ok:false,error:'R2ファイルが見つかりません'},404);if(download){await env.DB.prepare('UPDATE post_stats SET download_count=download_count+1 WHERE post_id=?').bind(f.post_id).run().catch(()=>{})}const h=new Headers();obj.writeHttpMetadata(h);h.set('Content-Type',f.mime||h.get('Content-Type')||'application/octet-stream');h.set('Cache-Control',f.visibility==='public'?'public, max-age=3600':'private, no-store');if(download)h.set('Content-Disposition',`attachment; filename="${String(f.filename||'download').replace(/["\r\n]/g,'_')}"`);return new Response(obj.body,{headers:h})}
async function legacyUpload(req,env,url){const auth=req.headers.get('Authorization')||'',secret=env.UPLOAD_SECRET||'';if(!secret||auth!==`Bearer ${secret}`)return json({ok:false,error:'Unauthorized'},401);const type=url.searchParams.get('type')||'asset';if(!validStorage(type))return json({ok:false,error:'type must be skin, asset, or model'},400);const filename=(url.searchParams.get('filename')||'upload.bin').replace(/[\\/]/g,'_'),key=`${new Date().toISOString().slice(0,10).replace(/-/g,'/')}/${crypto.randomUUID()}_${filename}`,body=await req.arrayBuffer(),mime=req.headers.get('Content-Type')||'application/octet-stream';await bucketFor(env,type).put(key,body,{httpMetadata:{contentType:mime}});return json({ok:true,type,key})}
