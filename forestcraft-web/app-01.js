'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SKIN_SCALE=14;
const MODEL_SCALE=11;

const state={
 mode:'skin',tool:'brush',brushSize:1,brushShape:'square',color:'#8b5a3c',hsv:{h:24,s:.57,v:.55},autoTone:false,autoToneStrength:10,alphaLock:false,
 partMirror:false,axisMirror:false,fillMode:'faceConnected',replaceScope:'face',
 selection:null,selectionClipboard:null,
 skin:{surface:'body',armModel:'classic',showBody:true,showOuter:true,grid:true,partVisibility:{head:true,body:true,rightArm:true,leftArm:true,rightLeg:true,leftLeg:true},layers:[],activeLayer:0,compare:null,compareVisible:true,compareOpacity:.35,view:{rx:-10,ry:28,zoom:1,panX:0,panY:0},previewView:{rx:0,ry:0,zoom:1,panX:0,panY:0}},
 model:{bb:null,w:64,h:64,frames:[],frame:0,previewFrame:0,activeLayer:0,view:{rx:-12,ry:30,zoom:1,panX:0,panY:0},grid:true,playing:false,fps:5,timer:null},
 item:{size:16,frames:[],frame:0,previewFrame:0,activeLayer:0,playing:false,fps:5,timer:null},
 block:{size:16,face:'front',faces:{},frame:0,previewFrame:0,activeLayer:0,playing:false,fps:5,timer:null,view:{rx:-18,ry:32,zoom:1,panX:0,panY:0}},
 undo:[],redo:[],maxHistory:50,recentColors:['#8b5a3c','#f0c9a2','#ffffff','#111111','#6f7680','#c44536']
};

function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=false;return c;}
function makeLayer(name,w,h){const canvas=makeCanvas(w,h);return {name,visible:true,opacity:1,canvas,ctx:canvas.getContext('2d',{willReadFrequently:true})};}
function makeFrame(w,h,name='Base'){return {layers:[makeLayer(name,w,h)],activeLayer:0};}
function initDocs(){state.skin.layers=[makeLayer('Base',64,64)];state.skin.activeLayer=0;state.item.frames=[makeFrame(16,16)];for(const f of ['front','back','left','right','top','bottom'])state.block.faces[f]={frames:[makeFrame(16,16)]};state.model.frames=[makeFrame(64,64)];}
function activeFrame(){if(state.mode==='model')return state.model.frames[state.model.frame];if(state.mode==='item')return state.item.frames[state.item.frame];if(state.mode==='block')return state.block.faces[state.block.face].frames[state.block.frame];return null;}
function getLayers(){if(state.mode==='skin')return state.skin.layers;return activeFrame().layers;}
function getActiveLayerIndex(){if(state.mode==='skin')return state.skin.activeLayer;return activeFrame().activeLayer;}
function setActiveLayerIndex(i){if(state.mode==='skin')state.skin.activeLayer=i;else activeFrame().activeLayer=i;}
function dimsForMode(){if(state.mode==='skin')return [64,64];if(state.mode==='model')return [state.model.w,state.model.h];if(state.mode==='item')return [state.item.size,state.item.size];return [state.block.size,state.block.size];}
function compositeLayers(layers,w,h){const c=makeCanvas(w,h),x=c.getContext('2d');for(const l of layers){if(!l.visible)continue;x.globalAlpha=l.opacity;x.drawImage(l.canvas,0,0);}x.globalAlpha=1;return c;}
function activeComposite(){const [w,h]=dimsForMode();return compositeLayers(getLayers(),w,h);}
function skinComposite(includeCompare=true){const c=compositeLayers(state.skin.layers,64,64),x=c.getContext('2d');if(includeCompare&&state.skin.compare&&state.skin.compareVisible){x.globalAlpha=state.skin.compareOpacity;x.drawImage(state.skin.compare,0,0);x.globalAlpha=1;}return c;}
function modelComposite(frameIndex=state.model.frame){const f=state.model.frames[clamp(frameIndex,0,state.model.frames.length-1)];return compositeLayers(f.layers,state.model.w,state.model.h);}
function itemComposite(frameIndex=state.item.frame){const f=state.item.frames[clamp(frameIndex,0,state.item.frames.length-1)];return compositeLayers(f.layers,state.item.size,state.item.size);}
function blockComposite(face=state.block.face,frameIndex=state.block.frame){const d=state.block.faces[face],f=d.frames[clamp(frameIndex,0,d.frames.length-1)];return compositeLayers(f.layers,state.block.size,state.block.size);}
