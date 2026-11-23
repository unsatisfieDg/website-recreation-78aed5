import {createPageScope} from './page-scope.js?v=5fbc86d3ec7f';

// Each repeat is identical. Moving the viewport left makes the products drift right.
export function wrapConveyor(position,cycle){
 if(cycle<=0)return 0;
 return ((position%cycle)+cycle)%cycle;
}
export function advanceConveyor(position,elapsed,cycle,speed=48){
 return wrapConveyor(position-Math.min(elapsed,64)*speed/1000,cycle);
}

// The browser's compositor moves the belt between interactions, without a JS
// callback and DOM mutation on every display frame. Pause samples its true phase.
export function createConveyorMotor(track,speed=48){
 let animation=null,cycle=0;
 return {
  start(length,position){
   if(animation)return true;
   if(typeof track.animate!=='function'||length<=0)return false;
   cycle=length;
   animation=track.animate([{transform:`translate3d(${-cycle}px,0,0)`},{transform:'translate3d(0px,0,0)'}],{duration:cycle/speed*1000,iterations:Infinity,easing:'linear'});
   animation.currentTime=(cycle-wrapConveyor(position,cycle))/speed*1000;
   return true;
  },
  pause(){
   if(!animation)return null;
   const time=Number(animation.currentTime)||0,position=wrapConveyor(cycle-time*speed/1000,cycle);
   animation.cancel();animation=null;return position;
  }
 };
}

