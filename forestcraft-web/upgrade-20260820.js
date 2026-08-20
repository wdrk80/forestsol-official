(function(){
'use strict';

const API_BASE='https://forest-craft-api.wdrk80.workers.dev';
const PAGE_SIZE=24;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

async function waitForStudio(){
  for(let i=0;i<120;i++){
    if(window.ForestCraftStudioBridge?.state)return window.ForestCraftStudioBridge;
    await sleep(50);
  }
  throw new Error('Forest Craft Studio Bridge が見つかりません');
}

function injectStyles(){
  const style=document.createElement('style');
  style.id='fcs-20260820-style';
  style.textContent=`
  .layer-item{cursor:pointer;transition:border-color .12s,background .12s,box-shadow .12s}
  .layer-item:hover{background:#303946;border-color:#596879}
  .layer-item.active{background:#332a26;box-shadow:inset 0 0 0 1px rgba(255,107,45,.22)}
  .layer-item .fcs-layer-name[readonly]{pointer-events:none;cursor:pointer;background:#182029;border-color:#364250}
  .layer-item .fcs-layer-name:not([readonly]){outline:2px solid rgba(255,107,45,.5)}
  .fcs-layer-tip{font-size:10px;color:#8fa0b2;margin-top:5px}
  .fcs-face-brush-preview{position:absolute;left:50%;top:50%;transform-origin:center center;backface-visibility:hidden;pointer-events:none;z-index:9;image-rendering:pixelated;background:transparent!important;outline:0!important}
  .fcs-flat-brush-preview{position:fixed;pointer-events:none;z-index:9990;image-rendering:pixelated;border:0;background:transparent}
  .fcs-compare-list{display:flex;flex-direction:column;gap:6px;max-height:220px;overflow:auto;margin:8px 0}
  .fcs-compare-item{display:grid;grid-template-columns:28px 1fr 32px 32px;gap:5px;align-items:center;border:1px solid #3b4654;border-radius:7px;padding:6px;background:#272e37;cursor:pointer}
  .fcs-compare-item.active{border-color:#ff6b2d;background:#332a26}
  .fcs-compare-item button{padding:4px 5px;min-width:0}
  .fcs-compare-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
  .fcs-compare-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}
  .fcs-compare-actions button{width:100%}
  .fcs-compare-empty{font-size:11px;color:#9eabb9;padding:10px;border:1px dashed #4b5868;border-radius:7px;text-align:center}
  .fcs-uv-panel{position:absolute;left:12px;top:12px;z-index:30;width:235px;padding:9px 10px;border:1px solid #566372;border-radius:8px;background:rgba(17,24,32,.93);box-shadow:0 7px 22px #0007;font-size:11px;color:#d8e1eb}
  .fcs-uv-panel strong{display:block;font-size:12px;margin-bottom:5px}
  .fcs-uv-panel label{display:flex;align-items:center;gap:6px;margin:5px 0;color:#edf2f7}
  .fcs-uv-status{color:#9eabb9;line-height:1.45}
  .model-face.fcs-uv-shared{outline:2px solid #ffd166!important;filter:brightness(1.13)}
  .model-face.fcs-uv-source{outline:2px solid #ff6b2d!important;filter:brightness(1.16)}
  .fcs-library-modal{position:fixed;inset:0;z-index:2000;background:rgba(5,8,12,.78);display:flex;align-items:center;justify-content:center;padding:28px}
  .fcs-library-modal.hidden{display:none!important}
  .fcs-library-shell{width:min(1180px,96vw);height:min(790px,92vh);background:#1b2129;border:1px solid #4a5767;border-radius:16px;box-shadow:0 28px 80px #000b;display:flex;flex-direction:column;overflow:hidden}
  .fcs-library-head{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid #3b4654}
  .fcs-library-head h2{font-size:21px;margin:0;white-space:nowrap}
  .fcs-library-search{flex:1;min-width:160px;background:#111820!important;padding:9px 12px!important}
  .fcs-library-close{font-size:20px;padding:4px 10px}
  .fcs-library-tabs{display:flex;gap:6px;padding:10px 18px;border-bottom:1px solid #343f4d;background:#181e25}
  .fcs-library-tab.active{border-color:#ff6b2d;background:#5b3021}
  .fcs-library-body{flex:1;min-height:0;overflow:auto;padding:18px}
  .fcs-library-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
  .fcs-work-card{border:1px solid #3d4958;border-radius:10px;background:#242c35;overflow:hidden;cursor:pointer;transition:transform .12s,border-color .12s,box-shadow .12s}
  .fcs-work-card:hover{transform:translateY(-2px);border-color:#66778b;box-shadow:0 9px 24px #0005}
  .fcs-work-thumb{height:145px;background:linear-gradient(145deg,#2e3946,#141a21);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
  .fcs-work-thumb img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated;background:#171d24}
  .fcs-work-kind{font-size:32px;opacity:.7}
  .fcs-work-owner-badge{position:absolute;right:7px;top:7px;background:#245f45;border:1px solid #3f9b70;border-radius:999px;padding:3px 7px;font-size:10px;color:#ddffec}
  .fcs-work-info{padding:10px}
  .fcs-work-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fcs-work-meta{font-size:10px;color:#9eabb9;margin-top:5px;display:flex;justify-content:space-between;gap:8px}
  .fcs-library-empty{padding:55px 20px;text-align:center;color:#9eabb9}
  .fcs-library-foot{padding:12px 18px;border-top:1px solid #3b4654;display:flex;gap:8px;align-items:center;background:#181e25}
  .fcs-library-upload{border-color:#4d8e71;background:#204b39}
  .fcs-library-more{margin-left:auto}
  .fcs-library-note{font-size:10px;color:#8fa0b2}
  .fcs-myworks-btn{white-space:nowrap;border-color:#466b59;background:#20382f}
  @media(max-width:980px){.fcs-library-modal{padding:8px}.fcs-library-shell{width:100%;height:96vh}.fcs-library-head{flex-wrap:wrap}.fcs-library-head h2{width:calc(100% - 46px)}.fcs-library-search{order:3;width:100%}}
  `;
  document.head.appendChild(style);
}

function brushOffsets(size,shape){
  const out=[],rad=(size-1)/2;
  for(let yy=0;yy<size;yy++)for(let xx=0;xx<size;xx++){
    const dx=xx-rad,dy=yy-rad;let ok=true;
    if(shape==='circle')ok=dx*dx+dy*dy<=(size/2)*(size/2)+.2;
    if(shape==='diamond')ok=Math.abs(dx)+Math.abs(dy)<=Math.ceil(size/2)-.25;
    if(shape==='cross')ok=Math.abs(dx)<.55||Math.abs(dy)<.55;
    if(ok)out.push([Math.round(dx),Math.round(dy)]);
  }
  return [...new Map(out.map(v=>[v.join(','),v])).values()];
}

function activeFrame(state){
  if(state.mode==='model')return state.model.frames[state.model.frame];
  if(state.mode==='item')return state.item.frames[state.item.frame];
  if(state.mode==='block')return state.block.faces[state.block.face].frames[state.block.frame];
  return null;
}
function currentLayers(state){return state.mode==='skin'?state.skin.layers:activeFrame(state)?.layers||[]}
function setActiveLayerIndex(state,i){if(state.mode==='skin')state.skin.activeLayer=i;else if(activeFrame(state))activeFrame(state).activeLayer=i}

function initLayerUsability(bridge){
  const state=bridge.state,root=document.getElementById('layerList');
  if(!root)return;
  const enhance=()=>{
    const rows=[...root.querySelectorAll('.layer-item')],layers=currentLayers(state);
    rows.forEach((row,ri)=>{
      if(row.dataset.fcsLayerEnhanced==='1')return;
      row.dataset.fcsLayerEnhanced='1';
      const index=layers.length-1-ri,name=row.querySelector('input[type="text"]');
      row.dataset.fcsLayerIndex=String(index);
      if(name){
        name.classList.add('fcs-layer-name');
        name.readOnly=true;
        name.title='クリックでレイヤ選択 / ダブルクリックで名前変更';
        const lock=()=>{name.readOnly=true;name.style.pointerEvents='none'};
        lock();
        name.addEventListener('blur',lock);
        name.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();name.blur()}});
      }
      row.addEventListener('pointerdown',e=>{
        if(e.button!==0)return;
        const all=currentLayers(state),idx=Number(row.dataset.fcsLayerIndex);
        if(!Number.isInteger(idx)||!all[idx])return;
        setActiveLayerIndex(state,idx);state.selection=null;
        const info=document.getElementById('selectionInfo');if(info)info.textContent='なし';
        [...root.querySelectorAll('.layer-item')].forEach(r=>r.classList.toggle('active',r===row));
      },true);
      row.addEventListener('click',e=>{
        if(e.target.closest('.eye-btn,.opacity-wrap'))return;
        e.preventDefault();e.stopImmediatePropagation();
      },true);
      row.addEventListener('dblclick',e=>{
        if(e.target.closest('.eye-btn,.opacity-wrap'))return;
        if(!name)return;
        e.preventDefault();e.stopPropagation();
        name.readOnly=false;name.style.pointerEvents='auto';name.focus();name.select();
      },true);
    });
    if(!root.nextElementSibling?.classList?.contains('fcs-layer-tip')){
      const tip=document.createElement('div');tip.className='fcs-layer-tip';tip.textContent='レイヤ全体をクリックして切替 / 名前はダブルクリックで編集';root.after(tip);
    }
  };
  new MutationObserver(()=>requestAnimationFrame(enhance)).observe(root,{childList:true,subtree:true});
  enhance();
}

