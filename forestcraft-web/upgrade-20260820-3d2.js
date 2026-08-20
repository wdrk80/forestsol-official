(function(){
'use strict';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

async function waitBridge(){for(let i=0;i<160;i++){if(window.ForestCraftStudioBridge?.state)return window.ForestCraftStudioBridge;await sleep(50)}throw new Error('Studio bridge timeout')}
async function waitUvPanel(){for(let i=0;i<120;i++){const p=document.querySelector('.fcs-uv-panel');if(p)return p;await sleep(50)}return null}
function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;return c}
function cloneCanvas(src){const c=makeCanvas(src.width,src.height);c.getContext('2d').drawImage(src,0,0);return c}
function faceRect(uv){if(!Array.isArray(uv)||uv.length<4)return null;const a=uv.map(Number);if(a.some(v=>!Number.isFinite(v)))return null;const x=Math.floor(Math.min(a[0],a[2])),y=Math.floor(Math.min(a[1],a[3])),w=Math.max(1,Math.round(Math.abs(a[2]-a[0]))),h=Math.max(1,Math.round(Math.abs(a[3]-a[1])));return{x,y,w,h,uv:a}}
function validCube(el){return !!el&&((el.type==='cube')||(Array.isArray(el.from)&&Array.isArray(el.to)))}
function faceRecords(state){const out=[],els=Array.isArray(state.model.bb?.elements)?state.model.bb.elements:[];els.forEach((el,ei)=>{if(!validCube(el))return;for(const [key,face] of Object.entries(el.faces||{})){const r=faceRect(face?.uv);if(r)out.push({el,ei,key,face,rect:r})}});return out}
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function sameUv(a,b){return a&&b&&a.w===b.w&&a.h===b.h&&a.x===b.x&&a.y===b.y}
function nextPow2(n){let p=1;while(p<n)p*=2;return p}

function injectStyles(){
 const s=document.createElement('style');s.textContent=`
 .fcs-uv-extra{border-top:1px solid #3b4654;margin-top:8px;padding-top:8px}
 .fcs-uv-extra button{width:100%;margin-top:6px;padding:6px 8px}
 .fcs-uv-extra .fcs-row{display:flex;gap:6px}.fcs-uv-extra .fcs-row button{flex:1}
 .fcs-uv-face-name{font-size:10px;color:#ffd7c3;margin:5px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .fcs-focus-mode .model-face{opacity:.08!important;filter:none!important}.fcs-focus-mode .model-face.fcs-focus-selected{opacity:1!important;filter:brightness(1.08)!important;outline:2px solid #ff6b2d!important}
 .fcs-focus-mode .model-grid-overlay{opacity:.08!important}
 .model-face.fcs-selected-face{box-shadow:inset 0 0 0 2px rgba(255,107,45,.8)}
 `;document.head.appendChild(s)
}

function assignFaceMetadata(state){
 const root=document.getElementById('bbRoot');if(!root||!state.model.bb)return;
 const els=(state.model.bb.elements||[]).map((el,ei)=>({el,ei})).filter(x=>validCube(x.el));
 const parts=[...root.children].filter(x=>x.classList?.contains('part'));
 parts.forEach((part,pi)=>{const rec=els[pi];if(!rec)return;const entries=Object.entries(rec.el.faces||{}).filter(([,f])=>!!faceRect(f?.uv));const cvs=[...part.querySelectorAll('.cube-inner > .model-face')];cvs.forEach((cv,fi)=>{const ent=entries[fi];if(!ent)return;cv.dataset.fcsElementIndex=String(rec.ei);cv.dataset.fcsFaceKey=ent[0]})})
}
function getRecordForCanvas(state,cv){assignFaceMetadata(state);const ei=Number(cv?.dataset.fcsElementIndex),key=cv?.dataset.fcsFaceKey;if(!Number.isInteger(ei)||!key)return null;const el=state.model.bb?.elements?.[ei],face=el?.faces?.[key],rect=faceRect(face?.uv);return el&&face&&rect?{el,ei,key,face,rect}:null}
function sharedRecords(state,rec){return faceRecords(state).filter(r=>r.ei!==rec.ei||r.key!==rec.key).filter(r=>rectsOverlap(r.rect,rec.rect))}

function occupancy(state,exclude){const w=state.model.w,h=state.model.h,occ=new Uint8Array(w*h);for(const r of faceRecords(state)){if(exclude&&r.ei===exclude.ei&&r.key===exclude.key)continue;const x0=clamp(r.rect.x,0,w),y0=clamp(r.rect.y,0,h),x1=clamp(r.rect.x+r.rect.w,0,w),y1=clamp(r.rect.y+r.rect.h,0,h);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)occ[y*w+x]=1}return occ}
function findFree(state,rw,rh,exclude){const w=state.model.w,h=state.model.h,occ=occupancy(state,exclude);for(let y=0;y<=h-rh;y++){outer:for(let x=0;x<=w-rw;x++){for(let yy=0;yy<rh;yy++)for(let xx=0;xx<rw;xx++)if(occ[(y+yy)*w+x+xx])continue outer;return{x,y}}}return null}
function resizeModelTexture(state,newW,newH){const oldW=state.model.w,oldH=state.model.h;if(newW===oldW&&newH===oldH)return;for(const frame of state.model.frames){for(const l of frame.layers){const old=cloneCanvas(l.canvas);l.canvas.width=newW;l.canvas.height=newH;l.ctx=l.canvas.getContext('2d',{willReadFrequently:true});l.ctx.imageSmoothingEnabled=false;l.ctx.drawImage(old,0,0)}}state.model.w=newW;state.model.h=newH;const bb=state.model.bb;bb.resolution=bb.resolution||{};bb.resolution.width=newW;bb.resolution.height=newH;bb.texture_width=newW;bb.texture_height=newH;if(Array.isArray(bb.textures)&&bb.textures.length===1){bb.textures[0].width=newW;bb.textures[0].height=newH}}
function ensureFree(state,rec){let spot=findFree(state,rec.rect.w,rec.rect.h,rec);if(spot)return spot;const oldW=state.model.w,oldH=state.model.h;let newW=nextPow2(Math.max(oldW+rec.rect.w,oldW+1)),newH=oldH;if(rec.rect.h>newH)newH=nextPow2(rec.rect.h);resizeModelTexture(state,newW,newH);spot={x:oldW,y:0};if(spot.y+rec.rect.h>newH){newH=nextPow2(rec.rect.h);resizeModelTexture(state,newW,newH)}return spot}
function copiedUv(oldUv,spot){const xForward=oldUv[2]>=oldUv[0],yForward=oldUv[3]>=oldUv[1],w=Math.max(1,Math.round(Math.abs(oldUv[2]-oldUv[0]))),h=Math.max(1,Math.round(Math.abs(oldUv[3]-oldUv[1])));const x1=xForward?spot.x:spot.x+w,x2=xForward?spot.x+w:spot.x,y1=yForward?spot.y:spot.y+h,y2=yForward?spot.y+h:spot.y;return[x1,y1,x2,y2]}
function copyRectAllFrames(state,src,dst){for(const frame of state.model.frames){for(const l of frame.layers){const temp=makeCanvas(src.w,src.h);temp.getContext('2d').drawImage(l.canvas,src.x,src.y,src.w,src.h,0,0,src.w,src.h);l.ctx.drawImage(temp,0,0,src.w,src.h,dst.x,dst.y,src.w,src.h)}}}
function compositeFirstFrame(state){const c=makeCanvas(state.model.w,state.model.h),x=c.getContext('2d'),f=state.model.frames[0];for(const l of f.layers){if(!l.visible)continue;x.globalAlpha=l.opacity;x.drawImage(l.canvas,0,0)}x.globalAlpha=1;return c}
function syncEmbeddedTexture(state){const bb=state.model.bb;if(!bb||!Array.isArray(bb.textures)||!bb.textures.length)return;const t=bb.textures[0];t.width=state.model.w;t.height=state.model.h;try{t.source=compositeFirstFrame(state).toDataURL('image/png')}catch{}}
function downloadJson(obj,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800)}

