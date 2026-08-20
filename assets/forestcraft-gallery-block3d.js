(function(){
  "use strict";
  var API="https://forest-craft-api.wdrk80.workers.dev";
  var enc=new TextEncoder();

  function ensureStyles(){
    if(document.getElementById("forestCraftBlock3dStyles"))return;
    var s=document.createElement("style");
    s.id="forestCraftBlock3dStyles";
    s.textContent=`
      .fcb-viewer-shell{display:grid;gap:10px;min-width:0}
      .fcb-toolbar{display:flex;gap:7px;flex-wrap:wrap}
      .fcb-btn{appearance:none;border:1px solid rgba(118,210,170,.42);border-radius:10px;background:#0b2118;color:#eaf7f0;min-height:38px;padding:8px 12px;font:inherit;font-size:12px;font-weight:850;cursor:pointer}
      .fcb-btn.active{color:#062019;background:linear-gradient(135deg,#c6f7d2,#6fe29a);border-color:#78f0a1}
      .fcb-stage{position:relative;min-height:480px;overflow:hidden;border:1px solid rgba(117,197,164,.34);border-radius:18px;background:radial-gradient(circle at 50% 46%,#153429 0,#071711 54%,#03100c 100%);perspective:900px;touch-action:none;user-select:none}
      .fcb-stage:fullscreen{width:100vw;height:100vh;border:0;border-radius:0;background:radial-gradient(circle at 50% 46%,#153429 0,#071711 54%,#03100c 100%)}
      .fcb-camera{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;will-change:transform}
      .fcb-cube{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d;will-change:transform}
      .fcb-face{position:absolute;left:50%;top:50%;width:180px;height:180px;image-rendering:pixelated;backface-visibility:hidden;transform-origin:center center;background:#111}
      .fcb-help{position:absolute;left:12px;bottom:10px;z-index:5;padding:5px 8px;border-radius:999px;background:rgba(0,0,0,.48);color:#a9c9bb;font-size:10px;pointer-events:none}
      .fcb-card-stage{position:absolute;inset:0;z-index:1;overflow:hidden;perspective:650px;pointer-events:none;background:radial-gradient(circle at 50% 46%,rgba(28,72,55,.55),rgba(4,16,12,.15) 58%,rgba(2,10,7,.4))}
      .fcb-card-stage .fcb-face{width:96px;height:96px}
      .post-preview>.fcb-card-stage,.preview>.fcb-card-stage{position:absolute;inset:0}
      .post-preview>.post-category,.preview>.kind{z-index:4}
      .fcb-download-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border:1px solid rgba(112,190,158,.3);border-radius:11px;background:#06120e}
      .fcb-download-copy{display:grid;gap:3px;min-width:0}.fcb-download-copy strong{font-size:13px;color:#e4f3ed}.fcb-download-copy span{font-size:10px;color:#91ab9f;line-height:1.5}
      .fcb-download-button{flex:none;border:0;border-radius:9px;padding:10px 13px;background:#78f0a1;color:#062019;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
      .fcb-download-button:disabled{opacity:.55;cursor:wait}
      @media(max-width:900px){.fcb-stage{min-height:390px}}
      @media(max-width:560px){.fcb-stage{min-height:340px}.fcb-face{width:150px;height:150px}}
    `;
    document.head.appendChild(s);
  }

  function fileUrl(f){return API+"/files/"+encodeURIComponent(f.id)}
  function faceFiles(files){
    var out={};
    ["front","back","left","right","top","bottom"].forEach(function(face){
      out[face]=files.find(function(f){return f.file_role==="texture"&&new RegExp("block_"+face+"\\.png$","i").test(f.original_filename||"")})||null;
    });
    return out;
  }

  function drawFirstFrame(canvas,url){
    var img=new Image();
    img.crossOrigin="anonymous";
    img.onload=function(){
      var side=img.naturalWidth||img.width||16;
      canvas.width=side;canvas.height=side;
      var x=canvas.getContext("2d");x.imageSmoothingEnabled=false;x.clearRect(0,0,side,side);x.drawImage(img,0,0,side,side,0,0,side,side);
    };
    img.src=url;
  }

  function faceTransform(face,T){
    var z=T/2;
    return ({
      front:"translate(-50%,-50%) translateZ("+z+"px)",
      back:"translate(-50%,-50%) rotateY(180deg) translateZ("+z+"px)",
      left:"translate(-50%,-50%) rotateY(-90deg) translateZ("+z+"px)",
      right:"translate(-50%,-50%) rotateY(90deg) translateZ("+z+"px)",
      top:"translate(-50%,-50%) rotateX(90deg) translateZ("+z+"px)",
      bottom:"translate(-50%,-50%) rotateX(-90deg) translateZ("+z+"px)"
    })[face];
  }

  function build(stage,files,interactive,card){
    ensureStyles();
    var ff=faceFiles(files),T=card?96:180;
    var camera=document.createElement("div");camera.className="fcb-camera";
    var cube=document.createElement("div");cube.className="fcb-cube";camera.appendChild(cube);stage.appendChild(camera);
    ["front","back","left","right","top","bottom"].forEach(function(face){
      var c=document.createElement("canvas");c.className="fcb-face fcb-face-"+face;c.style.width=T+"px";c.style.height=T+"px";c.style.transform=faceTransform(face,T);cube.appendChild(c);if(ff[face])drawFirstFrame(c,fileUrl(ff[face]));
    });
    var rx=card?-18:-18,ry=card?32:32,zoom=card?1.25:1.18,panX=0,panY=0;
    function paint(){cube.style.transform="rotateX("+rx+"deg) rotateY("+ry+"deg)";camera.style.transform="translate(calc(-50% + "+panX+"px),calc(-50% + "+panY+"px)) scale("+zoom+")"}
    function reset(){rx=-18;ry=32;zoom=card?1.25:1.18;panX=0;panY=0;paint()}
    paint();
    if(card||!interactive)return {reset:reset};
    var pointers=new Map(),lastDist=0,lastCenter=null;
    stage.addEventListener("pointerdown",function(e){stage.setPointerCapture&&stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){var a=Array.from(pointers.values());lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);lastCenter={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}}});
    stage.addEventListener("pointermove",function(e){if(!pointers.has(e.pointerId))return;var old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){ry+=(e.clientX-old.x)*.45;rx-=(e.clientY-old.y)*.45;rx=Math.max(-89,Math.min(89,rx));paint()}else if(pointers.size===2){var a=Array.from(pointers.values()),dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),center={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};if(lastDist){zoom*=dist/lastDist;zoom=Math.max(.3,Math.min(4,zoom))}if(lastCenter){panX+=center.x-lastCenter.x;panY+=center.y-lastCenter.y}lastDist=dist;lastCenter=center;paint()}});
    function end(e){pointers.delete(e.pointerId);if(pointers.size<2){lastDist=0;lastCenter=null}}
    stage.addEventListener("pointerup",end);stage.addEventListener("pointercancel",end);
    stage.addEventListener("wheel",function(e){e.preventDefault();zoom*=e.deltaY>0?.9:1.1;zoom=Math.max(.25,Math.min(4,zoom));paint()},{passive:false});
    return {reset:reset};
  }

  function mountBlockCard(container,post){
    if(!container||!post||container.querySelector(".fcb-card-stage"))return;
    var img=container.querySelector("img");if(img)img.style.display="none";
    var stage=document.createElement("div");stage.className="fcb-card-stage";container.appendChild(stage);
    fetch(API+"/posts/"+encodeURIComponent(post.id)).then(function(r){return r.json()}).then(function(d){if(d&&d.ok&&d.post)build(stage,d.post.files||[],false,true)}).catch(function(){});
  }

  function crcTable(){var t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t}
  var CRCT=crcTable();
  function crc32(bytes){var c=0xffffffff;for(var i=0;i<bytes.length;i++)c=CRCT[(c^bytes[i])&255]^(c>>>8);return (c^0xffffffff)>>>0}
  function concat(parts){var len=parts.reduce(function(a,b){return a+b.length},0),out=new Uint8Array(len),o=0;parts.forEach(function(p){out.set(p,o);o+=p.length});return out}
  function dosNow(){var d=new Date(),time=((d.getHours()&31)<<11)|((d.getMinutes()&63)<<5)|((Math.floor(d.getSeconds()/2))&31),date=(((Math.max(1980,d.getFullYear())-1980)&127)<<9)|(((d.getMonth()+1)&15)<<5)|(d.getDate()&31);return {time:time,date:date}}
  async function bytes(v){if(v instanceof Uint8Array)return v;if(v instanceof Blob)return new Uint8Array(await v.arrayBuffer());return enc.encode(String(v))}
  async function zip(entries){
    var locals=[],centrals=[],offset=0,stamp=dosNow();
    for(var i=0;i<entries.length;i++){
      var name=enc.encode(entries[i].name),data=await bytes(entries[i].data),crc=crc32(data);
      var lh=new Uint8Array(30+name.length),lv=new DataView(lh.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0,true);lv.setUint16(8,0,true);lv.setUint16(10,stamp.time,true);lv.setUint16(12,stamp.date,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,name.length,true);lv.setUint16(28,0,true);lh.set(name,30);locals.push(lh,data);
      var ch=new Uint8Array(46+name.length),cv=new DataView(ch.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0,true);cv.setUint16(10,0,true);cv.setUint16(12,stamp.time,true);cv.setUint16(14,stamp.date,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint16(30,0,true);cv.setUint16(32,0,true);cv.setUint16(34,0,true);cv.setUint16(36,0,true);cv.setUint32(38,0,true);cv.setUint32(42,offset,true);ch.set(name,46);centrals.push(ch);offset+=lh.length+data.length;
    }
    var central=concat(centrals),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(4,0,true);ev.setUint16(6,0,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,central.length,true);ev.setUint32(16,offset,true);ev.setUint16(20,0,true);return new Blob([concat(locals),central,end],{type:"application/zip"});
  }

  function blockSlug(p){var raw=String(p.id||"block").toLowerCase().replace(/[^a-z0-9_\-]/g,"_").replace(/^_+|_+$/g,"");return (raw||"block").slice(-48)}
  async function fetchBlob(f){var r=await fetch(fileUrl(f));if(!r.ok)throw new Error((f.original_filename||"ファイル")+"を取得できませんでした");return r.blob()}
  async function makeBlockPack(p){
    var files=Array.isArray(p.files)?p.files:[],ff=faceFiles(files),slug=blockSlug(p),ns="forestcraft",base="assets/"+ns+"/textures/block/",entries=[];
    for(var face of ["front","back","left","right","top","bottom"]){if(!ff[face])throw new Error(face+"面テクスチャがありません");entries.push({name:base+slug+"_"+face+".png",data:await fetchBlob(ff[face])});var meta=files.find(function(f){return f.file_role==="mcmeta"&&new RegExp("block_"+face+"\\.png\\.mcmeta$","i").test(f.original_filename||"")});if(meta)entries.push({name:base+slug+"_"+face+".png.mcmeta",data:await fetchBlob(meta)})}
    var model={parent:"minecraft:block/block",textures:{particle:ns+":block/"+slug+"_front",front:ns+":block/"+slug+"_front",back:ns+":block/"+slug+"_back",left:ns+":block/"+slug+"_left",right:ns+":block/"+slug+"_right",top:ns+":block/"+slug+"_top",bottom:ns+":block/"+slug+"_bottom"},elements:[{from:[0,0,0],to:[16,16,16],faces:{north:{texture:"#back",cullface:"north"},south:{texture:"#front",cullface:"south"},west:{texture:"#left",cullface:"west"},east:{texture:"#right",cullface:"east"},up:{texture:"#top",cullface:"up"},down:{texture:"#bottom",cullface:"down"}}}]};
    var blockstate={variants:{"":{model:ns+":block/"+slug}}};
    var manifest={type:"FOREST_CRAFT_BLOCK",format_version:1,block_id:ns+":"+slug,display_name:p.title||slug,source_post_id:p.id,category:"block",model:ns+":block/"+slug,faces:{front:slug+"_front.png",back:slug+"_back.png",left:slug+"_left.png",right:slug+"_right.png",top:slug+"_top.png",bottom:slug+"_bottom.png"},minecraft:{edition:"Java",resource_pack_format:34,requires_block_registration:true}};
    var readme="Forest Craft Studio Block Pack\n\n作品: "+(p.title||slug)+"\nBlock ID: "+ns+":"+slug+"\n\nこのZIPには6面テクスチャ、Block Model、Blockstate、Forest Craft用定義をまとめています。\nMinecraft Java Editionでは、リソースパックだけで新しいブロックIDを追加することはできません。\nForest Farm / NeoForgeなどのMOD側で上記Block IDを登録すると、このモデルとテクスチャをそのまま利用できます。\n";
    entries.push({name:"pack.mcmeta",data:JSON.stringify({pack:{pack_format:34,description:"Forest Craft Studio - "+(p.title||slug)}},null,2)});
    entries.push({name:"assets/"+ns+"/models/block/"+slug+".json",data:JSON.stringify(model,null,2)});
    entries.push({name:"assets/"+ns+"/blockstates/"+slug+".json",data:JSON.stringify(blockstate,null,2)});
    entries.push({name:"forestcraft_block.json",data:JSON.stringify(manifest,null,2)});
    entries.push({name:"README.txt",data:readme});
    return {blob:await zip(entries),filename:"forestcraft_block_"+slug+".zip",id:ns+":"+slug};
  }
  function saveBlob(blob,name){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1200)}

  async function patchDetail(content,id){
    if(!content)return;
    var h=window.ForestCraftGallery;if(!h||!h.getPost)return;
    var p=await h.getPost(id);if(!p||p.category!=="block")return;
    var files=Array.isArray(p.files)?p.files:[],old=content.querySelector(".fc-non-skin-preview,.fcb-viewer-shell");
    if(old&&!old.classList.contains("fcb-viewer-shell")){
      var shell=document.createElement("div");shell.className="fcb-viewer-shell";shell.innerHTML='<div class="fcb-toolbar"><button class="fcb-btn active" type="button">3D</button><button class="fcb-btn" type="button" data-fcb-reset>表示リセット</button><button class="fcb-btn" type="button" data-fcb-full>全画面</button></div><div class="fcb-stage" data-fcb-stage><div class="fcb-help">ドラッグ: 回転　ホイール/ピンチ: ズーム</div></div>';old.replaceWith(shell);var stage=shell.querySelector("[data-fcb-stage]"),viewer=build(stage,files,true,false);shell.querySelector("[data-fcb-reset]").onclick=viewer.reset;shell.querySelector("[data-fcb-full]").onclick=function(){if(stage.requestFullscreen)stage.requestFullscreen()};
    }
    var list=content.querySelector(".fc-download-list");if(list){list.innerHTML='<div class="fcb-download-row"><div class="fcb-download-copy"><strong>Minecraft Block Pack</strong><span>6面テクスチャ・モデルJSON・blockstate・Forest Craft定義を1つにまとめます。</span></div><button class="fcb-download-button" type="button" data-fcb-download>まとめてダウンロード</button></div>';var b=list.querySelector("[data-fcb-download]");b.onclick=async function(){b.disabled=true;var oldText=b.textContent;b.textContent="作成中…";try{var pack=await makeBlockPack(p);saveBlob(pack.blob,pack.filename);b.textContent="完了";setTimeout(function(){b.textContent=oldText;b.disabled=false},900)}catch(e){alert(e.message||String(e));b.textContent=oldText;b.disabled=false}}}
  }

  function install(){
    ensureStyles();
    var h=window.ForestCraftGallery;if(!h||h.__block3dInstalled)return false;h.__block3dInstalled=true;
    var original=h.openPost;
    h.openPost=async function(id,opts){var r=await original(id,opts);try{await patchDetail(opts&&opts.content?opts.content:document.getElementById("modalContent"),id)}catch(e){console.warn("Block 3D表示失敗",e)}return r};
    h.mountBlockCard=mountBlockCard;h.patchBlockDetail=patchDetail;h.makeBlockPack=makeBlockPack;return true;
  }
  if(!install()){var timer=setInterval(function(){if(install())clearInterval(timer)},50);setTimeout(function(){clearInterval(timer)},5000)}
})();