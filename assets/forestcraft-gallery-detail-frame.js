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
      width:min(1220px,calc(100vw - 30px))!important;
      max-height:calc(100vh - 24px)!important;
      overflow:auto!important;
      padding:0!important;
      border:0!important;
      border-radius:22px!important;
      color:#34210f!important;
      background:
        url("../images/forestcraft/fcs-gallery-detail-frame.png")
        center / 100% 100% no-repeat!important;
      box-shadow:0 28px 76px rgba(0,0,0,.62)!important;
    }

    #postModal .modal-head{
      position:absolute!important;
      top:18px!important;
      right:18px!important;
      z-index:30!important;
      width:auto!important;
      min-height:0!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }

    #postModal .modal-close{
      width:46px!important;
      height:46px!important;
      border:2px solid #8b5a29!important;
      border-radius:10px!important;
      color:#2e1a0c!important;
      background:linear-gradient(180deg,#f6e4b9,#d8b273)!important;
      box-shadow:
        inset 0 0 0 2px rgba(255,249,225,.55),
        0 3px 8px rgba(0,0,0,.28)!important;
      font-size:24px!important;
      font-weight:900!important;
    }

    #postModal .modal-content{
      margin:0!important;
      padding:68px 72px 58px!important;
      border:0!important;
      border-radius:0!important;
      color:#34210f!important;
      background:transparent!important;
      box-shadow:none!important;
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
    #postModal .fc-favorite.on{
      border-color:#a6782e!important;
      background:linear-gradient(180deg,#8d672d,#64451c)!important;
      color:#fff0b2!important;
    }

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

    #postModal .fc-action-button.danger{
      border-color:#6e2c25!important;
      color:#fff0df!important;
      background:linear-gradient(180deg,#944b38,#6e3025)!important;
    }

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

    #postModal .fc-viewer-stage,
    #postModal .fc-non-skin-preview,
    #postModal .fcm-stage,
    #postModal .fcb-stage{
      border:3px solid #4b2e18!important;
      box-shadow:0 6px 16px rgba(55,30,12,.22)!important;
    }

    @media(max-width:900px){
      #postModal .modal-card{
        width:calc(100vw - 12px)!important;
        border-radius:14px!important;
      }
      #postModal .modal-content{
        padding:52px 28px 36px!important;
      }
      #postModal .modal-head{
        top:12px!important;
        right:12px!important;
      }
      #postModal .modal-close{
        width:40px!important;
        height:40px!important;
        font-size:21px!important;
      }
      #postModal .fc-detail-grid{gap:18px!important}
    }
  `;

  document.head.appendChild(s);
})();