(async function(){
  const styleParts=['style-01.txt','style-02.txt'];
  const appParts=['app-01.txt','app-02.txt','app-03.txt','app-04.txt','app-05.txt','app-06.txt','app-07.txt'];
  try{
    const css=(await Promise.all(styleParts.map(async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw new Error(p+' '+r.status);return r.text()}))).join('');
    const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
    const js=(await Promise.all(appParts.map(async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw new Error(p+' '+r.status);return r.text()}))).join('');
    (0,eval)(js);
  }catch(err){
    console.error(err);
    document.body.innerHTML='<div style="font-family:sans-serif;background:#12161c;color:#fff;min-height:100vh;padding:40px"><h1>Forest Craft Studio</h1><p>Web版の読み込みに失敗しました。</p><pre style="white-space:pre-wrap;color:#ffb8b8">'+String(err).replace(/[&<>]/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[s]))+'</pre><p><a href="../forestcraft.html" style="color:#9edbbf">Forest Craft Studioページへ戻る</a></p></div>';
  }
})();
