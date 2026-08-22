(function(){
"use strict";
if(!/(^|\/)mypage\.html$/.test(location.pathname))return;
const API="https://forest-craft-api.wdrk80.workers.dev";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function addStyles(){
 if(document.getElementById("mypageFavoriteStyles"))return;
 const s=document.createElement("style");s.id="mypageFavoriteStyles";s.textContent=`
 .work-preview{position:relative!important;overflow:hidden!important;background:radial-gradient(circle at 50% 46%,#173b2e 0,#071711 58%,#03100c 100%)!important}
 .work-preview>img{object-fit:contain!important;image-rendering:pixelated}
 .work-preview>.fcm-card-stage,.work-preview>.fcb-card-stage,.work-preview>.fc2-card-stage{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
 .favorite-card .work-preview img{object-fit:contain;image-rendering:pixelated}
 .favorite-rating{margin-top:5px;color:#8b6a31;font-size:10px;font-weight:900}.favorite-open{color:#54351e;text-decoration:none;display:inline-grid;place-items:center}.favorite-heart{position:absolute;right:8px;top:8px;z-index:9;display:grid;place-items:center;width:31px;height:31px;border-radius:50%;border:1px solid #b58b3e;background:rgba(58,38,17,.86);color:#ffe29a;font-size:16px}.favorite-count{font-size:11px;color:#80634a;font-weight:900}
 `;document.head.appendChild(s)
}

function loadScript(src,key){
 return new Promise((resolve,reject)=>{
  const old=document.querySelector(`script[data-${key}]`);
  if(old){if(old.dataset.loaded==='1')return resolve();old.addEventListener("load",resolve,{once:true});old.addEventListener("error",reject,{once:true});return}
  const s=document.createElement("script");s.src=src;s.async=false;s.setAttribute(`data-${key}`,"1");s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=reject;document.head.appendChild(s)
 })
}

async function ensure3d(){
 if(!window.ForestCraftGallery){
  window.ForestCraftGallery={
   apiBase:API,
   getPost:async id=>(await ForestAuth.request('/posts/'+encodeURIComponent(id))).post,
   openPost:async()=>{}
  };
 }
 try{
  await loadScript('assets/forestcraft-gallery-skinfix.js?v=20260822-mypage-skin1','mypage-skin3d');
  await loadScript('assets/forestcraft-gallery-block3d.js?v=20260822-mypage-block3','mypage-block3d');
  await loadScript('assets/forestcraft-gallery-model3d.js?v=20260822-mypage-model2','mypage-model3d');
 }catch(e){console.warn('MyPage 3D preview load failed',e)}
}

function preview(p){
 return p.preview_file_id?`<img src="${API}/files/${encodeURIComponent(p.preview_file_id)}" alt="${esc(p.title)}">`:`<div style="font-size:38px">${p.category==='model'?'◫':p.category==='block'?'▣':p.category==='skin'?'◆':'🎨'}</div>`
}

async function fullPost(p){
 try{const d=await ForestAuth.request('/posts/'+encodeURIComponent(p.id));return d.post||p}catch{return p}
}

function skinUrl(p){
 const files=Array.isArray(p.files)?p.files:[];
 const f=files.find(x=>x.file_role==='main'&&(x.mime_type||'').startsWith('image/'))||files.find(x=>(x.original_filename||'')==='minecraft_skin.png');
 if(f)return `${API}/files/${encodeURIComponent(f.id)}`;
 return p.preview_file_id?`${API}/files/${encodeURIComponent(p.preview_file_id)}`:'';
}

async function mountOne(box,p){
 if(!box||!p||box.dataset.fcOwn3d==='1'||box.dataset.fcOwn3d==='loading')return;
 if(!['skin','block','model'].includes(p.category))return;
 const h=window.ForestCraftGallery;if(!h)return;
 box.dataset.fcOwn3d='loading';
 try{
  const full=await fullPost(p);
  if(p.category==='skin'&&typeof h.mountSkinCard==='function'){
   const url=skinUrl(full);if(!url)throw new Error('skin image missing');
   h.mountSkinCard(box,url,(full.classic_slim||p.classic_slim)==='slim');
  }
  if(p.category==='block'&&typeof h.mountBlockCard==='function')await h.mountBlockCard(box,full);
  if(p.category==='model'&&typeof h.mountModelCard==='function')await h.mountModelCard(box,full);
  box.dataset.fcOwn3d='1';
 }catch(e){
  box.dataset.fcOwn3d='';
  console.warn('MyPage 3D preview failed',p.id,e);
 }
}

let ownMountBusy=false;
async function mountOwn3d(){
 if(ownMountBusy)return;
 const grid=document.getElementById('works');if(!grid||!window.ForestAuth)return;
 ownMountBusy=true;
 try{
  const posts=await ForestAuth.myPosts();
  const map=new Map(posts.map(p=>[String(p.id),p]));
  for(const card of grid.querySelectorAll('.work-card[data-id]')){
   const p=map.get(String(card.dataset.id||''));
   if(p)await mountOne(card.querySelector('.work-preview'),p);
  }
 }catch(e){console.warn('MyPage own works load failed',e)}
 finally{ownMountBusy=false}
}

function mount3d(grid,posts){
 const cards=[...grid.querySelectorAll('.favorite-card')];
 cards.forEach((card,i)=>{const p=posts[i];if(p)mountOne(card.querySelector('.work-preview'),p)});
}

async function init(){
 for(let i=0;i<120&&!window.ForestAuth;i++)await sleep(50);if(!window.ForestAuth)return;
 for(let i=0;i<120&&!document.getElementById('myWorks');i++)await sleep(50);const own=document.getElementById('myWorks');if(!own)return;
 addStyles();await ensure3d();
 const ownGrid=document.getElementById('works');
 if(ownGrid){new MutationObserver(()=>setTimeout(mountOwn3d,40)).observe(ownGrid,{childList:true,subtree:true});await mountOwn3d()}

 if(document.getElementById('favoriteWorks'))return;
 const section=document.createElement('section');section.id='favoriteWorks';section.className='paper-card works-card';section.innerHTML=`<div class="section-head"><h2>お気に入り</h2><button id="favoriteReloadBtn" type="button">再読み込み</button></div><div id="favoriteCount" class="favorite-count">読み込み中…</div><div id="favoriteGrid" class="works" style="margin-top:12px"><div class="empty">お気に入りを読み込み中…</div></div>`;own.insertAdjacentElement('afterend',section);
 const buttons=document.querySelector('.profile-buttons');if(buttons&&!document.getElementById('favoriteWorksLink')){const a=document.createElement('a');a.id='favoriteWorksLink';a.className='button wood';a.href='#favoriteWorks';a.textContent='★ お気に入りを見る';buttons.appendChild(a)}
 const grid=section.querySelector('#favoriteGrid'),count=section.querySelector('#favoriteCount');
 async function load(){
  grid.innerHTML='<div class="empty">お気に入りを読み込み中…</div>';
  try{
   const d=await ForestAuth.request('/me/favorites'),posts=d.posts||[];count.textContent=`${posts.length}件のお気に入り`;
   if(!posts.length){grid.innerHTML='<div class="empty">お気に入りはまだありません。作品ギャラリーの ☆ ボタンから追加できます。</div>';return}
   grid.innerHTML=posts.map(p=>`<article class="work-card favorite-card" data-id="${esc(p.id)}"><div class="work-preview">${preview(p)}<span class="favorite-heart">★</span></div><div class="work-body"><div class="work-title">${esc(p.title)}</div><div class="work-meta">${esc(p.category)} ・ by ${esc(p.display_name||p.username||'Unknown')}</div><div class="favorite-rating">★ ${Number(p.rating_average||0).toFixed(1)} (${Number(p.rating_count||0)})</div><div class="work-actions"><a class="mini-btn favorite-open" href="forestcraft.html?post=${encodeURIComponent(p.id)}">作品を見る</a><button class="mini-btn delete favoriteRemove" type="button">お気に入り解除</button></div></div></article>`).join('');
   mount3d(grid,posts);
   grid.querySelectorAll('.favoriteRemove').forEach(b=>b.onclick=async()=>{const card=b.closest('.favorite-card'),id=card.dataset.id;b.disabled=true;try{await ForestAuth.request('/posts/'+encodeURIComponent(id)+'/favorite',{method:'DELETE'});card.remove();const left=grid.querySelectorAll('.favorite-card').length;count.textContent=`${left}件のお気に入り`;if(!left)grid.innerHTML='<div class="empty">お気に入りはまだありません。</div>'}catch(e){alert(e.message||String(e));b.disabled=false}});
  }catch(e){grid.innerHTML=`<div class="empty">${esc(/404|Not found/i.test(e.message||'')?'お気に入りAPIの反映待ちです。':e.message)}</div>`;count.textContent=''}
 }
 section.querySelector('#favoriteReloadBtn').onclick=load;window.addEventListener('forestcraft-community-change',load);await load();
}
init().catch(e=>console.warn('[mypage favorites]',e));
})();