function synthBoxUv(el){if(!Array.isArray(el.from)||!Array.isArray(el.to))return false;const uo=Array.isArray(el.uv_offset)?el.uv_offset:[0,0],u=Number(uo[0])||0,v=Number(uo[1])||0,w=Math.max(1,Math.round(Math.abs(el.to[0]-el.from[0]))),h=Math.max(1,Math.round(Math.abs(el.to[1]-el.from[1]))),d=Math.max(1,Math.round(Math.abs(el.to[2]-el.from[2])));el.faces=el.faces||{};const map={west:[u,v+d,u+d,v+d+h],north:[u+d,v+d,u+d+w,v+d+h],east:[u+d+w,v+d,u+d+w+d,v+d+h],south:[u+d+w+d,v+d,u+d+w+d+w,v+d+h],up:[u+d,v,u+d+w,v+d],down:[u+d+w,v,u+d+w+w,v+d]};let changed=false;for(const [k,uv] of Object.entries(map)){el.faces[k]=el.faces[k]||{};if(!faceRect(el.faces[k].uv)){el.faces[k].uv=uv;changed=true}}return changed}
function normalizeVector(v,def=[0,0,0]){if(Array.isArray(v))return v.map(Number);if(v&&typeof v==='object')return[Number(v.x)||0,Number(v.y)||0,Number(v.z)||0];return def.slice()}
async function normalizeModelFile(file){const text=await file.text();let obj;try{obj=JSON.parse(text)}catch{throw new Error('JSONとして読めない .bbmodel です')}
 if(obj['minecraft:geometry'])throw new Error('これはBlockbenchの .bbmodel ではなく Bedrock geometry JSON です。現在は .bbmodel を選んでください。');
 if(!Array.isArray(obj.elements))throw new Error('elements が無い形式です。Blockbenchの編集用 .bbmodel として保存し直してください。');
 const meshes=obj.elements.filter(e=>e?.type==='mesh').length,cubes=obj.elements.filter(validCube);if(!cubes.length)throw new Error(meshes?'Meshだけで作られたモデルです。現在の3DペイントはCubeモデル対応です。':'Cube要素が見つかりませんでした。');
 let boxFixed=0,objFixed=0;for(const el of cubes){el.rotation=normalizeVector(el.rotation);if(el.origin)el.origin=normalizeVector(el.origin);if(el.faces)for(const f of Object.values(el.faces)){if(f?.uv&&!Array.isArray(f.uv)&&typeof f.uv==='object'){const x=Number(f.uv.x),y=Number(f.uv.y),w=Number(f.uv.w),h=Number(f.uv.h);if([x,y,w,h].every(Number.isFinite)){f.uv=[x,y,x+w,y+h];objFixed++}}}if((el.box_uv===true||el.box_uv===1)&&synthBoxUv(el))boxFixed++}
 const uvFaces=cubes.reduce((n,e)=>n+Object.values(e.faces||{}).filter(f=>!!faceRect(f?.uv)).length,0);if(!uvFaces)throw new Error('面UVがありません。Box UVでも復元できない形式のため、BlockbenchでUVを確定してから保存してください。');
 const notes=[];if(meshes)notes.push(`Mesh ${meshes}個は未対応のため表示しません`);if(boxFixed)notes.push(`Box UV ${boxFixed}個を編集用UVへ展開`);if(objFixed)notes.push(`UVオブジェクト ${objFixed}個を変換`);if((obj.textures||[]).length>1)notes.push('複数テクスチャは1枚目中心で編集');if((obj.textures||[]).some(t=>typeof t.source==='string'&&!t.source.startsWith('data:image')))notes.push('外部テクスチャは自動取得できないため必要ならTexture PNG読込を使用');
 const normalized=new File([JSON.stringify(obj)],file.name,{type:'application/json'});return{file:normalized,notes,obj}
}

