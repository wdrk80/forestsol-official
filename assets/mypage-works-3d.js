(function(){
  "use strict";
  if(!/(^|\/)mypage\.html$/.test(location.pathname))return;

  const API="https://forest-craft-api.wdrk80.workers.dev";
  let timer=null;
  let loading=false;

  function ready(){
    return window.ForestAuth&&window.ForestCraftGallery&&
      typeof window.ForestCraftGallery.mountSkinCard==="function"&&
      typeof window.ForestCraftGallery.mountBlockCard==="function"&&
      typeof window.ForestCraftGallery.mountModelCard==="function";
  }

  function previewUrl(post,full){
    const files=Array.isArray(full&&full.files)?full.files:[];
    const skin=files.find(f=>f.file_role==="main"&&(f.mime_type||"").indexOf("image/")===0)||
      files.find(f=>(f.original_filename||"")==="minecraft_skin.png");
    if(skin)return API+"/files/"+encodeURIComponent(skin.id);
    if(post.preview_file_id)return API+"/files/"+encodeURIComponent(post.preview_file_id);
    return "";
  }

  async function detailed(post){
    try{
      const d=await ForestAuth.request("/posts/"+encodeURIComponent(post.id));
      return d&&d.post?d.post:post;
    }catch(e){
      return post;
    }
  }

  async function enhance(){
    if(loading||!ready())return;
    const root=document.getElementById("works");
    if(!root)return;
    loading=true;
    try{
      const posts=await ForestAuth.myPosts();
      const map=new Map(posts.map(p=>[String(p.id),p]));
      const cards=Array.from(root.querySelectorAll(".work-card"));
      for(const card of cards){
        const id=String(card.dataset.id||"");
        const post=map.get(id);
        const box=card.querySelector(".work-preview");
        if(!post||!box||box.dataset.fcMy3dMounted==="1")continue;
        if(!["skin","block","model"].includes(post.category))continue;
        box.dataset.fcMy3dMounted="1";
        box.style.position="relative";
        box.style.overflow="hidden";
        box.style.background="radial-gradient(circle at 50% 46%,#173b2e 0,#071711 58%,#03100c 100%)";

        try{
          const full=await detailed(post);
          if(post.category==="skin"){
            const url=previewUrl(post,full);
            if(!url)throw new Error("skin image missing");
            ForestCraftGallery.mountSkinCard(box,url,(full.classic_slim||post.classic_slim)==="slim");
          }else if(post.category==="block"){
            ForestCraftGallery.mountBlockCard(box,full);
          }else if(post.category==="model"){
            ForestCraftGallery.mountModelCard(box,full);
          }
        }catch(e){
          box.dataset.fcMy3dMounted="";
        }
      }
    }finally{
      loading=false;
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(enhance,80);
  }

  function start(){
    const root=document.getElementById("works");
    if(!root){setTimeout(start,80);return}
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    schedule();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
