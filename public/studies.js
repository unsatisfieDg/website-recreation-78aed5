import {createPageScope} from './page-scope.js?v=5fbc86d3ec7f';
import {createPouchRenderer,pouchState,stripPoint,tearEdge} from './pouch.js?v=120145103ae2';
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const portion=(p,a,b)=>smooth((p-a)/(b-a));
const mix=(a,b,p)=>a+(b-a)*p;

// Hidden animation layers must not wait on the browser's lazy-image heuristic.
// Subscribe before requesting them, and handle a previously failed image too.
function loadPiece(img){
 return new Promise((resolve,reject)=>{
  const finish=()=>{img.removeEventListener('load',loaded);img.removeEventListener('error',failed);};
  const loaded=()=>{finish();resolve();};
  const failed=()=>{finish();reject(new Error('Product artwork unavailable'));};
  img.addEventListener('load',loaded,{once:true});img.addEventListener('error',failed,{once:true});
  if(img.complete&&!img.naturalWidth)img.src=img.getAttribute('src');
  img.loading='eager';
  if(img.complete&&img.naturalWidth)loaded();
 });
}

// Shared axis and overlapping joins make the closed device one continuous silhouette.
function poseVape(p){
 const pod=portion(p,0,.57),core=portion(p,.16,.91),settle=portion(p,.06,1);
 return [
  [320,mix(338,354,settle),mix(74,69,settle),mix(0,-3,settle),1,1,4],
  [mix(320,421,core),mix(278,214,core),45,mix(0,9,core),1,portion(p,.13,.32),2],
  [mix(320,338,pod),mix(130,74,pod),mix(74,67,pod),mix(0,7,pod),1,1,6],
  [mix(320,230,core),mix(182,225,core),mix(74,76,core),mix(0,-18,core),mix(.28,.88,core),1,5]
 ];
}
const sweets=[[194,128,65,-23],[390,84,60,18],[492,205,73,-13],[143,346,65,23],[476,423,53,31],[210,469,45,-17],[277,65,36,28],[510,330,34,-24]];
const cut=Array.from({length:81},(_,i)=>[i*1.25,tearEdge(i/80)*100]);
function edgeAt(x){for(let i=1;i<cut.length;i++)if(x<=cut[i][0])return mix(cut[i-1][1],cut[i][1],(x-cut[i-1][0])/(cut[i][0]-cut[i-1][0]));return cut.at(-1)[1];}
function topSlice(a,b){const edge=[[a,edgeAt(a)+.08],...cut.filter(([x])=>x>a&&x<b).map(([x,y])=>[x,y+.08]),[b,edgeAt(b)+.08]];return `polygon(${[[a,0],[b,0],...edge.reverse()].map(([x,y])=>`${x}% ${y}%`).join(',')})`;}
const lowerPouch=`polygon(${[...cut,[100,100],[0,100]].map(([x,y])=>`${x}% ${y}%`).join(',')})`;
function poseGummies(p,ratio){
 const pouch=pouchState(p,ratio),{tear,release,relax,width,y:bagY}=pouch;
 const result=sweets.map(([x,y,w,r],i)=>{
  const t=portion(p,.48+i*.014,.87+i*.017);
  const mouth=pouch.top+ratio*width*.1175;
  const flight=(1-t)*(1-t)*(mouth+46)+2*(1-t)*t*8+t*t*y;
  const spread=t+Math.sin(Math.PI*t)*.12;
  return [mix(320,x,spread),flight,mix(w*.42,w,t),r*t+Math.sin(Math.PI*t)*(i%2?23:-23),1,portion(t,.08,.24),t>.24?13:3+i%3];
 });
 // Every pouch layer uses the same intact source, so the closed seam is invisible.
 result.push([320,bagY,width,0,1-.035*relax,1,10]);
 result.push([320,bagY,width,0,1-.035*relax,tear===1?0:1,11]);
 const front=(1-tear)*100,hingeX=pouch.left+width*front/100,hingeY=pouch.top+ratio*width*edgeAt(front)/100;
 const angle=mix(-18*tear,14,release),radians=angle*Math.PI/180;
 const dx=320-hingeX,dy=bagY-hingeY;
 const capX=hingeX+dx*Math.cos(radians)-dy*Math.sin(radians)+100*release;
 const capY=hingeY+dx*Math.sin(radians)+dy*Math.cos(radians)-80*release;
 result.push([capX,capY,width,angle,1,tear===0?0:1,15]);
 return {poses:result,front};
}
function poseRoll(p){
 const unfurl=portion(p,0,.49),lift=portion(p,.24,.93),filter=portion(p,.32,1);
 return [
  [322,mix(278,334,lift),400,mix(-10,-4,lift),mix(.08,1,unfurl),portion(p,.02,.23),2],
  [mix(338,345,lift),mix(274,180,lift),mix(313,343,lift),mix(-10,3,lift),1,portion(p,.08,.26),4],
  [mix(165,119,filter),mix(304,255,filter),mix(78,90,filter),mix(-10,-25,filter),1,portion(p,.12,.3),5],
  [320,280,420,-10,mix(1,.74,unfurl),1-portion(p,.08,.42),6]
 ];
}
const names={vapes:'Vapes',edibles:'Gummies','pre-rolls':'Pre-Rolls'};
const descriptions={vapes:'Vape opened. Mouthpiece, extract cartridge, connection collar and battery housing labelled.',edibles:'Pouch opened. Proposed fruit and hemp cultivar pairings are shown beside the gummies.','pre-rolls':'Pre-roll opened. Hemp flower, rolling paper and paper tip labelled.'};

