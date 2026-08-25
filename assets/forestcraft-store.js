(function(){
  "use strict";

  if(!/(^|\/)forestcraft\.html$/.test(location.pathname))return;

  var STORE_ID="9P50T1JGKSK3";
  var PRODUCT_NAME="Forest Craft Studio";
  var STORE_DIRECT_URL="https://apps.microsoft.com/detail/"+STORE_ID+"?mode=direct";
  var STORE_FULL_URL="https://apps.microsoft.com/detail/"+STORE_ID+"?mode=full";
  var STORE_REVIEW_URI="ms-windows-store://review/?ProductId="+STORE_ID;
  var API_BASE="https://forest-craft-store-api.wdrk80.workers.dev";

  function addStyle(){
    if(document.getElementById("forestCraftStoreStyle"))return;
    var style=document.createElement("style");
    style.id="forestCraftStoreStyle";
    style.textContent=[
      ".forest-store-panel{margin-top:30px;padding:28px;border:1px solid rgba(111,231,169,.48);border-radius:22px;background:radial-gradient(circle at 100% 0,rgba(70,211,255,.11),transparent 30%),linear-gradient(145deg,rgba(4,29,20,.94),rgba(3,18,14,.9));box-shadow:0 18px 46px rgba(0,0,0,.34)}",
      ".forest-store-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:18px}",
      ".forest-store-head h2{margin:0;font-size:27px}",
      ".forest-store-head p{margin:5px 0 0;color:#bad0c5;line-height:1.7}",
      ".forest-store-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border:1px solid rgba(87,221,255,.42);border-radius:999px;background:rgba(6,35,28,.72);color:#d9f8ff;font-size:12px;font-weight:850}",
      ".forest-store-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}",
      ".forest-store-stat{padding:18px;border:1px solid rgba(115,222,169,.3);border-radius:15px;background:rgba(5,31,22,.76)}",
      ".forest-store-stat-label{display:block;color:#a9c7b8;font-size:12px;margin-bottom:7px}",
      ".forest-store-stat-value{display:block;color:#f7fff9;font-size:25px;font-weight:950;letter-spacing:-.02em}",
      ".forest-store-stat-sub{display:block;color:#8fb5a4;font-size:11px;margin-top:5px}",
      ".forest-store-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:17px}",
      ".forest-store-sync-note{margin:14px 0 0;color:#9db9ac;font-size:12px;line-height:1.65}",
      ".forest-store-reviews{margin-top:18px;display:grid;gap:10px}",
      ".forest-store-review{padding:15px;border:1px solid rgba(115,222,169,.24);border-radius:13px;background:rgba(3,22,16,.7)}",
      ".forest-store-review-top{display:flex;justify-content:space-between;gap:12px;color:#dff7e7;font-size:13px;font-weight:850}",
      ".forest-store-review p{margin:8px 0 0;color:#bdd0c7;line-height:1.7;font-size:13px;white-space:pre-wrap}",
      "@media(max-width:700px){.forest-store-stats{grid-template-columns:1fr}.forest-store-panel{padding:21px 15px}}"
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

  function createPanel(){
    if(document.getElementById("forestCraftStorePanel"))return;
    var hero=document.querySelector(".hero");
    if(!hero)return;

    var panel=document.createElement("section");
    panel.id="forestCraftStorePanel";
    panel.className="forest-store-panel";
    panel.innerHTML=''
      +'<div class="forest-store-head">'
      +  '<div><h2>Microsoft Store</h2><p>ダウンロード・評価・レビューをStore側に一本化しています。</p></div>'
      +  '<span class="forest-store-badge">Microsoft Store 公式配布</span>'
      +'</div>'
      +'<div class="forest-store-stats">'
      +  '<div class="forest-store-stat"><span class="forest-store-stat-label">ダウンロード</span><strong class="forest-store-stat-value" id="forestStoreDownloads">--</strong><span class="forest-store-stat-sub">Microsoft Store 取得数</span></div>'
      +  '<div class="forest-store-stat"><span class="forest-store-stat-label">評価</span><strong class="forest-store-stat-value" id="forestStoreRating">--</strong><span class="forest-store-stat-sub" id="forestStoreRatingCount">Store評価</span></div>'
      +  '<div class="forest-store-stat"><span class="forest-store-stat-label">レビュー</span><strong class="forest-store-stat-value" id="forestStoreReviews">--</strong><span class="forest-store-stat-sub">Microsoft Storeと共通</span></div>'
      +'</div>'
      +'<div class="forest-store-actions">'
      +  '<a class="button primary" data-no-transition href="'+STORE_DIRECT_URL+'">🪟 無料でインストール</a>'
      +  '<a class="button secondary" data-no-transition href="'+STORE_REVIEW_URI+'">★ レビューを書く</a>'
      +  '<a class="button secondary" data-no-transition href="'+STORE_FULL_URL+'">Storeで詳細を見る</a>'
      +'</div>'
      +'<p class="forest-store-sync-note" id="forestStoreSyncNote">Microsoft Storeの統計を読み込んでいます...</p>'
      +'<div class="forest-store-reviews" id="forestStoreReviewList"></div>';

    hero.insertAdjacentElement("afterend",panel);
  }

  function fmtInt(v){
    var n=Number(v);
    return Number.isFinite(n)?new Intl.NumberFormat("ja-JP").format(n):"--";
  }

  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[c]});
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
    }catch(e){
      if(note)note.textContent="ダウンロード数・評価の自動同期はMicrosoft Store Analytics APIの接続設定後に表示されます。レビュー投稿はすでにStoreと共通です。";
    }
  }

  async function loadStoreReviews(){
    var box=document.getElementById("forestStoreReviewList");
    if(!box)return;
    try{
      var r=await fetch(API_BASE+"/store-reviews?limit=6",{cache:"no-store"});
      var d=await r.json();
      if(!r.ok||!d||d.ok===false)throw new Error("reviews unavailable");
      var items=Array.isArray(d.reviews)?d.reviews:[];
      if(!items.length)return;
      box.innerHTML=items.map(function(x){
        var stars=Number(x.rating||0);
        return '<article class="forest-store-review"><div class="forest-store-review-top"><span>'+esc(x.title||x.reviewer_name||"Microsoft Store レビュー")+'</span><span>'+esc((Number.isFinite(stars)?stars.toFixed(1):"-")+" ★")+'</span></div><p>'+esc(x.text||x.review_text||"")+'</p></article>';
      }).join("");
    }catch(e){}
  }

  function install(){
    addStyle();
    patchHero();
    createPanel();
    loadStoreStats();
    loadStoreReviews();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();