export function initConveyor(scope=createPageScope()){
 document.querySelectorAll('[data-conveyor]').forEach(section=>initBelt(section,scope));
}
function initBelt(section,scope){
 const viewport=section.querySelector('[data-belt-window]'),track=section.querySelector('[data-belt-track]');
 const group=section.querySelector('[data-belt-group]'),video=section.querySelector('[data-conveyor-video]');
 const toggle=section.querySelector('[data-belt-toggle]'),caption=section.querySelector('[data-belt-caption]');
 const items=[...group.children],keyOf=card=>card.dataset.beltItem||card.dataset.study;
 const beltName=section.dataset.beltName||'product conveyor';
 const speed=Math.max(1,Math.min(80,Number(section.dataset.beltSpeed)||48));
 const motor=createConveyorMotor(track,speed);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let cycle=0,position=0,last=0,frame=0,inView=false,focused=false,manualPause=false,interacting=false,loadingVideo=false;
 let settleAt=0,glide=null,velocity=0,reading=false,pointerReading=false,resumeTimer=0;
 const motionEnabled=()=>!reduced.matches&&!document.body.classList.contains('motion-off')&&!document.documentElement?.classList.contains('cinema-pending');
 const allowed=()=>motionEnabled()&&!document.hidden;
 let wasMotionEnabled=motionEnabled();
 const isTopicBelt=section.id==='knowledge';
 // An opened product may travel with its labels. Hold only while it animates,
 // or while an information answer is being read, so products cannot stop forever.
 const opened=()=>Boolean(section.querySelector('[data-playing="true"], details[open]'));
 const paused=()=>manualPause||focused||interacting||reading||pointerReading||performance.now()<settleAt;
 function updateUI(){
  if(toggle.getAttribute('aria-pressed')!==String(manualPause))toggle.setAttribute('aria-pressed',String(manualPause));
  toggle.setAttribute('aria-label',`${manualPause?'Play':'Pause'} ${beltName}`);
  section.dataset.beltState=!allowed()?'still':paused()?'paused':'moving';
  caption.textContent=!allowed()?'EXPLORE THE DETAILS':paused()?'TAKE A CLOSER LOOK':'DRIFTING RIGHT';syncLoop();
 }
 function syncVideo(){
  if(!video)return;
  if(!inView||!allowed()||manualPause){video.pause();return;}
  if(!video.querySelector('source').src){const source=video.querySelector('source');source.src=source.dataset.src;video.load();}
  if(video.paused&&!loadingVideo){loadingVideo=true;video.play().catch(()=>{}).finally(()=>{loadingVideo=false;if(scope.disposed||!inView||!allowed()||manualPause)video.pause();});}
 }
 function render(){track.style.transform=`translate3d(${-position}px,0,0)`;section.dataset.beltPosition=position.toFixed(2);}
 function freeze(){const actual=motor.pause();if(actual!==null){position=actual;render();}}
 function resize(){
  const next=group.getBoundingClientRect().width;if(!next)return;
  if(cycle&&Math.abs(next-cycle)<.1)return;
  freeze();
  position=cycle?wrapConveyor(position/cycle*next,next):0;cycle=next;glide=null;render();
  syncLoop();
 }
 function wake(){if(!frame)frame=requestAnimationFrame(tick);}
 function syncLoop(){
  clearTimeout(resumeTimer);resumeTimer=0;
  if(!inView||!allowed()||paused()&&!glide){
   freeze();cancelAnimationFrame(frame);frame=0;last=0;velocity=0;
   if(inView&&allowed()&&!manualPause&&settleAt>performance.now())resumeTimer=setTimeout(updateUI,settleAt-performance.now()+16);
   return;
  }
  if(!glide&&motor.start(cycle,position)){section.dataset.beltEngine='compositor';cancelAnimationFrame(frame);frame=0;last=0;return;}
  freeze();section.dataset.beltEngine='frame';wake();
 }
 function tick(now){
  frame=0;if(!inView||!allowed())return;
  const elapsed=last?now-last:0;last=now;
  if(inView&&!document.hidden){
   if(glide){
    const t=Math.min(1,(now-glide.started)/glide.duration),ease=t*t*(3-2*t);
    position=wrapConveyor(glide.from+(glide.to-glide.from)*ease,cycle);render();
    if(t===1)glide=null;
   }else if(allowed()&&!paused()){
    velocity+= (speed-velocity)*(1-Math.exp(-Math.min(elapsed,64)/150));
    position=advanceConveyor(position,elapsed,cycle,velocity);render();
   }
   if(paused())velocity=0;
   const state=!allowed()?'still':paused()?'paused':'moving';if(section.dataset.beltState!==state)updateUI();
  }
  syncLoop();
 }
 function closeAnswers(){section.querySelectorAll('details[open]').forEach(answer=>{answer.open=false;});}
 function moveTo(value,closeDetails=false){
  freeze();
  if(closeDetails)closeAnswers();
  const target=wrapConveyor(value,cycle);let distance=target-position;
  if(distance>cycle/2)distance-=cycle;if(distance<-cycle/2)distance+=cycle;
  if(allowed())glide={from:position,to:position+distance,started:performance.now(),duration:650};
  else{position=target;glide=null;render();}
  settleAt=performance.now()+2400;updateUI();
 }
 function show(id,focus=false,closeDetails=false){
  const card=items.find(item=>keyOf(item)===id);if(!card)return;
  const x=card.offsetLeft-group.offsetLeft-(viewport.clientWidth-card.offsetWidth)/2;
  moveTo(x,closeDetails);
  if(focus)card.querySelector('[data-study-stage], summary, a, button')?.focus({preventScroll:true});
 }
 scope.on(toggle,'click',()=>{manualPause=!manualPause;syncVideo();updateUI();});
 // A topic should stay under the pointer long enough to read and click.
 if(isTopicBelt){
  scope.on(viewport,'pointerenter',event=>{if(event.pointerType==='mouse'){pointerReading=true;updateUI();}});
  scope.on(viewport,'pointerleave',()=>{pointerReading=false;updateUI();});
 }
 
 scope.on(viewport,'focusin',event=>{focused=event.target.matches(':focus-visible');if(focused){const card=event.target.closest('[data-study], [data-belt-card]');if(card)show(keyOf(card));}updateUI();});
 scope.on(viewport,'focusout',()=>{focused=viewport.contains(document.activeElement)&&document.activeElement.matches(':focus-visible');updateUI();});
 // Existing page anchors now select their matching panel within the relevant belt.
 scope.on(document,'click',event=>{
  const link=event.target.closest('a[href]');if(!link)return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin||url.pathname!==location.pathname)return;
  const id=url.hash.replace(/^#(?:form-)?/,'');if(!items.some(item=>keyOf(item)===id))return;
  event.preventDefault();
  if(isTopicBelt)manualPause=true;
  history.replaceState(history.state,'',url);
  section.scrollIntoView({behavior:allowed()?'smooth':'auto',block:'start'});
  show(id,false,true);
 });
 section.querySelectorAll('[data-belt-step]').forEach(button=>scope.on(button,'click',()=>{
  freeze();
  moveTo(position+Number(button.dataset.beltStep)*cycle/items.length,true);
 }));
 let drag=null,suppressClick=false;
 scope.on(viewport,'pointerdown',event=>{
  if(event.button!==0||event.target.closest('a,summary,input,select,textarea'))return;
  freeze();
  suppressClick=false;drag={id:event.pointerId,x:event.clientX,y:event.clientY,start:position,moving:false};interacting=true;glide=null;updateUI();
 });
 scope.on(viewport,'pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moving&&Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)*1.2){drag.moving=true;closeAnswers();viewport.setPointerCapture(event.pointerId);}
  if(drag.moving){event.preventDefault();position=wrapConveyor(drag.start-dx,cycle);render();}
 });
 const endDrag=event=>{
  if(!drag||event.pointerId!==drag.id)return;
  suppressClick=drag.moving;if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
  drag=null;interacting=false;settleAt=performance.now()+1400;updateUI();
 };
 scope.on(window,'pointerup',endDrag);scope.on(window,'pointercancel',endDrag);
 scope.on(viewport,'click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
 scope.on(viewport,'keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();freeze();moveTo(position+(event.key==='ArrowRight'?1:-1)*cycle/items.length,true);
 });
 scope.own(new MutationObserver(()=>{reading=opened();updateUI();})).observe(section,{attributes:true,subtree:true,attributeFilter:['aria-pressed','data-playing','open']});
 scope.own(new ResizeObserver(resize)).observe(viewport);
 scope.own(new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;last=0;syncVideo();syncLoop();},{rootMargin:'150px'})).observe(section);
 const syncPlayer=()=>document.body.classList.toggle('viewing-conveyor',Boolean(document.querySelector('[data-conveyor][data-belt-visible="true"]')));
 scope.own(new IntersectionObserver(entries=>{section.dataset.beltVisible=String(entries[0].isIntersecting);syncPlayer();},{rootMargin:'-80px 0px -120px 0px'})).observe(section);
 // Keep only on-screen product controls in the keyboard sequence; either loop copy is usable.
 const cards=[...section.querySelectorAll('[data-study], [data-belt-card]')];
 const visibleCards=scope.own(new IntersectionObserver(entries=>entries.forEach(entry=>{
  entry.target.querySelectorAll('button,a,summary,input,select,textarea').forEach(control=>control.tabIndex=entry.intersectionRatio>.25?0:-1);
 }),{root:viewport,threshold:[0,.25,.5]}));cards.forEach(card=>visibleCards.observe(card));
 scope.on(document,'visibilitychange',()=>{last=0;syncVideo();updateUI();});
 const onMotion=()=>{
  const enabled=motionEnabled();
  if(enabled===wasMotionEnabled)return;
  wasMotionEnabled=enabled;
  if(!enabled&&glide){position=wrapConveyor(glide.to,cycle);glide=null;render();}
  last=0;syncVideo();updateUI();
 };
 scope.on(reduced,'change',onMotion);
 const motionObserver=scope.own(new MutationObserver(onMotion));motionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});motionObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 scope.cleanup(()=>{cancelAnimationFrame(frame);clearTimeout(resumeTimer);motor.pause();video?.pause();track.style.transform='';delete section.dataset.beltVisible;syncPlayer();});
 section.classList.add('conveyor-ready');resize();
 const initial=location.hash.replace(/^#(?:form-)?/,'');
 const initialCard=items.find(item=>keyOf(item)===initial);
 if(initialCard){
  if(isTopicBelt)manualPause=true;
  position=wrapConveyor(initialCard.offsetLeft-group.offsetLeft-(viewport.clientWidth-initialCard.offsetWidth)/2,cycle);
  render();
 }
 reading=opened();updateUI();
}