function cloneCanvas(src){const c=document.createElement('canvas');c.width=src.width;c.height=src.height;c.getContext('2d',{willReadFrequently:true}).drawImage(src,0,0);return c}

function initCompareLayers(bridge){
  const state=bridge.state,section=document.getElementById('compareSection'),fileInput=document.getElementById('compareFileInput');
  if(!section||!fileInput)return;
  const comps=[];let active=-1;
  section.innerHTML=`
    <div class="section-head"><h3>比較レイヤ</h3><button id="fcsCompareLoad">＋ 読込</button></div>
    <div id="fcsCompareList" class="fcs-compare-list"></div>
    <div class="row-between"><label>選択中の透明度</label><span id="fcsCompareOpacityLabel" class="value-label">35%</span></div>
    <input id="fcsCompareOpacity" class="wide-range" type="range" min="0" max="100" value="35" />
    <div class="fcs-compare-actions"><button id="fcsEditToCompare">編集 → 比較</button><button id="fcsCompareToEdit">比較 → 編集</button></div>
    <p class="small-note">比較は複数保管できます。表示されるのは選択中の1枚だけです。</p>`;
  const list=section.querySelector('#fcsCompareList'),range=section.querySelector('#fcsCompareOpacity'),label=section.querySelector('#fcsCompareOpacityLabel');

  function sync(){
    const c=comps[active]||null;
    state.skin.compare=c?.canvas||null;
    state.skin.compareVisible=!!c&&c.visible!==false;
    state.skin.compareOpacity=c?.opacity??.35;
    range.disabled=!c;range.value=String(Math.round((c?.opacity??.35)*100));label.textContent=range.value+'%';
    bridge.refreshAll();
  }
  function render(){
    list.innerHTML='';
    if(!comps.length){const e=document.createElement('div');e.className='fcs-compare-empty';e.textContent='比較レイヤはまだありません';list.appendChild(e)}
    comps.slice().reverse().forEach((c,ri)=>{
      const i=comps.length-1-ri,row=document.createElement('div');row.className='fcs-compare-item'+(i===active?' active':'');
      const eye=document.createElement('button');eye.textContent=c.visible===false?'○':'◉';eye.title='表示 / 非表示';
      const name=document.createElement('div');name.className='fcs-compare-name';name.textContent=c.name;name.title='ダブルクリックで名前変更';
      const up=document.createElement('button');up.textContent='▲';up.title='上へ';
      const del=document.createElement('button');del.textContent='×';del.title='削除';
      row.append(eye,name,up,del);
      row.addEventListener('click',e=>{if(e.target.tagName==='BUTTON')return;active=i;render();sync()});
      name.addEventListener('dblclick',e=>{e.stopPropagation();const n=prompt('比較レイヤ名',c.name);if(n?.trim()){c.name=n.trim();render()}});
      eye.onclick=e=>{e.stopPropagation();active=i;c.visible=!c.visible;render();sync()};
      up.onclick=e=>{e.stopPropagation();if(i>=comps.length-1)return;[comps[i],comps[i+1]]=[comps[i+1],comps[i]];active=i+1;render();sync()};
      del.onclick=e=>{e.stopPropagation();comps.splice(i,1);if(!comps.length)active=-1;else active=clamp(active-(i<=active?1:0),0,comps.length-1);render();sync()};
      list.appendChild(row);
    });
  }
  function add(canvas,name){comps.push({canvas:cloneCanvas(canvas),name:name||`比較 ${comps.length+1}`,opacity:.35,visible:true});active=comps.length-1;render();sync()}

  section.querySelector('#fcsCompareLoad').onclick=()=>fileInput.click();
  fileInput.addEventListener('change',async e=>{
    e.stopImmediatePropagation();
    const f=fileInput.files?.[0];if(!f)return;
    try{
      const bmp=await createImageBitmap(f);if(bmp.width!==64||bmp.height!==64){bmp.close?.();alert('64×64 PNGを選んでください');return}
      const c=document.createElement('canvas');c.width=64;c.height=64;c.getContext('2d').drawImage(bmp,0,0);bmp.close?.();add(c,f.name.replace(/\.[^.]+$/,''));
    }catch(err){alert('比較画像を読み込めませんでした: '+err.message)}finally{fileInput.value=''}
  },true);
  range.oninput=e=>{const c=comps[active];if(!c)return;c.opacity=+e.target.value/100;label.textContent=e.target.value+'%';sync()};
  section.querySelector('#fcsEditToCompare').onclick=()=>{
    const src=state.skin.layers[state.skin.activeLayer];if(!src)return;add(src.canvas,src.name+' 比較');bridge.setStatus?.('編集レイヤを比較へコピーしました');
  };
  section.querySelector('#fcsCompareToEdit').onclick=()=>{
    const src=comps[active];if(!src)return;
    const idx=state.skin.activeLayer,l={name:src.name+' copy',visible:true,opacity:1,canvas:cloneCanvas(src.canvas)};l.ctx=l.canvas.getContext('2d',{willReadFrequently:true});
    state.skin.layers.splice(idx+1,0,l);state.skin.activeLayer=idx+1;bridge.renderLayers();bridge.refreshAll();bridge.setStatus?.('比較レイヤを編集へコピーしました');
  };
  const newBtn=document.getElementById('skinNewBtn');
  if(newBtn)newBtn.addEventListener('click',()=>setTimeout(()=>{if(comps.length)sync()},0));
  render();sync();
}

