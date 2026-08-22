(function(){
  "use strict";
  if(document.getElementById("forestCraftDetailFrameStyles"))return;

  var s=document.createElement("style");
  s.id="forestCraftDetailFrameStyles";
  s.textContent=`
    #postModal.modal{
      background:rgba(10,6,3,.84)!important;
      backdrop-filter:blur(6px)!important;
    }

    #postModal .modal-card{
      position:relative!important;
      width:min(1450px,calc(100vw - 24px))!important;
      max-height:calc(100vh - 18px)!important;
      overflow:auto!important;
      padding:0!important;
      border:0!important;
      border-radius:22px!important;
      color:#34210f!important;
      background:url("../images/forestcraft/fcs-gallery-detail-frame.png") center / 100% 100% no-repeat!important;
      box-shadow:0 28px 76px rgba(0,0,0,.62)!important;
    }

    #postModal .modal-head{
      position:absolute!important;
      top:16px!important;
      right:16px!important;
      z-index:30!important;
      width:auto!important;
      min-height:0!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }

    #postModal .modal-close{
      width:50px!important;
      height:50px!important;
      border:2px solid #8b5a29!important;
      border-radius:10px!important;
      color:#2e1a0c!important;
      background:linear-gradient(180deg,#f6e4b9,#d8b273)!important;
      box-shadow:inset 0 0 0 2px rgba(255,249,225,.55),0 3px 8px rgba(0,0,0,.28)!important;
      font-size:26px!important;
      font-weight:900!important;
    }

    #postModal .modal-content{
      margin:0!important;
      padding:52px 54px 46px!important;
      border:0!important;
      border-radius:0!important;
      color:#34210f!important;
      background:transparent!important;
      box-shadow:none!important;
    }

    #postModal .fc-detail-grid{
      grid-template-columns:minmax(0,1fr) minmax(470px,1.06fr)!important;
      gap:34px!important;
      align-items:start!important;
      color:#34210f!important;
    }

    #postModal .eyebrow{
      margin:2px 0 8px!important;
      color:#58713c!important;
      font-size:15px!important;
      font-weight:900!important;
      letter-spacing:.16em!important;
    }

    #postModal .fc-detail-title{
      margin:0 0 14px!important;
      color:#2d190b!important;
      font-size:36px!important;
      line-height:1.15!important;
      text-shadow:0 1px 0 rgba(255,255,255,.28)!important;
    }

    #postModal .post-author{
      margin:0 0 13px!important;
      color:#6d4e31!important;
      font-size:14px!important;
      font-weight:700!important;
    }

    #postModal .post-meta,
    #postModal .fc-meta-line{
      margin:0 0 14px!important;
      gap:14px!important;
      color:#6d4e31!important;
      font-size:14px!important;
      line-height:1.55!important;
      font-weight:750!important;
    }

    #postModal .fc-author-link{color:#45652f!important;font-weight:900!important}

    #postModal .fc-tag-list:empty{display:none!important}
    #postModal .fc-info-chip,
    #postModal .fc-tag{
      border:1px solid rgba(74,87,45,.28)!important;
      color:#3d5428!important;
      background:rgba(245,229,192,.76)!important;
      font-size:12px!important;
      padding:6px 9px!important;
    }

    #postModal .fc-community{
      margin:10px 0 18px!important;
      padding:18px 20px!important;
      gap:12px!important;
      border:2px solid rgba(108,75,38,.32)!important;
      color:#3b2715!important;
      background:rgba(255,244,216,.68)!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.32)!important;
    }
    #postModal .fc-community-score{gap:9px!important;color:#9c6b22!important}
    #postModal .fc-community-score strong{font-size:27px!important;line-height:1!important}
    #postModal .fc-community-score span{font-size:13px!important;color:#765d42!important}
    #postModal .fc-community-note{font-size:12px!important;color:#765d42!important}
    #postModal .fc-stars{gap:5px!important}
    #postModal .fc-star{font-size:34px!important;color:#807563!important;text-shadow:none!important}
    #postModal .fc-star.on,
    #postModal .fc-star:hover{color:#d19b28!important}

    #postModal .fc-favorite{
      min-height:44px!important;
      padding:10px 16px!important;
      border:1px solid #8e653b!important;
      color:#f6e6c0!important;
      background:linear-gradient(180deg,#76502d,#56351c)!important;
      font-size:13px!important;
    }
    #postModal .fc-favorite.on{
      border-color:#a6782e!important;
      background:linear-gradient(180deg,#8d672d,#64451c)!important;
      color:#fff0b2!important;
    }

    #postModal .fc-detail-description{
      margin:14px 0 16px!important;
      color:#432b16!important;
      font-size:18px!important;
      line-height:1.55!important;
      font-weight:700!important;
    }

    #postModal .fc-detail-actions{
      gap:12px!important;
      margin:0 0 20px!important;
    }

    #postModal .fc-action-button,
    #postModal .fc-viewer-button,
    #postModal .fcm-btn,
    #postModal .fcb-btn{
      min-height:44px!important;
      padding:10px 15px!important;
      border-color:#876039!important;
      color:#f6e7c2!important;
      background:linear-gradient(180deg,#694522,#493019)!important;
      font-size:13px!important;
      font-weight:900!important;
    }

    #postModal .fc-action-button.primary,
    #postModal .fc-viewer-button.active,
    #postModal .fcm-btn.active,
    #postModal .fcb-btn.active{
      border-color:#4f6b32!important;
      color:#f8f0d4!important;
      background:linear-gradient(180deg,#78934d,#506b31)!important;
    }

    #postModal .fc-action-button.danger{
      border-color:#6e2c25!important;
      color:#fff0df!important;
      background:linear-gradient(180deg,#944b38,#6e3025)!important;
    }

    #postModal .fc-download-title{
      margin:4px 0 11px!important;
      color:#402812!important;
      font-size:21px!important;
      line-height:1.2!important;
    }

    #postModal .fc-download-list{gap:10px!important}
    #postModal .fc-download-row,
    #postModal .fcb-download-row{
      min-height:66px!important;
      padding:14px 16px!important;
      border:2px solid #3f2b19!important;
      background:linear-gradient(180deg,#193428,#0b2118)!important;
      box-shadow:inset 0 0 0 1px rgba(142,186,154,.11)!important;
    }
    #postModal .fc-download-name,
    #postModal .fcb-download-copy strong{
      color:#f1ead8!important;
      font-size:14px!important;
      line-height:1.45!important;
      font-weight:850!important;
    }
    #postModal .fcb-download-copy span{color:#b9c8be!important;font-size:12px!important}
    #postModal .fc-download-link,
    #postModal .fcb-download-button{
      min-width:112px!important;
      min-height:42px!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      padding:9px 15px!important;
      color:#16321f!important;
      background:#77eaa0!important;
      font-size:13px!important;
      font-weight:900!important;
    }

    #postModal .fc-viewer-toolbar,
    #postModal .fcm-toolbar,
    #postModal .fcb-toolbar{gap:9px!important;margin-bottom:10px!important}

    #postModal .fc-viewer-stage,
    #postModal .fc-non-skin-preview,
    #postModal .fcm-stage,
    #postModal .fcb-stage{
      min-height:585px!important;
      border:3px solid #4b2e18!important;
      box-shadow:0 6px 16px rgba(55,30,12,.22)!important;
    }

    @media(max-width:1100px){
      #postModal .modal-content{padding:48px 42px 40px!important}
      #postModal .fc-detail-grid{grid-template-columns:minmax(0,1fr) minmax(390px,.95fr)!important;gap:26px!important}
      #postModal .fc-detail-title{font-size:32px!important}
      #postModal .fc-viewer-stage,
      #postModal .fc-non-skin-preview,
      #postModal .fcm-stage,
      #postModal .fcb-stage{min-height:520px!important}
    }

    @media(max-width:900px){
      #postModal .modal-card{width:calc(100vw - 12px)!important;border-radius:14px!important}
      #postModal .modal-content{padding:52px 24px 30px!important}
      #postModal .modal-head{top:12px!important;right:12px!important}
      #postModal .modal-close{width:42px!important;height:42px!important;font-size:22px!important}
      #postModal .fc-detail-grid{grid-template-columns:1fr!important;gap:20px!important}
      #postModal .fc-detail-title{font-size:30px!important}
      #postModal .fc-detail-description{font-size:16px!important}
      #postModal .fc-viewer-stage,
      #postModal .fc-non-skin-preview,
      #postModal .fcm-stage,
      #postModal .fcb-stage{min-height:420px!important}
    }

    @media(max-width:560px){
      #postModal .modal-content{padding:48px 16px 24px!important}
      #postModal .fc-meta-line{font-size:12px!important;gap:8px!important}
      #postModal .fc-community{padding:14px!important}
      #postModal .fc-community-score strong{font-size:23px!important}
      #postModal .fc-star{font-size:30px!important}
      #postModal .fc-download-row,
      #postModal .fcb-download-row{padding:12px!important}
    }
  `;

  document.head.appendChild(s);
})();