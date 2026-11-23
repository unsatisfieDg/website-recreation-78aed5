import {editions,findEdition,editionURL} from './editions.js?v=cbe2b6b94c45';
const mod=(n,d)=>((n%d)+d)%d;
const ease=t=>1-Math.pow(1-t,4);
export const editionAt=phase=>mod(Math.round(phase),editions.length);
export function editionPlacement(index,phase,width,height){
 const phone=width<700,r=mod(phase-index+2,4)-2,space=width*(phone?.83:.40),size=Math.min(phone?width*.78:width*.34,phone?420:540);
 return {x:width*(phone?.52:.58)+r*space,y:height*(phone?.45:.46)-r*height*(phone?.15:.28),size,scale:Math.max(.50,1+r*.14),yaw:-18+r*8,tilt:-12+r*3,relative:r};
}
export const nearestEditionPhase=(phase,index)=>phase+mod(index-phase+2,4)-2;
export function initEditionGalleries(scope){
 // Existing links retain a destination after the new, separate flavour pages launch.
 if(location.pathname.endsWith('/vapes.html')){const e=findEdition(new URLSearchParams(location.search).get('flavour'));if(e){location.replace(editionURL(e)+(location.hash==='#vape-study'?'#vape-study':''));return;}}
 document.querySelectorAll('[data-edition-gallery]').forEach(root=>mountGallery(root,scope));
 const legacy=document.querySelector('[data-legacy-vape-study]');
 if(legacy){const id=new URLSearchParams(location.search).get('flavour');legacy.hidden=!['berry-blast','melon-wave'].includes(id);}
}
function mountGallery(root,scope){
 const stage=root.querySelector('[data-edition-stage]'),items=[...root.querySelectorAll('[data-edition-item]')],toggle=root.querySelector('[data-edition-pause]'),status=root.querySelector('[data-edition-status]'),data=root.querySelector('[data-edition-data]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let phase=0,width=0,height=0,frame=0,last=0,visible=false,paused=false,hover=null,focused=false,glide=null,drag=null,selected=-1,settle=0,suppressClick=0;
 let models=null,modelPromise=null,pointer={x:0,y:0},modelTime=0,lastModelFrame=0;
 const motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off');
 function select(i,announce=false){
  if(i===selected)return;selected=i;const e=editions[i];
  root.dataset.galleryActive=e.slug;root.querySelector('[data-edition-title]').textContent=e.name;root.querySelector('[data-edition-number]').textContent=`0${i+1} / 04`;root.querySelector('[data-edition-finish]').textContent=e.finish;
  root.querySelector('[data-edition-phrase]').textContent=e.phrase;const link=root.querySelector('[data-edition-link]');link.href=editionURL(e);link.firstChild.textContent=`Discover ${e.name}`;
  root.querySelectorAll('[data-edition-direct]').forEach((a,j)=>{if(i===j)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
  items.forEach((a,j)=>a.dataset.active=String(j===i));
  if(motion())data.animate([{opacity:.25,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,easing:'cubic-bezier(.16,1,.3,1)'});
  if(announce)status.textContent=`${e.name}, edition ${i+1} of 4.`;
 }
 function draw(now=performance.now(),force=false){
  if(!width||!height)return;const placements=items.map((item,i)=>{const p=editionPlacement(i,phase,width,height);item.style.width=`${p.size}px`;item.style.height=`${p.size*702/589}px`;item.style.transform=`translate3d(${p.x-p.size/2}px,${p.y-p.size*702/589/2}px,0) rotateY(${p.yaw}deg) rotateZ(${p.tilt}deg) scale(${p.scale})`;item.style.zIndex=String(10+Math.round(p.relative*2));return p;});
  if(models&&visible&&!document.hidden&&(force||now-lastModelFrame>=15)){models.draw(placements,width,height,{time:modelTime,motion:motion()&&!paused,hover,pointer});lastModelFrame=now;}
  root.dataset.galleryPhase=phase.toFixed(4);select(hover===null?(glide?glide.index:editionAt(phase)):hover);root.dataset.galleryReady='true';
 }
 function sync(){
  cancelAnimationFrame(frame);frame=0;last=0;const running=visible&&!document.hidden&&motion()&&!paused&&hover===null&&!focused&&!drag;
  toggle.querySelector('[data-edition-pause-symbol]').setAttribute('d',paused?'M8 5l11 7-11 7Z':'M9 6v12M15 6v12');toggle.disabled=!motion();toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',!motion()?'Automatic movement disabled':paused?'Play edition conveyor':'Pause edition conveyor');root.dataset.galleryState=running?'moving':'paused';
  if(visible&&!document.hidden&&(running||glide||(models&&motion()&&!paused&&hover!==null)))frame=requestAnimationFrame(tick);
  draw(performance.now(),true);
 }
 function tick(now){
  frame=0;if(scope.disposed||!visible||document.hidden)return;const dt=last?Math.min(40,now-last):0;last=now;
  if(glide){const t=Math.min(1,(now-glide.start)/glide.duration);phase=glide.from+(glide.to-glide.from)*ease(t);if(t===1)glide=null;}
  else if(motion()&&!paused&&hover===null&&!focused&&!drag&&now>=settle)phase=mod(phase+dt/7200,4);
  if(motion()&&!paused)modelTime+=dt;
  draw(now);if(glide||(motion()&&!paused&&((hover===null&&!focused&&!drag)||(models&&hover!==null))))frame=requestAnimationFrame(tick);else sync();
 }
 function go(i){
  hover=null;const to=nearestEditionPhase(phase,mod(i,4));settle=performance.now()+6500;
  if(motion())glide={from:phase,to,index:mod(i,4),start:performance.now(),duration:850};else{phase=to;glide=null;draw();}
  select(mod(i,4),true);sync();
 }
 scope.on(toggle,'click',()=>{paused=!paused;sync();});
 root.querySelectorAll('[data-edition-step]').forEach(b=>scope.on(b,'click',()=>go((glide?.index??editionAt(phase))+Number(b.dataset.editionStep))));
 items.forEach((item,i)=>{scope.on(item,'pointerenter',e=>{if(e.pointerType==='mouse'){hover=i;draw();sync();}});scope.on(item,'pointerleave',()=>{hover=null;draw();sync();});});
 items.forEach(item=>scope.on(item,'pointermove',e=>{if(drag||e.pointerType!=='mouse')return;const r=item.getBoundingClientRect();pointer={x:Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),y:Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))};if(!motion())draw(performance.now(),true);}));
 scope.on(stage,'focusin',e=>{focused=e.target!==stage;if(focused){const i=Number(e.target.closest('[data-edition-item]')?.dataset.editionItem);if(Number.isInteger(i))go(i);}sync();});
 scope.on(stage,'focusout',()=>{focused=false;sync();});
 scope.on(stage,'keydown',e=>{if(e.target!==stage)return;if(!['ArrowLeft','ArrowRight','Home','End',' ','Enter'].includes(e.key))return;e.preventDefault();if(e.key==='Enter'){location.assign(editionURL(editions[editionAt(phase)]));return;}if(e.key===' '){paused=!paused;sync();return;}go(e.key==='Home'?0:e.key==='End'?3:editionAt(phase)+(e.key==='ArrowRight'?1:-1));});
 scope.on(stage,'pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,start:phase,moved:false,pointer:e.pointerId};glide=null;if(e.pointerType==='mouse')e.preventDefault();sync();});
 scope.on(stage,'pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.abs(dy)>Math.abs(dx)+5){drag=null;sync();return;}if(Math.abs(dx)>6){drag.moved=true;stage.setPointerCapture(e.pointerId);hover=null;phase=drag.start+dx/(width*(width<700?.83:.40));draw();}});
 function release(e){if(!drag)return;const moved=drag.moved;drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(moved){suppressClick=performance.now()+350;go(editionAt(phase));}else sync();}
 scope.on(stage,'pointerup',release);scope.on(stage,'pointercancel',()=>{drag=null;sync();});scope.on(stage,'click',e=>{if(performance.now()<suppressClick)e.preventDefault();});
 scope.own(new ResizeObserver(()=>{width=stage.clientWidth;height=stage.clientHeight;draw();})).observe(stage);
 scope.own(new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)glide=null;sync();},{threshold:.05})).observe(stage);
 const preload=scope.own(new IntersectionObserver(entries=>{if(entries[0].isIntersecting){items.forEach(a=>a.querySelector('img').loading='eager');if(!modelPromise)modelPromise=import('./edition-models.js?v=902645d2dd95').then(m=>m.createEditionModels({stage,items,editions,scope,invalidate:()=>{draw(performance.now(),true);sync();}})).then(engine=>{if(scope.disposed)return;models=engine;draw(performance.now(),true);sync();}).catch(()=>{stage.dataset.gallery3d='fallback';});preload.disconnect();}},{rootMargin:'350px'}));preload.observe(root);
 scope.on(reduced,'change',()=>{glide=null;draw();sync();});scope.on(document,'visibilitychange',sync);scope.own(new MutationObserver(()=>{if(!motion())glide=null;draw();sync();})).observe(document.body,{attributes:true,attributeFilter:['class']});
 scope.cleanup(()=>cancelAnimationFrame(frame));width=stage.clientWidth;height=stage.clientHeight;draw();
}
