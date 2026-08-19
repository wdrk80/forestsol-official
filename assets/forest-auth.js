(function(){
  "use strict";

  const API_BASE="https://forest-craft-api.wdrk80.workers.dev";
  const TOKEN_KEY="forestsol_session_v1";
  const USER_KEY="forestsol_user_v1";

  function token(){return localStorage.getItem(TOKEN_KEY)||""}
  function cachedUser(){try{return JSON.parse(localStorage.getItem(USER_KEY)||"null")}catch{return null}}
  function saveSession(t,user){if(t)localStorage.setItem(TOKEN_KEY,t);if(user)localStorage.setItem(USER_KEY,JSON.stringify(user));window.dispatchEvent(new CustomEvent("forestsol-auth-change",{detail:{user:user||null}}))}
  function clearSession(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);window.dispatchEvent(new CustomEvent("forestsol-auth-change",{detail:{user:null}}))}
  function authHeaders(extra={}){const h={...extra};if(token())h.Authorization=`Bearer ${token()}`;return h}
  async function request(path,options={}){
    const res=await fetch(API_BASE+path,{...options,headers:authHeaders(options.headers||{})});
    let data;try{data=await res.json()}catch{data={ok:false,error:`HTTP ${res.status}`}}
    if(res.status===401)clearSession();
    if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);
    return data;
  }

  async function register(values){
    const data=await request("/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});
    saveSession(data.token,data.user);return data.user;
  }
  async function login(loginValue,password){
    const data=await request("/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login:loginValue,password})});
    saveSession(data.token,data.user);return data.user;
  }
  async function me(force=false){
    if(!token())return null;
    if(!force&&cachedUser())return cachedUser();
    try{const data=await request("/auth/me");saveSession(token(),data.user);return data.user}catch{return null}
  }
  async function logout(){try{if(token())await request("/auth/logout",{method:"POST"})}catch{}clearSession()}
  async function updateMe(values){const data=await request("/me",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});saveSession(token(),data.user);return data.user}
  async function uploadAvatar(blob){
    if(!blob)throw new Error("画像が選択されていません");
    const data=await request("/me/avatar",{method:"POST",headers:{"Content-Type":blob.type||"image/webp"},body:blob});
    saveSession(token(),data.user);return data.user;
  }
  async function deleteAvatar(){
    const data=await request("/me/avatar",{method:"DELETE"});
    saveSession(token(),data.user);return data.user;
  }
  async function myPosts(){return (await request("/me/posts")).posts||[]}
  async function publicUser(username){return (await request(`/users/${encodeURIComponent(username)}`)).user}
  async function publicPosts(username){return (await request(`/users/${encodeURIComponent(username)}/posts`)).posts||[]}
  async function updatePost(id,values){return (await request(`/posts/${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)})).post}
  async function deletePost(id){return request(`/posts/${encodeURIComponent(id)}`,{method:"DELETE"})}

  function accountNavLabel(){const u=cachedUser();return token()&&u?`マイページ (${u.display_name||u.username})`:"ログイン"}
  function accountNavHref(){return token()?"mypage.html":"account.html"}

  async function imageBitmapFromFile(file){
    if("createImageBitmap" in window)return createImageBitmap(file);
    return new Promise((resolve,reject)=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("画像を読み込めませんでした"))};
      img.src=url;
    });
  }

  async function prepareAvatar(file){
    const allowed=["image/jpeg","image/png","image/webp"];
    if(!allowed.includes(file.type))throw new Error("JPG・PNG・WebP画像を選んでください");
    if(file.size>15*1024*1024)throw new Error("元画像は15MBまでです");

    const image=await imageBitmapFromFile(file);
    const srcW=image.width||image.naturalWidth;
    const srcH=image.height||image.naturalHeight;
    if(!srcW||!srcH)throw new Error("画像サイズを取得できませんでした");

    const max=1024;
    const scale=Math.min(1,max/srcW,max/srcH);
    const w=Math.max(1,Math.round(srcW*scale));
    const h=Math.max(1,Math.round(srcH*scale));
    const canvas=document.createElement("canvas");
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d",{alpha:false});
    ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);
    ctx.drawImage(image,0,0,w,h);
    if(image.close)image.close();

    const make=(type,quality)=>new Promise(resolve=>canvas.toBlob(resolve,type,quality));
    let blob=await make("image/webp",.88);
    if(!blob)blob=await make("image/jpeg",.9);
    if(!blob)throw new Error("画像の変換に失敗しました");
    if(blob.size>3*1024*1024){
      blob=await make("image/webp",.72)||blob;
    }
    if(blob.size>3*1024*1024)throw new Error("画像を3MB以下にできませんでした");
    return blob;
  }

  function ensureAvatarStyles(){
    if(document.getElementById("forestAvatarPickerStyles"))return;
    const style=document.createElement("style");
    style.id="forestAvatarPickerStyles";
    style.textContent=`
      .forest-avatar-editor{display:grid;gap:10px;padding:13px;border:1px solid rgba(84,53,27,.18);border-radius:12px;background:rgba(255,250,236,.48)}
      .forest-avatar-editor-title{font-size:11px;font-weight:900}
      .forest-avatar-editor-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
      .forest-avatar-preview{width:82px;height:82px;flex:0 0 82px;padding:0;overflow:hidden;display:grid;place-items:center;border:3px solid #caa25e;border-radius:50%;background:#ead9b8;color:#3c2718;font-size:34px;cursor:pointer;box-shadow:0 5px 14px rgba(62,38,18,.16)}
      .forest-avatar-preview img{width:100%;height:100%;object-fit:cover}
      .forest-avatar-actions{display:flex;gap:7px;flex-wrap:wrap}
      .forest-avatar-action{min-height:36px;padding:7px 11px;border:1px solid #80603a;border-radius:8px;background:linear-gradient(180deg,#78502a,#513018);color:#fff0cf;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
      .forest-avatar-action.remove{border-color:#8e5a4b;background:linear-gradient(180deg,#a2614e,#743f31)}
      .forest-avatar-help{color:#80644a;font-size:10px;line-height:1.55}
    `;
    document.head.appendChild(style);
  }

  function mountAvatarPicker(){
    const urlInput=document.getElementById("avatarUrl");
    const form=document.getElementById("profileForm");
    if(!urlInput||!form||urlInput.dataset.avatarPickerMounted)return;
    urlInput.dataset.avatarPickerMounted="1";
    ensureAvatarStyles();

    const oldField=urlInput.closest(".field")||urlInput.parentElement;
    const editor=document.createElement("div");
    editor.className="forest-avatar-editor";
    editor.innerHTML=`
      <div class="forest-avatar-editor-title">プロフィールアイコン</div>
      <div class="forest-avatar-editor-row">
        <button class="forest-avatar-preview" type="button" aria-label="アイコン画像を変更"><span>🐾</span></button>
        <div>
          <div class="forest-avatar-actions">
            <button class="forest-avatar-action choose" type="button">画像を変更</button>
            <button class="forest-avatar-action remove" type="button">アイコンを削除</button>
          </div>
          <div class="forest-avatar-help">タップしてスマホ・PCから選択できます。JPG / PNG / WebP</div>
        </div>
      </div>
      <input class="forest-avatar-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
    `;
    oldField.parentElement.insertBefore(editor,oldField);
    oldField.style.display="none";

    const preview=editor.querySelector(".forest-avatar-preview");
    const fileInput=editor.querySelector(".forest-avatar-file");
    const chooseBtn=editor.querySelector(".choose");
    const removeBtn=editor.querySelector(".remove");
    let pendingBlob=null;
    let removeRequested=false;
    let previewObjectUrl="";

    function releasePreviewUrl(){if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=""}}
    function showAvatar(src){
      releasePreviewUrl();
      preview.innerHTML=src?`<img src="${String(src).replace(/"/g,"&quot;")}" alt="">`:'<span>🐾</span>';
    }
    function showBlob(blob){
      releasePreviewUrl();
      previewObjectUrl=URL.createObjectURL(blob);
      preview.innerHTML=`<img src="${previewObjectUrl}" alt="選択中のアイコン">`;
    }
    function setStatus(message,kind=""){
      const el=document.getElementById("profileStatus");
      if(!el)return;
      el.textContent=message;
      el.className="status "+kind;
    }

    const initial=urlInput.value||cachedUser()?.avatar_url||"";
    showAvatar(initial);

    const openPicker=()=>fileInput.click();
    preview.addEventListener("click",openPicker);
    chooseBtn.addEventListener("click",openPicker);

    fileInput.addEventListener("change",async()=>{
      const file=fileInput.files&&fileInput.files[0];
      if(!file)return;
      try{
        setStatus("画像を準備中…");
        pendingBlob=await prepareAvatar(file);
        removeRequested=false;
        showBlob(pendingBlob);
        setStatus("画像を選択しました。『プロフィールを保存』で反映されます。","good");
      }catch(err){
        pendingBlob=null;
        setStatus(err.message,"bad");
      }finally{
        fileInput.value="";
      }
    });

    removeBtn.addEventListener("click",()=>{
      pendingBlob=null;
      removeRequested=true;
      showAvatar("");
      setStatus("アイコンを削除する設定です。『プロフィールを保存』で反映されます。","good");
    });

    form.addEventListener("submit",async event=>{
      if(form.dataset.avatarPass==="1"){
        delete form.dataset.avatarPass;
        return;
      }
      if(!pendingBlob&&!removeRequested)return;

      event.preventDefault();
      event.stopImmediatePropagation();
      const submitter=event.submitter||form.querySelector('button[type="submit"]');
      if(submitter)submitter.disabled=true;
      setStatus(pendingBlob?"アイコンをアップロード中…":"アイコンを削除中…");

      try{
        const updated=pendingBlob?await uploadAvatar(pendingBlob):await deleteAvatar();
        urlInput.value=updated.avatar_url||"";
        pendingBlob=null;
        removeRequested=false;
        showAvatar(updated.avatar_url||"");
        form.dataset.avatarPass="1";
        if(submitter)submitter.disabled=false;
        if(typeof form.requestSubmit==="function")form.requestSubmit(submitter||undefined);
        else submitter?.click();
      }catch(err){
        if(submitter)submitter.disabled=false;
        const msg=/404|Not found/i.test(err.message||"")
          ?"画像アップロードAPIがまだ反映されていません。Cloudflare Workerの更新が必要です。"
          :err.message;
        setStatus(msg,"bad");
      }
    },true);
  }

  function hidePublishAdminFields(){
    ["publishSecret","publishUserId","publishApiUrl"].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      const wrap=el.closest("label,.publish-field,.field,.form-row,.publish-form-row")||el.parentElement;
      if(wrap)wrap.style.display="none";else el.style.display="none";
    });
    const modal=document.getElementById("publishModal");
    if(modal){modal.querySelectorAll(".small-note").forEach(n=>{if(/UPLOAD_SECRET|管理キー|ユーザーID|API URL/i.test(n.textContent||""))n.style.display="none"})}
  }

  function getStudioBinding(name){try{return (0,eval)(name)}catch{return null}}
  async function studioSubmit(event){
    event?.preventDefault();event?.stopImmediatePropagation();
    const progress=getStudioBinding("setPublishProgress");
    const pstate=getStudioBinding("publishState");
    const user=await me(true);
    if(!user){progress?.("投稿するにはForestsolへのログインが必要です。","bad");setTimeout(()=>location.href="../account.html?next=forestcraft-web/",700);return}
    if(!pstate||pstate.busy)return;
    const title=document.getElementById("publishTitle")?.value.trim()||"";
    const description=document.getElementById("publishDescription")?.value||"";
    const tags=(document.getElementById("publishTags")?.value||"").split(",").map(x=>x.trim()).filter(Boolean);
    const visibility=document.getElementById("publishVisibility")?.value||"public";
    if(!title)return progress?.("タイトルを入力してください。","bad");
    if(!pstate.files?.length)return progress?.("投稿できるファイルがありません。","bad");
    const submit=document.getElementById("publishSubmitBtn"),cancel=document.getElementById("publishCancelBtn"),close=document.getElementById("publishCloseBtn");
    pstate.busy=true;[submit,cancel,close].forEach(b=>{if(b)b.disabled=true});
    const category=({skin:"skin",model:"model",item:"item",block:"block"})[pstate.mode]||pstate.mode;
    try{
      progress?.("作品情報を登録中…");
      const body={title,description,category,tags,visibility};
      const appState=getStudioBinding("state");if(category==="skin"&&appState?.skin)body.classic_slim=appState.skin.armModel;
      const postData=await request("/posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const postId=postData.post.id;
      for(let i=0;i<pstate.files.length;i++){
        const f=pstate.files[i];
        progress?.(`ファイル ${i+1}/${pstate.files.length} を送信中… ${f.filename}`);
        const path=`/posts/${encodeURIComponent(postId)}/files?type=${encodeURIComponent(f.storage)}&role=${encodeURIComponent(f.role)}&filename=${encodeURIComponent(f.filename)}`;
        await request(path,{method:"POST",headers:{"Content-Type":f.mime},body:f.blob});
      }
      progress?.(`投稿完了！ ${user.display_name||user.username} の作品に追加しました。`,"good");
      const status=getStudioBinding("setStatus");status?.(`サイト投稿完了: ${title}`);
    }catch(err){progress?.(`投稿失敗: ${err.message}`,"bad")}
    finally{pstate.busy=false;[submit,cancel,close].forEach(b=>{if(b)b.disabled=false})}
  }

  async function mountStudio(){
    const user=await me(false);
    const top=document.querySelector(".topbar");
    if(top&&!document.getElementById("forestAuthStudioLink")){
      const a=document.createElement("a");a.id="forestAuthStudioLink";a.className="site-return";a.href=user?"../mypage.html":"../account.html?next=forestcraft-web/";a.textContent=user?`👤 ${user.display_name||user.username}`:"🔐 ログイン";
      const ret=top.querySelector(".site-return");ret?.insertAdjacentElement("afterend",a);
    }
    document.querySelectorAll(".publish-btn").forEach(btn=>{
      if(user){btn.disabled=false;btn.classList.remove("web-publish-disabled");btn.textContent="🌐 サイトに投稿";btn.title="ログイン中のアカウントで投稿"}
      else{btn.disabled=true;btn.textContent="🔐 ログインして投稿";btn.title="登録済みユーザーだけ投稿できます"}
    });
    hidePublishAdminFields();
    const submit=document.getElementById("publishSubmitBtn");
    if(submit&&!submit.dataset.authBound){submit.dataset.authBound="1";submit.addEventListener("click",studioSubmit,true)}
    const test=document.getElementById("publishTestBtn");if(test)test.style.display="none";
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountAvatarPicker);
  else mountAvatarPicker();

  window.ForestAuth={API_BASE,token,cachedUser,register,login,me,logout,updateMe,uploadAvatar,deleteAvatar,myPosts,publicUser,publicPosts,updatePost,deletePost,request,clearSession,accountNavLabel,accountNavHref,mountStudio,mountAvatarPicker};
})();