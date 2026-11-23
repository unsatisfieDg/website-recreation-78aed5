import {inspectionProducts,inspectionCamera} from './product-inspection-data.js?v=6d67befdec0f';
export function sceneProgress(top,height,viewport){return Math.min(1,Math.max(0,-top/Math.max(1,height-viewport)));}
const clamp=x=>Math.min(1,Math.max(0,x));
const ease=x=>{x=clamp(x);return clamp(x*x*x*(x*(x*6-15)+10));};
export function productJourney(progress){
 const p=clamp(progress),position=p<.4?ease((p-.18)/.22):1+ease((p-.6)/.22);
 return {position,active:Math.min(2,Math.round(position))};
}
export function initProductStory(scope){
 const root=document.querySelector('[data-product-story]');if(!root)return;
 const sticky=root.querySelector('.product-story-sticky'),track=root.querySelector('.pi-track'),panels=[...root.querySelectorAll('[data-pi-panel]')],nav=[...root.querySelectorAll('[data-pw-index]')],status=root.querySelector('[data-pw-status]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=0,selected=-1,manual=0,visible=false,frame=0,detailTimer=0,detailRevision=0,top=0,distance=1;
 const motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off');
 root.dataset.renderer='photographic';
 const film=root.querySelector('[data-pw-film]'),filmToggle=root.querySelector('[data-pw-film-toggle]');
 let filmPaused=false,filmLoading=false,filmFailed=false;
 function syncFilm(){
  const allowed=motion()&&selected<0&&!document.hidden&&!scope.disposed&&!filmPaused&&!filmFailed&&visible&&!document.documentElement.classList.contains('cinema-pending');
  filmToggle.disabled=!motion()||filmFailed;
  filmToggle.setAttribute('aria-pressed',String(filmPaused||!motion()));
  filmToggle.setAttribute('aria-label',filmFailed?'Background animation unavailable':!motion()?'Background motion reduced':filmPaused?'Play background animation':'Pause background animation');
  if(!allowed){film.pause();return;}
  if(!film.getAttribute('src')){film.src=film.dataset.src;film.load();}
  if(!film.paused||filmLoading)return;
  filmLoading=true;film.play().catch(()=>{}).finally(()=>{filmLoading=false;if(scope.disposed||!visible||!motion()||document.hidden||filmPaused||selected>=0)film.pause();});
 }
 scope.on(film,'playing',()=>root.dataset.filmReady='true');
 scope.on(film,'error',()=>{filmFailed=true;film.hidden=true;syncFilm();});
 scope.on(filmToggle,'click',()=>{filmPaused=!filmPaused;syncFilm();});
 function selectPart(index,{announce=true}={}){
  clearTimeout(detailTimer);const revision=++detailRevision;
  const panel=panels[active],part=inspectionProducts[active].parts[index],fromMarker=document.activeElement?.matches('[data-pi-part]');
  selected=part?index:-1;root.dataset.open=String(selected>=0);
  for(const [i,item] of panels.entries()){
   item.dataset.focused=String(i===active&&selected>=0);item.dataset.detailReady='false';item.dataset.cutaway='false';
   const caption=item.querySelector('.pi-caption');caption.inert=i===active&&selected>=0;caption.setAttribute('aria-hidden',String(caption.inert));
   const detail=item.querySelector('[data-pi-detail]');detail.hidden=i!==active||selected<0;
   item.querySelectorAll('[data-pi-part]').forEach(button=>button.setAttribute('aria-expanded',String(i===active&&Number(button.dataset.piPart)===selected)));
   item.querySelectorAll('[data-pi-cutaway]').forEach(image=>image.classList.toggle('is-current',i===active&&Number(image.dataset.piCutaway)===selected));
   const camera=inspectionCamera(i===active?part:null);
   item.querySelector('.pi-camera').style.transform=`translate3d(${camera.x}%,${camera.y}%,0) scale(${camera.scale})`;
  }
  if(part){
   const detail=panel.querySelector('[data-pi-detail]');
   detail.querySelector('[data-pi-detail-index]').textContent=`0${selected+1} / IN FOCUS`;
   detail.querySelector('[data-pi-detail-title]').textContent=part.name;
   const pairing=detail.querySelector('[data-pi-detail-pairing]');pairing.textContent=part.pairing||'';pairing.hidden=!part.pairing;
   detail.querySelector('[data-pi-detail-copy]').textContent=part.copy;
   panel.dataset.cutaway=String(Boolean(part.image));
   if(fromMarker)detail.focus({preventScroll:true});
   // Text follows the camera move; stale rapid-click reveals are discarded.
   detailTimer=setTimeout(()=>{if(!scope.disposed&&revision===detailRevision)panel.dataset.detailReady='true';},motion()?560:0);
   if(announce)status.textContent=`${part.name}. ${part.copy}`;
  }else if(announce)status.textContent='Whole product view.';
  syncFilm();
 }
 function measure(){
  const inset=parseFloat(getComputedStyle(sticky).top)||0;
  top=scrollY+root.getBoundingClientRect().top-inset;
  distance=Math.max(1,root.offsetHeight-(innerHeight-inset));requestDraw();
 }
 function draw(){
  frame=0;if(scope.disposed)return;
  const progress=motion()?clamp((scrollY-top)/distance):[0,.5,1][manual],next=productJourney(progress);
  if(active!==next.active){selectPart(-1,{announce:false});active=next.active;root.dataset.chapter=String(active);syncFilm();}
  track.style.transform=`translate3d(${-next.position*100/3}%,0,0)`;root.style.setProperty('--pw-progress',progress);
  panels.forEach((panel,i)=>{const current=i===active;panel.classList.toggle('is-current',current);panel.inert=!current;panel.setAttribute('aria-hidden',String(!current));});
  nav.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===active)));
 }
 function requestDraw(){if(visible&&!frame)frame=requestAnimationFrame(draw);}
 scope.own(new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;root.classList.toggle('ps-in-view',visible);if(visible){measure();requestDraw();}else if(frame){cancelAnimationFrame(frame);frame=0;}syncFilm();},{threshold:0})).observe(sticky);
 scope.own(new ResizeObserver(measure)).observe(document.body);
 scope.on(window,'scroll',requestDraw,{passive:true});scope.on(window,'resize',measure,{passive:true});
 scope.on(document,'visibilitychange',()=>{syncFilm();if(!document.hidden)requestDraw();});
 nav.forEach((button,index)=>scope.on(button,'click',()=>{manual=index;selectPart(-1,{announce:false});if(!motion()){draw();return;}measure();window.scrollTo({top:top+[.07,.5,.93][index]*distance,behavior:'smooth'});}));
 panels.forEach((panel,i)=>{
  panel.querySelectorAll('[data-pi-part]').forEach(button=>scope.on(button,'click',()=>{if(i===active)selectPart(Number(button.dataset.piPart));}));
  scope.on(panel.querySelector('[data-pi-next]'),'click',()=>selectPart((selected+1)%inspectionProducts[active].parts.length));
  scope.on(panel.querySelector('[data-pi-back]'),'click',()=>{const previous=selected;selectPart(-1);panel.querySelector(`[data-pi-part="${previous}"]`)?.focus({preventScroll:true});});
 });
 scope.on(root,'keydown',event=>{if(event.key==='Escape'&&selected>=0){const previous=selected;selectPart(-1);panels[active].querySelector(`[data-pi-part="${previous}"]`)?.focus({preventScroll:true});event.preventDefault();}});
 const preferenceChange=()=>{if(selected>=0)selectPart(selected,{announce:false});measure();syncFilm();};
 scope.on(reduced,'change',preferenceChange);
 scope.own(new MutationObserver(preferenceChange)).observe(document.body,{attributes:true,attributeFilter:['class']});
 scope.cleanup(()=>{clearTimeout(detailTimer);cancelAnimationFrame(frame);film.pause();film.removeAttribute('src');film.load();});
 measure();draw();
}