function localCell(e,cv){
  const w=cv.clientWidth||parseFloat(cv.style.width)||cv.width,h=cv.clientHeight||parseFloat(cv.style.height)||cv.height;
  return {x:clamp(Math.floor((e.offsetX/w)*cv.width),0,cv.width-1),y:clamp(Math.floor((e.offsetY/h)*cv.height),0,cv.height-1)};
}

function drawPreview(overlay,x,y,state){
  const ctx=overlay.getContext('2d');ctx.clearRect(0,0,overlay.width,overlay.height);
  if(!['brush','eraser'].includes(state.tool))return;
  const erase=state.tool==='eraser';ctx.fillStyle=erase?'rgba(255,90,90,.50)':'rgba(255,184,82,.46)';
  for(const [dx,dy] of brushOffsets(state.brushSize,state.brushShape)){
    const px=x+dx,py=y+dy;if(px<0||py<0||px>=overlay.width||py>=overlay.height)continue;ctx.fillRect(px,py,1,1);
  }
}

function initBrushPreview(bridge){
  const state=bridge.state;
  function bindFace(cv){
    if(cv.dataset.fcsBrushPreview==='1')return;cv.dataset.fcsBrushPreview='1';
    const ov=document.createElement('canvas');ov.width=cv.width;ov.height=cv.height;ov.className='fcs-face-brush-preview';ov.style.width=cv.style.width;ov.style.height=cv.style.height;ov.style.transform=cv.style.transform;cv.parentNode.insertBefore(ov,cv.nextSibling);
    const move=e=>{if(e.target!==cv)return;const p=localCell(e,cv);drawPreview(ov,p.x,p.y,state)};
    cv.addEventListener('pointermove',move,true);cv.addEventListener('pointerenter',move,true);cv.addEventListener('pointerleave',()=>ov.getContext('2d').clearRect(0,0,ov.width,ov.height),true);
  }
  function scanFaces(){document.querySelectorAll('.skin-face:not(.preview-face),.model-face').forEach(bindFace)}
  new MutationObserver(()=>requestAnimationFrame(scanFaces)).observe(document.body,{childList:true,subtree:true});scanFaces();

  const flat=document.createElement('canvas');flat.className='fcs-flat-brush-preview';document.body.appendChild(flat);let current=null;
  function bindFlat(cv){
    if(!cv||cv.dataset.fcsFlatPreview==='1')return;cv.dataset.fcsFlatPreview='1';
    const move=e=>{current=cv;const r=cv.getBoundingClientRect();flat.width=cv.width;flat.height=cv.height;flat.style.left=r.left+'px';flat.style.top=r.top+'px';flat.style.width=r.width+'px';flat.style.height=r.height+'px';flat.style.display='block';const x=clamp(Math.floor(e.offsetX/(cv.clientWidth||r.width)*cv.width),0,cv.width-1),y=clamp(Math.floor(e.offsetY/(cv.clientHeight||r.height)*cv.height),0,cv.height-1);drawPreview(flat,x,y,state)};
    cv.addEventListener('pointermove',move,true);cv.addEventListener('pointerenter',move,true);cv.addEventListener('pointerleave',()=>{if(current===cv){flat.style.display='none';current=null}},true);
  }
  bindFlat(document.getElementById('itemCanvas'));bindFlat(document.getElementById('blockCanvas'));flat.style.display='none';
}

