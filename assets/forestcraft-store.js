(function(){
  "use strict";

  if(!/(^|\/)forestcraft\.html$/.test(location.pathname))return;

  var STORE_ID="9P50T1JGKSK3";
  var STORE_DIRECT_URL="https://apps.microsoft.com/detail/"+STORE_ID+"?mode=direct";
  var STORE_FULL_URL="https://apps.microsoft.com/detail/"+STORE_ID+"?mode=full";
  var STORE_REVIEW_URI="ms-windows-store://review/?ProductId="+STORE_ID;
  var API_BASE="https://forest-craft-store-api.wdrk80.workers.dev";
  var SHOW_STORE_DEBUG=new URLSearchParams(location.search).get("storeDebug")==="1";

  function addStyle(){
    if(document.getElementById("forestCraftStoreStyle"))return;
    var style=document.createElement("style");
    style.id="forestCraftStoreStyle";
    style.textContent=[
      ".forest-store-inline{margin-top:18px;padding-top:17px;border-top:1px solid rgba(115,222,169,.22)}",
      ".forest-store-inline-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}",
      ".forest-store-inline-title{color:#dff9e7;font-size:12px;font-weight:900;letter-spacing:.03em}",
      ".forest-store-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border:1px solid rgba(87,221,255,.36);border-radius:999px;background:rgba(6,35,28,.58);color:#d9f8ff;font-size:10px;font-weight:850}",
      ".forest-store-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}",
      ".forest-store-stat{padding:12px 13px;border:1px solid rgba(115,222,169,.27);border-radius:12px;background:rgba(3,28,20,.62)}",
      ".forest-store-stat-label{display:block;color:#9fbeaf;font-size:10px;margin-bottom:4px}",
      ".forest-store-stat-value{display:block;color:#f7fff9;font-size:20px;font-weight:950;letter-spacing:-.02em}",
      ".forest-store-stat-sub{display:block;color:#84aa98;font-size:9px;margin-top:3px}",
      ".forest-store-sync-note{margin:8px 0 0;color:#8fae9f;font-size:10px;line-height:1.55}",
      ".forest-store-reviews{margin-top:11px;display:grid;gap:8px}",
      ".forest-store-review{padding:11px 12px;border:1px solid rgba(115,222,169,.20);border-radius:11px;background:rgba(3,22,16,.56)}",
      ".forest-store-review-top{display:flex;justify-content:space-between;gap:10px;color:#dff7e7;font-size:11px;font-weight:850}",
      ".forest-store-review p{margin:5px 0 0;color:#bdd0c7;line-height:1.55;font-size:11px;white-space:pre-wrap}",
      ".forest-store-debug{margin-top:10px;padding:10px 12px;border:1px dashed rgba(255,213,108,.35);border-radius:10px;color:#d8e7df;background:rgba(20,27,18,.52);font-size:10px;line-height:1.65}",
      "@media(max-width:700px){.forest-store-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.forest-store-stat{padding:10px 9px}.forest-store-stat-value{font-size:18px}}",
      "@media(max-width:470px){.forest-store-stats{grid-template-columns:1fr}.forest-store-stat{display:grid;grid-template-columns:1fr auto;align-items:center}.forest-store-stat-sub{grid-column:1/-1}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function makeButton(tag,className,text,href){
    var el=document.createElement(tag);
    el.className=className;
    el.textContent=text;
    if(href)el.setAttribute("href",href);
    return el;
  }

  function patchHero(){
    var actions=document.querySelector(".hero-actions");
    if(!actions)return;

    var old=actions.querySelector(".button.primary");
    if(old){
      var download=makeButton("a","button primary","🪟 Windows版をダウンロード",STORE_DIRECT_URL);
      download.id="forestCraftStoreDownload";
      download.dataset.noTransition="1";
      download.title="Microsoft Store経由で安全にインストール";
      old.replaceWith(download);
    }

    if(!document.getElementById("forestCraftStoreView")){
      var view=makeButton("a","button secondary","Microsoft Storeで見る",STORE_FULL_URL);
      view.id="forestCraftStoreView";
      view.dataset.noTransition="1";
      actions.appendChild(view);
    }

    if(!document.getElementById("forestCraftStoreReviewHero")){
      var review=makeButton("a","button secondary","★ 評価・レビューを書く",STORE_REVIEW_URI);
      review.id="forestCraftStoreReviewHero";
      review.dataset.noTransition="1";
      actions.appendChild(review);
    }

    var note=document.querySelector(".download-note");
    if(note){
      note.textContent="Windows版はMicrosoft Store経由で安全にインストール・自動更新されます。ダウンロードボタンからStoreの商品ページへ移動せず、Web Installerを開始できます。";
    }
  }

  function createInlineStats(){
    var oldPanel=document.getElementById("forestCraftStorePanel");
    if(oldPanel)oldPanel.remove();
    if(document.getElementById("forestCraftStoreInline"))return;

    var host=document.querySelector(".hero-copy-wrap");
    if(!host)return;

    var box=document.createElement("div");
    box.id="forestCraftStoreInline";
    box.className="forest-store-inline";
    box.innerHTML=''
      +'<div class="forest-store-inline-head">'
      +  '<span class="forest-store-inline-title">Microsoft Store 統計</span>'
      +  '<span class="forest-store-badge">公式配布・自動同期</span>'
      +'</div>'
      +'<div class="forest-store-stats">'
      +  '<div class="forest-store-stat"><span class="forest-store-stat-label">ダウンロード</span><strong class="forest-store-stat-value" id="forestStoreDownloads">--</strong><span class="forest-store-stat-sub">Store取得数</span></div>'
      +  '<div class="forest-store-stat"><span class="forest-store-stat-label">評価</span><strong class="forest-store-stat-value" id="forestStoreRating">--</strong><span class="forest-store-stat-sub" id="forestStoreRatingCount">Store評価</span></div>'
      +  '<div class="forest-store-stat"><span class="forest-store-stat-label">レビュー</span><strong class="forest-store-stat-value" id="forestStoreReviews">--</strong><span class="forest-store-stat-sub">Storeと共通</span></div>'
      +'</div>'
      +'<p class="forest-store-sync-note" id="forestStoreSyncNote">Microsoft Storeの統計を読み込んでいます...</p>'
      +'<div class="forest-store-reviews" id="forestStoreReviewList"></div>'
      +(SHOW_STORE_DEBUG?'<div class="forest-store-debug" id="forestStoreDebug">取得内訳を読み込んでいます...</div>':'');

    host.appendChild(box);
  }

  function fmtInt(v){
    var n=Number(v);
    return Number.isFinite(n)?new Intl.NumberFormat("ja-JP").format(n):"--";
  }

  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[c]});
  }

  function renderReviews(items){
    var box=document.getElementById("forestStoreReviewList");
    if(!box)return;
    items=Array.isArray(items)?items:[];
    if(!items.length){box.innerHTML="";return;}
    box.innerHTML=items.slice(0,3).map(function(x){
      var stars=Number(x.rating||0);
      return '<article class="forest-store-review"><div class="forest-store-review-top"><span>'+esc(x.title||x.reviewer_name||"Microsoft Store レビュー")+'</span><span>'+esc((Number.isFinite(stars)?stars.toFixed(1):"-")+" ★")+'</span></div><p>'+esc(x.text||x.review_text||"")+'</p></article>';
    }).join("");
  }

  function renderDebug(d){
    if(!SHOW_STORE_DEBUG)return;
    var el=document.getElementById("forestStoreDebug");
    if(!el)return;
    var x=d&&d.latest_acquisition;
    if(!x){el.textContent="取得内訳: まだ詳細データなし";return;}
    el.textContent="最新取得: "+[x.date||"日付不明",x.market||"地域不明",x.device_type||"端末不明",x.store_client||"経路不明",x.os_version||"OS不明",x.acquisition_type||""].filter(Boolean).join(" / ");
  }

  async function loadStoreStats(){
    var note=document.getElementById("forestStoreSyncNote");
    try{
      var r=await fetch(API_BASE+"/store-stats",{cache:"no-store"});
      var d=await r.json();
      if(!r.ok||!d||d.ok===false)throw new Error((d&&d.error)||"stats unavailable");

      document.getElementById("forestStoreDownloads").textContent=fmtInt(d.downloads!=null?d.downloads:d.acquisitions);
      var rating=Number(d.rating_average!=null?d.rating_average:d.rating);
      document.getElementById("forestStoreRating").textContent=Number.isFinite(rating)?rating.toFixed(1)+" ★":"--";
      document.getElementById("forestStoreRatingCount").textContent=fmtInt(d.rating_count)+"件の評価";
      document.getElementById("forestStoreReviews").textContent=fmtInt(d.review_count);
      if(note)note.textContent="Microsoft Storeの統計と同期しています。";
      renderReviews(d.reviews);
      renderDebug(d);
    }catch(e){
      if(note)note.textContent="Microsoft Store統計を一時的に取得できません。しばらくすると自動で復帰します。";
    }
  }

  function install(){
    addStyle();
    patchHero();
    createInlineStats();
    loadStoreStats();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();