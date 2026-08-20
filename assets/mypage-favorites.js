(function(){
"use strict";
if(!/(^|\/)mypage\.html$/.test(location.pathname))return;
const API="https://forest-craft-api.wdrk80.workers.dev";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function addStyles(){if(document.getElementById("mypageFavoriteStyles"))return;const s=document.createElement("style");s.id="mypageFavoriteStyles";s.textContent=`
.favorite-card .work-preview{position:relative}.favorite-card .work-preview img{object-fit:contain;image-rendering:pixelated}.favorite-rating{margin-top:5px;color:#8b6a31;font-size:10px;font-weight:900}.favorite-open{color:#54351e;text-decoration:none;display:inline-grid;place-items:center}.favorite-heart{position:absolute;right:8px;top:8px;z-index:9;display:grid;place-items:center;width:31px;height:31px;border-radius:50%;border:1px solid #b58b3e;background:rgba(58,38,17,.86);color:#ffe29a;font-size:16px}.favorite-count{font-size:11px;color:#80634a;font-weight:900}
`;document.head.appendChild(s)}
function loadScript(src,key){return new Promise((resolve,reject)=>{const old=document.querySelector(`script[data-${key}]`);if(old){if(old.dataset.loaded==='1')return resolve();old.addEventListener("load",resolve,{once:true});return}const s=document.createElement("script");s.src=src;s.async=false;s.setAttribute(`data-${key}`,"1");s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=reject;document.head.appendChild(s)})}
async function ensure3d(){
 window.ForestCraftGallery=window.ForestCraftGallery||{};
 Object.assign(window.ForestCraftGallery,{apiBase:API,getPost:async id=>(await ForestAuth.request('/posts/'+encodeURIComponent(id))).post,openPost:window.ForestCraftGallery.openPost||async()=>{}});
 try{await loadScript('assets/forestcraft-gallery-block3d.js?v=20260820-block3d2','mypage-block3d');await loadScript('assets/forestcraft-gallery-model3d.js?v=20260820-model3d1','mypage-model3d')}catch(e){console.warn('MyPage 3D preview load failed',e)}
}
function preview(p){return p.preview_file_id?`<img src="${API}/files/${encodeURIComponent(p.preview_file_id)}" alt="${esc(p.title)}">`:`<div style="font-size:38px">${p.category==='model'?'◫':p.category==='block'?'▣':'🎨'}</div>`}
function mount3d(grid,posts){const h=window.ForestCraftGallery;if(!h)return;[...grid.querySelectorAll('.favorite-card')].forEach((card,i)=>{const p=posts[i],box=card.querySelector('.work-preview');if(!p||!box)return;if(p.category==='block'&&typeof h.mountBlockCard==='function')h.mountBlockCard(box,p);if(p.category==='model'&&typeof h.mountModelCard==='function')h.mountModelCard(box,p)})}
async function init(){
 for(let i=0;i<120&&!window.ForestAuth;i++)await sleep(50);if(!window.ForestAuth)return;
 for(let i=0;i<120&&!document.getElementById('myWorks');i++)await sleep(50);const own=document.getElementById('myWorks');if(!own)return;
 addStyles();await ensure3d();
 const section=document.createElement('section');section.id='favoriteWorks';section.className='paper-card works-card';section.innerHTML=`<div class="section-head"><h2>お気に入り</h2><button id="favoriteReloadBtn" type="button">再読み込み</button></div><div id="favoriteCount" class="favorite-count">読み込み中…</div><div id="favoriteGrid" class="works" style="margin-top:12px"><div class="empty">お気に入りを読み込み中…</div></div>`;own.insertAdjacentElement('afterend',section);
 const grid=section.querySelector('#favoriteGrid'),count=section.querySelector('#favoriteCount');
 async function load(){
  grid.innerHTML='<div class="empty">お気に入りを読み込み中…</div>';
  try{const d=await ForestAuth.request('/me/favorites'),posts=d.posts||[];count.textContent=`${posts.length}件のお気に入り`;if(!posts.length){grid.innerHTML='<div class="empty">お気に入りはまだありません。作品ギャラリーの ☆ ボタンから追加できます。</div>';return}
   grid.innerHTML=posts.map(p=>`<article class="work-card favorite-card" data-id="${esc(p.id)}"><div class="work-preview">${preview(p)}<span class="favorite-heart">★</span></div><div class="work-body"><div class="work-title">${esc(p.title)}</div><div class="work-meta">${esc(p.category)} ・ by ${esc(p.display_name||p.username||'Unknown')}</div><div class="favorite-rating">★ ${Number(p.rating_average||0).toFixed(1)} (${Number(p.rating_count||0)})</div><div class="work-actions"><a class="mini-btn favorite-open" href="forestcraft.html?post=${encodeURIComponent(p.id)}">作品を見る</a><button class="mini-btn delete favoriteRemove" type="button">お気に入り解除</button></div></div></article>`).join('');
   mount3d(grid,posts);
   grid.querySelectorAll('.favoriteRemove').forEach(b=>b.onclick=async()=>{const card=b.closest('.favorite-card'),id=card.dataset.id;b.disabled=true;try{await ForestAuth.request('/posts/'+encodeURIComponent(id)+'/favorite',{method:'DELETE'});card.remove();const left=grid.querySelectorAll('.favorite-card').length;count.textContent=`${left}件のお気に入り`;if(!left)grid.innerHTML='<div class="empty">お気に入りはまだありません。</div>'}catch(e){alert(e.message||String(e));b.disabled=false}});
  }catch(e){grid.innerHTML=`<div class="empty">${esc(/404|Not found/i.test(e.message||'')?'お気に入りAPIの反映待ちです。':e.message)}</div>`;count.textContent=''}
 }
 section.querySelector('#favoriteReloadBtn').onclick=load;window.addEventListener('forestcraft-community-change',load);await load();
}
init().catch(e=>console.warn('[mypage favorites]',e));
})();
