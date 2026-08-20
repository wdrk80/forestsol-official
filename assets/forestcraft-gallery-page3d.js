(function(){
  "use strict";
  if(!/(^|\/)forestcraft-gallery\.html$/.test(location.pathname))return;

  var API="https://forest-craft-api.wdrk80.workers.dev";
  var postByPreview=new Map();

  function loadSkinFix(done){
    if(window.ForestCraftGallery&&typeof window.ForestCraftGallery.mountSkinCard==="function")return done();
    var existing=document.querySelector('script[data-forest-craft-skinfix]');
    if(existing){setTimeout(function(){loadSkinFix(done)},50);return}
    var s=document.createElement("script");
    s.src="assets/forestcraft-gallery-skinfix.js?v=20260820-skinfix1";
    s.async=false;
    s.dataset.forestCraftSkinfix="1";
    s.onload=done;
    document.head.appendChild(s);
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
    out.forEach(function(p){if(p.category==="skin"&&p.preview_file_id)postByPreview.set(String(p.preview_file_id),p)});
  }

  function fileId(img){
    try{var u=new URL(img.src,location.href),m=u.pathname.match(/\/files\/([^/]+)$/);return m?decodeURIComponent(m[1]):""}catch(e){return ""}
  }

  function scan(){
    var h=window.ForestCraftGallery,grid=document.getElementById("grid");
    if(!h||typeof h.mountSkinCard!=="function"||!grid)return;
    grid.querySelectorAll(".card .preview").forEach(function(preview){
      if(preview.dataset.fc3dMounted==="1")return;
      var img=preview.querySelector("img");if(!img)return;
      var p=postByPreview.get(fileId(img));if(!p)return;
      preview.dataset.fc3dMounted="1";
      h.mountSkinCard(preview,img.src,p.classic_slim==="slim");
    });
  }

  function start(){
    if(!window.ForestCraftGallery||typeof window.ForestCraftGallery.mountSkinCard!=="function"){setTimeout(start,60);return}
    var grid=document.getElementById("grid");if(!grid){setTimeout(start,60);return}
    loadPosts().then(function(){scan();new MutationObserver(scan).observe(grid,{childList:true,subtree:true})}).catch(function(e){console.warn("3Dギャラリー準備失敗",e)});
  }

  loadSkinFix(start);
})();