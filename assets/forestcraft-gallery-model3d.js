(function(){
  "use strict";
  var API="https://forest-craft-api.wdrk80.workers.dev";

  function ensureStyles(){
    if(document.getElementById("forestCraftModel3dStyles"))return;
    var s=document.createElement("style");
    s.id="forestCraftModel3dStyles";
    s.textContent=`
      .fcm-viewer-shell{display:grid;gap:10px;min-width:0}
      .fcm-toolbar{display:flex;gap:7px;flex-wrap:wrap}
      .fcm-btn{appearance:none;border:1px solid rgba(118,210,170,.42);border-radius:10px;background:#0b2118;color:#eaf7f0;min-height:38px;padding:8px 12px;font:inherit;font-size:12px;font-weight:850;cursor:pointer}
      .fcm-btn.active{color:#062019;background:linear-gradient(135deg,#c6f7d2,#6fe29a);border-color:#78f0a1}
      .fcm-stage{position:relative;min-height:480px;overflow:hidden;border:1px solid rgba(117,197,164,.34);border-radius:18px;background:radial-gradient(circle at 50% 45%,#173b2e 0,#071711 56%,#03100c 100%);perspective:1100px;touch-action:none;user-select:none}
      .fcm-stage:fullscreen{width:100vw;height:100vh;border:0;border-radius:0;background:radial-gradient(circle at 50% 45%,#173b2e 0,#071711 56%,#03100c 100%)}
      .fcm-camera{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;will-change:transform}
      .fcm-root,.fcm-part,.fcm-inner{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d;will-change:transform}
      .fcm-face{position:absolute;left:50%;top:50%;image-rendering:pixelated;backface-visibility:hidden;transform-origin:center center;background:rgba(20,28,25,.22)}
      .fcm-help{position:absolute;left:12px;bottom:10px;z-index:5;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.50);color:#a9c9bb;font-size:10px;pointer-events:none}
      .fcm-texture{display:none;place-items:center;min-height:480px;overflow:auto;border:1px solid rgba(117,197,164,.34);border-radius:18px;background:#04100c;padding:18px}
      .fcm-texture.active{display:grid}.fcm-texture img{width:min(100%,700px);height:auto;object-fit:contain;image-rendering:pixelated}
      .fcm-card-stage{position:absolute;inset:0;z-index:1;overflow:hidden;perspective:700px;pointer-events:none;background:radial-gradient(circle at 50% 46%,rgba(28,72,55,.56),rgba(4,16,12,.16) 60%,rgba(2,10,7,.42))}
      .fcm-card-stage .fcm-face{filter:drop-shadow(0 1px 0 rgba(255,255,255,.04))}
      .post-preview>.fcm-card-stage,.preview>.fcm-card-stage,.work-preview>.fcm-card-stage,.fcs-safe-thumb>.fcm-card-stage,.fcs-work-thumb>.fcm-card-stage{position:absolute;inset:0}
      .post-preview>.post-category,.preview>.kind,.fcs-safe-own,.fcs-work-owner-badge{z-index:6}
      @media(max-width:900px){.fcm-stage,.fcm-texture{min-height:390px}}
      @media(max-width:560px){.fcm-stage,.fcm-texture{min-height:340px}.fcm-btn{font-size:11px;padding:7px 9px}}
    `;
    document.head.appendChild(s);
  }

  function fileUrl(f){return API+"/files/"+encodeURIComponent(f.id)}
  function bbFaceMap(k){return {south:"front",north:"back",west:"left",east:"right",up:"top",down:"bottom"}[k]||k}
  function parseUV(face){return Array.isArray(face&&face.uv)&&face.uv.length>=4?face.uv.map(Number):null}
  function validCube(e){return !!e&&(e.type==="cube"||(Array.isArray(e.from)&&Array.isArray(e.to)))}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function modelFiles(files){
    files=Array.isArray(files)?files:[];
    return {
      bb:files.find(function(f){return f.file_role==="bbmodel"||/\.bbmodel$/i.test(f.original_filename||"")})||null,
      tex:files.find(function(f){return f.file_role==="texture"&&(f.mime_type||"").indexOf("image/")===0})||files.find(function(f){return /model_texture\.png$/i.test(f.original_filename||"")})||null,
      preview:files.find(function(f){return f.file_role==="preview"})||null
    };
  }
  async function fullPost(p){
    if(p&&Array.isArray(p.files))return p;
    var id=typeof p==="string"?p:p&&p.id;if(!id)throw new Error("作品IDがありません");
    var r=await fetch(API+"/posts/"+encodeURIComponent(id)),d=await r.json();
    if(!r.ok||!d.ok)throw new Error(d.error||"3Dモデル作品を読み込めませんでした");
    return d.post;
  }
  async function loadJson(f){var r=await fetch(fileUrl(f));if(!r.ok)throw new Error(".bbmodelを取得できませんでした");return r.json()}
  function loadImage(url){return new Promise(function(resolve,reject){var img=new Image();img.crossOrigin="anonymous";img.onload=function(){resolve(img)};img.onerror=function(){reject(new Error("モデルテクスチャを読み込めませんでした"))};img.src=url})}

  function faceTransform(face,W,H,D){
    if(face==="front")return "translate(-50%,-50%) translateZ("+(D/2)+"px)";
    if(face==="back")return "translate(-50%,-50%) rotateY(180deg) translateZ("+(D/2)+"px)";
    if(face==="left")return "translate(-50%,-50%) rotateY(-90deg) translateZ("+(W/2)+"px)";
    if(face==="right")return "translate(-50%,-50%) rotateY(90deg) translateZ("+(W/2)+"px)";
    if(face==="top")return "translate(-50%,-50%) rotateX(90deg) translateZ("+(H/2)+"px)";
    return "translate(-50%,-50%) rotateX(-90deg) translateZ("+(H/2)+"px)";
  }
  function drawUv(cv,img,uv,rotation){
    var x1=uv[0],y1=uv[1],x2=uv[2],y2=uv[3],sx=Math.min(x1,x2),sy=Math.min(y1,y2),sw=Math.max(1,Math.abs(x2-x1)),sh=Math.max(1,Math.abs(y2-y1)),ctx=cv.getContext("2d");
    ctx.clearRect(0,0,cv.width,cv.height);ctx.save();
    if(x2<x1){ctx.translate(cv.width,0);ctx.scale(-1,1)}
    if(y2<y1){ctx.translate(0,cv.height);ctx.scale(1,-1)}
    var rot=((Number(rotation)||0)%360+360)%360;
    if(rot===90||rot===270){
      var tmp=document.createElement("canvas");tmp.width=cv.width;tmp.height=cv.height;var tx=tmp.getContext("2d");tx.drawImage(img,sx,sy,sw,sh,0,0,tmp.width,tmp.height);ctx.restore();ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(rot*Math.PI/180);ctx.drawImage(tmp,-cv.height/2,-cv.width/2,cv.height,cv.width);ctx.restore();return;
    }
    if(rot===180){ctx.translate(cv.width,cv.height);ctx.rotate(Math.PI)}
    ctx.drawImage(img,sx,sy,sw,sh,0,0,cv.width,cv.height);ctx.restore();
  }

  function build(stage,obj,img,interactive,card){
    ensureStyles();
    var els=(obj.elements||[]).filter(validCube);if(!els.length)throw new Error("Cube要素がありません");
    var min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    els.forEach(function(e){for(var i=0;i<3;i++){min[i]=Math.min(min[i],Number(e.from[i]),Number(e.to[i]));max[i]=Math.max(max[i],Number(e.from[i]),Number(e.to[i]))}});
    var center=min.map(function(v,i){return(v+max[i])/2}),span=Math.max(1,max[0]-min[0],max[1]-min[1],max[2]-min[2]);
    var target=card?98:300,U=clamp(target/span,card?.75:1.2,card?11:18);
    stage.innerHTML="";
    var camera=document.createElement("div");camera.className="fcm-camera";
    var root=document.createElement("div");root.className="fcm-root";camera.appendChild(root);stage.appendChild(camera);
    els.forEach(function(el){
      var from=el.from.map(Number),to=el.to.map(Number),w=Math.max(.01,Math.abs(to[0]-from[0])),h=Math.max(.01,Math.abs(to[1]-from[1])),d=Math.max(.01,Math.abs(to[2]-from[2]));
      var cc=[(from[0]+to[0])/2,(from[1]+to[1])/2,(from[2]+to[2])/2],origin=(Array.isArray(el.origin)?el.origin:cc).map(Number),rot=(Array.isArray(el.rotation)?el.rotation:[0,0,0]).map(Number);
      var part=document.createElement("div");part.className="fcm-part";part.style.transform="translate3d("+((origin[0]-center[0])*U)+"px,"+(-(origin[1]-center[1])*U)+"px,"+((origin[2]-center[2])*U)+"px) rotateX("+(-rot[0])+"deg) rotateY("+rot[1]+"deg) rotateZ("+(-rot[2])+"deg)";
      var inner=document.createElement("div");inner.className="fcm-inner";inner.style.transform="translate3d("+((cc[0]-origin[0])*U)+"px,"+(-(cc[1]-origin[1])*U)+"px,"+((cc[2]-origin[2])*U)+"px)";
      Object.entries(el.faces||{}).forEach(function(entry){var key=entry[0],bf=entry[1],uv=parseUV(bf);if(!uv)return;var face=bbFaceMap(key),fw=(face==="left"||face==="right"?d:w)*U,fh=(face==="top"||face==="bottom"?d:h)*U,cw=Math.max(1,Math.round(Math.abs(uv[2]-uv[0]))),ch=Math.max(1,Math.round(Math.abs(uv[3]-uv[1])));var c=document.createElement("canvas");c.className="fcm-face fcm-face-"+face;c.width=cw;c.height=ch;c.style.width=fw+"px";c.style.height=fh+"px";c.style.transform=faceTransform(face,w*U,h*U,d*U);drawUv(c,img,uv,bf&&bf.rotation);inner.appendChild(c)});
      part.appendChild(inner);root.appendChild(part);
    });
    var rx=-18,ry=32,zoom=card?1.06:1.02,panX=0,panY=0;
    function paint(){root.style.transform="rotateX("+rx+"deg) rotateY("+ry+"deg)";camera.style.transform="translate(calc(-50% + "+panX+"px),calc(-50% + "+panY+"px)) scale("+zoom+")"}
    function reset(){rx=-18;ry=32;zoom=card?1.06:1.02;panX=0;panY=0;paint()}
    paint();
    if(card||!interactive)return{reset:reset};
    var pointers=new Map(),lastDist=0,lastCenter=null;
    stage.addEventListener("pointerdown",function(e){stage.setPointerCapture&&stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){var a=Array.from(pointers.values());lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);lastCenter={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}}});
    stage.addEventListener("pointermove",function(e){if(!pointers.has(e.pointerId))return;var old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){ry+=(e.clientX-old.x)*.45;rx-=(e.clientY-old.y)*.45;rx=clamp(rx,-89,89);paint()}else if(pointers.size===2){var a=Array.from(pointers.values()),dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),center2={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};if(lastDist){zoom*=dist/lastDist;zoom=clamp(zoom,.25,4)}if(lastCenter){panX+=center2.x-lastCenter.x;panY+=center2.y-lastCenter.y}lastDist=dist;lastCenter=center2;paint()}});
    function end(e){pointers.delete(e.pointerId);if(pointers.size<2){lastDist=0;lastCenter=null}}
    stage.addEventListener("pointerup",end);stage.addEventListener("pointercancel",end);
    stage.addEventListener("wheel",function(e){e.preventDefault();zoom*=e.deltaY>0?.9:1.1;zoom=clamp(zoom,.25,4);paint()},{passive:false});
    return{reset:reset};
  }

  async function loadParts(p){
    p=await fullPost(p);var mf=modelFiles(p.files),obj=null,img=null;
    if(!mf.bb)throw new Error(".bbmodelが見つかりません");
    obj=await loadJson(mf.bb);
    var texUrl=mf.tex?fileUrl(mf.tex):(mf.preview?fileUrl(mf.preview):"");
    if(!texUrl)throw new Error("モデルテクスチャが見つかりません");
    img=await loadImage(texUrl);
    return{post:p,files:mf,obj:obj,img:img,texUrl:texUrl};
  }

  async function mountModelCard(container,post){
    if(!container||!post||container.querySelector(".fcm-card-stage"))return;
    container.style.position="relative";
    var old=container.querySelector("img");if(old)old.style.display="none";
    var stage=document.createElement("div");stage.className="fcm-card-stage";container.appendChild(stage);
    try{var d=await loadParts(post);build(stage,d.obj,d.img,false,true)}catch(e){stage.remove();if(old)old.style.display=""}
  }

  async function patchDetail(content,id){
    if(!content)return;var h=window.ForestCraftGallery;if(!h||!h.getPost)return;
    var p=await h.getPost(id);if(!p||p.category!=="model")return;
    var old=content.querySelector(".fc-non-skin-preview,.fcm-viewer-shell");if(!old||old.classList.contains("fcm-viewer-shell"))return;
    var d=await loadParts(p),shell=document.createElement("div");shell.className="fcm-viewer-shell";
    shell.innerHTML='<div class="fcm-toolbar"><button class="fcm-btn active" type="button" data-fcm-view="3d">3D</button><button class="fcm-btn" type="button" data-fcm-view="texture">テクスチャ</button><button class="fcm-btn" type="button" data-fcm-reset>表示リセット</button><button class="fcm-btn" type="button" data-fcm-full>全画面</button></div><div class="fcm-stage" data-fcm-stage><div class="fcm-help">ドラッグ: 回転　ホイール/ピンチ: ズーム</div></div><div class="fcm-texture" data-fcm-texture><img alt="モデルテクスチャ"></div>';
    old.replaceWith(shell);var stage=shell.querySelector("[data-fcm-stage]"),texture=shell.querySelector("[data-fcm-texture]"),ti=texture.querySelector("img");ti.src=d.texUrl;ti.alt=(p.title||"3D Model")+" テクスチャ";var viewer=build(stage,d.obj,d.img,true,false);
    shell.querySelectorAll("[data-fcm-view]").forEach(function(b){b.onclick=function(){var mode=b.dataset.fcmView;shell.querySelectorAll("[data-fcm-view]").forEach(function(x){x.classList.toggle("active",x===b)});stage.style.display=mode==="3d"?"":"none";texture.classList.toggle("active",mode==="texture")}});
    shell.querySelector("[data-fcm-reset]").onclick=viewer.reset;shell.querySelector("[data-fcm-full]").onclick=function(){if(stage.requestFullscreen)stage.requestFullscreen()};
  }

  function install(){
    ensureStyles();var h=window.ForestCraftGallery;if(!h||h.__model3dInstalled)return false;h.__model3dInstalled=true;var original=h.openPost;
    if(typeof original==="function")h.openPost=async function(id,opts){var r=await original(id,opts);try{await patchDetail(opts&&opts.content?opts.content:document.getElementById("modalContent"),id)}catch(e){console.warn("3D Model表示失敗",e)}return r};
    h.mountModelCard=mountModelCard;h.patchModelDetail=patchDetail;return true;
  }
  if(!install()){var timer=setInterval(function(){if(install())clearInterval(timer)},50);setTimeout(function(){clearInterval(timer)},5000)}
})();
