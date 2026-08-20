(function(){
'use strict';
const API='https://forest-craft-api.wdrk80.workers.dev';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function fileId(img){try{const u=new URL(img.src,location.href),m=u.pathname.match(/\/files\/([^/]+)$/);return m?decodeURIComponent(m[1]):''}catch{return''}}
function loadScript(src,key){return new Promise((resolve,reject)=>{const old=document.querySelector(`script[data-${key}]`);if(old){if(old.dataset.loaded==='1')return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=()=>reject(new Error(src+' の読み込みに失敗'));document.head.appendChild(s)})}
async function getPost(id){if(window.ForestAuth){try{return (await ForestAuth.request('/posts/'+encodeURIComponent(id))).post}catch{}}const r=await fetch(API+'/posts/'+encodeURIComponent(id)),d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'作品を取得できませんでした');return d.post}
async function collectPosts(){
 const out=[];let offset=0;
 for(let i=0;i<60;i++){const r=await fetch(API+`/posts?limit=50&offset=${offset}`),d=await r.json();if(!r.ok||!d.ok)break;const b=d.posts||[];out.push(...b);if(b.length<50)break;offset+=b.length}
 if(window.ForestAuth){try{const d=await ForestAuth.request('/me/posts');for(const p of d.posts||[])if(!out.some(x=>x.id===p.id))out.push(p)}catch{}}
 return out;
}
async function start(){
 for(let i=0;i<140&&!window.ForestCraftStudioBridge;i++)await sleep(50);
 window.ForestCraftGallery=window.ForestCraftGallery||{};
 Object.assign(window.ForestCraftGallery,{apiBase:API,getPost:getPost,openPost:window.ForestCraftGallery.openPost||async function(){}});
 try{await loadScript('../assets/forestcraft-gallery-block3d.js?v=20260820-block3d2','fcs-lib-block3d');await loadScript('../assets/forestcraft-gallery-model3d.js?v=20260820-model3d1','fcs-lib-model3d')}catch(e){console.warn('[library3d]',e);return}
 const posts=await collectPosts(),byPreview=new Map();posts.forEach(p=>{if(p.preview_file_id)byPreview.set(String(p.preview_file_id),p)});
 function scan(){
  const h=window.ForestCraftGallery;if(!h)return;
  document.querySelectorAll('.fcs-safe-thumb,.fcs-work-thumb').forEach(box=>{
   if(box.dataset.fcsReal3d==='1')return;const img=box.querySelector('img');if(!img)return;const p=byPreview.get(fileId(img));if(!p||!['block','model'].includes(p.category))return;
   box.dataset.fcsReal3d='1';box.style.position='relative';
   if(p.category==='block'&&typeof h.mountBlockCard==='function')h.mountBlockCard(box,p);
   if(p.category==='model'&&typeof h.mountModelCard==='function')h.mountModelCard(box,p);
  });
 }
 scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
}
start().catch(e=>console.warn('[Forest Craft library 3D]',e));
})();
