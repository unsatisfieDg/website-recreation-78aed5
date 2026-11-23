import {createConveyorMotor,wrapConveyor} from './conveyor.js?v=155bee2c4a86';
import {findVariant,vapeVariants} from './vape-variants.js?v=2aa87c105d21';

export function runwayPosition(index,itemWidth,bandWidth,cycle,gap=0){return wrapConveyor(index*(itemWidth+gap)+itemWidth/2-bandWidth/2,cycle);}
export function auraPoint(clientX,clientY,rect){return {x:Math.max(0,Math.min(rect.width,clientX-rect.left)),y:Math.max(0,Math.min(rect.height,clientY-rect.top))};}
export function atmosphereCanPlay({visible,active,fading=false,motion=true,hidden=false,inspecting=false,failed=false}){return visible&&(active||fading)&&motion&&!hidden&&!inspecting&&!failed;}
export function initPremiumRanges(scope){
 document.querySelectorAll('[data-range-scene]').forEach(root=>{
  mountAura(root,scope);
  root.querySelectorAll('[data-diagonal-runway]').forEach(runway=>mountRunway(root,runway,scope));
 });
}
function mountAura(root,scope){
 const film=root.querySelector('[data-range-film]'),toggle=root.querySelector('[data-aura-toggle]');if(!film||!toggle)return;
 let visible=false,hovered=false,focused=false,pinned=false,loading=false,failed=false,frame=0,fadeTimer=0,focusTimer=0,point=null,fadeUntil=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off');
 function drawPoint(){frame=0;if(!point||scope.disposed)return;const p=auraPoint(point.x,point.y,root.getBoundingClientRect());root.style.setProperty('--aura-x',`${p.x}px`);root.style.setProperty('--aura-y',`${p.y}px`);}
 function requestPoint(){if(!frame)frame=requestAnimationFrame(drawPoint);}
 function sync(){
  const active=visible&&(hovered||focused||pinned)&&!document.hidden;
  const before=root.dataset.auraActive==='true';root.dataset.auraActive=String(active);
  toggle.setAttribute('aria-pressed',String(pinned));toggle.setAttribute('aria-label',pinned?'Release the psychedelic atmosphere':'Keep the psychedelic atmosphere visible');
  if(before&&!active){fadeUntil=performance.now()+1100;clearTimeout(fadeTimer);fadeTimer=setTimeout(sync,1150);}
  const running=!scope.disposed&&atmosphereCanPlay({visible,active,fading:performance.now()<fadeUntil,motion:motion(),hidden:document.hidden,failed,inspecting:Boolean(root.querySelector('[data-model-interacting="true"], [data-model-focus]'))});
  if(!running){film.pause();return;}
  if(!film.src){film.src=film.dataset.src;film.load();}
  if(loading||!film.paused)return;loading=true;
  film.play().catch(()=>{}).finally(()=>{loading=false;if(scope.disposed||!visible||document.hidden||!motion())film.pause();});
 }
 scope.on(root,'pointerenter',event=>{if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return;hovered=true;point={x:event.clientX,y:event.clientY};requestPoint();sync();});
 scope.on(root,'pointermove',event=>{if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return;point={x:event.clientX,y:event.clientY};requestPoint();});
 scope.on(root,'pointerleave',()=>{hovered=false;sync();});
 scope.on(root,'focusin',event=>{focused=event.target.matches(':focus-visible');if(focused){const rect=event.target.getBoundingClientRect();point={x:rect.left+rect.width/2,y:rect.top+rect.height/2};requestPoint();}sync();});
 scope.on(root,'focusout',()=>{clearTimeout(focusTimer);focusTimer=setTimeout(()=>{focused=root.contains(document.activeElement)&&document.activeElement.matches(':focus-visible');sync();},0);});
 scope.on(toggle,'click',()=>{pinned=!pinned;if(pinned&&!point){const rect=root.getBoundingClientRect();point={x:rect.left+rect.width*.5,y:Math.max(100,Math.min(innerHeight*.5,rect.top+rect.height*.5))};requestPoint();}sync();});
 scope.on(film,'playing',()=>root.dataset.filmReady='true');scope.on(film,'error',()=>{failed=true;film.hidden=true;});
 scope.on(root,'ehf-model-motion',sync);scope.on(document,'visibilitychange',sync);scope.on(reduced,'change',sync);
 scope.on(window,'scroll',()=>{if(hovered&&point)requestPoint();},{passive:true});
 scope.own(new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.02})).observe(root);
 scope.own(new MutationObserver(sync)).observe(document.body,{attributes:true,attributeFilter:['class']});
 scope.cleanup(()=>{cancelAnimationFrame(frame);clearTimeout(fadeTimer);clearTimeout(focusTimer);film.pause();film.removeAttribute('src');film.load();});
 root.dataset.auraActive='false';
}
function mountRunway(scene,root,scope){
 const viewport=root.querySelector('[data-runway-window]'),band=root.querySelector('[data-runway-band]'),track=root.querySelector('[data-runway-track]'),group=root.querySelector('[data-runway-group]'),toggle=root.querySelector('[data-runway-toggle]'),status=root.querySelector('[data-runway-status]');
 const inspector=scene.querySelector('[data-range-inspector]'),home=root.dataset.runwayHome==='true',reduced=matchMedia('(prefers-reduced-motion: reduce)'),motor=createConveyorMotor(track,62);
 let cycle=0,position=0,visible=false,hovered=false,focused=false,paused=false,glide=null,settle=0,timer=0,current=findVariant(new URLSearchParams(location.search).get('flavour')).id;
 const motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off')&&!document.hidden;
 if(inspector){const explicit=vapeVariants.some(v=>v.id===new URLSearchParams(location.search).get('flavour'))||location.hash==='#vape-study';inspector.hidden=!explicit;}
 function render(){track.style.transform=`translate3d(${-position}px,0,0)`;}
 function freeze(){const actual=motor.pause();if(actual!==null){position=actual;render();}}
 function sync(){
  clearTimeout(timer);timer=0;const running=visible&&motion()&&!paused&&!hovered&&!focused&&performance.now()>=settle&&!glide;
  toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',`${paused?'Play':'Pause'} diagonal gallery`);root.dataset.runwayState=running?'moving':'paused';
  if(running)motor.start(cycle,position);else freeze();
  if(visible&&motion()&&!paused&&!hovered&&!focused&&settle>performance.now())timer=setTimeout(sync,settle-performance.now()+20);
 }
 function mark(id){current=findVariant(id).id;root.querySelectorAll('[data-runway-choice]').forEach(link=>{const active=link.dataset.runwayChoice===current;link.closest('[data-runway-item]').dataset.current=String(active);if(active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});}
 function centre(id,{animate=true}={}){
  freeze();glide?.cancel();glide=null;const i=vapeVariants.findIndex(v=>v.id===id);if(i<0||!cycle)return;
  const item=group.children[i],target=runwayPosition(i,parseFloat(getComputedStyle(item).width),band.clientWidth,cycle,parseFloat(getComputedStyle(group).gap)||0);let distance=target-position;if(distance>cycle/2)distance-=cycle;if(distance<-cycle/2)distance+=cycle;
  settle=performance.now()+2200;
  if(animate&&motion()){
   const start=position;glide=track.animate([{transform:`translate3d(${-start}px,0,0)`},{transform:`translate3d(${-(start+distance)}px,0,0)`}],{duration:700,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'});
   const thisGlide=glide;thisGlide.onfinish=()=>{if(scope.disposed||glide!==thisGlide)return;position=target;render();thisGlide.cancel();glide=null;sync();};
  }else{position=target;render();}
  sync();
 }
 function resize(){
  const width=parseFloat(getComputedStyle(group).width)||group.offsetWidth;if(!width||Math.abs(width-cycle)<.5)return;freeze();cycle=width;centre(current,{animate:false});sync();
 }
 function inspect(id){
  if(!inspector)return;inspector.hidden=false;mark(id);status.textContent=`${findVariant(id).name}. Opening the three-dimensional study.`;
  scene.dispatchEvent(new CustomEvent('ehf-select-flavour',{detail:{id}}));
 }
 scope.on(root,'click',event=>{
  const link=event.target.closest('[data-runway-choice]');if(!link||home||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();inspect(link.dataset.runwayChoice);
 });
 scope.on(scene,'ehf-flavour-changed',event=>mark(event.detail.id));
 scope.on(scene.querySelector('[data-inspector-close]'),'click',()=>{
  inspector.hidden=true;centre(current,{animate:false});root.scrollIntoView({block:'start',behavior:motion()?'smooth':'auto'});
  const links=[...root.querySelectorAll(`[data-runway-choice="${current}"]`)];const link=links.sort((a,b)=>Math.abs(a.getBoundingClientRect().left-innerWidth/2)-Math.abs(b.getBoundingClientRect().left-innerWidth/2))[0];link?.focus({preventScroll:true});
 });
 scope.on(toggle,'click',()=>{paused=!paused;sync();});
 root.querySelectorAll('[data-runway-step]').forEach(button=>scope.on(button,'click',()=>{const i=vapeVariants.findIndex(v=>v.id===current),next=(i+Number(button.dataset.runwayStep)+6)%6;mark(vapeVariants[next].id);centre(current);status.textContent=findVariant(current).name;}));
 root.querySelectorAll('[data-runway-item]').forEach(item=>{
  scope.on(item,'pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;sync();}});
  scope.on(item,'pointerleave',()=>{hovered=false;sync();});
 });
 scope.on(viewport,'focusin',event=>{focused=event.target.matches(':focus-visible');if(focused){const link=event.target.closest('[data-runway-choice]');if(link){mark(link.dataset.runwayChoice);centre(current,{animate:false});}}sync();});
 scope.on(viewport,'focusout',()=>{focused=false;sync();});
 scope.own(new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;root.dataset.runwayVisible=String(visible);sync();},{threshold:.02})).observe(viewport);
 scope.own(new ResizeObserver(resize)).observe(band);
 scope.on(document,'visibilitychange',sync);scope.on(reduced,'change',sync);
 scope.own(new MutationObserver(sync)).observe(document.body,{attributes:true,attributeFilter:['class']});
 scope.cleanup(()=>{clearTimeout(timer);glide?.cancel();motor.pause();});
 mark(current);resize();
}