export function initProductStudies(scope=createPageScope()){
 const sections=[...document.querySelectorAll('[data-study]')];if(!sections.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off');
 const controllers=[];scope.cleanup(()=>controllers.forEach(c=>c.stop()));
 for(const section of sections){
  const id=section.dataset.study,name=names[id],stage=section.querySelector('[data-study-stage]'),scene=section.querySelector('.study-scene'),rig=section.querySelector('.study-rig');
  const pieces=[...section.querySelectorAll('.study-piece')],status=section.querySelector('[data-study-status]');
  const annotations=section.querySelector('[data-study-annotations]'),pairingNote=section.querySelector('[data-study-pairing-note]');
  const leaders=[...section.querySelectorAll('[data-study-leader]')];
  const attached=section.querySelector('[data-part="gummy-attached-seal"] img'),released=section.querySelector('[data-part="gummy-released-seal"] img'),body=section.querySelector('[data-part="gummy-body"] img');
  let progress=0,target=0,from=0,elapsed=0,duration=0,last=0,raf=0,running=false,ratio=4/3,pouchRenderer=null;
  let ready=false,loading=null,requested=false,pendingPreload=false;
  const baseDuration=id==='edibles'?4100:id==='vapes'?2350:2650;
  scope.cleanup(()=>pouchRenderer?.dispose());
  function announce(){status.textContent=target===1?descriptions[id]:`${name} closed.`;}
  function updateButton(){stage.setAttribute('aria-label',`${target===1?'Close':'Open'} ${name}`);stage.setAttribute('aria-pressed',String(target===1));}
  function draw(p){
   progress=clamp(p);
   let poses;
   if(id==='edibles'){
    const gummy=poseGummies(progress,ratio);poses=gummy.poses;
    body.style.clipPath=lowerPouch;attached.style.clipPath=topSlice(0,gummy.front);released.style.clipPath=topSlice(gummy.front,100);
    pouchRenderer?.draw(progress);
   }else poses=id==='vapes'?poseVape(progress):poseRoll(progress);
   rig.style.transform=`rotate(${id==='vapes'?-7*(1-progress):id==='edibles'?-4*(1-progress):0}deg)`;
   pieces.forEach((piece,i)=>{const [x,y,w,angle,sy,opacity,z]=poses[i];piece.style.width=`${w}px`;piece.style.transform=`translate3d(${x}px,${y}px,0) rotate(${angle}deg) scaleY(${sy})`;piece.style.opacity=opacity;piece.style.zIndex=z;});
   const labelOpacity=target===1?portion(progress,.73,.97):0;
   section.style.setProperty('--study-label-opacity',labelOpacity);
   if(annotations)annotations.hidden=labelOpacity===0;
   if(pairingNote)pairingNote.hidden=labelOpacity===0;
   // Match the end of each leader to its moving component as the layout settles.
   if(labelOpacity>0){
    const finalPoses=id==='vapes'?poseVape(1):id==='edibles'?poseGummies(1,ratio).poses:poseRoll(1);
    leaders.forEach(leader=>{
     const index=Number(leader.dataset.studyLeader),current=poses[index],final=finalPoses[index];
     const x=Number(leader.dataset.anchorX)+current[0]-final[0],y=Number(leader.dataset.anchorY)+current[1]-final[1];
     const lx=Number(leader.dataset.labelX),ly=Number(leader.dataset.labelY);
     const anchor=id==='edibles'&&index===10&&pouchRenderer?stripPoint(pouchState(progress,ratio),.64,.065):[x,y];
     leader.querySelector('path').setAttribute('d',`M ${lx} ${ly} L ${mix(lx,anchor[0],.55)} ${ly} L ${anchor[0]} ${anchor[1]}`);
     leader.querySelector('.study-anchor').setAttribute('cx',anchor[0]);leader.querySelector('.study-anchor').setAttribute('cy',anchor[1]);
     leader.querySelector('.study-mobile-marker').setAttribute('transform',`translate(${anchor[0]} ${anchor[1]})`);
    });
   }
   section.dataset.progress=String(Math.round(progress*100));section.dataset.phase=progress===0?'assembled':progress===1?'opened':target===1?'opening':'closing';
  }
  function stop(){cancelAnimationFrame(raf);raf=0;running=false;last=0;section.dataset.playing='false';}
  function settle(){stop();draw(target);announce();}
  function frame(now){
   if(!running)return;
   if(document.hidden||!motion()){settle();return;}
   elapsed+=last?Math.min(now-last,150):0;last=now;
   const t=clamp(elapsed/duration);draw(mix(from,target,smooth(t)));
   if(t===1){settle();return;}raf=requestAnimationFrame(frame);
  }
  function animate(){
   if(!motion()){settle();return;}
   if(progress===target){settle();return;}
   from=progress;elapsed=0;duration=Math.max(380,baseDuration*Math.abs(target-from));running=true;section.dataset.playing='true';
   status.textContent=target===1?`Opening ${name}.`:`Closing ${name}.`;raf=requestAnimationFrame(frame);
  }
  function loadArtwork(){
   if(ready||loading)return loading;
   stage.setAttribute('aria-busy','true');
   loading=Promise.all(pieces.map(p=>loadPiece(p.querySelector('img')))).then(()=>{
    if(scope.disposed)return;
    if(body){ratio=body.naturalHeight/body.naturalWidth;pouchRenderer=createPouchRenderer(rig,body);}
    ready=true;draw(progress);section.classList.add('study-ready');
    stage.removeAttribute('aria-busy');
    if(requested){requested=false;animate();}
   }).catch(()=>{
    loading=null;stage.removeAttribute('aria-busy');
    status.textContent=`${name} artwork could not load. Activate to retry.`;
   });
   return loading;
  }
  function go(next){
   stop();target=next;updateButton();
   // Both seamless loop copies represent the same product. Keep the offscreen
   // copy settled at the same destination, without running a second animation.
   controllers.forEach(controller=>{if(controller.id===id&&controller.section!==section)controller.synchronize(next);});
   if(!ready){requested=true;status.textContent=`Loading ${name}.`;loadArtwork();return;}
   animate();
  }
  function synchronize(next){
   stop();target=next;requested=false;updateButton();
   if(ready){settle();return;}
   loadArtwork()?.then(()=>{if(!scope.disposed&&ready&&target===next)settle();}).catch(()=>{});
  }
  scope.on(stage,'click',()=>go(target===1?0:1));
  scope.on(stage,'keydown',e=>{if(e.key==='Escape'&&target===1){e.preventDefault();go(0);}});
  scope.on(stage,'pointermove',e=>{if(!motion()||!fine.matches||target===1)return;const r=stage.getBoundingClientRect();stage.style.setProperty('--study-tilt-x',`${(e.clientX-r.left-r.width/2)/r.width*5}deg`);stage.style.setProperty('--study-tilt-y',`${-(e.clientY-r.top-r.height/2)/r.height*4}deg`);});
  scope.on(stage,'pointerleave',()=>{stage.style.setProperty('--study-tilt-x','0deg');stage.style.setProperty('--study-tilt-y','0deg');});
  const size=()=>scene.style.setProperty('--scene-scale',scene.clientWidth/640);scope.own(new ResizeObserver(size)).observe(scene);size();
  scope.own(new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&running)settle();},{threshold:.01})).observe(stage);
  controllers.push({id,section,synchronize,stop,settle,onMotion(){if(!motion()&&running)settle();if(pendingPreload&&!document.documentElement?.classList.contains('cinema-pending')){pendingPreload=false;loadArtwork();}}});
  draw(0);updateButton();section.dataset.playing='false';stage.disabled=false;
  const preload=scope.own(new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){preload.disconnect();if(document.documentElement?.classList.contains('cinema-pending'))pendingPreload=true;else loadArtwork();}},{rootMargin:'650px'}));
  preload.observe(stage);
 }
 const preferences=scope.own(new MutationObserver(()=>controllers.forEach(c=>c.onMotion())));preferences.observe(document.body,{attributes:true,attributeFilter:['class']});if(document.documentElement)preferences.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 scope.on(reduced,'change',()=>controllers.forEach(c=>c.onMotion()));
 scope.on(document,'visibilitychange',()=>{if(document.hidden)controllers.forEach(c=>c.settle());});
}
