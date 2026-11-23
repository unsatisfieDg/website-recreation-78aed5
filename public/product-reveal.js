import {productReveal,revealEditions} from './product-reveal-template.js?v=b01de48003c8';
import {mountBarViewer} from './bar-viewer.js?v=834658f760e5';
import {createPageScope} from './page-scope.js?v=5fbc86d3ec7f';
import {createProductSmoke} from './product-smoke.js?v=1029d0f04a5a';
import {vapeCopy} from './product-content.js?v=c73acc77c6a5';
const quiet=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-off');
export function mountProductJourney(root,scope){mountStage(root,scope);}
export function initDirectFlavourScenes(scope){document.querySelectorAll('.flavour-page>[data-product-reveal]').forEach(panel=>{const host=document.createElement('div');host.className='flavour-stage';panel.before(host);host.append(panel);mountStage(host,scope,panel);});}
function mountStage(host,scope,initial=null){
 let current=null,pending=null,origin=null;const inline=!initial,back=host.querySelector('.collection-cinema__sticky'),retiring=new Set();
 if(inline)host.classList.add('has-flavour-stage');
 function fit(){if(!inline)return;const y=host.getBoundingClientRect().top,top=Math.max(0,80-y);host.style.setProperty('--scene-top',`${top}px`);const height=Math.max(560,innerHeight-Math.max(80,y));host.style.setProperty('--scene-height',`${height}px`);host.style.setProperty('--scene-extent',`${top+height}px`);}
 fit();scope.on(window,'resize',fit);
 function dispose(entry){if(!entry)return;clearTimeout(entry.timer);clearTimeout(entry.deadline);entry.scope.dispose();entry.panel.remove();retiring.delete(entry);}
 function retire(entry){if(!entry)return;entry.smoke.cancel();clearTimeout(entry.timer);entry.panel.dataset.sceneState='leaving';entry.panel.inert=true;retiring.add(entry);entry.timer=setTimeout(()=>dispose(entry),quiet()?0:750);}
 function close(){dispose(pending);pending=null;retire(current);current=null;host.dataset.revealOpen='false';host.dataset.scenePreparing='false';if(back)back.inert=false;host.dispatchEvent(new Event('ehf-reveal-closed'));origin?.focus({preventScroll:true});}
 function activate(entry){
  if(scope.disposed||entry!==pending)return;
  clearTimeout(entry.deadline);pending=null;retire(current);current=entry;
  host.dataset.scenePreparing='false';host.dataset.revealOpen='true';if(back)back.inert=true;
  delete entry.panel.dataset.directLoading;entry.panel.dataset.sceneState='active';
  entry.panel.inert=false;entry.panel.setAttribute('aria-busy','false');
  const enter=()=>{
   if(current!==entry||entry.scope.disposed)return;
   entry.entered=true;
   entry.viewer.dispatchEvent(new Event('ehf-scene-entered'));
   if(!entry.panel.contains(document.activeElement))entry.panel.querySelector('h1,h2')?.focus({preventScroll:true});
  };
  if(!entry.smoke.play(vapeCopy[entry.viewer.dataset.initialFlavour],{done:enter}))
   entry.timer=setTimeout(enter,quiet()?0:720);
 }
 function attach(panel){const child=createPageScope(),viewer=panel.querySelector('[data-model-flow]'),entry={panel,scope:child,viewer,timer:0,deadline:0,modelReady:false,artReady:false};viewer.dataset.sceneManaged='true';viewer.dataset.waitForEntrance='true';panel.dataset.sceneState='pending';panel.inert=!panel.hasAttribute('data-direct-loading');panel.setAttribute('aria-busy','true');pending=entry;
  const art=panel.querySelector('.product-reveal__fruit');Promise.resolve(art?.decode?.()).catch(()=>{}).then(()=>{entry.artReady=true;if(entry.modelReady)activate(entry);});
  child.on(viewer,'ehf-model-ready',()=>{entry.modelReady=true;if(current===entry){if(entry.entered)viewer.dispatchEvent(new Event('ehf-scene-entered'));}else if(entry.artReady)activate(entry);});child.on(viewer,'ehf-model-failed',()=>activate(entry));
  child.on(panel.querySelector('[data-reveal-close]'),'click',e=>{e.preventDefault();close();});
  panel.dataset.scenePaused=host.dataset.scenePaused||'false';const motionButton=panel.querySelector('[data-scene-motion]');motionButton.setAttribute('aria-pressed',panel.dataset.scenePaused);motionButton.setAttribute('aria-label',panel.dataset.scenePaused==='true'?'Resume liquid background':'Pause liquid background');
  const bounds=panel.getBoundingClientRect();
  let visible=bounds.bottom>0&&bounds.top<innerHeight;
  entry.smoke=createProductSmoke(panel,child,{allowed:()=>visible&&!quiet()&&panel.dataset.scenePaused!=='true'});
  entry.smoke.prepare();
  child.observe(new IntersectionObserver(([intersection])=>{
   visible=intersection.isIntersecting;
   if(!visible)entry.smoke.finish();
  }),panel);
  child.on(panel,'focusin',()=>entry.smoke.finish());
  panel.querySelectorAll('[data-scene-flavour]').forEach(button=>child.on(button,'click',()=>show(button.dataset.sceneFlavour)));
  child.on(panel.querySelector('[data-scene-motion]'),'click',e=>{const button=e.currentTarget,paused=panel.dataset.scenePaused!=='true';host.dataset.scenePaused=panel.dataset.scenePaused=String(paused);if(paused)entry.smoke.finish();button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'Resume liquid background':'Pause liquid background');viewer.dispatchEvent(new CustomEvent('ehf-scene-pause',{detail:{paused}}));});
  entry.deadline=setTimeout(()=>{if(pending===entry)activate(entry);},7000);mountBarViewer(viewer,child);return entry;
 }
 function show(id){if(!revealEditions[id]||current?.viewer.dataset.initialFlavour===id&&!pending)return;dispose(pending);pending=null;[...retiring].forEach(dispose);if(!current)fit();host.dataset.scenePreparing='true';host.dataset.revealOpen='true';host.dispatchEvent(new Event('ehf-reveal-open'));const holder=document.createElement('div');holder.innerHTML=productReveal(id,{direct:!inline});const panel=holder.firstElementChild;if(inline)panel.dataset.inlineScene='true';else if(!current)panel.dataset.directLoading='true';host.append(panel);attach(panel);}
 if(initial){host.dataset.revealOpen='true';initial.dataset.directLoading='true';attach(initial);}
 if(inline)scope.on(host,'click',event=>{const link=event.target.closest('a[data-cinema-object],a[data-cinema-link]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const url=new URL(link.href,location.href),match=Object.entries(revealEditions).find(([,e])=>url.pathname.endsWith(`/${e.slug}.html`));if(!match)return;event.preventDefault();origin=link;show(match[0]);});
 scope.on(document,'keydown',e=>{if(e.key==='Escape'&&inline&&(current||pending)){e.preventDefault();close();}});
 scope.cleanup(()=>{dispose(pending);dispose(current);[...retiring].forEach(dispose);});
}

