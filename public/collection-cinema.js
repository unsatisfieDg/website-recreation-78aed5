import {mountProductJourney,initDirectFlavourScenes} from './product-reveal.js?v=2679d77593cc';
import {cinemaProducts} from './collection-cinema-data.js?v=bf4876d5f47b';
import {createCinematicModels} from './cinematic-models.js?v=6daa0491c776';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export const wrapCinema=(n,count)=>((n%count)+count)%count;
export const nearestCinema=(phase,index,count)=>phase+wrapCinema(index-phase+count/2,count)-count/2;
export function cinemaPlacement(index,phase,width,height,progress=0,time=0,motion=true,count=8){
 const phone=width<900,r=wrapCinema(index-phase+count/2,count)-count/2,abs=Math.abs(r),front=Math.exp(-r*r*4);
 if(!motion){const active=wrapCinema(Math.round(phase),count)===index;return {x:width*(phone?.5:.68),y:height*(phone?.38:.45),height:Math.min(height*(phone?.26:.65),600),yaw:-.14,pitch:0,tilt:-.04,depth:100,alpha:active?1:0,light:1,front:active?1:0,relative:r};}
 const size=(phone?Math.min(height*.40,Math.max(180,height*.88-360)):Math.min(height*.42,520))*Math.max(.44,1-abs*.155);
 return {x:width*.5+r*width*(phone?.56:.205),y:height*(phone?.44:.48)-abs*height*.025+Math.sin(time*.00045+index)*3,height:size,yaw:-.16-r*.25+Math.sin(time*.00025+index)*.05,pitch:.035,tilt:r*-.11-.08,depth:100-abs*30,alpha:1,light:clamp(1-abs*.28,.18,1),front,relative:r};
}
export function initCollectionCinema(scope){initDirectFlavourScenes(scope);document.querySelectorAll('[data-collection-cinema]').forEach(root=>{mountCinema(root,scope);mountProductJourney(root,scope);});}
function mountCinema(root,scope){
 const products=cinemaProducts.filter(p=>!root.hasAttribute('data-cinema-filter')||!['edibles','pre-rolls'].includes(p.id));
 const count=products.length,stage=root.querySelector('[data-cinema-stage]'),objects=[...root.querySelectorAll('[data-cinema-object]')],pause=root.querySelector('[data-cinema-pause]'),status=root.querySelector('[data-cinema-status]'),picks=[...root.querySelectorAll('[data-cinema-pick]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off');
 let engine=null,promise=null,frame=0,last=0,time=0,lastDraw=0,width=0,height=0,phase=0,selected=-1,visible=false,paused=false,focused=false,hover=false,glide=null,drag=null,suppressClick=0;
 function update(){if(!frame)frame=requestAnimationFrame(tick);}
 function select(i){if(i===selected)return;selected=i;const p=products[i];root.dataset.cinemaSelected=p.id;root.style.setProperty('--cinema-accent',p.colour);root.querySelector('[data-cinema-name]').textContent=p.name;root.querySelector('[data-cinema-category]').textContent=p.category;const link=root.querySelector('[data-cinema-link]');link.href=p.href;link.firstChild.textContent=`View ${p.name}`;picks.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));objects.forEach((a,j)=>a.dataset.active=String(j===i));}
 function measure(){const r=stage.getBoundingClientRect();width=r.width;height=r.height;update();}
 function ui(){pause.disabled=!motion();pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',!motion()?'Automatic movement disabled':paused?'Resume collection movement':'Pause collection movement');}
 function tick(now){frame=0;if(scope.disposed||!width||!height)return;const dt=last?Math.min(40,now-last):0;last=now;const r=root.getBoundingClientRect();visible=r.bottom>0&&r.top<innerHeight;
  if(!visible||document.hidden||root.dataset.revealOpen==='true'){last=0;root.dataset.cinemaState='offscreen';return;}
  if(!promise)promise=createCinematicModels({stage,items:objects,products,scope,invalidate:update}).then(e=>{engine=e;update();}).catch(()=>stage.dataset.cinema3d='fallback');
  if(glide){const t=motion()?clamp((now-glide.start)/850):1;phase=mix(glide.from,glide.to,1-Math.pow(1-t,4));if(t>=1)glide=null;}
  const auto=motion()&&!paused&&!hover&&!focused&&!drag;
  if(auto&&!glide){phase+=dt/5400;time+=dt;}
  select(glide?glide.selected:wrapCinema(Math.round(phase),count));
  const placements=products.map((_,i)=>cinemaPlacement(i,phase,width,height,0,time,motion(),count));
  objects.forEach((a,i)=>{const p=placements[i],w=p.height*(products[i].id==='edibles'?.98:products[i].id==='pre-rolls'?.82:.29);a.style.width=`${w}px`;a.style.height=`${p.height}px`;a.style.transform=`translate3d(${p.x-w/2}px,${p.y-p.height/2}px,0)`;a.style.zIndex=String(10+Math.round(p.depth));a.style.visibility=p.alpha<.02?'hidden':'visible';a.inert=p.alpha<.08||p.x+w/2<0||p.x-w/2>width;a.querySelector('img').style.transform=`rotate(${p.tilt}rad)`;});
  if(engine&&(now-lastDraw>=16||!auto)){engine.draw(placements,width,height);lastDraw=now;}
  root.dataset.cinemaPhase=phase.toFixed(4);root.dataset.cinemaState=auto?'moving':'paused';
  if(auto||glide||drag)frame=requestAnimationFrame(tick);else last=0;
 }
 function choose(i){const n=wrapCinema(i,count);select(n);glide={from:phase,to:nearestCinema(phase,n,count),selected:n,start:performance.now()};status.textContent=`${products[n].name}, ${n+1} of ${count}.`;update();}
 scope.on(window,'scroll',update,{passive:true});scope.own(new ResizeObserver(measure)).observe(stage);
 scope.own(new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible)update();else{cancelAnimationFrame(frame);frame=0;last=0;}},{threshold:0})).observe(root);
 scope.on(document,'visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;last=0;update();});scope.on(reduced,'change',()=>{ui();update();});scope.own(new MutationObserver(()=>{ui();update();})).observe(document.body,{attributes:true,attributeFilter:['class']});
 [...objects,root.querySelector('[data-cinema-link]')].filter(Boolean).forEach(a=>{scope.on(a,'pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;update();}});scope.on(a,'pointerleave',()=>{hover=false;update();});});scope.on(root,'focusin',e=>{focused=e.target.matches(':focus-visible');update();});scope.on(root,'focusout',e=>{focused=root.contains(e.relatedTarget)&&e.relatedTarget.matches(':focus-visible');update();});
 scope.on(root,'ehf-reveal-open',()=>{cancelAnimationFrame(frame);frame=0;last=0;});scope.on(root,'ehf-reveal-closed',()=>{hover=false;update();});
 scope.on(pause,'click',()=>{paused=!paused;if(!paused)focused=false;ui();update();});root.querySelectorAll('[data-cinema-step]').forEach(b=>scope.on(b,'click',()=>choose(Math.round(phase)+Number(b.dataset.cinemaStep))));picks.forEach((b,i)=>scope.on(b,'click',()=>choose(i)));
 scope.on(stage,'keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End',' '].includes(e.key))return;e.preventDefault();if(e.key===' '){paused=!paused;ui();update();}else choose(e.key==='Home'?0:e.key==='End'?count-1:Math.round(phase)+(e.key==='ArrowRight'?1:-1));});
 scope.on(stage,'pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,phase,moved:false,id:e.pointerId};glide=null;});
 scope.on(window,'pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const d=e.clientX-drag.x;if(Math.abs(d)>7){drag.moved=true;stage.classList.add('is-dragging');}if(drag.moved){phase=drag.phase-d/(width*(width<900?.56:.205));update();}});
 scope.on(window,'pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const moved=drag.moved;drag=null;stage.classList.remove('is-dragging');if(moved){suppressClick=performance.now()+350;choose(Math.round(phase));}});scope.on(window,'pointercancel',()=>{drag=null;stage.classList.remove('is-dragging');update();});scope.on(stage,'click',e=>{if(performance.now()<suppressClick){e.preventDefault();e.stopPropagation();}},{capture:true});
 scope.cleanup(()=>cancelAnimationFrame(frame));select(0);ui();measure();document.fonts.ready.then(()=>{if(!scope.disposed)measure();});
}
