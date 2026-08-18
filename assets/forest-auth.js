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
  async function myPosts(){return (await request("/me/posts")).posts||[]}
  async function publicUser(username){return (await request(`/users/${encodeURIComponent(username)}`)).user}
  async function publicPosts(username){return (await request(`/users/${encodeURIComponent(username)}/posts`)).posts||[]}
  async function updatePost(id,values){return (await request(`/posts/${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)})).post}
  async function deletePost(id){return request(`/posts/${encodeURIComponent(id)}`,{method:"DELETE"})}

  function accountNavLabel(){const u=cachedUser();return token()&&u?`マイページ (${u.display_name||u.username})`:"ログイン"}
  function accountNavHref(){return token()?"mypage.html":"account.html"}

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

  window.ForestAuth={API_BASE,token,cachedUser,register,login,me,logout,updateMe,myPosts,publicUser,publicPosts,updatePost,deletePost,request,clearSession,accountNavLabel,accountNavHref,mountStudio};
})();
