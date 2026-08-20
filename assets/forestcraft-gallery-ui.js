(function(){
  "use strict";

  var API="https://forest-craft-api.wdrk80.workers.dev";
  var authPromise=null;
  var activePostId="";

  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]})}
  function cat(c){return ({skin:"Skin",item:"Item",block:"Block",model:"3D Model"})[c]||c||"作品"}
  function tags(p){if(Array.isArray(p.tags))return p.tags;try{return JSON.parse(p.tags_json||"[]")}catch(e){return []}}
  function formatDate(v){var d=new Date(v);if(Number.isNaN(d.getTime()))return "";return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(d)}

  function ensureStyles(){
    if(document.getElementById("forestCraftGalleryUiStyles"))return;
    var s=document.createElement("style");
    s.id="forestCraftGalleryUiStyles";
    s.textContent=`
      .modal-card{width:min(1180px,100%)!important}
      .fc-detail-grid{display:grid;grid-template-columns:minmax(360px,.95fr) minmax(0,1.05fr);gap:28px;align-items:start}
      .fc-viewer-shell{display:grid;gap:10px;min-width:0}
      .fc-viewer-toolbar{display:flex;gap:7px;flex-wrap:wrap}
      .fc-viewer-button,.fc-action-button{appearance:none;border:1px solid rgba(118,210,170,.42);border-radius:10px;background:#0b2118;color:#eaf7f0;min-height:38px;padding:8px 12px;font:inherit;font-size:12px;font-weight:850;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
      .fc-viewer-button.active{color:#062019;background:linear-gradient(135deg,#c6f7d2,#6fe29a);border-color:#78f0a1}
      .fc-viewer-button:hover,.fc-action-button:hover{filter:brightness(1.08)}
      .fc-action-button.primary{color:#052015;background:linear-gradient(135deg,#c6f7d2,#68db91);border-color:#78f0a1}
      .fc-action-button.danger{border-color:#9d554e;background:#3a1717;color:#ffd8d3}
      .fc-viewer-stage{position:relative;min-height:480px;overflow:hidden;border:1px solid rgba(117,197,164,.34);border-radius:18px;background:radial-gradient(circle at 50% 46%,#153429 0,#071711 54%,#03100c 100%);perspective:900px;touch-action:none;user-select:none}
      .fc-viewer-stage:fullscreen{width:100vw;height:100vh;border:0;border-radius:0;background:radial-gradient(circle at 50% 46%,#153429 0,#071711 54%,#03100c 100%)}
      .fc-viewer-stage:fullscreen .fc-skin-camera{transform:translate(-50%,-50%) scale(1.75)}
      .fc-viewer-help{position:absolute;left:12px;bottom:10px;z-index:5;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.48);color:#a9c9bb;font-size:10px;pointer-events:none}
      .fc-skin-camera{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;transition:transform .06s linear}
      .fc-skin-model{position:absolute;width:0;height:0;transform-style:preserve-3d}
      .fc-skin-part{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d}
      .fc-skin-face{position:absolute;left:50%;top:50%;background-repeat:no-repeat;image-rendering:pixelated;backface-visibility:hidden;transform-origin:center center}
      .fc-uv-view{display:none;place-items:center;min-height:480px;overflow:auto;border:1px solid rgba(117,197,164,.34);border-radius:18px;background:#04100c;padding:18px}
      .fc-uv-view.active{display:grid}
      .fc-uv-view img{width:min(100%,620px);height:auto;image-rendering:pixelated;object-fit:contain}
      .fc-viewer-stage.hidden{display:none}
      .fc-detail-title{margin:0 0 8px;font-size:31px}
      .fc-author-link{color:#bdebd7;text-decoration:none}.fc-author-link:hover{text-decoration:underline}
      .fc-meta-line{display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0;color:#9db7ac;font-size:12px}
      .fc-info-chip{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;background:#112c21;color:#bfe9d6;font-size:11px}
      .fc-detail-description{white-space:pre-wrap;color:#c6d8d0;line-height:1.85;margin:18px 0}
      .fc-detail-actions{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0 4px}
      .fc-download-title{margin:22px 0 9px;font-size:14px;color:#d7eee3}
      .fc-download-list{display:grid;gap:8px}
      .fc-download-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid rgba(112,190,158,.3);border-radius:11px;background:#06120e}
      .fc-download-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d9e6e1;font-size:12px}
      .fc-download-link{flex:none;padding:8px 12px;border-radius:9px;text-decoration:none;color:#062019;background:#78f0a1;font-size:11px;font-weight:900}
      .fc-tag-list{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}
      .fc-tag{padding:6px 9px;border-radius:999px;background:#123025;color:#afe4ce;font-size:11px}
      .fc-non-skin-preview{min-height:480px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(117,197,164,.34);border-radius:18px;background:#04100c}
      .fc-non-skin-preview img{width:100%;height:100%;max-height:620px;object-fit:contain;image-rendering:pixelated}
      .fc-placeholder{font-size:56px;color:#628173}
      .fc-toast{position:fixed;left:50%;bottom:26px;z-index:1200;transform:translateX(-50%);padding:10px 15px;border-radius:999px;background:#163d2d;color:#eafff1;box-shadow:0 10px 30px rgba(0,0,0,.35);font-size:12px;font-weight:800}
      @media(max-width:900px){.fc-detail-grid{grid-template-columns:1fr}.fc-viewer-stage,.fc-uv-view,.fc-non-skin-preview{min-height:390px}}
      @media(max-width:560px){.fc-viewer-stage,.fc-uv-view,.fc-non-skin-preview{min-height:340px}.fc-detail-title{font-size:26px}.fc-viewer-button,.fc-action-button{font-size:11px;padding:7px 9px}}
    `;
    document.head.appendChild(s);
  }

  function loadAuth(){
    if(window.ForestAuth)return Promise.resolve(window.ForestAuth);
    if(authPromise)return authPromise;
    authPromise=new Promise(function(resolve){
      var s=document.createElement("script");
      s.src="assets/forest-auth.js?v=20260820-gallery-edit1";
      s.onload=function(){resolve(window.ForestAuth||null)};
      s.onerror=function(){resolve(null)};
      document.head.appendChild(s);
    });
    return authPromise;
  }

  async function currentUser(){
    var a=await loadAuth();
    if(!a)return null;
    try{return await a.me(false)}catch(e){return null}
  }

  async function getPost(id){
    var r=await fetch(API+"/posts/"+encodeURIComponent(id));
    var d=await r.json().catch(function(){return {ok:false,error:"作品情報を読み込めませんでした"}});
    if(!r.ok||!d.ok)throw new Error(d.error||"作品情報を読み込めませんでした");
    return d.post;
  }

  function fileUrl(f,download){return API+(download?"/download/":"/files/")+encodeURIComponent(f.id)}

  function uvRect(u,v,w,h){return {u:u,v:v,w:w,h:h}}
  function skinMaps(slim){
    var aw=slim?3:4;
    return {
      head:{w:8,h:8,d:8,base:{top:uvRect(8,0,8,8),bottom:uvRect(16,0,8,8),right:uvRect(0,8,8,8),front:uvRect(8,8,8,8),left:uvRect(16,8,8,8),back:uvRect(24,8,8,8)},outer:{top:uvRect(40,0,8,8),bottom:uvRect(48,0,8,8),right:uvRect(32,8,8,8),front:uvRect(40,8,8,8),left:uvRect(48,8,8,8),back:uvRect(56,8,8,8)}},
      body:{w:8,h:12,d:4,base:{top:uvRect(20,16,8,4),bottom:uvRect(28,16,8,4),right:uvRect(16,20,4,12),front:uvRect(20,20,8,12),left:uvRect(28,20,4,12),back:uvRect(32,20,8,12)},outer:{top:uvRect(20,32,8,4),bottom:uvRect(28,32,8,4),right:uvRect(16,36,4,12),front:uvRect(20,36,8,12),left:uvRect(28,36,4,12),back:uvRect(32,36,8,12)}},
      rarm:{w:aw,h:12,d:4,base:{top:uvRect(44,16,aw,4),bottom:uvRect(44+aw,16,aw,4),right:uvRect(40,20,4,12),front:uvRect(44,20,aw,12),left:uvRect(44+aw,20,4,12),back:uvRect(48+aw,20,aw,12)},outer:{top:uvRect(44,32,aw,4),bottom:uvRect(44+aw,32,aw,4),right:uvRect(40,36,4,12),front:uvRect(44,36,aw,12),left:uvRect(44+aw,36,4,12),back:uvRect(48+aw,36,aw,12)}},
      larm:{w:aw,h:12,d:4,base:{top:uvRect(36,48,aw,4),bottom:uvRect(36+aw,48,aw,4),right:uvRect(32,52,4,12),front:uvRect(36,52,aw,12),left:uvRect(36+aw,52,4,12),back:uvRect(40+aw,52,aw,12)},outer:{top:uvRect(52,48,aw,4),bottom:uvRect(52+aw,48,aw,4),right:uvRect(48,52,4,12),front:uvRect(52,52,aw,12),left:uvRect(52+aw,52,4,12),back:uvRect(56+aw,52,aw,12)}},
      rleg:{w:4,h:12,d:4,base:{top:uvRect(4,16,4,4),bottom:uvRect(8,16,4,4),right:uvRect(0,20,4,12),front:uvRect(4,20,4,12),left:uvRect(8,20,4,12),back:uvRect(12,20,4,12)},outer:{top:uvRect(4,32,4,4),bottom:uvRect(8,32,4,4),right:uvRect(0,36,4,12),front:uvRect(4,36,4,12),left:uvRect(8,36,4,12),back:uvRect(12,36,4,12)}},
      lleg:{w:4,h:12,d:4,base:{top:uvRect(20,48,4,4),bottom:uvRect(24,48,4,4),right:uvRect(16,52,4,12),front:uvRect(20,52,4,12),left:uvRect(24,52,4,12),back:uvRect(28,52,4,12)},outer:{top:uvRect(4,48,4,4),bottom:uvRect(8,48,4,4),right:uvRect(0,52,4,12),front:uvRect(4,52,4,12),left:uvRect(8,52,4,12),back:uvRect(12,52,4,12)}}
    };
  }

  function addFace(part,name,dims,rect,url,U){
    var w=(name==="left"||name==="right")?dims.d:dims.w;
    var h=(name==="top"||name==="bottom")?dims.d:dims.h;
    var f=document.createElement("div");
    f.className="fc-skin-face fc-face-"+name;
    f.style.width=(w*U)+"px";
    f.style.height=(h*U)+"px";
    f.style.backgroundImage='url("'+url.replace(/"/g,"%22")+'")';
    f.style.backgroundSize=(64*U)+"px "+(64*U)+"px";
    f.style.backgroundPosition=(-rect.u*U)+"px "+(-rect.v*U)+"px";
    var W=dims.w*U,H=dims.h*U,D=dims.d*U;
    if(name==="front")f.style.transform="translate(-50%,-50%) translateZ("+(D/2)+"px)";
    if(name==="back")f.style.transform="translate(-50%,-50%) rotateY(180deg) translateZ("+(D/2)+"px)";
    if(name==="right")f.style.transform="translate(-50%,-50%) rotateY(90deg) translateZ("+(W/2)+"px)";
    if(name==="left")f.style.transform="translate(-50%,-50%) rotateY(-90deg) translateZ("+(W/2)+"px)";
    if(name==="top")f.style.transform="translate(-50%,-50%) rotateX(90deg) translateZ("+(H/2)+"px)";
    if(name==="bottom")f.style.transform="translate(-50%,-50%) rotateX(-90deg) translateZ("+(H/2)+"px)";
    part.appendChild(f);
  }

  function addPart(root,name,dims,uv,url,U,x,y,scale){
    var p=document.createElement("div");
    p.className="fc-skin-part fc-part-"+name;
    p.style.transform="translate3d("+(x*U)+"px,"+(y*U)+"px,0) scale3d("+scale+","+scale+","+scale+")";
    ["front","back","left","right","top","bottom"].forEach(function(face){if(uv[face])addFace(p,face,dims,uv[face],url,U)});
    root.appendChild(p);
  }

  function mountSkinViewer(stage,url,slim){
    var U=6;
    var maps=skinMaps(slim);
    var camera=document.createElement("div");camera.className="fc-skin-camera";
    var model=document.createElement("div");model.className="fc-skin-model";camera.appendChild(model);stage.appendChild(camera);
    var aw=maps.rarm.w;
    addPart(model,"head",maps.head,maps.head.base,url,U,0,-12,1);
    addPart(model,"head-outer",maps.head,maps.head.outer,url,U,0,-12,1.125);
    addPart(model,"body",maps.body,maps.body.base,url,U,0,-2,1);
    addPart(model,"body-outer",maps.body,maps.body.outer,url,U,0,-2,1.055);
    addPart(model,"right-arm",maps.rarm,maps.rarm.base,url,U,-(4+aw/2),-2,1);
    addPart(model,"right-arm-outer",maps.rarm,maps.rarm.outer,url,U,-(4+aw/2),-2,1.06);
    addPart(model,"left-arm",maps.larm,maps.larm.base,url,U,(4+aw/2),-2,1);
    addPart(model,"left-arm-outer",maps.larm,maps.larm.outer,url,U,(4+aw/2),-2,1.06);
    addPart(model,"right-leg",maps.rleg,maps.rleg.base,url,U,-2,10,1);
    addPart(model,"right-leg-outer",maps.rleg,maps.rleg.outer,url,U,-2,10,1.06);
    addPart(model,"left-leg",maps.lleg,maps.lleg.base,url,U,2,10,1);
    addPart(model,"left-leg-outer",maps.lleg,maps.lleg.outer,url,U,2,10,1.06);

    var rx=-8,ry=25,zoom=1.45,pointers=new Map(),lastDist=0;
    function paint(){model.style.transform="rotateX("+rx+"deg) rotateY("+ry+"deg)";camera.style.transform="translate(-50%,-50%) scale("+zoom+")"}
    function reset(){rx=-8;ry=25;zoom=1.45;paint()}
    paint();
    stage.addEventListener("pointerdown",function(e){stage.setPointerCapture&&stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){var a=Array.from(pointers.values());lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}});
    stage.addEventListener("pointermove",function(e){if(!pointers.has(e.pointerId))return;var old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){ry+=(e.clientX-old.x)*.55;rx-=(e.clientY-old.y)*.45;rx=Math.max(-80,Math.min(80,rx));paint()}else if(pointers.size===2){var a=Array.from(pointers.values());var dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(lastDist){zoom*=dist/lastDist;zoom=Math.max(.65,Math.min(3.2,zoom));paint()}lastDist=dist}});
    function end(e){pointers.delete(e.pointerId);lastDist=0}
    stage.addEventListener("pointerup",end);stage.addEventListener("pointercancel",end);
    stage.addEventListener("wheel",function(e){e.preventDefault();zoom*=e.deltaY<0?1.1:.9;zoom=Math.max(.65,Math.min(3.2,zoom));paint()},{passive:false});
    return {reset:reset};
  }

  function previewFile(files){return files.find(function(x){return x.file_role==="preview"||x.file_role==="thumbnail"})||files.find(function(x){return (x.mime_type||"").indexOf("image/")===0})||null}
  function mainSkin(files){return files.find(function(x){return x.file_role==="main"&&(x.mime_type||"").indexOf("image/")===0})||files.find(function(x){return (x.original_filename||"")==="minecraft_skin.png"})||null}

  function downloadLabel(p,f){
    var role=f.file_role||"file",name=f.original_filename||"file";
    if(p.category==="skin"&&role==="main")return "Minecraftスキン";
    if(p.category==="model"&&role==="bbmodel")return "3Dモデル (.bbmodel)";
    if(p.category==="model"&&role==="texture")return "モデルテクスチャ";
    if(p.category==="item"&&role==="main")return "アイテムテクスチャ";
    if(p.category==="block"&&role==="texture")return name.replace(/^block_/,"").replace(/\.png$/i,"")+" 面テクスチャ";
    if(role==="mcmeta")return "アニメーション設定 (.mcmeta)";
    return name;
  }

  function visibleDownloads(p,files){
    return files.filter(function(f){
      if(f.file_role==="preview"||f.file_role==="thumbnail")return false;
      if(p.category==="skin")return f.file_role==="main";
      return true;
    });
  }

  function toast(text){var old=document.querySelector(".fc-toast");if(old)old.remove();var n=document.createElement("div");n.className="fc-toast";n.textContent=text;document.body.appendChild(n);setTimeout(function(){n.remove()},1700)}

  async function copyShare(id){
    var url=location.origin+"/forestcraft.html?post="+encodeURIComponent(id)+"#gallery";
    try{await navigator.clipboard.writeText(url);toast("作品リンクをコピーしました")}catch(e){var ta=document.createElement("textarea");ta.value=url;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();toast("作品リンクをコピーしました")}
  }

  function closePost(){
    var modal=document.getElementById("postModal");if(modal)modal.classList.remove("open");
    document.body.style.overflow="";
    activePostId="";
  }

  async function openPost(id,opts){
    opts=opts||{};activePostId=id;ensureStyles();
    var modal=opts.modal||document.getElementById("postModal"),content=opts.content||document.getElementById("modalContent");
    if(!modal||!content)return;
    modal.classList.add("open");document.body.style.overflow="hidden";
    content.innerHTML='<div class="empty-state">作品情報を読み込み中...</div>';
    try{
      var p=await getPost(id),files=Array.isArray(p.files)?p.files:[],user=await currentUser();
      var owner=!!(user&&p.user_id&&user.id===p.user_id);
      var tg=tags(p).map(function(t){return '<span class="fc-tag">'+esc(t)+'</span>'}).join("");
      var ds=visibleDownloads(p,files);
      var rows=ds.length?ds.map(function(f){return '<div class="fc-download-row"><span class="fc-download-name">'+esc(downloadLabel(p,f))+' · '+esc(f.original_filename||"")+'</span><a class="fc-download-link" href="'+fileUrl(f,true)+'" data-no-transition>ダウンロード</a></div>'}).join(""):'<div class="empty-state">ダウンロード可能なファイルはありません。</div>';
      var author=p.username?'<a class="fc-author-link" href="profile.html?u='+encodeURIComponent(p.username)+'">'+esc(p.display_name||p.username)+'</a>':esc(p.display_name||"Unknown");
      var skin=mainSkin(files),pv=previewFile(files),slim=p.classic_slim==="slim";
      var left="";
      if(p.category==="skin"&&skin){
        var skinUrl=fileUrl(skin,false);
        left='<div class="fc-viewer-shell"><div class="fc-viewer-toolbar"><button class="fc-viewer-button active" type="button" data-fc-view="3d">3D</button><button class="fc-viewer-button" type="button" data-fc-view="uv">UV</button><button class="fc-viewer-button" type="button" data-fc-reset>表示リセット</button><button class="fc-viewer-button" type="button" data-fc-full>全画面</button></div><div class="fc-viewer-stage" data-fc-stage><div class="fc-viewer-help">ドラッグ: 回転　ホイール/ピンチ: ズーム</div></div><div class="fc-uv-view" data-fc-uv><img src="'+skinUrl+'" alt="'+esc(p.title)+' UV"></div></div>';
      }else if(pv){
        left='<div class="fc-non-skin-preview"><img src="'+fileUrl(pv,false)+'" alt="'+esc(p.title)+'"></div>';
      }else left='<div class="fc-non-skin-preview"><div class="fc-placeholder">🎨</div></div>';

      var ownerActions=owner?'<a class="fc-action-button primary" href="forestcraft-web/?editPost='+encodeURIComponent(p.id)+'" data-no-transition>✏️ Studioで編集</a><button class="fc-action-button danger" type="button" data-fc-delete>削除</button>':'';
      var modelChip=p.category==="skin"?'<span class="fc-info-chip">腕: '+(slim?'Slim':'Classic')+'</span>':'';
      content.innerHTML='<div class="fc-detail-grid"><div>'+left+'</div><div><p class="eyebrow">'+esc(cat(p.category))+'</p><h2 class="fc-detail-title">'+esc(p.title)+'</h2><p class="post-author">by '+author+'</p><div class="fc-meta-line"><span>↓ '+Number(p.download_count||0)+'</span><span>👁 '+Number(p.view_count||0)+'</span><span>投稿日 '+esc(formatDate(p.created_at))+'</span>'+modelChip+'</div><div class="fc-tag-list">'+tg+'</div><p class="fc-detail-description">'+esc(p.description||"説明はありません。")+'</p><div class="fc-detail-actions"><button class="fc-action-button" type="button" data-fc-share>🔗 リンクをコピー</button>'+ownerActions+'</div><h3 class="fc-download-title">ダウンロード</h3><div class="fc-download-list">'+rows+'</div></div></div>';

      if(p.category==="skin"&&skin){
        var stage=content.querySelector("[data-fc-stage]"),uv=content.querySelector("[data-fc-uv]");
        var viewer=mountSkinViewer(stage,fileUrl(skin,false),slim);
        content.querySelectorAll("[data-fc-view]").forEach(function(b){b.addEventListener("click",function(){var mode=b.dataset.fcView;content.querySelectorAll("[data-fc-view]").forEach(function(x){x.classList.toggle("active",x===b)});stage.classList.toggle("hidden",mode!=="3d");uv.classList.toggle("active",mode==="uv")})});
        content.querySelector("[data-fc-reset]").addEventListener("click",viewer.reset);
        content.querySelector("[data-fc-full]").addEventListener("click",function(){if(stage.requestFullscreen)stage.requestFullscreen()});
      }
      var share=content.querySelector("[data-fc-share]");if(share)share.addEventListener("click",function(){copyShare(p.id)});
      var del=content.querySelector("[data-fc-delete]");if(del)del.addEventListener("click",async function(){if(!confirm("この作品を削除しますか？"))return;del.disabled=true;try{var a=await loadAuth();if(!a)throw new Error("ログイン情報を読み込めませんでした");await a.deletePost(p.id);closePost();toast("作品を削除しました");if(typeof opts.onDelete==="function")opts.onDelete(p);else if(typeof window.loadPosts==="function")window.loadPosts()}catch(e){alert(e.message||String(e));del.disabled=false}});
    }catch(e){content.innerHTML='<div class="empty-state">'+esc(e.message||String(e))+'</div>'}
  }

  ensureStyles();
  window.ForestCraftGallery={openPost:openPost,closePost:closePost,getPost:getPost,apiBase:API,formatDate:formatDate,tags:tags,cat:cat,esc:esc};
})();