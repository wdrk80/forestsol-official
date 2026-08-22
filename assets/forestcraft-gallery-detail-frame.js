(function(){
  "use strict";
  if(document.getElementById("forestCraftDetailFrameStyles"))return;
  var s=document.createElement("style");
  s.id="forestCraftDetailFrameStyles";
  s.textContent=`
    /* Forest Craft Studio 作品詳細: 外枠だけを木枠＋羊皮紙へ変更 */
    #postModal.modal{background:rgba(10,6,3,.82)!important;backdrop-filter:blur(5px)!important}
    #postModal .modal-card{
      width:min(1220px,calc(100vw - 34px))!important;
      max-height:calc(100vh - 30px)!important;
      overflow:auto!important;
      padding:0!important;
      border:8px solid #4a2b16!important;
      border-radius:22px!important;
      color:#33200f!important;
      background:
        linear-gradient(90deg,rgba(255,255,255,.04),transparent 16%,rgba(0,0,0,.12) 70%),
        linear-gradient(180deg,#6b4322,#3e2412)!important;
      box-shadow:
        inset 0 0 0 2px #a6753e,
        inset 0 0 0 5px rgba(37,20,9,.72),
        0 26px 70px rgba(0,0,0,.60)!important;
    }
    #postModal .modal-head{
      position:sticky!important;
      top:0!important;
      z-index:20!important;
      min-height:62px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      padding:10px 12px!important;
      border-bottom:2px solid #b98443!important;
      background:linear-gradient(180deg,#5a351b,#3b2110)!important;
      box-shadow:0 5px 12px rgba(0,0,0,.26)!important;
    }
    #postModal .modal-close{
      width:48px!important;
      height:48px!important;
      border:2px solid #c99a58!important;
      border-radius:9px!important;
      color:#2d1a0d!important;
      background:linear-gradient(180deg,#f4dfb4,#d8b77c)!important;
      box-shadow:inset 0 0 0 2px rgba(255,248,220,.45),0 3px 8px rgba(0,0,0,.28)!important;
      font-size:24px!important;
      font-weight:900!important;
    }
    #postModal .modal-content{
      margin:14px!important;
      padding:24px 26px 28px!important;
      border:3px solid #b78748!important;
      border-radius:15px!important;
      color:#34210f!important;
      background:
        radial-gradient(circle at 18% 10%,rgba(255,255,255,.42),transparent 33%),
        linear-gradient(180deg,#f3ddb1,#dfbd83)!important;
      box-shadow:
        inset 0 0 0 1px rgba(92,56,25,.22),
        inset 0 0 28px rgba(98,58,24,.14)!important;
    }
    #postModal .fc-detail-grid{gap:30px!important;color:#34210f!important}
    #postModal .eyebrow{color:#58713c!important;font-weight:900!important;letter-spacing:.16em!important}
    #postModal .fc-detail-title{color:#2d190b!important;text-shadow:0 1px 0 rgba(255,255,255,.28)!important}
    #postModal .post-author,
    #postModal .post-meta,
    #postModal .fc-meta-line{color:#6d4e31!important;font-weight:700!important}
    #postModal .fc-author-link{color:#45652f!important;font-weight:900!important}
    #postModal .fc-detail-description{color:#432b16!important;font-weight:650!important}
    #postModal .fc-info-chip,
    #postModal .fc-tag{
      border:1px solid rgba(74,87,45,.28)!important;
      color:#3d5428!important;
      background:rgba(245,229,192,.76)!important;
    }
    #postModal .fc-community{
      border:2px solid rgba(108,75,38,.32)!important;
      color:#3b2715!important;
      background:rgba(255,244,216,.68)!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.32)!important;
    }
    #postModal .fc-community-score{color:#9c6b22!important}
    #postModal .fc-community-score span,
    #postModal .fc-community-note{color:#765d42!important}
    #postModal .fc-star{color:#807563!important;text-shadow:none!important}
    #postModal .fc-star.on,
    #postModal .fc-star:hover{color:#d19b28!important}
    #postModal .fc-favorite{
      border:1px solid #8e653b!important;
      color:#f6e6c0!important;
      background:linear-gradient(180deg,#76502d,#56351c)!important;
    }
    #postModal .fc-favorite.on{border-color:#a6782e!important;background:linear-gradient(180deg,#8d672d,#64451c)!important;color:#fff0b2!important}
    #postModal .fc-action-button,
    #postModal .fc-viewer-button,
    #postModal .fcm-btn,
    #postModal .fcb-btn{
      border-color:#876039!important;
      color:#f6e7c2!important;
      background:linear-gradient(180deg,#694522,#493019)!important;
    }
    #postModal .fc-action-button.primary,
    #postModal .fc-viewer-button.active,
    #postModal .fcm-btn.active,
    #postModal .fcb-btn.active{
      border-color:#4f6b32!important;
      color:#f8f0d4!important;
      background:linear-gradient(180deg,#78934d,#506b31)!important;
    }
    #postModal .fc-action-button.danger{border-color:#6e2c25!important;color:#fff0df!important;background:linear-gradient(180deg,#944b38,#6e3025)!important}
    #postModal .fc-download-title{color:#402812!important;font-size:17px!important}
    #postModal .fc-download-row,
    #postModal .fcb-download-row{
      border:2px solid #3f2b19!important;
      background:linear-gradient(180deg,#193428,#0b2118)!important;
      box-shadow:inset 0 0 0 1px rgba(142,186,154,.11)!important;
    }
    #postModal .fc-download-name,
    #postModal .fcb-download-copy strong{color:#f1ead8!important}
    #postModal .fcb-download-copy span{color:#b9c8be!important}
    #postModal .fc-download-link,
    #postModal .fcb-download-button{color:#16321f!important;background:#77eaa0!important}
    #postModal .empty-state{color:#684c30!important}
    #postModal .fc-viewer-stage,
    #postModal .fc-non-skin-preview,
    #postModal .fcm-stage,
    #postModal .fcb-stage{border:3px solid #4b2e18!important;box-shadow:0 6px 16px rgba(55,30,12,.22)!important}
    @media(max-width:900px){
      #postModal .modal-card{width:calc(100vw - 16px)!important;border-width:5px!important}
      #postModal .modal-content{margin:8px!important;padding:16px!important}
      #postModal .fc-detail-grid{gap:18px!important}
    }
  `;
  document.head.appendChild(s);
})();
