(function(){
  "use strict";
  if(!/(^|\/)forestcraft-gallery\.html$/.test(location.pathname))return;

  var API="https://forest-craft-api.wdrk80.workers.dev";
  var postByPreview=new Map();

  function loadOne(src,attr,done){
    var old=document.querySelector('script['+attr+']');
    if(old){if(old.dataset.loaded==='1')done();else old.addEventListener('load',done,{once:true});return}
    var s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(attr,'1');s.onload=function(){s.dataset.loaded='1';done()};document.head.appendChild(s);
  }
  function loadFixes(done){
    function block(){
      if(window.ForestCraftGallery&&typeof window.ForestCraftGallery.mountBlockCard==='function')return done();
      loadOne('assets/forestcraft-gallery-block3d.js?v=20260820-block3d2','data-forest-craft-block3d',done);
    }
    if(window.ForestCraftGallery&&typeof window.ForestCraftGallery.mountSkinCard==='function')return block();
    loadOne('assets/forestcraft-gallery-skinfix.js?v=20260820-skinfix1','data-forest-craft-skinfix',block);
  }

  async function loadPosts(){
    var out=[],offset=0;
    for(var i=0;i<100;i++){
      var r=await fetch(API+"/posts?limit=50&offset="+offset),d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||"作品を取得できませんでした");
      var batch=d.posts||[];out.push.apply(out,batch);
      if(batch.length<50)break;
      offset+=50;
    }
    postByPreview.clear();
    out.forEach(function(p){if((p.category==="skin"||p.category==="block")&&p.preview_file_id)postByPreview.set(String(p.preview_file_id),p)});
  }

  function fileId(img){
    try{var u=new URL(img.src,location.href),m=u.pathname.match(/\/files\/([^/]+)$/);return m?decodeURIComponent(m[1]):""}catch(e){return ""}
  }

  function scan(){
    var h=window.ForestCraftGallery,grid=document.getElementById("grid");
    if(!h||typeof h.mountSkinCard!=="function"||typeof h.mountBlockCard!=="function"||!grid)return;
    grid.querySelectorAll(".card .preview").forEach(function(preview){
      if(preview.dataset.fc3dMounted==="1")return;
      var img=preview.querySelector("img");if(!img)return;
      var p=postByPreview.get(fileId(img));if(!p)return;
      preview.dataset.fc3dMounted="1";
      if(p.category==="skin")h.mountSkinCard(preview,img.src,p.classic_slim==="slim");
      if(p.category==="block")h.mountBlockCard(preview,p);
    });
  }

  function start(){
    if(!window.ForestCraftGallery||typeof window.ForestCraftGallery.mountSkinCard!=="function"||typeof window.ForestCraftGallery.mountBlockCard!=="function"){setTimeout(start,60);return}
    var grid=document.getElementById("grid");if(!grid){setTimeout(start,60);return}
    loadPosts().then(function(){scan();new MutationObserver(scan).observe(grid,{childList:true,subtree:true})}).catch(function(e){console.warn("3Dギャラリー準備失敗",e)});
  }

  loadFixes(start);
})();