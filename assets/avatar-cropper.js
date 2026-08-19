(function(){
  "use strict";

  const MAX_SOURCE_BYTES=15*1024*1024;
  const OUTPUT_SIZE=768;
  const EDIT_SIZE=600;
  const ALLOWED=["image/jpeg","image/png","image/webp"];

  function ready(fn){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn);
    else fn();
  }

  function setStatus(message,kind=""){
    const el=document.getElementById("profileStatus");
    if(!el)return;
    el.textContent=message;
    el.className="status "+kind;
  }

  function escapeAttr(value){
    return String(value||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function loadImage(file){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("画像を読み込めませんでした"))};
      img.src=url;
    });
  }

  function addStyles(){
    if(document.getElementById("forestManualCropStyles"))return;
    const style=document.createElement("style");
    style.id="forestManualCropStyles";
    style.textContent=`
      .forest-manual-avatar{display:grid;gap:12px;padding:14px;border:1px solid rgba(84,53,27,.18);border-radius:12px;background:rgba(255,250,236,.52)}
      .forest-manual-avatar-title{font-size:12px;font-weight:900;color:#4d3019}
      .forest-manual-avatar-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
      .forest-manual-preview{width:96px;height:96px;flex:0 0 96px;padding:0;overflow:hidden;display:grid;place-items:center;border:4px solid #caa25e;border-radius:50%;background:#ead9b8;color:#3c2718;font-size:38px;box-shadow:0 6px 16px rgba(62,38,18,.18)}
      .forest-manual-preview img{width:100%;height:100%;object-fit:cover}
      .forest-manual-actions{display:flex;gap:8px;flex-wrap:wrap}
      .forest-manual-btn{min-height:40px;padding:8px 13px;border:1px solid #80603a;border-radius:9px;background:linear-gradient(180deg,#78502a,#513018);color:#fff0cf;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
      .forest-manual-btn.remove{border-color:#8e5a4b;background:linear-gradient(180deg,#a2614e,#743f31)}
      .forest-manual-help{margin-top:7px;color:#80644a;font-size:10px;line-height:1.55}
      .forest-crop-overlay{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(12,8,5,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
      .forest-crop-overlay.open{display:flex}
      .forest-crop-dialog{width:min(94vw,520px);max-height:94vh;overflow:auto;padding:18px;border:2px solid rgba(213,169,93,.55);border-radius:18px;background:linear-gradient(180deg,#f8e8c8,#e7c992);box-shadow:0 24px 70px rgba(0,0,0,.55)}
      .forest-crop-title{margin:0 0 12px;text-align:center;color:#472b16;font-size:20px;font-weight:900}
      .forest-crop-sub{margin:0 0 14px;text-align:center;color:#7a5c3d;font-size:11px;line-height:1.6}
      .forest-crop-stage{position:relative;width:min(78vw,360px);aspect-ratio:1;margin:0 auto;overflow:hidden;border:5px solid #c89f59;border-radius:50%;background:#1c2b24;box-shadow:0 10px 26px rgba(48,28,12,.30);touch-action:none;cursor:grab}
      .forest-crop-stage.dragging{cursor:grabbing}
      .forest-crop-canvas{display:block;width:100%;height:100%}
      .forest-crop-guide{position:absolute;inset:0;pointer-events:none;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(255,246,211,.72)}
      .forest-crop-controls{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;margin:17px auto 0;width:min(100%,390px);color:#4d311b;font-size:12px;font-weight:900}
      .forest-crop-range{width:100%;accent-color:#5d7a3d}
      .forest-crop-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
      .forest-crop-action{min-height:44px;border:1px solid #80603a;border-radius:10px;font:inherit;font-weight:900;cursor:pointer}
      .forest-crop-action.cancel{color:#5c3a20;background:#ead2a8}
      .forest-crop-action.apply{color:#fff4d6;border-color:#47632c;background:linear-gradient(180deg,#718d48,#506b30)}
      @media(max-width:520px){.forest-crop-dialog{padding:14px}.forest-crop-title{font-size:17px}.forest-crop-stage{width:min(82vw,340px)}}
    `;
    document.head.appendChild(style);
  }

  function init(){
    if(!/mypage\.html$/i.test(location.pathname))return;
    const form=document.getElementById("profileForm");
    const urlInput=document.getElementById("avatarUrl");
    if(!form||!urlInput||form.dataset.manualCropMounted)return;
    form.dataset.manualCropMounted="1";

    addStyles();

    const oldEditor=document.querySelector(".forest-avatar-editor");
    if(oldEditor)oldEditor.remove();
    const oldField=urlInput.closest(".field")||urlInput.parentElement;
    if(oldField)oldField.style.display="none";

    const editor=document.createElement("div");
    editor.className="forest-manual-avatar";
    editor.innerHTML=`
      <div class="forest-manual-avatar-title">プロフィールアイコン</div>
      <div class="forest-manual-avatar-row">
        <button class="forest-manual-preview" type="button" aria-label="アイコン画像を変更"><span>🐾</span></button>
        <div>
          <div class="forest-manual-actions">
            <button class="forest-manual-btn choose" type="button">画像を変更</button>
            <button class="forest-manual-btn remove" type="button">アイコンを削除</button>
          </div>
          <div class="forest-manual-help">画像を選んだあと、好きな位置へ動かして大きさも自由に調整できます。</div>
        </div>
      </div>
      <input class="forest-manual-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
    `;
    form.insertBefore(editor,oldField||form.querySelector("button[type=submit]"));

    const overlay=document.createElement("div");
    overlay.className="forest-crop-overlay";
    overlay.innerHTML=`
      <div class="forest-crop-dialog" role="dialog" aria-modal="true" aria-label="アイコンの切り抜き">
        <h3 class="forest-crop-title">アイコンの位置を決める</h3>
        <p class="forest-crop-sub">画像を指で動かして位置を調整。下のバーで大きさを変えられます。</p>
        <div class="forest-crop-stage">
          <canvas class="forest-crop-canvas" width="${EDIT_SIZE}" height="${EDIT_SIZE}"></canvas>
          <div class="forest-crop-guide"></div>
        </div>
        <div class="forest-crop-controls">
          <span>小</span>
          <input class="forest-crop-range" type="range" min="1" max="4" value="1" step="0.01" aria-label="画像の拡大率">
          <span>大</span>
        </div>
        <div class="forest-crop-actions">
          <button class="forest-crop-action cancel" type="button">キャンセル</button>
          <button class="forest-crop-action apply" type="button">この位置で使う</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const preview=editor.querySelector(".forest-manual-preview");
    const fileInput=editor.querySelector(".forest-manual-file");
    const choose=editor.querySelector(".choose");
    const remove=editor.querySelector(".remove");
    const stage=overlay.querySelector(".forest-crop-stage");
    const canvas=overlay.querySelector(".forest-crop-canvas");
    const ctx=canvas.getContext("2d",{alpha:false});
    const range=overlay.querySelector(".forest-crop-range");
    const cancel=overlay.querySelector(".cancel");
    const apply=overlay.querySelector(".apply");

    let image=null;
    let imageW=0;
    let imageH=0;
    let baseScale=1;
    let zoom=1;
    let offsetX=0;
    let offsetY=0;
    let pendingBlob=null;
    let removeRequested=false;
    let previewUrl="";
    let dragging=false;
    let pointerId=null;
    let lastX=0;
    let lastY=0;

    function clearPreviewUrl(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=""}}
    function showAvatar(src){
      clearPreviewUrl();
      preview.innerHTML=src?`<img src="${escapeAttr(src)}" alt="">`:'<span>🐾</span>';
    }
    function showBlob(blob){
      clearPreviewUrl();
      previewUrl=URL.createObjectURL(blob);
      preview.innerHTML=`<img src="${previewUrl}" alt="選択中のアイコン">`;
    }

    function clampOffset(){
      if(!image)return;
      const s=baseScale*zoom;
      const sw=imageW*s,sh=imageH*s;
      const maxX=Math.max(0,(sw-EDIT_SIZE)/2);
      const maxY=Math.max(0,(sh-EDIT_SIZE)/2);
      offsetX=Math.max(-maxX,Math.min(maxX,offsetX));
      offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
    }

    function draw(){
      ctx.fillStyle="#17231e";
      ctx.fillRect(0,0,EDIT_SIZE,EDIT_SIZE);
      if(!image)return;
      clampOffset();
      const s=baseScale*zoom;
      const w=imageW*s,h=imageH*s;
      const x=(EDIT_SIZE-w)/2+offsetX;
      const y=(EDIT_SIZE-h)/2+offsetY;
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality="high";
      ctx.drawImage(image,x,y,w,h);
    }

    async function openCrop(file){
      if(!ALLOWED.includes(file.type))throw new Error("JPG・PNG・WebP画像を選んでください");
      if(file.size>MAX_SOURCE_BYTES)throw new Error("元画像は15MBまでです");
      image=await loadImage(file);
      imageW=image.naturalWidth||image.width;
      imageH=image.naturalHeight||image.height;
      if(!imageW||!imageH)throw new Error("画像サイズを取得できませんでした");
      baseScale=Math.max(EDIT_SIZE/imageW,EDIT_SIZE/imageH);
      zoom=1;
      offsetX=0;
      offsetY=0;
      range.value="1";
      draw();
      overlay.classList.add("open");
      document.documentElement.style.overflow="hidden";
    }

    function closeCrop(){
      overlay.classList.remove("open");
      document.documentElement.style.overflow="";
      dragging=false;
      pointerId=null;
    }

    function canvasBlob(){
      const out=document.createElement("canvas");
      out.width=OUTPUT_SIZE;
      out.height=OUTPUT_SIZE;
      const outCtx=out.getContext("2d",{alpha:false});
      outCtx.fillStyle="#fff";
      outCtx.fillRect(0,0,OUTPUT_SIZE,OUTPUT_SIZE);
      const ratio=OUTPUT_SIZE/EDIT_SIZE;
      const s=baseScale*zoom*ratio;
      const w=imageW*s,h=imageH*s;
      const x=(OUTPUT_SIZE-w)/2+offsetX*ratio;
      const y=(OUTPUT_SIZE-h)/2+offsetY*ratio;
      outCtx.imageSmoothingEnabled=true;
      outCtx.imageSmoothingQuality="high";
      outCtx.drawImage(image,x,y,w,h);
      return new Promise(resolve=>out.toBlob(resolve,"image/webp",.9));
    }

    function openPicker(){fileInput.click()}
    preview.addEventListener("click",openPicker);
    choose.addEventListener("click",openPicker);

    fileInput.addEventListener("change",async()=>{
      const file=fileInput.files&&fileInput.files[0];
      fileInput.value="";
      if(!file)return;
      try{
        setStatus("画像を読み込み中…");
        await openCrop(file);
        setStatus("切り抜く位置と大きさを調整してください。");
      }catch(err){
        setStatus(err.message,"bad");
      }
    });

    range.addEventListener("input",()=>{
      zoom=Math.max(1,Number(range.value)||1);
      clampOffset();
      draw();
    });

    stage.addEventListener("pointerdown",event=>{
      if(!image)return;
      dragging=true;
      pointerId=event.pointerId;
      lastX=event.clientX;
      lastY=event.clientY;
      stage.classList.add("dragging");
      stage.setPointerCapture?.(pointerId);
    });
    stage.addEventListener("pointermove",event=>{
      if(!dragging||event.pointerId!==pointerId)return;
      const rect=stage.getBoundingClientRect();
      const factor=EDIT_SIZE/rect.width;
      offsetX+=(event.clientX-lastX)*factor;
      offsetY+=(event.clientY-lastY)*factor;
      lastX=event.clientX;
      lastY=event.clientY;
      draw();
    });
    function endDrag(event){
      if(!dragging||event.pointerId!==pointerId)return;
      dragging=false;
      stage.classList.remove("dragging");
      try{stage.releasePointerCapture?.(pointerId)}catch{}
      pointerId=null;
    }
    stage.addEventListener("pointerup",endDrag);
    stage.addEventListener("pointercancel",endDrag);

    stage.addEventListener("wheel",event=>{
      if(!image)return;
      event.preventDefault();
      zoom=Math.max(1,Math.min(4,zoom+(event.deltaY<0?.08:-.08)));
      range.value=String(zoom);
      clampOffset();
      draw();
    },{passive:false});

    cancel.addEventListener("click",()=>{
      closeCrop();
      setStatus("画像の変更をキャンセルしました。");
    });

    apply.addEventListener("click",async()=>{
      if(!image)return;
      apply.disabled=true;
      try{
        const blob=await canvasBlob();
        if(!blob)throw new Error("画像の切り抜きに失敗しました");
        if(blob.size>3*1024*1024)throw new Error("切り抜いた画像が3MBを超えています");
        pendingBlob=blob;
        removeRequested=false;
        showBlob(blob);
        closeCrop();
        setStatus("切り抜き位置を決定しました。『プロフィールを保存』で反映されます。","good");
      }catch(err){
        setStatus(err.message,"bad");
      }finally{
        apply.disabled=false;
      }
    });

    remove.addEventListener("click",()=>{
      pendingBlob=null;
      removeRequested=true;
      showAvatar("");
      setStatus("アイコンを削除する設定です。『プロフィールを保存』で反映されます。","good");
    });

    const initial=urlInput.value||ForestAuth.cachedUser()?.avatar_url||"";
    showAvatar(initial);

    form.addEventListener("submit",async event=>{
      if(form.dataset.avatarCropPass==="1"){
        delete form.dataset.avatarCropPass;
        return;
      }
      if(!pendingBlob&&!removeRequested)return;

      event.preventDefault();
      event.stopImmediatePropagation();
      const submitter=event.submitter||form.querySelector('button[type="submit"]');
      if(submitter)submitter.disabled=true;
      setStatus(pendingBlob?"切り抜いたアイコンを保存中…":"アイコンを削除中…");

      try{
        const updated=pendingBlob?await ForestAuth.uploadAvatar(pendingBlob):await ForestAuth.deleteAvatar();
        urlInput.value=updated.avatar_url||"";
        pendingBlob=null;
        removeRequested=false;
        showAvatar(updated.avatar_url||"");
        form.dataset.avatarCropPass="1";
        if(submitter)submitter.disabled=false;
        if(typeof form.requestSubmit==="function")form.requestSubmit(submitter||undefined);
        else submitter?.click();
      }catch(err){
        if(submitter)submitter.disabled=false;
        setStatus(err.message,"bad");
      }
    },true);
  }

  ready(()=>setTimeout(init,0));
})();