function modelUvPoint(e,cv){
  const uv=cv.dataset.uv.split(',').map(Number),p=localCell(e,cv);
  const x=uv[2]>=uv[0]?Math.floor(uv[0])+p.x:Math.ceil(uv[0])-1-p.x;
  const y=uv[3]>=uv[1]?Math.floor(uv[1])+p.y:Math.ceil(uv[1])-1-p.y;
  return {x,y,lx:p.x,ly:p.y};
}
function faceUsesPixel(cv,x,y){const u=cv.dataset.uv.split(',').map(Number),x0=Math.min(u[0],u[2]),x1=Math.max(u[0],u[2]),y0=Math.min(u[1],u[3]),y1=Math.max(u[1],u[3]);return x>=Math.floor(x0)&&x<Math.ceil(x1)&&y>=Math.floor(y0)&&y<Math.ceil(y1)}
function modelComposite(state){
  const frame=state.model.frames[state.model.frame],c=document.createElement('canvas');c.width=state.model.w;c.height=state.model.h;const x=c.getContext('2d');
  for(const l of frame.layers){if(!l.visible)continue;x.globalAlpha=l.opacity;x.drawImage(l.canvas,0,0)}x.globalAlpha=1;return c;
}
function renderUvFace(cv,comp){
  const u=cv.dataset.uv.split(',').map(Number),x1=u[0],y1=u[1],x2=u[2],y2=u[3],sx=Math.min(x1,x2),sy=Math.min(y1,y2),sw=Math.max(1,Math.abs(x2-x1)),sh=Math.max(1,Math.abs(y2-y1)),ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);ctx.save();if(x2<x1){ctx.translate(cv.width,0);ctx.scale(-1,1)}if(y2<y1){ctx.translate(0,cv.height);ctx.scale(1,-1)}ctx.drawImage(comp,sx,sy,sw,sh,0,0,cv.width,cv.height);ctx.restore();
}
function refreshModelFaces(state){if(!state.model.bb)return;const comp=modelComposite(state);document.querySelectorAll('.model-face').forEach(cv=>renderUvFace(cv,comp))}
function tonedRgb(state,x,y){
  const h=state.color.replace('#',''),r=parseInt(h.slice(0,2),16)||0,g=parseInt(h.slice(2,4),16)||0,b=parseInt(h.slice(4,6),16)||0;if(!state.autoTone)return[r,g,b];const n=((x*73856093)^(y*19349663))>>>0,t=((n%2001)/1000-1)*state.autoToneStrength;return[r+t,g+t,b+t].map(v=>clamp(Math.round(v),0,255));
}
function putPixel(state,ctx,x,y,erase){if(x<0||y<0||x>=state.model.w||y>=state.model.h)return;if(state.alphaLock&&!erase&&ctx.getImageData(x,y,1,1).data[3]===0)return;if(erase){ctx.clearRect(x,y,1,1);return}const [r,g,b]=tonedRgb(state,x,y);ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(x,y,1,1)}
function samplePixel(state,ctx,x,y){const d=ctx.getImageData(x,y,1,1).data;if(!d[3])return;const hex='#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');state.color=hex;const input=document.getElementById('colorHex'),preview=document.getElementById('colorPreview');if(input)input.value=hex;if(preview)preview.style.background=hex}
function floodFillModel(state,ctx,sx,sy,erase,protect){const w=state.model.w,h=state.model.h;if(sx<0||sy<0||sx>=w||sy>=h)return;const img=ctx.getImageData(0,0,w,h),d=img.data,i0=(sy*w+sx)*4,target=[d[i0],d[i0+1],d[i0+2],d[i0+3]],rep=erase?[0,0,0,0]:[...tonedRgb(state,sx,sy),255];if(target.every((v,i)=>v===rep[i]))return;const q=[[sx,sy]],seen=new Uint8Array(w*h);while(q.length){const [x,y]=q.pop(),idx=y*w+x;if(seen[idx])continue;seen[idx]=1;if(protect?.(x,y))continue;const i=idx*4;if(d[i]!==target[0]||d[i+1]!==target[1]||d[i+2]!==target[2]||d[i+3]!==target[3])continue;d[i]=rep[0];d[i+1]=rep[1];d[i+2]=rep[2];d[i+3]=rep[3];if(x>0)q.push([x-1,y]);if(x<w-1)q.push([x+1,y]);if(y>0)q.push([x,y-1]);if(y<h-1)q.push([x,y+1])}ctx.putImageData(img,0,0)}
function pushModelUndo(state){
  const frame=state.model.frames[state.model.frame],snap={mode:'model',face:state.block.face,frame:state.model.frame,layers:frame.layers.map(l=>({name:l.name,visible:l.visible,opacity:l.opacity,data:l.ctx.getImageData(0,0,l.canvas.width,l.canvas.height)})),active:frame.activeLayer};state.undo.push(snap);if(state.undo.length>state.maxHistory)state.undo.shift();state.redo=[];const u=document.getElementById('undoBtn'),r=document.getElementById('redoBtn');if(u)u.disabled=false;if(r)r.disabled=true;
}

