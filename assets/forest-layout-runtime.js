(function(){
  "use strict";

  const KEY="forestsol_gallery_layout_v1";
  const DEFAULTS={
    desktop:{
      tabs:{x:38,y:19,w:55,h:58},
      search:{x:12,y:66,w:63,h:58},
      sort:{x:77,y:66,w:16,h:58},
      back:{x:3.5,y:73,w:26,h:72}
    },
    tablet:{
      tabs:{x:28,y:18,w:66,h:52},
      search:{x:10,y:64,w:62,h:54},
      sort:{x:74,y:64,w:20,h:54},
      back:{x:3,y:72,w:30,h:66}
    },
    mobile:{
      tabs:{x:8,y:16,w:84,h:108},
      search:{x:7,y:62,w:86,h:52},
      sort:{x:7,y:77,w:86,h:52},
      back:{x:3,y:70,w:52,h:58}
    }
  };

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(base,extra){
    const out=clone(base);
    if(!extra||typeof extra!=="object")return out;
    ["desktop","tablet","mobile"].forEach(mode=>{
      if(!extra[mode])return;
      Object.keys(out[mode]).forEach(key=>{
        if(extra[mode][key]&&typeof extra[mode][key]==="object")Object.assign(out[mode][key],extra[mode][key]);
      });
    });
    return out;
  }
  function load(){
    try{return merge(DEFAULTS,JSON.parse(localStorage.getItem(KEY)||"null"));}
    catch{return clone(DEFAULTS);}
  }
  function save(settings){localStorage.setItem(KEY,JSON.stringify(settings));}
  function reset(){localStorage.removeItem(KEY);apply();}
  function modeForWidth(w){return w<=760?"mobile":w<=1059?"tablet":"desktop";}
  function targetMap(doc){
    return {
      tabs:{el:doc.querySelector(".tabs"),parent:doc.querySelector(".filters")},
      search:{el:doc.getElementById("q"),parent:doc.querySelector(".filters")},
      sort:{el:doc.getElementById("sort"),parent:doc.querySelector(".filters")},
      back:{el:doc.querySelector(".back-link"),parent:doc.querySelector(".gallery-page-head")}
    };
  }
  function pct(v){return `${Number(v)||0}%`;}
  function px(v){return `${Math.max(1,Number(v)||1)}px`;}
  function force(el,name,value){if(el)el.style.setProperty(name,value,"important");}

  function applyTo(doc,settings,forcedMode){
    if(!doc)return;
    const view=doc.defaultView||window;
    const mode=forcedMode||modeForWidth(view.innerWidth||document.documentElement.clientWidth||1200);
    const cfg=(settings||load())[mode]||DEFAULTS[mode];
    const map=targetMap(doc);
    const toolbar=doc.querySelector(".toolbar");
    const filters=doc.querySelector(".filters");
    const head=doc.querySelector(".gallery-page-head");

    if(filters)force(filters,"position","relative");
    if(head)force(head,"position","relative");
    if(toolbar){
      force(toolbar,"position","static");
      force(toolbar,"display","contents");
      force(toolbar,"inset","auto");
    }

    Object.keys(map).forEach(key=>{
      const item=map[key],v=cfg[key];
      if(!item.el||!v)return;
      const el=item.el;
      force(el,"position","absolute");
      force(el,"left",pct(v.x));
      force(el,"top",pct(v.y));
      force(el,"right","auto");
      force(el,"bottom","auto");
      force(el,"width",pct(v.w));
      force(el,"max-width","none");
      if(key!=="tabs")force(el,"height",px(v.h));
      if(key==="tabs"){
        force(el,"height","auto");
        force(el,"justify-content",mode==="mobile"?"center":"flex-start");
      }
    });

    const q=map.search.el;
    if(q){
      force(q,"background-size","100% 100%");
      force(q,"background-position","center");
    }
  }

  function apply(){applyTo(document,load());}
  function getDefaults(){return clone(DEFAULTS);}
  function getSettings(){return load();}
  function setSettings(v){save(v);apply();}
  function getTargets(doc){return targetMap(doc||document);}

  window.ForestLayout={KEY,apply,applyTo,getDefaults,getSettings,setSettings,save,reset,modeForWidth,getTargets};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
  window.addEventListener("resize",()=>apply());
  window.addEventListener("storage",e=>{if(e.key===KEY)apply();});
})();