(async()=>{
 const bridge=await waitBridge(),state=bridge.state;injectStyles();const panel=await waitUvPanel();if(!panel)return;
 let selected=null;
 const extra=document.createElement('div');extra.className='fcs-uv-extra';extra.innerHTML=`<div class="fcs-uv-face-name" id="fcsFaceName">面を選択してください</div><label><input id="fcsAutoSplit" type="checkbox"> 共有UVを描画時に自動分離</label><label><input id="fcsFocusFace" type="checkbox"> 選択面に集中</label><button id="fcsSplitFace">この面だけUV分離</button><div class="fcs-row"><button id="fcsBbExport">.bbmodel書出し</button><button id="fcsClearFace">選択解除</button></div>`;panel.appendChild(extra);
 const faceName=extra.querySelector('#fcsFaceName'),autoSplit=extra.querySelector('#fcsAutoSplit'),focus=extra.querySelector('#fcsFocusFace'),splitBtn=extra.querySelector('#fcsSplitFace');
 function setSelected(cv){if(!cv||!cv.classList.contains('model-face'))return;selected=cv;document.querySelectorAll('.model-face').forEach(f=>f.classList.toggle('fcs-focus-selected',f===cv));const rec=getRecordForCanvas(state,cv);if(rec){const shared=sharedRecords(state,rec);faceName.textContent=`Cube ${rec.ei+1} / ${rec.key} / UV共有 ${shared.length+1}面`;splitBtn.disabled=!shared.length}else{faceName.textContent='面情報を取得できません';splitBtn.disabled=true}}
 function updateFocus(){document.getElementById('bbRoot')?.classList.toggle('fcs-focus-mode',focus.checked&&!!selected)}focus.onchange=updateFocus;
 function splitSelected(silent=false){const rec=getRecordForCanvas(state,selected);if(!rec)return false;const shared=sharedRecords(state,rec);if(!shared.length){if(!silent)bridge.setStatus?.('この面のUVはすでに独立しています');return true}const oldW=state.model.w,oldH=state.model.h,spot=ensureFree(state,rec);copyRectAllFrames(state,rec.rect,spot);const nuv=copiedUv(rec.rect.uv,spot);rec.face.uv=nuv;selected.dataset.uv=nuv.join(',');assignFaceMetadata(state);syncEmbeddedTexture(state);bridge.renderLayers();bridge.refreshAll();setSelected(selected);const expanded=state.model.w!==oldW||state.model.h!==oldH;bridge.setStatus?.(`UV分離完了: ${rec.key} → ${spot.x},${spot.y}${expanded?` / Texture ${state.model.w}×${state.model.h}へ拡張`:''}`);document.getElementById('saveState').textContent='編集中';return true}
 splitBtn.onclick=()=>splitSelected(false);
 extra.querySelector('#fcsClearFace').onclick=()=>{selected=null;document.getElementById('bbRoot')?.classList.remove('fcs-focus-mode');document.querySelectorAll('.model-face').forEach(f=>f.classList.remove('fcs-focus-selected'));focus.checked=false;faceName.textContent='面を選択してください';splitBtn.disabled=true};
 extra.querySelector('#fcsBbExport').onclick=()=>{if(!state.model.bb)return alert('先にモデルを読み込んでください');syncEmbeddedTexture(state);const base=(state.model._fcsSourceName||'model.bbmodel').replace(/\.bbmodel$/i,'');downloadJson(state.model.bb,base+'_edited.bbmodel')};

 function bindFaces(){assignFaceMetadata(state);document.querySelectorAll('.model-face').forEach(cv=>{if(cv.dataset.fcsSelectBind==='1')return;cv.dataset.fcsSelectBind='1';cv.addEventListener('pointerenter',()=>{setSelected(cv);updateFocus()},true)})}
 new MutationObserver(()=>requestAnimationFrame(bindFaces)).observe(document.getElementById('bbRoot')||document.body,{childList:true,subtree:true});bindFaces();
 const viewport=document.getElementById('modelViewport');viewport.addEventListener('pointerdown',e=>{const cv=e.target.closest?.('.model-face');if(!cv||!autoSplit.checked)return;setSelected(cv);const rec=getRecordForCanvas(state,cv);if(rec&&sharedRecords(state,rec).length)splitSelected(true)},true);

 const input=document.getElementById('bbFileInput');if(input){input.addEventListener('change',async e=>{const f=input.files?.[0];if(!f)return;e.preventDefault();e.stopImmediatePropagation();try{bridge.setStatus?.('モデル形式を確認中…');const n=await normalizeModelFile(f);state.model._fcsSourceName=f.name;await bridge.loadBBModel(n.file);setTimeout(()=>{assignFaceMetadata(state);bindFaces()},0);bridge.setStatus?.(n.notes.length?`モデル読込: ${n.notes.join(' / ')}`:'モデル読込完了')}catch(err){alert('モデルを読み込めませんでした\n\n'+err.message);bridge.setStatus?.('モデル読込失敗: '+err.message)}finally{input.value=''}},true)}
 const info=document.getElementById('modelInfo');if(info)info.title='対応: Cube + 面UV / Box UVは可能な範囲で自動展開。Mesh、Bedrock geometry、複数テクスチャ、外部テクスチャには制限があります。';
 const ver=document.querySelector('.version');if(ver)ver.textContent='Web v1.2.1';document.title=document.title.replace(/Web v[\d.]+/,'Web v1.2.1');
 bridge.setStatus?.('3D UV分離・モデル診断 v1.2.1 準備完了');
})().catch(err=>console.error('[FCS 3D upgrade]',err));
})();