function initModelUvProtection(bridge){
  const state=bridge.state,viewport=document.getElementById('modelViewport');if(!viewport)return;
  const panel=document.createElement('div');panel.className='fcs-uv-panel';panel.innerHTML='<strong>3Dペイント補助</strong><label><input id="fcsUvGuard" type="checkbox" checked> 共有UVを保護</label><div id="fcsUvStatus" class="fcs-uv-status">面にカーソルを合わせるとUV共有状態を確認します。</div>';
  viewport.appendChild(panel);const guard=panel.querySelector('#fcsUvGuard'),status=panel.querySelector('#fcsUvStatus');
  let downCv=null,blockedNotice=false;

  function sharedAt(p){return [...document.querySelectorAll('.model-face')].filter(f=>faceUsesPixel(f,p.x,p.y))}
  function markShared(cv,p){
    const shared=sharedAt(p);document.querySelectorAll('.model-face').forEach(f=>f.classList.remove('fcs-uv-shared','fcs-uv-source'));cv.classList.add('fcs-uv-source');if(shared.length>1)shared.forEach(f=>f!==cv&&f.classList.add('fcs-uv-shared'));
    status.textContent=shared.length>1?`UV共有: ${shared.length}面。このピクセルを塗ると複数面が変わります。`:'UV共有なし: この位置は1面だけです。';return shared;
  }
  function paint(e,cv){
    const p=modelUvPoint(e,cv),shared=markShared(cv,p),frame=state.model.frames[state.model.frame],layer=frame.layers[frame.activeLayer];if(!layer)return;
    if((state.tool==='eyedropper'||e.altKey)){samplePixel(state,layer.ctx,p.x,p.y);return}
    if(shared.length>1&&guard.checked){if(!blockedNotice){bridge.setStatus?.(`共有UV保護: ${shared.length}面にまたがるため描画を止めました`);blockedNotice=true}return}
    blockedNotice=false;
    if(state.tool==='fill'){floodFillModel(state,layer.ctx,p.x,p.y,e.shiftKey,guard.checked?(x,y)=>sharedAt({x,y}).length>1:null);refreshModelFaces(state);return}
    if(!['brush','eraser'].includes(state.tool))return;
    const erase=state.tool==='eraser'||e.shiftKey;let skipped=false;for(const [dx,dy] of brushOffsets(state.brushSize,state.brushShape)){const x=p.x+dx,y=p.y+dy;if(guard.checked&&sharedAt({x,y}).length>1){skipped=true;continue}putPixel(state,layer.ctx,x,y,erase)}if(skipped)status.textContent='共有UVのピクセルだけ保護して、それ以外を描画しました。';refreshModelFaces(state);
  }
  function bind(cv){
    if(cv.dataset.fcsModelFix==='1')return;cv.dataset.fcsModelFix='1';
    cv.addEventListener('pointermove',e=>{if(e.target===cv){const p=modelUvPoint(e,cv);markShared(cv,p)}if(downCv===cv){e.stopImmediatePropagation();paint(e,cv)}},true);
    cv.addEventListener('pointerleave',()=>{if(!downCv){document.querySelectorAll('.model-face').forEach(f=>f.classList.remove('fcs-uv-shared','fcs-uv-source'));status.textContent='面にカーソルを合わせるとUV共有状態を確認します。'}},true);
    cv.addEventListener('pointerdown',e=>{if(e.button!==0||state.model.playing)return;e.preventDefault();e.stopImmediatePropagation();downCv=cv;blockedNotice=false;cv.setPointerCapture?.(e.pointerId);const p=modelUvPoint(e,cv),shared=markShared(cv,p);if(!(shared.length>1&&guard.checked)&&!['eyedropper'].includes(state.tool)&&!e.altKey)pushModelUndo(state);paint(e,cv)},true);
    cv.addEventListener('pointerup',e=>{if(downCv!==cv)return;e.stopImmediatePropagation();downCv=null;blockedNotice=false;document.getElementById('saveState').textContent='編集中';bridge.setStatus?.('3D Texture編集');},true);
    cv.addEventListener('pointercancel',()=>{if(downCv===cv)downCv=null},true);
  }
  function scan(){document.querySelectorAll('.model-face').forEach(bind)}
  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.getElementById('bbRoot')||document.body,{childList:true,subtree:true});scan();
}

