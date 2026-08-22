(function(){
  "use strict";
  if(!/(^|\/)forestcraft-gallery\.html$/.test(location.pathname))return;

  if(!document.querySelector('link[data-forest-craft-gallery-original]')){
    var theme=document.createElement('link');
    theme.rel='stylesheet';
    theme.href='assets/forestcraft-gallery-original.css?v=20260821-original1';
    theme.dataset.forestCraftGalleryOriginal='1';
    document.head.appendChild(theme);
  }

  function ensureLayoutArt(){
    var head=document.querySelector('.gallery-page-head');
    if(head&&!head.querySelector('.fc-gallery-header-art')){
      var hi=document.createElement('img');
      hi.className='fc-gallery-header-art';
      hi.src='images/forestcraft/fcs-gallery-header.png';
      hi.alt='';
      hi.setAttribute('aria-hidden','true');
      head.insertBefore(hi,head.firstChild);
    }
    var filters=document.querySelector('.filters');
    if(filters&&!filters.querySelector('.fc-gallery-filter-art')){
      var fi=document.createElement('img');
      fi.className='fc-gallery-filter-art';
      fi.src='images/forestcraft/fcs-gallery-filter-panel.png';
      fi.alt='';
      fi.setAttribute('aria-hidden','true');
      filters.insertBefore(fi,filters.firstChild);
    }
  }

  function applyLayoutFix(){
    var id='fc-gallery-layout-fix-20260822d';
    if(document.getElementById(id))return;
    var style=document.createElement('style');
    style.id=id;
    style.textContent=[
      '.gallery-page-head{position:relative!important;height:auto!important;min-height:0!important;padding:0!important;background:none!important;overflow:visible!important;}',
      '.fc-gallery-header-art{display:block!important;width:100%!important;height:auto!important;max-width:none!important;margin:0!important;padding:0!important;pointer-events:none!important;}',
      '.gallery-page-head-inner{position:absolute!important;inset:0!important;height:100%!important;}',
      '.filters{position:relative!important;height:auto!important;min-height:0!important;padding:0!important;background:none!important;overflow:visible!important;}',
      '.fc-gallery-filter-art{display:block!important;width:100%!important;height:auto!important;max-width:none!important;margin:0!important;padding:0!important;pointer-events:none!important;}',
      '.toolbar input{background-size:100% 100%!important;background-position:center!important;background-repeat:no-repeat!important;}',
      '@media(min-width:1060px){.tabs{top:27%!important;right:7.5%!important;left:auto!important}.toolbar{left:12.5%!important;right:7.5%!important;bottom:20%!important}}',
      '@media(min-width:761px) and (max-width:1059px){.tabs{top:26%!important;right:5%!important;left:auto!important}.toolbar{left:10%!important;right:6%!important;bottom:18%!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function loadLayoutRuntime(){
    if(window.ForestLayout||document.querySelector('script[data-forest-layout-runtime]'))return;
    var s=document.createElement('script');
    s.src='assets/forest-layout-runtime.js?v=20260822-layout1';
    s.async=false;
    s.dataset.forestLayoutRuntime='1';
    document.head.appendChild(s);
  }

  ensureLayoutArt();
  applyLayoutFix();
  loadLayoutRuntime();

  var API="https://forest-craft-api.wdrk80.workers.dev";
  var postByPreview=new Map();

  function loadOne(src,attr,done){
    var old=document.querySelector('script['+attr+']');
    if(old){if(old.dataset.loaded==='1')done();else old.addEventListener('load',done,{once:true});return}
    var s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(attr,'1');s.onload=function(){s.dataset.loaded='1';done()};document.head.appendChild(s);
  }
  function loadFixes(done){
    function community(){
      if(window.ForestCraftGallery&&typeof window.ForestCraftGallery.mountCommunity==='function')return done();
      loadOne('assets/forestcraft-community.js?v=20260820-community1','data-forest-craft-community',done);
    }
    function model(){
      if(window.ForestCraftGallery&&typeof window.ForestCraftGallery.mountModelCard==='function')return community();
      loadOne('assets/forestcraft-gallery-model3d.js?v=20260820-model3d1','data-forest-craft-model3d',community);
    }
    function block(){
      if(window.ForestCraftGallery&&typeof window.ForestCraftGallery.mountBlockCard==='function')return model();
      loadOne('assets/forestcraft-gallery-block3d.js?v=20260820-block3d2','data-forest-craft-block3d',model);
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
    out.forEach(function(p){if((p.category==="skin"||p.category==="block"||p.category==="model")&&p.preview_file_id)postByPreview.set(String(p.preview_file_id),p)});
  }

  function fileId(img){
    try{var u=new URL(img.src,location.href),m=u.pathname.match(/\/files\/([^/]+)$/);return m?decodeURIComponent(m[1]):""}catch(e){return ""}
  }

  function scan(){
    var h=window.ForestCraftGallery,grid=document.getElementById("grid");
    if(!h||typeof h.mountSkinCard!=="function"||typeof h.mountBlockCard!=="function"||typeof h.mountModelCard!=="function"||!grid)return;
    grid.querySelectorAll(".card .preview").forEach(function(preview){
      if(preview.dataset.fc3dMounted==="1")return;
      var img=preview.querySelector("img");if(!img)return;
      var p=postByPreview.get(fileId(img));if(!p)return;
      preview.dataset.fc3dMounted="1";
      if(p.category==="skin")h.mountSkinCard(preview,img.src,p.classic_slim==="slim");
      if(p.category==="block")h.mountBlockCard(preview,p);
      if(p.category==="model")h.mountModelCard(preview,p);
    });
  }

  function start(){
    if(!window.ForestCraftGallery||typeof window.ForestCraftGallery.mountSkinCard!=="function"||typeof window.ForestCraftGallery.mountBlockCard!=="function"||typeof window.ForestCraftGallery.mountModelCard!=="function"||typeof window.ForestCraftGallery.mountCommunity!=="function"){setTimeout(start,60);return}
    var grid=document.getElementById("grid");if(!grid){setTimeout(start,60);return}
    loadPosts().then(function(){scan();new MutationObserver(scan).observe(grid,{childList:true,subtree:true})}).catch(function(e){console.warn("3Dギャラリー準備失敗",e)});
  }

  loadFixes(start);
})();