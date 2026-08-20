(async function(){
  const styleParts=['style-01.txt','style-02.txt'];
  const appParts=['app-01.txt','app-02.txt','app-03.txt','app-04.txt','app-05.txt','app-06.txt','app-07.txt'];
  const API_BASE='https://forest-craft-api.wdrk80.workers.dev';
  const loadScript=src=>new Promise((resolve,reject)=>{if(document.querySelector(`script[src="${src}"]`))return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(src+' の読み込みに失敗'));document.head.appendChild(s)});

  function bindAuthenticatedPublish(){
    const bridge=window.ForestCraftStudioBridge;
    const auth=window.ForestAuth;
    const submit=document.getElementById('publishSubmitBtn');
    if(!bridge||!auth||!submit||submit.dataset.directAuthPublish==='1')return;
    submit.dataset.directAuthPublish='1';

    submit.addEventListener('click',async event=>{
      event.preventDefault();
      event.stopImmediatePropagation();

      const pstate=bridge.publishState;
      const progress=bridge.setPublishProgress;
      if(!pstate||pstate.busy)return;

      let user=null;
      try{user=await auth.me(true)}catch(e){}
      if(!user){
        progress('投稿するにはForest Solへのログインが必要です。','bad');
        setTimeout(()=>location.href='../account.html?next=forestcraft-web/',700);
        return;
      }

      const title=document.getElementById('publishTitle')?.value.trim()||'';
      const description=document.getElementById('publishDescription')?.value||'';
      const tags=(document.getElementById('publishTags')?.value||'').split(',').map(x=>x.trim()).filter(Boolean);
      const visibility=document.getElementById('publishVisibility')?.value||'public';
      if(!title)return progress('タイトルを入力してください。','bad');
      if(!pstate.files?.length)return progress('投稿できるファイルがありません。','bad');

      const cancel=document.getElementById('publishCancelBtn');
      const close=document.getElementById('publishCloseBtn');
      pstate.busy=true;
      [submit,cancel,close].forEach(b=>{if(b)b.disabled=true});

      const category=({skin:'skin',model:'model',item:'item',block:'block'})[pstate.mode]||pstate.mode;
      let createdPostId='';
      try{
        const editContext=window.ForestCraftStudioEditContext||null;
        progress(editContext?'編集版の作品情報を登録中…':'作品情報を登録中…');
        const body={title,description,category,tags,visibility};
        if(category==='skin'&&bridge.state?.skin)body.classic_slim=bridge.state.skin.armModel;

        const postData=await auth.request('/posts',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(body)
        });
        createdPostId=postData.post.id;

        for(let i=0;i<pstate.files.length;i++){
          const f=pstate.files[i];
          progress(`ファイル ${i+1}/${pstate.files.length} を送信中… ${f.filename}`);
          const path=`/posts/${encodeURIComponent(createdPostId)}/files?type=${encodeURIComponent(f.storage)}&role=${encodeURIComponent(f.role)}&filename=${encodeURIComponent(f.filename)}`;
          await auth.request(path,{
            method:'POST',
            headers:{'Content-Type':f.mime},
            body:f.blob
          });
        }

        if(editContext?.sourcePostId&&editContext.sourcePostId!==createdPostId){
          progress('元の投稿を新しい編集版へ置き換え中…');
          try{
            await auth.request(`/posts/${encodeURIComponent(editContext.sourcePostId)}`,{method:'DELETE'});
          }catch(cleanErr){
            console.warn('旧投稿の削除に失敗',cleanErr);
            progress('編集版は投稿できましたが、元の投稿を自動削除できませんでした。','bad');
          }
          editContext.sourcePostId=createdPostId;
          const u=new URL(location.href);u.searchParams.set('editPost',createdPostId);history.replaceState(null,'',u);
        }

        progress(`投稿完了！ ${user.display_name||user.username} の作品に追加しました。`,'good');
        bridge.setStatus?.(`サイト投稿完了: ${title}`);
      }catch(err){
        if(createdPostId){
          progress('投稿に失敗したため、途中データを片付けています…','bad');
          try{await auth.request(`/posts/${encodeURIComponent(createdPostId)}`,{method:'DELETE'})}catch(cleanupErr){console.warn('投稿ロールバック失敗',cleanupErr)}
        }
        progress(`投稿失敗: ${err.message||String(err)}`,'bad');
      }finally{
        pstate.busy=false;
        [submit,cancel,close].forEach(b=>{if(b)b.disabled=false});
      }
    },true);
  }

  async function blobFile(file){
    const r=await fetch(`${API_BASE}/files/${encodeURIComponent(file.id)}`);
    if(!r.ok)throw new Error(`${file.original_filename||'ファイル'}を読み込めませんでした`);
    const blob=await r.blob();
    return new File([blob],file.original_filename||'file.bin',{type:file.mime_type||blob.type||'application/octet-stream'});
  }

  async function imageWidth(file){
    const bmp=('createImageBitmap' in window)?await createImageBitmap(file):null;
    if(bmp){const w=bmp.width;bmp.close?.();return w}
    return await new Promise((resolve,reject)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const w=img.naturalWidth;URL.revokeObjectURL(u);resolve(w)};img.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('画像サイズを取得できませんでした'))};img.src=u});
  }

  function autoResize(fn,size){
    const old=window.confirm;
    try{window.confirm=()=>true;fn(size)}finally{window.confirm=old}
  }

  async function loadEditPostFromQuery(){
    const id=new URLSearchParams(location.search).get('editPost');
    if(!id)return;
    const bridge=window.ForestCraftStudioBridge,auth=window.ForestAuth;
    if(!bridge||!auth)return;
    bridge.setStatus?.('投稿作品を編集用に読み込み中…');
    const user=await auth.me(true);
    if(!user)throw new Error('この作品を編集するにはForest Solへログインしてください。');
    const data=await auth.request(`/posts/${encodeURIComponent(id)}`);
    const p=data.post;
    if(!p||p.user_id!==user.id)throw new Error('自分の作品だけStudioへ直接読み込めます。');
    const files=Array.isArray(p.files)?p.files:[];

    if(p.category==='skin'){
      const f=files.find(x=>x.file_role==='main')||files.find(x=>(x.mime_type||'').startsWith('image/'));
      if(!f)throw new Error('スキン本体が見つかりません。');
      bridge.switchMode('skin');
      if(p.classic_slim){bridge.state.skin.armModel=p.classic_slim;const sel=document.getElementById('armModel');if(sel)sel.value=p.classic_slim;bridge.buildSkinModel()}
      await bridge.importSkinPNG(await blobFile(f));
    }else if(p.category==='model'){
      const bb=files.find(x=>x.file_role==='bbmodel'||/\.bbmodel$/i.test(x.original_filename||''));
      const tex=files.find(x=>x.file_role==='texture'&&(x.mime_type||'').startsWith('image/'));
      if(!bb)throw new Error('.bbmodelファイルが見つかりません。');
      bridge.switchMode('model');
      await bridge.loadBBModel(await blobFile(bb));
      if(tex)await bridge.importModelTexture(await blobFile(tex));
    }else if(p.category==='item'){
      const f=files.find(x=>x.file_role==='main')||files.find(x=>(x.mime_type||'').startsWith('image/'));
      if(!f)throw new Error('アイテムテクスチャが見つかりません。');
      const file=await blobFile(f),w=await imageWidth(file);
      bridge.switchMode('item');
      autoResize(bridge.changeItemSize,w);
      const size=document.getElementById('itemSize');if(size)size.value=String(w);
      await bridge.importAnimatedPNG(file,'item');
    }else if(p.category==='block'){
      const tex=files.filter(x=>x.file_role==='texture'&&(x.mime_type||'').startsWith('image/'));
      if(!tex.length)throw new Error('ブロックテクスチャが見つかりません。');
      const loaded=[];for(const f of tex)loaded.push({meta:f,file:await blobFile(f)});
      const w=await imageWidth(loaded[0].file);
      bridge.switchMode('block');
      autoResize(bridge.changeBlockSize,w);
      const size=document.getElementById('blockSize');if(size)size.value=String(w);
      for(const x of loaded){const m=(x.meta.original_filename||'').match(/^block_(front|back|left|right|top|bottom)\.png$/i);if(!m)continue;bridge.state.block.face=m[1].toLowerCase();await bridge.importAnimatedPNG(x.file,'block')}
      bridge.state.block.face='front';bridge.initBlockTabs();bridge.buildBlockCube();bridge.refreshAll();bridge.renderLayers();bridge.updateFrameLabels();
    }else throw new Error('この種類の作品はまだ直接編集に対応していません。');

    const title=document.getElementById('publishTitle'),desc=document.getElementById('publishDescription'),tag=document.getElementById('publishTags'),vis=document.getElementById('publishVisibility'),submit=document.getElementById('publishSubmitBtn');
    if(title)title.value=p.title||'';if(desc)desc.value=p.description||'';
    if(tag){let t=[];try{t=Array.isArray(p.tags)?p.tags:JSON.parse(p.tags_json||'[]')}catch(e){}tag.value=t.join(', ')}
    if(vis)vis.value=p.visibility||'public';if(submit)submit.textContent='編集版を投稿';
    window.ForestCraftStudioEditContext={sourcePostId:p.id,sourcePost:p};
    bridge.setStatus?.(`「${p.title}」を編集用に読み込みました。`);
  }

  try{
    await loadScript('../assets/forest-auth.js?v=20260820-publish-auth4');
    const css=(await Promise.all(styleParts.map(async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw new Error(p+' '+r.status);return r.text()}))).join('');
    const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
    const chunks=await Promise.all(appParts.map(async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw new Error(p+' '+r.status);return r.text()}));
    chunks[1]=chunks[1].replace(/^[\s\S]*?(?=function bindSkinFace\(cv\))/, '');
    const bridge='\nwindow.ForestCraftStudioBridge={publishState,buildPublishFiles,setPublishProgress,setStatus,state,importSkinPNG,loadBBModel,importModelTexture,importAnimatedPNG,switchMode,buildSkinModel,changeItemSize,changeBlockSize,initBlockTabs,buildBlockCube,refreshAll,renderLayers,updateFrameLabels};';
    const js=chunks.join('')+bridge;
    (0,eval)(js);
    bindAuthenticatedPublish();
    await window.ForestAuth?.mountStudio?.();
    await loadEditPostFromQuery();
  }catch(err){
    console.error(err);
    document.body.innerHTML='<div style="font-family:sans-serif;background:#12161c;color:#fff;min-height:100vh;padding:40px"><h1>Forest Craft Studio</h1><p>Web版の読み込みに失敗しました。</p><pre style="white-space:pre-wrap;color:#ffb8b8">'+String(err).replace(/[&<>]/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[s]))+'</pre><p><a href="../forestcraft.html" style="color:#9edbbf">Forest Craft Studioページへ戻る</a></p></div>';
  }
})();