function kindIcon(category){return {skin:'🐾',model:'◫',item:'◆',block:'▣'}[category]||'✦'}
function categoryName(category){return {skin:'Skin',model:'3D Model',item:'Item',block:'Block'}[category]||category}

function initLibrary(bridge){
  const auth=window.ForestAuth,state={mode:'skin',tab:'gallery',offset:0,mine:[],loaded:[],hasMore:true,user:null,query:''};
  const modal=document.createElement('div');modal.className='fcs-library-modal hidden';modal.innerHTML=`<div class="fcs-library-shell">
    <div class="fcs-library-head"><h2 id="fcsLibraryTitle">作品を開く</h2><input id="fcsLibrarySearch" class="fcs-library-search" type="text" placeholder="作品名を検索"><button id="fcsLibraryClose" class="fcs-library-close">×</button></div>
    <div class="fcs-library-tabs"><button class="fcs-library-tab active" data-tab="gallery">ギャラリー</button><button class="fcs-library-tab" data-tab="mine">自分の作品</button></div>
    <div class="fcs-library-body"><div id="fcsLibraryGrid" class="fcs-library-grid"></div><div id="fcsLibraryEmpty" class="fcs-library-empty hidden"></div></div>
    <div class="fcs-library-foot"><button id="fcsLibraryUpload" class="fcs-library-upload">PCからアップロード</button><span id="fcsLibraryNote" class="fcs-library-note"></span><button id="fcsLibraryMore" class="fcs-library-more">さらに表示</button></div>
  </div>`;document.body.appendChild(modal);
  const grid=modal.querySelector('#fcsLibraryGrid'),empty=modal.querySelector('#fcsLibraryEmpty'),more=modal.querySelector('#fcsLibraryMore'),note=modal.querySelector('#fcsLibraryNote'),search=modal.querySelector('#fcsLibrarySearch');

  async function ensureUser(){try{state.user=await auth?.me?.(true)||null}catch{state.user=null}return state.user}
  function visiblePosts(){const q=state.query.trim().toLowerCase();return state.loaded.filter(p=>(state.mode==='all'||p.category===state.mode)&&(!q||`${p.title||''} ${p.description||''} ${p.username||''}`.toLowerCase().includes(q)))}
  function render(){
    const posts=visiblePosts();grid.innerHTML='';empty.classList.toggle('hidden',posts.length>0);if(!posts.length){empty.textContent=state.tab==='mine'&&!state.user?'ログインすると、投稿した自分の作品をここから開けます。':'作品が見つかりません。'}
    for(const p of posts){
      const own=!!state.user&&p.user_id===state.user.id,card=document.createElement('article');card.className='fcs-work-card';
      const thumb=document.createElement('div');thumb.className='fcs-work-thumb';if(p.preview_file_id){const img=document.createElement('img');img.loading='lazy';img.alt=p.title||'';img.src=`${API_BASE}/files/${encodeURIComponent(p.preview_file_id)}`;img.onerror=()=>{img.remove();thumb.innerHTML=`<span class="fcs-work-kind">${kindIcon(p.category)}</span>`};thumb.appendChild(img)}else thumb.innerHTML=`<span class="fcs-work-kind">${kindIcon(p.category)}</span>`;
      if(own){const badge=document.createElement('span');badge.className='fcs-work-owner-badge';badge.textContent='自分の作品';thumb.appendChild(badge)}
      const info=document.createElement('div');info.className='fcs-work-info';info.innerHTML=`<div class="fcs-work-title"></div><div class="fcs-work-meta"><span>${categoryName(p.category)}</span><span>${p.display_name||p.username||''}</span></div>`;info.querySelector('.fcs-work-title').textContent=p.title||'無題';card.append(thumb,info);
      card.title=own?'クリックしてStudioで開く':'公開ギャラリー作品';
      card.onclick=()=>{if(own){const u=new URL(location.href);u.searchParams.set('editPost',p.id);location.href=u.toString()}else{note.textContent='他のユーザーの作品は閲覧用です。Studioへ直接読み込むのは自分の作品だけです。'}};
      grid.appendChild(card);
    }
    more.classList.toggle('hidden',!state.hasMore||state.tab==='mine'&&state.loaded.length>=state.mine.length);
    if(state.tab==='gallery')note.textContent='自分の投稿には「自分の作品」表示が付き、そのまま編集で開けます。';else note.textContent=state.user?'投稿済み作品をStudioへ直接戻せます。':'自分の作品を見るにはログインが必要です。';
  }
  async function load(reset=false){
    if(reset){state.offset=0;state.loaded=[];state.hasMore=true;grid.innerHTML='';more.disabled=true;empty.classList.add('hidden')}
    await ensureUser();
    try{
      if(state.tab==='mine'){
        if(!state.user){state.mine=[];state.loaded=[];state.hasMore=false;render();return}
        if(reset||!state.mine.length){const d=await auth.request('/me/posts');state.mine=Array.isArray(d.posts)?d.posts:[]}
        const filtered=state.mine.filter(p=>state.mode==='all'||p.category===state.mode),next=filtered.slice(state.loaded.length,state.loaded.length+PAGE_SIZE);state.loaded.push(...next);state.hasMore=state.loaded.length<filtered.length;
      }else{
        const qp=new URLSearchParams({limit:String(PAGE_SIZE),offset:String(state.offset)});if(state.mode!=='all')qp.set('category',state.mode);const r=await fetch(`${API_BASE}/posts?${qp}`);const d=await r.json();if(!r.ok||d.ok===false)throw new Error(d.error||`HTTP ${r.status}`);const batch=Array.isArray(d.posts)?d.posts:[];state.loaded.push(...batch);state.offset+=batch.length;state.hasMore=batch.length===PAGE_SIZE;
      }
      render();
    }catch(err){state.loaded=[];state.hasMore=false;render();empty.classList.remove('hidden');empty.textContent='作品一覧を読み込めませんでした: '+err.message}
    finally{more.disabled=false}
  }
  function upload(){modal.classList.add('hidden');const id={skin:'skinFileInput',item:'itemFileInput',block:'blockFileInput',model:'bbFileInput'}[state.mode];if(id)document.getElementById(id)?.click()}
  async function open(mode='skin',tab='gallery'){
    state.mode=mode;state.tab=tab;state.query='';search.value='';modal.querySelector('#fcsLibraryTitle').textContent=mode==='all'?'自分の作品':`${categoryName(mode)} を開く`;modal.querySelectorAll('.fcs-library-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));modal.classList.remove('hidden');await load(true);
  }
  modal.querySelector('#fcsLibraryClose').onclick=()=>modal.classList.add('hidden');modal.addEventListener('pointerdown',e=>{if(e.target===modal)modal.classList.add('hidden')});
  modal.querySelectorAll('.fcs-library-tab').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;modal.querySelectorAll('.fcs-library-tab').forEach(x=>x.classList.toggle('active',x===b));load(true)});
  modal.querySelector('#fcsLibraryUpload').onclick=upload;more.onclick=()=>load(false);search.oninput=e=>{state.query=e.target.value;render()};window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))modal.classList.add('hidden')});

  const map=[['skinOpenBtn','skin'],['itemOpenBtn','item'],['blockOpenBtn','block'],['bbOpenBtn','model']];
  for(const [id,mode] of map){const b=document.getElementById(id);if(!b)continue;b.onclick=e=>{e.preventDefault();open(mode,'gallery')}}
  const bb=document.getElementById('bbOpenBtn');if(bb)bb.textContent='モデル読込';
  const top=document.querySelector('.topbar'),save=document.getElementById('saveState');if(top&&!document.getElementById('fcsMyWorksBtn')){const b=document.createElement('button');b.id='fcsMyWorksBtn';b.className='fcs-myworks-btn';b.textContent='▦ 自分の作品';b.onclick=()=>open('all','mine');top.insertBefore(b,save||null)}
}

(async()=>{
  try{
    const bridge=await waitForStudio();injectStyles();
    const ver=document.querySelector('.version');if(ver)ver.textContent='Web v1.2.0';document.title=document.title.replace(/Web v[\d.]+/,'Web v1.2.0');
    initLayerUsability(bridge);initCompareLayers(bridge);initBrushPreview(bridge);initModelUvProtection(bridge);initLibrary(bridge);
    bridge.setStatus?.('大幅アップデート v1.2.0 準備完了');
  }catch(err){console.error('[Forest Craft Studio upgrade]',err)}
})();
})();
