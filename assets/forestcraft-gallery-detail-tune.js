(function(){
  "use strict";
  if(!/(^|\/)forestcraft-gallery\.html$/.test(location.pathname))return;

  var API="https://forest-craft-api.wdrk80.workers.dev";
  var style=document.createElement("style");
  style.id="forestCraftDetailTuneStyles";
  style.textContent=`
    /* 作品詳細の最終調整: 枠と×は既存のまま */
    #postModal .modal-content{
      padding:86px 58px 50px!important;
    }

    #postModal .fc-detail-grid{
      grid-template-columns:minmax(0,1.12fr) minmax(500px,.92fr)!important;
      gap:38px!important;
      align-items:start!important;
    }

    /* 左側を木枠から離して、羊皮紙の中へ完全に収める */
    #postModal .fc-viewer-shell,
    #postModal .fcm-viewer-shell,
    #postModal .fcb-viewer-shell{
      min-width:0!important;
      padding:8px 0 0!important;
    }

    #postModal .fc-viewer-toolbar,
    #postModal .fcm-toolbar,
    #postModal .fcb-toolbar{
      gap:11px!important;
      margin:0 0 14px!important;
    }

    #postModal .fc-viewer-button,
    #postModal .fcm-btn,
    #postModal .fcb-btn{
      min-height:48px!important;
      padding:11px 17px!important;
      font-size:15px!important;
      border-radius:10px!important;
    }

    #postModal .fc-viewer-stage,
    #postModal .fc-non-skin-preview,
    #postModal .fcm-stage,
    #postModal .fcb-stage{
      min-height:640px!important;
      border-width:3px!important;
      border-radius:18px!important;
    }

    #postModal .fc-detail-title{
      font-size:40px!important;
      margin:0 0 16px!important;
    }

    #postModal .post-author{
      display:flex!important;
      align-items:center!important;
      gap:10px!important;
      min-height:46px!important;
      margin:0 0 12px!important;
      font-size:18px!important;
      line-height:1.25!important;
      font-weight:800!important;
    }

    #postModal .fc-author-link{
      font-size:18px!important;
      font-weight:950!important;
    }

    #postModal .fc-author-avatar{
      flex:none!important;
      width:42px!important;
      height:42px!important;
      display:grid!important;
      place-items:center!important;
      overflow:hidden!important;
      border:2px solid #8f6338!important;
      border-radius:50%!important;
      background:#ead09b!important;
      color:#553218!important;
      box-shadow:0 2px 7px rgba(65,37,13,.25)!important;
      font-size:22px!important;
    }

    #postModal .fc-author-avatar img{
      width:100%!important;
      height:100%!important;
      display:block!important;
      object-fit:cover!important;
    }

    #postModal .fc-meta-line{
      font-size:17px!important;
      gap:10px 16px!important;
      margin:0 0 16px!important;
      font-weight:800!important;
    }

    #postModal .fc-community{
      margin:10px 0 22px!important;
      padding:22px 24px!important;
      gap:15px!important;
      border-radius:15px!important;
    }

    #postModal .fc-community-score{
      gap:12px!important;
      align-items:center!important;
    }

    #postModal .fc-community-score strong{
      font-size:31px!important;
    }

    #postModal .fc-community-score span{
      font-size:18px!important;
      font-weight:800!important;
    }

    #postModal .fc-stars{
      gap:7px!important;
      margin-top:4px!important;
    }

    #postModal .fc-star{
      font-size:38px!important;
    }

    #postModal .fc-community-note{
      margin-top:7px!important;
      font-size:16px!important;
      line-height:1.45!important;
      font-weight:700!important;
    }

    #postModal .fc-favorite{
      min-height:54px!important;
      padding:13px 20px!important;
      font-size:16px!important;
      font-weight:900!important;
      border-radius:11px!important;
    }

    #postModal .fc-detail-grid>div:nth-child(2)>h3,
    #postModal .fc-download-title{
      font-size:23px!important;
      line-height:1.2!important;
    }

    #postModal .fc-detail-actions{
      gap:13px!important;
      margin:0 0 22px!important;
    }

    #postModal .fc-action-button{
      min-height:50px!important;
      padding:11px 17px!important;
      font-size:15px!important;
    }

    #postModal .fc-download-row,
    #postModal .fcb-download-row{
      min-height:72px!important;
      padding:15px 18px!important;
    }

    #postModal .fc-download-name,
    #postModal .fcb-download-copy strong{
      font-size:16px!important;
    }

    #postModal .fc-download-link,
    #postModal .fcb-download-button{
      min-width:126px!important;
      min-height:46px!important;
      font-size:14px!important;
    }

    @media(max-width:1180px){
      #postModal .modal-content{padding:78px 44px 42px!important}
      #postModal .fc-detail-grid{grid-template-columns:minmax(0,1.05fr) minmax(430px,.95fr)!important;gap:28px!important}
      #postModal .fc-viewer-stage,
      #postModal .fc-non-skin-preview,
      #postModal .fcm-stage,
      #postModal .fcb-stage{min-height:560px!important}
    }

    @media(max-width:900px){
      #postModal .modal-content{padding:70px 24px 32px!important}
      #postModal .fc-detail-grid{grid-template-columns:1fr!important;gap:24px!important}
      #postModal .fc-viewer-stage,
      #postModal .fc-non-skin-preview,
      #postModal .fcm-stage,
      #postModal .fcb-stage{min-height:440px!important}
      #postModal .fc-detail-title{font-size:34px!important}
    }

    @media(max-width:560px){
      #postModal .modal-content{padding:62px 16px 24px!important}
      #postModal .post-author{font-size:17px!important}
      #postModal .fc-author-link{font-size:17px!important}
      #postModal .fc-author-avatar{width:38px!important;height:38px!important}
      #postModal .fc-meta-line{font-size:15px!important;gap:9px 13px!important}
      #postModal .fc-community-score strong{font-size:28px!important}
      #postModal .fc-community-score span{font-size:15px!important}
      #postModal .fc-community-note{font-size:14px!important}
      #postModal .fc-favorite{font-size:15px!important;min-height:48px!important}
    }
  `;
  document.head.appendChild(style);

  async function addAuthorAvatar(){
    var content=document.getElementById("modalContent");
    if(!content)return;
    var author=content.querySelector(".post-author");
    if(!author||author.querySelector(".fc-author-avatar"))return;
    var link=author.querySelector(".fc-author-link");
    if(!link)return;

    var holder=document.createElement("span");
    holder.className="fc-author-avatar";
    holder.textContent="🐾";
    author.insertBefore(holder,author.firstChild);

    try{
      var u=new URL(link.href,location.href);
      var username=u.searchParams.get("u");
      if(!username)return;
      var r=await fetch(API+"/users/"+encodeURIComponent(username));
      var d=await r.json();
      var avatar=d&&d.user&&d.user.avatar_url;
      if(!r.ok||!avatar)return;
      var img=document.createElement("img");
      img.src=avatar;
      img.alt=(d.user.display_name||username)+" のアイコン";
      holder.textContent="";
      holder.appendChild(img);
    }catch(e){/* fallback paw remains */}
  }

  var target=document.getElementById("modalContent");
  if(target){
    new MutationObserver(function(){setTimeout(addAuthorAvatar,0)}).observe(target,{childList:true,subtree:true});
    addAuthorAvatar();
  }
})();
