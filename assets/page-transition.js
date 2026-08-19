(function(){
  "use strict";

  function ensureSiteNav(){
    var navs=document.querySelectorAll("nav");
    navs.forEach(function(nav){
      if(!nav.querySelector('a[href="forestcraft.html"],a[href$="/forestcraft.html"]')){
        var craft=document.createElement("a");craft.href="forestcraft.html";craft.textContent="Forest Craft Studio";craft.className="forestcraft-nav-link";
        var farm=nav.querySelector('a[href="forestfarm.html"],a[href$="/forestfarm.html"]');
        if(farm&&farm.nextSibling)nav.insertBefore(craft,farm.nextSibling);else nav.appendChild(craft);
      }
      if(!nav.querySelector(".forest-account-nav-link")){
        var link=document.createElement("a");link.className="forest-account-nav-link";
        var logged=!!localStorage.getItem("forestsol_session_v1");
        var user=null;try{user=JSON.parse(localStorage.getItem("forestsol_user_v1")||"null")}catch(e){}
        link.href=logged?"mypage.html":"account.html";
        link.textContent=logged?(user&&user.display_name?"マイページ":"マイページ"):"ログイン";
        nav.appendChild(link);
      }
    });
  }
  ensureSiteNav();
  window.addEventListener("forestsol-auth-change",ensureSiteNav);

  function applyForestCraftVisualFix(){
    if(!/\/forestcraft\.html$/i.test(location.pathname))return;
    var header=document.querySelector(".craft-header");
    if(header&&!header.querySelector(".forestcraft-header-art")){
      header.style.background="#06140e";
      header.style.aspectRatio="1717 / 532";
      header.style.height="auto";
      var art=document.createElement("div");
      art.className="forestcraft-header-art";
      art.setAttribute("aria-hidden","true");
      art.style.cssText="position:absolute;inset:0;display:grid;grid-template-columns:572fr 286fr 287fr 286fr 286fr;overflow:hidden;z-index:0";
      ["header-a.svg","header-2.svg","header-3.svg","header-4.svg","header-5.svg"].forEach(function(name){
        var img=document.createElement("img");
        img.src="images/forestcraft/tiles/"+name+"?v=20260819c";
        img.alt="";
        img.draggable=false;
        img.style.cssText="display:block;width:100%;height:100%;object-fit:fill;min-width:0";
        art.appendChild(img);
      });
      header.insertBefore(art,header.firstChild);
      var hidden=header.querySelector(".header-accessible");if(hidden)hidden.style.zIndex="1";
    }
    if(!document.getElementById("forestcraft-native-art-style")){
      var s=document.createElement("style");s.id="forestcraft-native-art-style";
      s.textContent="body:has(.craft-header){background-color:#020906!important}.craft-header{background-image:none!important}.craft-header:before,.craft-header:after{display:none!important}.hero-icon-wrap:after{display:none!important}.hero-icon{opacity:1!important;visibility:visible!important;filter:drop-shadow(0 22px 36px rgba(0,0,0,.55)) drop-shadow(0 0 26px rgba(64,208,255,.26))!important}.forestcraft-header-art img{image-rendering:auto!important}";
      document.head.appendChild(s);
    }
  }
  applyForestCraftVisualFix();

  var TRANSITION_DURATION=920,REDUCED_MOTION_DURATION=180,isLeaving=false;
  var reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var style=document.createElement("style");
  style.textContent=[
    ".forestcraft-nav-link{color:#9fe7c6!important}",
    ".forestcraft-nav-link:hover{color:#ffd36b!important}",
    ".forest-account-nav-link{color:#ffd36b!important}",
    ".forest-account-nav-link:hover{color:#9fe7c6!important}",
    ".paw-page-transition{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;overflow:hidden;visibility:hidden;opacity:0;pointer-events:none;background:radial-gradient(circle at 50% 46%,rgba(255,255,244,.98) 0 18%,rgba(255,242,190,.96) 54%,rgba(226,183,83,.96) 100%);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}",
    ".paw-page-transition.is-active{visibility:visible;pointer-events:auto;animation:paw-curtain-in 260ms ease-out forwards}",
    ".paw-page-transition__sun{position:absolute;width:min(78vw,620px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.72),rgba(255,218,107,.2) 48%,transparent 70%);animation:paw-sun-breathe 2.4s ease-in-out infinite alternate}",
    ".paw-page-transition__trail{position:relative;width:min(86vw,520px);height:190px}",
    ".paw-page-transition__print{--paw-x:0px;--paw-y:0px;--paw-rotate:0deg;--paw-delay:0ms;position:absolute;left:50%;top:50%;width:68px;height:68px;color:#875020;opacity:0;filter:drop-shadow(0 5px 3px rgba(91,47,12,.2));transform:translate(calc(-50% + var(--paw-x)),calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(.25)}",
    ".paw-page-transition__print:nth-child(even){color:#b67429}",
    ".paw-page-transition.is-active .paw-page-transition__print{animation:paw-print-pop 420ms cubic-bezier(.18,.88,.28,1.28) var(--paw-delay) forwards}",
    ".paw-page-transition__print:nth-child(1){--paw-x:-178px;--paw-y:56px;--paw-rotate:-19deg;--paw-delay:90ms}",
    ".paw-page-transition__print:nth-child(2){--paw-x:-93px;--paw-y:8px;--paw-rotate:17deg;--paw-delay:230ms}",
    ".paw-page-transition__print:nth-child(3){--paw-x:-8px;--paw-y:48px;--paw-rotate:-17deg;--paw-delay:370ms}",
    ".paw-page-transition__print:nth-child(4){--paw-x:77px;--paw-y:0px;--paw-rotate:18deg;--paw-delay:510ms}",
    ".paw-page-transition__print:nth-child(5){--paw-x:162px;--paw-y:40px;--paw-rotate:-16deg;--paw-delay:650ms}",
    ".paw-page-transition__print svg{display:block;width:100%;height:100%;fill:currentColor}",
    "html.paw-transition-leaving,html.paw-transition-leaving body{overflow:hidden}",
    "@keyframes paw-curtain-in{from{opacity:0}to{opacity:1}}",
    "@keyframes paw-print-pop{0%{opacity:0;transform:translate(calc(-50% + var(--paw-x)),calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(.25)}62%{opacity:1;transform:translate(calc(-50% + var(--paw-x)),calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(1.13)}100%{opacity:1;transform:translate(calc(-50% + var(--paw-x)),calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(1)}}",
    "@keyframes paw-sun-breathe{from{transform:scale(.94);opacity:.76}to{transform:scale(1.04);opacity:1}}",
    "@media(max-width:540px){.paw-page-transition__trail{width:340px;height:170px}.paw-page-transition__print{width:55px;height:55px}.paw-page-transition__print:nth-child(1){--paw-x:-133px;--paw-y:52px}.paw-page-transition__print:nth-child(2){--paw-x:-68px;--paw-y:10px}.paw-page-transition__print:nth-child(3){--paw-x:-3px;--paw-y:46px}.paw-page-transition__print:nth-child(4){--paw-x:62px;--paw-y:4px}.paw-page-transition__print:nth-child(5){--paw-x:127px;--paw-y:40px}}",
    "@media(prefers-reduced-motion:reduce){.paw-page-transition.is-active{animation-duration:120ms}.paw-page-transition__sun{animation:none}.paw-page-transition.is-active .paw-page-transition__print{animation:none;opacity:1;transform:translate(calc(-50% + var(--paw-x)),calc(-50% + var(--paw-y))) rotate(var(--paw-rotate)) scale(1)}}"
  ].join("\n");document.head.appendChild(style);

  function pawMarkup(){return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><ellipse cx="32" cy="42" rx="16" ry="13"></ellipse><ellipse cx="14" cy="28" rx="6" ry="8" transform="rotate(-24 14 28)"></ellipse><ellipse cx="25" cy="18" rx="6" ry="8" transform="rotate(-8 25 18)"></ellipse><ellipse cx="39" cy="18" rx="6" ry="8" transform="rotate(8 39 18)"></ellipse><ellipse cx="50" cy="28" rx="6" ry="8" transform="rotate(24 50 28)"></ellipse></svg>'}
  var overlay=document.createElement("div");overlay.className="paw-page-transition";overlay.setAttribute("aria-hidden","true");
  var sun=document.createElement("div");sun.className="paw-page-transition__sun";overlay.appendChild(sun);
  var trail=document.createElement("div");trail.className="paw-page-transition__trail";for(var i=0;i<5;i++){var paw=document.createElement("span");paw.className="paw-page-transition__print";paw.innerHTML=pawMarkup();trail.appendChild(paw)}overlay.appendChild(trail);document.body.appendChild(overlay);
  function shouldTransition(link){if(!link||link.hasAttribute("download")||link.dataset.noTransition!==undefined||(link.target&&link.target.toLowerCase()!=="_self"))return false;var raw=link.getAttribute("href");if(!raw||raw.charAt(0)==="#")return false;var dest;try{dest=new URL(link.href,location.href)}catch(e){return false}if(dest.origin!==location.origin||!/^https?:$/.test(dest.protocol))return false;return dest.href!==location.href}
  function beginTransition(destination){if(isLeaving)return;isLeaving=true;document.documentElement.classList.add("paw-transition-leaving");overlay.classList.add("is-active");setTimeout(function(){location.href=destination},reduceMotion?REDUCED_MOTION_DURATION:TRANSITION_DURATION)}
  document.addEventListener("click",function(event){if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;var link=event.target.closest("a[href]");if(!shouldTransition(link))return;event.preventDefault();beginTransition(link.href)});
  window.addEventListener("pageshow",function(){isLeaving=false;document.documentElement.classList.remove("paw-transition-leaving");overlay.classList.remove("is-active");document.querySelectorAll('.forest-account-nav-link').forEach(function(n){n.remove()});ensureSiteNav();applyForestCraftVisualFix()});
})();
