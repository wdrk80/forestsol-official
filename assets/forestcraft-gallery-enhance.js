(function(){
  "use strict";
  if(!/(^|\/)forestcraft\.html$/.test(location.pathname))return;

  function loadOne(src,attr,done){
    var old=document.querySelector('script['+attr+']');
    if(old){if(old.dataset.loaded==='1')done();else old.addEventListener('load',done,{once:true});return}
    var s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(attr,'1');s.onload=function(){s.dataset.loaded='1';done()};document.head.appendChild(s);
  }
  function loadModelFixes(done){
    function block(){
      if(window.ForestCraftGallery&&typeof window.ForestCraftGallery.patchBlockDetail==='function'&&typeof window.ForestCraftGallery.mountBlockCard==='function')return done();
      loadOne('assets/forestcraft-gallery-block3d.js?v=20260820-block3d2','data-forest-craft-block3d',done);
    }
    if(window.ForestCraftGallery&&typeof window.ForestCraftGallery.mountSkinCard==='function')return block();
    loadOne('assets/forestcraft-gallery-skinfix.js?v=20260820-skinfix1','data-forest-craft-skinfix',block);
  }

  function install(){
    if(!window.ForestCraftGallery||typeof render!=="function"||typeof openPost!=="function"||!document.getElementById("galleryGrid")){
      setTimeout(install,60);return;
    }
    if(typeof window.ForestCraftGallery.mountSkinCard!=="function"||typeof window.ForestCraftGallery.patchBlockDetail!=="function"||typeof window.ForestCraftGallery.mountBlockCard!=="function"){
      loadModelFixes(install);return;
    }
    if(window.__forestCraftGalleryEnhanced)return;
    window.__forestCraftGalleryEnhanced=true;

    var grid=document.getElementById("galleryGrid");
    var status=document.getElementById("galleryStatus");
    var originalRender=render;

    function moreHref(){
      var q=new URLSearchParams();
      try{if(activeCategory)q.set("category",activeCategory)}catch(e){}
      var search=document.getElementById("searchInput");if(search&&search.value.trim())q.set("q",search.value.trim());
      var sort=document.getElementById("sortSelect");if(sort&&sort.value)q.set("sort",sort.value);
      return "forestcraft-gallery.html"+(q.toString()?"?"+q.toString():"");
    }

    var wrap=document.createElement("div");
    wrap.style.cssText="display:flex;justify-content:center;margin-top:20px";
    var more=document.createElement("a");
    more.className="button secondary";
    more.textContent="さらに見る";
    more.href=moreHref();
    wrap.appendChild(more);
    grid.parentNode.insertBefore(wrap,grid.nextSibling);

    function mountCardModels(items,cards){
      var h=window.ForestCraftGallery;
      cards.forEach(function(card,i){
        var p=items[i];if(!p||!p.preview_file_id)return;
        var preview=card.querySelector(".post-preview");if(!preview)return;
        if(p.category==="skin")h.mountSkinCard(preview,h.apiBase+"/files/"+encodeURIComponent(p.preview_file_id),p.classic_slim==="slim");
        if(p.category==="block")h.mountBlockCard(preview,p);
      });
    }

    render=function(){
      originalRender();
      var items=[];try{items=filtered()}catch(e){}
      var cards=Array.from(grid.querySelectorAll(".post-card"));
      mountCardModels(items,cards);
      cards.slice(8).forEach(function(c){c.remove()});
      more.href=moreHref();
      var total=items.length||cards.length;
      if(status&&total>0)status.textContent="最新 "+Math.min(8,total)+"件を表示中 / 全"+total+"件";
      wrap.style.display="flex";
    };

    openPost=function(id){return window.ForestCraftGallery.openPost(id,{onDelete:function(){if(typeof loadPosts==="function")loadPosts()}})};
    window.openPost=openPost;

    var search=document.getElementById("searchInput");if(search)search.oninput=render;
    var sort=document.getElementById("sortSelect");if(sort)sort.onchange=render;
    document.querySelectorAll(".category-tab").forEach(function(b){b.addEventListener("click",function(){setTimeout(function(){more.href=moreHref()},0)})});

    render();
    var postId=new URLSearchParams(location.search).get("post");
    if(postId)setTimeout(function(){openPost(postId)},80);
  }
  install();
})();