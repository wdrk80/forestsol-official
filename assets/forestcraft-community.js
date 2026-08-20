(function(){
  "use strict";
  var API="https://forest-craft-api.wdrk80.workers.dev";

  function ensureStyles(){
    if(document.getElementById("forestCraftCommunityStyles"))return;
    var s=document.createElement("style");s.id="forestCraftCommunityStyles";s.textContent=`
      .fc-community{display:grid;gap:10px;margin:14px 0;padding:13px 14px;border:1px solid rgba(118,210,170,.30);border-radius:13px;background:rgba(8,31,23,.72)}
      .fc-community-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .fc-community-score{display:flex;align-items:baseline;gap:7px;color:#f5d372}.fc-community-score strong{font-size:20px}.fc-community-score span{font-size:10px;color:#9fb5aa}
      .fc-stars{display:flex;gap:3px}.fc-star{appearance:none;border:0;background:transparent;color:#52675e;font-size:25px;line-height:1;padding:1px 2px;cursor:pointer;text-shadow:0 2px 8px rgba(0,0,0,.35)}.fc-star.on,.fc-star:hover{color:#ffd56c}.fc-star:disabled{cursor:default;opacity:.75}
      .fc-community-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fc-favorite{appearance:none;border:1px solid rgba(255,213,108,.36);border-radius:10px;background:#1d261d;color:#f5e9c8;padding:8px 12px;font:inherit;font-size:11px;font-weight:850;cursor:pointer}.fc-favorite.on{background:#58441b;border-color:#e8c25a;color:#fff2b6}.fc-community-note{font-size:10px;color:#93aa9f}
      .fc-card-fav{position:absolute;right:8px;top:8px;z-index:8;display:grid;place-items:center;width:30px;height:30px;border:1px solid rgba(255,213,108,.35);border-radius:50%;background:rgba(3,13,9,.86);color:#f4d779;font-size:17px;pointer-events:none}
    `;document.head.appendChild(s);
  }

  function loadAuth(){
    if(window.ForestAuth)return Promise.resolve(window.ForestAuth);
    return new Promise(function(resolve){var old=document.querySelector('script[data-fc-community-auth]');if(old){old.addEventListener("load",function(){resolve(window.ForestAuth||null)},{once:true});return}var s=document.createElement("script");s.src="assets/forest-auth.js?v=20260820-community1";s.dataset.fcCommunityAuth="1";s.onload=function(){resolve(window.ForestAuth||null)};s.onerror=function(){resolve(null)};document.head.appendChild(s)});
  }
  async function authUser(){var a=await loadAuth();if(!a)return null;try{return await a.me(false)}catch(e){return null}}
  async function request(path,options,authPreferred){
    var a=await loadAuth();if(a&&authPreferred!==false)return a.request(path,options||{});
    var r=await fetch(API+path,options||{}),d=await r.json().catch(function(){return{ok:false,error:"API応答を読み込めませんでした"}});if(!r.ok||d.ok===false)throw new Error(d.error||("HTTP "+r.status));return d;
  }
  function loginHref(){return "account.html?next="+encodeURIComponent(location.pathname+location.search+location.hash)}
  function toast(msg){var t=document.createElement("div");t.className="fc-toast";t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove()},1800)}

  async function mountCommunity(content,p){
    if(!content||!p||content.querySelector(".fc-community"))return;
    var meta=content.querySelector(".fc-meta-line");if(!meta)return;
    var box=document.createElement("div");box.className="fc-community";box.innerHTML='<div class="fc-community-top"><div class="fc-community-score"><strong data-fcc-avg>★ 0.0</strong><span data-fcc-count>0件の評価</span></div><div class="fc-community-actions"><button class="fc-favorite" type="button" data-fcc-fav>☆ お気に入り</button></div></div><div><div class="fc-stars" aria-label="この作品を5段階で評価"></div><div class="fc-community-note" data-fcc-note>星を押して評価できます。</div></div>';meta.insertAdjacentElement("afterend",box);
    var stars=box.querySelector(".fc-stars"),avg=box.querySelector("[data-fcc-avg]"),count=box.querySelector("[data-fcc-count]"),fav=box.querySelector("[data-fcc-fav]"),note=box.querySelector("[data-fcc-note]");
    for(var i=1;i<=5;i++){var b=document.createElement("button");b.className="fc-star";b.type="button";b.textContent="★";b.dataset.value=String(i);b.title=i+" / 5";stars.appendChild(b)}
    var state={rating_average:Number(p.rating_average||0),rating_count:Number(p.rating_count||0),favorite_count:Number(p.favorite_count||0),my_rating:0,is_favorite:false};
    function render(){avg.textContent="★ "+Number(state.rating_average||0).toFixed(1);count.textContent=Number(state.rating_count||0)+"件の評価";stars.querySelectorAll(".fc-star").forEach(function(b){b.classList.toggle("on",Number(b.dataset.value)<=Number(state.my_rating||0))});fav.classList.toggle("on",!!state.is_favorite);fav.textContent=(state.is_favorite?"★":"☆")+" お気に入り"+(state.favorite_count?" "+state.favorite_count:"")}
    render();
    try{var d=await request("/posts/"+encodeURIComponent(p.id)+"/community",{},true);if(d.community)Object.assign(state,d.community);render()}catch(e){note.textContent=/404|Not found/i.test(e.message||"")?"評価・お気に入りAPIの反映待ちです。":e.message;stars.querySelectorAll("button").forEach(function(x){x.disabled=true});fav.disabled=true;return}
    var user=await authUser();if(!user)note.textContent="評価・お気に入りにはログインが必要です。";
    stars.querySelectorAll(".fc-star").forEach(function(b){b.onclick=async function(){if(!user){location.href=loginHref();return}var val=Number(b.dataset.value);stars.querySelectorAll("button").forEach(function(x){x.disabled=true});try{var d=await request("/posts/"+encodeURIComponent(p.id)+"/rating",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rating:val})},true);Object.assign(state,d.community||{});render();note.textContent="評価を更新しました。";window.dispatchEvent(new CustomEvent("forestcraft-community-change",{detail:{postId:p.id,community:state}}))}catch(e){alert(e.message||String(e))}finally{stars.querySelectorAll("button").forEach(function(x){x.disabled=false})}}});
    fav.onclick=async function(){if(!user){location.href=loginHref();return}fav.disabled=true;try{var method=state.is_favorite?"DELETE":"POST",d=await request("/posts/"+encodeURIComponent(p.id)+"/favorite",{method:method},true);Object.assign(state,d.community||{});render();toast(state.is_favorite?"お気に入りに追加しました":"お気に入りから外しました");window.dispatchEvent(new CustomEvent("forestcraft-community-change",{detail:{postId:p.id,community:state}}))}catch(e){alert(e.message||String(e))}finally{fav.disabled=false}};
  }

  function install(){
    ensureStyles();var h=window.ForestCraftGallery;if(!h||h.__communityInstalled)return false;h.__communityInstalled=true;var original=h.openPost;if(typeof original!=="function")return false;
    h.openPost=async function(id,opts){var r=await original(id,opts);try{var p=await h.getPost(id);await mountCommunity(opts&&opts.content?opts.content:document.getElementById("modalContent"),p)}catch(e){console.warn("Community UI failed",e)}return r};
    h.mountCommunity=mountCommunity;return true;
  }
  if(!install()){var timer=setInterval(function(){if(install())clearInterval(timer)},60);setTimeout(function(){clearInterval(timer)},7000)}
})();
