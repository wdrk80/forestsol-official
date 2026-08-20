(function(){
  "use strict";
  if(!/(^|\/)forestcraft\.html$/.test(location.pathname))return;

  function install(){
    if(!window.ForestCraftGallery||typeof render!=="function"||typeof openPost!=="function"||!document.getElementById("galleryGrid")){
      setTimeout(install,60);return;
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

    render=function(){
      originalRender();
      var cards=Array.from(grid.querySelectorAll(".post-card"));
      cards.slice(8).forEach(function(c){c.remove()});
      more.href=moreHref();
      var total=0;
      try{total=filtered().length}catch(e){total=cards.length}
      if(status&&total>0)status.textContent="最新 "+Math.min(8,total)+"件を表示中 / 全"+total+"件";
      wrap.style.display=total>8?"flex":"none";
    };

    openPost=function(id){return window.ForestCraftGallery.openPost(id,{onDelete:function(){if(typeof loadPosts==="function")loadPosts()}})};
    window.openPost=openPost;

    var search=document.getElementById("searchInput");if(search)search.addEventListener("input",function(){more.href=moreHref()});
    var sort=document.getElementById("sortSelect");if(sort)sort.addEventListener("change",function(){more.href=moreHref()});
    document.querySelectorAll(".category-tab").forEach(function(b){b.addEventListener("click",function(){setTimeout(function(){more.href=moreHref()},0)})});

    render();
    var postId=new URLSearchParams(location.search).get("post");
    if(postId)setTimeout(function(){openPost(postId)},80);
  }
  install();
})();