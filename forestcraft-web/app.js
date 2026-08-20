(async function(){
  const styleParts=['style-01.txt','style-02.txt'];
  const appParts=['app-01.txt','app-02.txt','app-03.txt','app-04.txt','app-05.txt','app-06.txt','app-07.txt'];
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
      try{
        progress('作品情報を登録中…');
        const body={title,description,category,tags,visibility};
        if(category==='skin'&&bridge.state?.skin)body.classic_slim=bridge.state.skin.armModel;

        const postData=await auth.request('/posts',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(body)
        });
        const postId=postData.post.id;

        for(let i=0;i<pstate.files.length;i++){
          const f=pstate.files[i];
          progress(`ファイル ${i+1}/${pstate.files.length} を送信中… ${f.filename}`);
          const path=`/posts/${encodeURIComponent(postId)}/files?type=${encodeURIComponent(f.storage)}&role=${encodeURIComponent(f.role)}&filename=${encodeURIComponent(f.filename)}`;
          await auth.request(path,{
            method:'POST',
            headers:{'Content-Type':f.mime},
            body:f.blob
          });
        }

        progress(`投稿完了！ ${user.display_name||user.username} の作品に追加しました。`,'good');
        bridge.setStatus?.(`サイト投稿完了: ${title}`);
      }catch(err){
        progress(`投稿失敗: ${err.message||String(err)}`,'bad');
      }finally{
        pstate.busy=false;
        [submit,cancel,close].forEach(b=>{if(b)b.disabled=false});
      }
    },true);
  }

  try{
    await loadScript('../assets/forest-auth.js?v=20260820-publish-auth3');
    const css=(await Promise.all(styleParts.map(async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw new Error(p+' '+r.status);return r.text()}))).join('');
    const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
    const chunks=await Promise.all(appParts.map(async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw new Error(p+' '+r.status);return r.text()}));
    chunks[1]=chunks[1].replace(/^[\s\S]*?(?=function bindSkinFace\(cv\))/, '');
    const bridge='\nwindow.ForestCraftStudioBridge={publishState,buildPublishFiles,setPublishProgress,setStatus,state};';
    const js=chunks.join('')+bridge;
    (0,eval)(js);
    bindAuthenticatedPublish();
    await window.ForestAuth?.mountStudio?.();
  }catch(err){
    console.error(err);
    document.body.innerHTML='<div style="font-family:sans-serif;background:#12161c;color:#fff;min-height:100vh;padding:40px"><h1>Forest Craft Studio</h1><p>Web版の読み込みに失敗しました。</p><pre style="white-space:pre-wrap;color:#ffb8b8">'+String(err).replace(/[&<>]/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[s]))+'</pre><p><a href="../forestcraft.html" style="color:#9edbbf">Forest Craft Studioページへ戻る</a></p></div>';
  }
})();