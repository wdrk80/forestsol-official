(function(){
  "use strict";

  function ensureStyles(){
    if(document.getElementById("forestCraftSkinFixStyles"))return;
    var s=document.createElement("style");
    s.id="forestCraftSkinFixStyles";
    s.textContent=`
      .fc2-camera{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;will-change:transform}
      .fc2-model,.fc2-part{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d}
      .fc2-face{position:absolute;left:50%;top:50%;background-repeat:no-repeat;image-rendering:pixelated;backface-visibility:hidden;transform-origin:center center}
      .fc2-card-stage{position:absolute;inset:0;z-index:1;overflow:hidden;perspective:650px;pointer-events:none;background:radial-gradient(circle at 50% 46%,rgba(28,72,55,.55),rgba(4,16,12,.15) 58%,rgba(2,10,7,.4))}
      .post-preview>.fc2-card-stage,.preview>.fc2-card-stage{position:absolute;inset:0}
      .post-preview>.post-category,.preview>.kind{z-index:4}
    `;
    document.head.appendChild(s);
  }

  function rect(u,v,w,h){return {u:u,v:v,w:w,h:h}}
  function maps(slim){
    var aw=slim?3:4;
    return {
      head:{w:8,h:8,d:8,body:{top:rect(8,0,8,8),bottom:rect(16,0,8,8),right:rect(0,8,8,8),front:rect(8,8,8,8),left:rect(16,8,8,8),back:rect(24,8,8,8)},outer:{top:rect(40,0,8,8),bottom:rect(48,0,8,8),right:rect(32,8,8,8),front:rect(40,8,8,8),left:rect(48,8,8,8),back:rect(56,8,8,8)}},
      body:{w:8,h:12,d:4,body:{top:rect(20,16,8,4),bottom:rect(28,16,8,4),right:rect(16,20,4,12),front:rect(20,20,8,12),left:rect(28,20,4,12),back:rect(32,20,8,12)},outer:{top:rect(20,32,8,4),bottom:rect(28,32,8,4),right:rect(16,36,4,12),front:rect(20,36,8,12),left:rect(28,36,4,12),back:rect(32,36,8,12)}},
      rightArm:{w:aw,h:12,d:4,body:{top:rect(44,16,aw,4),bottom:rect(44+aw,16,aw,4),right:rect(40,20,4,12),front:rect(44,20,aw,12),left:rect(44+aw,20,4,12),back:rect(48+aw,20,aw,12)},outer:{top:rect(44,32,aw,4),bottom:rect(44+aw,32,aw,4),right:rect(40,36,4,12),front:rect(44,36,aw,12),left:rect(44+aw,36,4,12),back:rect(48+aw,36,aw,12)}},
      leftArm:{w:aw,h:12,d:4,body:{top:rect(36,48,aw,4),bottom:rect(36+aw,48,aw,4),right:rect(32,52,4,12),front:rect(36,52,aw,12),left:rect(36+aw,52,4,12),back:rect(40+aw,52,aw,12)},outer:{top:rect(52,48,aw,4),bottom:rect(52+aw,48,aw,4),right:rect(48,52,4,12),front:rect(52,52,aw,12),left:rect(52+aw,52,4,12),back:rect(56+aw,52,aw,12)}},
      rightLeg:{w:4,h:12,d:4,body:{top:rect(4,16,4,4),bottom:rect(8,16,4,4),right:rect(0,20,4,12),front:rect(4,20,4,12),left:rect(8,20,4,12),back:rect(12,20,4,12)},outer:{top:rect(4,32,4,4),bottom:rect(8,32,4,4),right:rect(0,36,4,12),front:rect(4,36,4,12),left:rect(8,36,4,12),back:rect(12,36,4,12)}},
      leftLeg:{w:4,h:12,d:4,body:{top:rect(20,48,4,4),bottom:rect(24,48,4,4),right:rect(16,52,4,12),front:rect(20,52,4,12),left:rect(24,52,4,12),back:rect(28,52,4,12)},outer:{top:rect(4,48,4,4),bottom:rect(8,48,4,4),right:rect(0,52,4,12),front:rect(4,52,4,12),left:rect(8,52,4,12),back:rect(12,52,4,12)}}
    };
  }

  function faceTransform(face,W,H,D){
    if(face==="front")return "translate(-50%,-50%) translateZ("+(D/2)+"px)";
    if(face==="back")return "translate(-50%,-50%) rotateY(180deg) translateZ("+(D/2)+"px)";
    if(face==="right")return "translate(-50%,-50%) rotateY(-90deg) translateZ("+(W/2)+"px)";
    if(face==="left")return "translate(-50%,-50%) rotateY(90deg) translateZ("+(W/2)+"px)";
    if(face==="top")return "translate(-50%,-50%) rotateX(90deg) translateZ("+(H/2)+"px)";
    return "translate(-50%,-50%) rotateX(-90deg) translateZ("+(H/2)+"px)";
  }

  function addFace(part,face,dims,uv,url,U){
    var fw=(face==="left"||face==="right"?dims.d:dims.w)*U;
    var fh=(face==="top"||face==="bottom"?dims.d:dims.h)*U;
    var f=document.createElement("div");
    f.className="fc2-face fc2-face-"+face;
    f.style.width=fw+"px";f.style.height=fh+"px";
    f.style.backgroundImage='url("'+String(url).replace(/"/g,"%22")+'")';
    f.style.backgroundSize=(64*U)+"px "+(64*U)+"px";
    f.style.backgroundPosition=(-uv.u*U)+"px "+(-uv.v*U)+"px";
    f.style.transform=faceTransform(face,dims.w*U,dims.h*U,dims.d*U);
    part.appendChild(f);
  }

  function addPart(root,name,dims,uv,url,U,x,y,outer){
    var p=document.createElement("div");
    p.className="fc2-part fc2-part-"+name+(outer?" fc2-outer":"");
    var scale=outer?1.06:1;
    p.style.transform="translate3d("+(x*U)+"px,"+(y*U)+"px,0) scale3d("+scale+","+scale+","+scale+")";
    ["front","back","left","right","top","bottom"].forEach(function(face){addFace(p,face,dims,uv[face],url,U)});
    root.appendChild(p);
  }

  function build(stage,url,slim,interactive,card){
    ensureStyles();
    var U=card?3:6,m=maps(slim),aw=m.rightArm.w;
    var camera=document.createElement("div");camera.className="fc2-camera";
    var model=document.createElement("div");model.className="fc2-model";camera.appendChild(model);stage.appendChild(camera);
    var defs=[
      ["head",m.head,0,-10],["body",m.body,0,0],
      ["rightArm",m.rightArm,-(4+aw/2),0],["leftArm",m.leftArm,(4+aw/2),0],
      ["rightLeg",m.rightLeg,-2,12],["leftLeg",m.leftLeg,2,12]
    ];
    defs.forEach(function(d){addPart(model,d[0],d[1],d[1].body,url,U,d[2],d[3],false);addPart(model,d[0]+"-outer",d[1],d[1].outer,url,U,d[2],d[3],true)});

    var rx=card?-8:0,ry=card?25:0,zoom=card?1.7:1.45,panX=0,panY=0;
    function paint(){model.style.transform="rotateX("+rx+"deg) rotateY("+ry+"deg)";camera.style.transform="translate(calc(-50% + "+panX+"px),calc(-50% + "+panY+"px)) scale("+zoom+")"}
    function reset(){rx=0;ry=0;zoom=1.45;panX=0;panY=0;paint()}
    paint();

    if(card){
      requestAnimationFrame(function(){var w=stage.clientWidth||200;zoom=Math.max(1.05,Math.min(2.35,w/120));paint()});
      return {reset:reset};
    }
    if(!interactive)return {reset:reset};

    var pointers=new Map(),lastDist=0,lastCenter=null;
    stage.addEventListener("pointerdown",function(e){
      stage.setPointerCapture&&stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){var a=Array.from(pointers.values());lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);lastCenter={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}}
    });
    stage.addEventListener("pointermove",function(e){
      if(!pointers.has(e.pointerId))return;
      var old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===1){ry+=(e.clientX-old.x)*.45;rx-=(e.clientY-old.y)*.45;rx=Math.max(-89,Math.min(89,rx));paint()}
      else if(pointers.size===2){var a=Array.from(pointers.values()),dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),center={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};if(lastDist){zoom*=dist/lastDist;zoom=Math.max(.35,Math.min(4,zoom))}if(lastCenter){panX+=center.x-lastCenter.x;panY+=center.y-lastCenter.y}lastDist=dist;lastCenter=center;paint()}
    });
    function end(e){pointers.delete(e.pointerId);if(pointers.size<2){lastDist=0;lastCenter=null}}
    stage.addEventListener("pointerup",end);stage.addEventListener("pointercancel",end);
    stage.addEventListener("wheel",function(e){e.preventDefault();zoom*=e.deltaY>0?.9:1.1;zoom=Math.max(.25,Math.min(4,zoom));paint()},{passive:false});
    return {reset:reset};
  }

  function mountSkinCard(container,url,slim){
    if(!container||container.querySelector(".fc2-card-stage"))return;
    var img=container.querySelector("img");if(img)img.style.display="none";
    var stage=document.createElement("div");stage.className="fc2-card-stage";container.appendChild(stage);
    build(stage,url,!!slim,false,true);
  }

  function patchDetail(content){
    if(!content)return;
    var share=content.querySelector("[data-fc-share]");if(share)share.remove();
    var stage=content.querySelector("[data-fc-stage]"),uvImg=content.querySelector("[data-fc-uv] img");
    if(!stage||!uvImg)return;
    stage.querySelectorAll(".fc-skin-camera,.fc2-camera").forEach(function(n){n.remove()});
    var chip=content.querySelector(".fc-info-chip"),slim=!!(chip&&/Slim/i.test(chip.textContent||""));
    var viewer=build(stage,uvImg.src,slim,true,false);
    var reset=content.querySelector("[data-fc-reset]");if(reset)reset.addEventListener("click",viewer.reset);
  }

  function install(){
    if(!window.ForestCraftGallery||window.__forestCraftSkinFixInstalled)return false;
    window.__forestCraftSkinFixInstalled=true;
    var original=window.ForestCraftGallery.openPost;
    window.ForestCraftGallery.openPost=async function(id,opts){var r=await original(id,opts);var c=opts&&opts.content?opts.content:document.getElementById("modalContent");patchDetail(c);return r};
    window.ForestCraftGallery.mountSkinCard=mountSkinCard;
    window.ForestCraftGallery.patchSkinDetail=patchDetail;
    return true;
  }

  ensureStyles();
  if(!install()){var timer=setInterval(function(){if(install())clearInterval(timer)},40);setTimeout(function(){clearInterval(timer)},5000)}
})();