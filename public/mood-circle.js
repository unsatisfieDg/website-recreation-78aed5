import {blendCinemaColour,cinemaPose,cinemaDistance,nearestCinemaPosition,flavourProfile,flavourSplash,flavourSplashSource,flavourMediaGrade,gummyHandoff,createFlavourBackdrop,STORY_DWELL} from './flavour-cinema.js?v=prerollfix2-1795346200';
import {productChapters,productOrbit,PRODUCT_ORBIT_MS,WRAPPER_TEAR_MS,WRAPPER_RESET_MS} from './product-journey.js?v=ac93c8712e95';
import {componentCopy,productComponent} from './product-content.js?v=c73acc77c6a5';
import {createProductSmoke} from './product-smoke.js?v=1029d0f04a5a';
import {moodProducts,ringOrder,mainSlots,gummySlots,moodFamilies,entryFor,familySlots,productSlot,circlePlacement,familyPlacement,blendPlacement,focusPlacement,ringMetrics,turnTarget,angleDelta,wheelMotionStep,mix,easeInOut,clamp01,TAU} from './mood-layout.js?v=0db75fe570d3';
export function initMoodCircles(scope){document.querySelectorAll('[data-mood-circle]').forEach(root=>mountWheel(root,scope));}
function mountWheel(root,scope){
 const $=s=>root.querySelector(s),stage=$('[data-mood-stage]'),buttons=[...root.querySelectorAll('[data-mood-object]')],question=$('[data-mood-question]'),familyText=$('[data-mood-pick]'),detail=$('[data-mood-detail]'),focus=$('[data-mood-focus]'),back=$('[data-mood-back]'),assemble=$('[data-mood-assemble]'),retry=$('[data-mood-retry]'),pause=$('[data-mood-pause]'),status=$('[data-mood-status]'),labels=$('[data-mood-labels]'),film=$('[data-mood-film]'),art=$('[data-mood-art]'),unrollButton=$('[data-mood-unroll]'),inspectNote=$('[data-mood-inspect-note]'),inspectBack=$('[data-inspect-back]'),wrapperReset=$('[data-wrapper-reset]'),cartonReset=$('[data-carton-reset]'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const journey=$('[data-mood-journey]'),journeyNext=$('[data-journey-next]'),journeyPrev=$('[data-journey-prev]');
 const insideButton=$('[data-cinema-inside]'),modelButton=$('[data-cinema-model]');
 const motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off');
 const splashVideo=document.createElement('video');
 splashVideo.muted=true;splashVideo.loop=true;splashVideo.playsInline=true;splashVideo.preload='auto';
 let mode='all',family=null,members=[],selected=-1,pendingSlot=-1,autoHold=0,opened=false,paused=false,visible=false,engine=null,enginePromise=null,rendererFailed=false,token=0,frame=0,last=0,lastDraw=0,time=0,w=0,h=0,phase=0,phaseTarget=0,familyAmount=0,focusAmount=0,pose=0,phaseTween=null,familyTween=null,focusTween=null,poseTween=null,hovered=-1,orbitX=0,orbitY=0,orbitDrag=null,wheelDrag=null,lastPointer=null,velocity=0,lastSteer=0,ignoreClickUntil=0,historyBusy=false,currentEntry=null,startingFilm=false;
 const cinema=$('[data-cinema]'),cinemaWorld=$('[data-cinema-world]'),cinemaCopy=$('[data-cinema-copy]'),cinemaDots=$('[data-cinema-dots]'),beltControls=$('[data-belt-controls]'),backdrop=createFlavourBackdrop(cinemaWorld,scope,invalidate);
 const studyLight=$('[data-mood-study-light]'),skipStudy=$('[data-study-skip]'),replayStudy=$('[data-study-replay]');
 const smoke=createProductSmoke(root,scope,{allowed:()=>family!=='gummies'&&visible&&clip.bottom-clip.top>Math.min(h,innerHeight)*.45&&motion()&&!paused,invalidate});
 let cinemaOpen=false,inside=false,inspectionMix=0,inspectionTween=null,storyPosition=0,storyTween=null,storyElapsed=0,storyHeld=false,storyModelHeld=false,storyGesture=null,lastStoryWheel=0;
 let clip={left:0,top:0,right:0,bottom:0};
 const hover=ringOrder.map(()=>0),pointer={x:0,y:0};let pointed=-1,focused=-1,manualTurn=false,focusAfterOpen=false;
 let detailPointer=null,carton=0,cartonTween=null,foil=0,unroll=0,foilTween=null,unrollTween=null,inspectAmount=0,inspectTween=null,inspectNode=null;
 let orbitProgress=0,orbitTween=null,studyLighting=null;
 let chapters=[],chapterIndex=0,chapterBusy=false,modelPending=false,measureFrame=0,storyFrame=null;
 let lastTravelDirection = 'next';
 const physicalBusy=()=>Boolean(inspectionTween||storyTween||poseTween||unrollTween||foilTween||inspectTween||cartonTween||orbitTween||chapterBusy);
 const wheelHeld=()=>hovered>=0&&!wheelDrag?.moved&&!manualTurn;
 function updateHover(){hovered=pointed>=0?pointed:focused;root.dataset.hoverHeld=String(wheelHeld());if(wheelHeld()&&['all','family'].includes(mode)){if(mode==='family')phaseTween=null;phaseTarget=phase;velocity=0;lastPointer=null;}invalidate();}
 function say(text){status.textContent=text;}
 function invalidate(){if(!frame&&!scope.disposed)frame=requestAnimationFrame(tick);}
 function tween(from,to,duration,done,ease=easeInOut){return {from,to,duration:motion()?duration:1,elapsed:0,done,ease};}
 function animateFoil(to,done){
  foilTween=tween(foil,to,to===1?WRAPPER_TEAR_MS:WRAPPER_RESET_MS,done,t=>t);
  ui();invalidate();
 }
 function fitDetail(){if(w>900||!['focus','detail','returning'].includes(mode))return;const top=parseFloat(getComputedStyle(detail).paddingTop)||148,value=`${Math.max(w<700?830:innerHeight,Math.ceil(top+$('.mood-detail__model').offsetHeight+$('.mood-detail__body').offsetHeight+104))}px`;if(root.style.getPropertyValue('--mood-detail-height')!==value)root.style.setProperty('--mood-detail-height',value);}
 function setMode(next){
  if(mode==='focus'&&next!=='focus'){orbitTween=null;orbitProgress=0;studyLighting?.cancel();}
  mode=next;ui();fitDetail();invalidate();
 }
 function activeCollection(){return mode!=='all'&&familyAmount>.5;}
 function ui(){
  storyFrame=null;
  const isResult=['focus','detail','returning'].includes(mode)&&(!cinemaOpen||inside),isFamily=family&&['turning','family','aligning','loading','unfiltering'].includes(mode);
  const storyInteractive=mode==='story'&&!inside;root.dataset.cinema=String(cinemaOpen);root.dataset.cinemaInside=String(inside);cinema.setAttribute('aria-hidden',String(!storyInteractive));cinema.inert=!storyInteractive;beltControls.hidden=mode!=='family';
  const wrapperBusy=inspectNode==='Wrapper'&&Boolean(inspectTween||foilTween);
  root.dataset.mode=mode;root.dataset.family=family||'';root.dataset.collectionField=String(Boolean(isFamily));root.dataset.inspecting=String(Boolean(inspectNode));root.dataset.inspectReady=String(Boolean(inspectNode&&!inspectTween&&!wrapperBusy));root.dataset.wrapperBusy=String(wrapperBusy);inspectNote.inert=wrapperBusy;cartonReset.hidden=inspectNode!=='Packaging';cartonReset.disabled=Boolean(inspectTween||cartonTween);wrapperReset.hidden=inspectNode!=='Wrapper';wrapperReset.disabled=wrapperBusy;root.dataset.unrolled=String(unroll>.99);root.toggleAttribute('data-detail-active',isResult);root.dataset.paused=String(paused||!motion());
  question.hidden=mode!=='all';familyText.hidden=!isFamily;detail.setAttribute('aria-hidden',String(!isResult));detail.inert=!isResult;const exploreNext=$('[data-mood-continue]');exploreNext.hidden=!['all','family'].includes(mode);exploreNext.href=document.querySelector('#munchies')?'#munchies':'index.html#munchies';
  root.toggleAttribute('data-study-revealing',Boolean(orbitTween));
  skipStudy.hidden=!orbitTween;
  replayStudy.hidden=mode!=='detail'||currentEntry?.family!=='gummies'||rendererFailed||paused||!motion();
  back.hidden=mode==='all';$('[data-journey-main]').hidden=!isResult;$('[data-journey-main]').disabled=historyBusy||mode==='returning'||mode==='unfiltering';back.disabled=historyBusy||mode==='returning'||mode==='unfiltering';$('[data-mood-back-label]').textContent=isResult||['aligning','loading'].includes(mode)?`Back to ${family||'collection'}`:'Back to main carousel';
  if(cinemaOpen){$('[data-mood-back-label]').textContent=inside?'Back to flavour':'All flavours';back.setAttribute('aria-label',inside?'Back to flavour':'All flavours');}
  back.setAttribute('aria-label',$('[data-mood-back-label]').textContent);back.title=$('[data-mood-back-label]').textContent;$('[data-mood-back-label]').textContent=isResult||['aligning','loading'].includes(mode)?moodFamilies[family]?.name||'Collection':'All products';
  if(cinemaOpen)$('[data-mood-back-label]').textContent=inside?'Flavour':'All flavours';
  const enabledSlots=mode==='all'?mainSlots:mode==='family'?members:[];
  buttons.forEach((b,slot)=>{const enabled=enabledSlots.includes(slot),entry=entryFor(slot,mode!=='all'&&Boolean(family));b.disabled=!enabled;b.setAttribute('aria-hidden',String(!enabled));const first=mode==='all'?ringOrder.indexOf(ringOrder[slot])===slot:true;b.tabIndex=enabled&&first?0:-1;b.setAttribute('aria-label',`Explore ${entry.name}${entry.family==='vapes'?' vape':''}`);b.querySelector('span').textContent=entry.name;});
  focus.tabIndex=-1;assemble.hidden=rendererFailed||currentEntry?.family==='gummies';assemble.disabled=Boolean(poseTween||unrollTween||foilTween||inspectTween||cartonTween)||mode!=='detail';unrollButton.hidden=rendererFailed||currentEntry?.family!=='pre-rolls'||!opened;unrollButton.disabled=assemble.disabled;unrollButton.textContent=unroll>.5?'Roll':'Unroll';$('[data-mood-select-hint]').hidden=currentEntry?.family==='gummies'||Boolean(inspectNode);assemble.textContent=opened?'Assemble again':'Disassemble';
  pause.setAttribute('aria-pressed',String(paused||!motion()));pause.setAttribute('aria-label',paused?'Resume ambient motion':isResult||cinemaOpen?'Pause flavour motion':'Pause wheel motion');pause.disabled=!motion();pause.hidden=false;root.dataset.storyHeld=String(storyHeld||storyModelHeld||cinema.contains(document.activeElement));
  if(insideButton)insideButton.disabled=modelPending;if(modelButton)modelButton.disabled=modelPending;
  if(insideButton?.firstChild)insideButton.firstChild.textContent=modelPending?'Preparing 3D view…':currentEntry?.family==='gummies'?'Explore the flavour':'Look inside';
  $('[data-mood-gesture]').textContent=isResult||cinemaOpen?'':mode==='family'?'Drag to explore':w<700?'Drag to turn':'Move around the wheel';
  journeyUI();syncFilm();syncCinema();
 }
 function measure(){storyFrame=null;const pad=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0;root.style.scrollMarginTop=`${-pad}px`;const r=stage.getBoundingClientRect();w=r.width;h=r.height;clip={left:Math.max(0,-r.left),top:Math.max(0,-r.top),right:Math.min(w,innerWidth-r.left),bottom:Math.min(h,innerHeight-r.top)};const a=root.getBoundingClientRect();root.style.setProperty('--mood-view-offset',`${Math.max(0,-a.top)}px`);visible=a.bottom>0&&a.top<innerHeight;if(!visible){smoke.finish();backdrop.pause();engine?.pauseCinema();}document.body.dataset.moodVisible=String(a.top<=90&&a.bottom>90);fitDetail();journeyUI();syncFilm();invalidate();}
 function frameBox(){const a=focus.getBoundingClientRect(),b=stage.getBoundingClientRect(),m=ringMetrics(w,h);return {x:a.left-b.left+a.width/2-(w<700&&currentEntry?.family==='vapes'?20:0),y:a.top-b.top+a.height/2,height:a.height*.92,width:a.width,cx:m.x,cy:m.y};}
 function queueMeasure(){if(!measureFrame)measureFrame=requestAnimationFrame(()=>{measureFrame=0;if(!scope.disposed)measure();});}
 async function boot(){
  if(!enginePromise){
   enginePromise=import('./mood-renderer.js?v=aff813f4d64c').then(({createMoodRenderer})=>{
    if(scope.disposed)return null;
    const params=new URLSearchParams(location.search);
    const initialFamily=family||params.get('collection')||root.dataset.initialCollection;
    const requested=currentEntry?.id||params.get('product')||params.get('flavour');
    const slot=Object.hasOwn(moodFamilies,initialFamily)?productSlot(initialFamily,requested):undefined;
    return createMoodRenderer({stage,buttons,products:moodProducts,scope,invalidate,splashVideo,
     initialFamily,
     initialProduct:slot===undefined?requested:moodProducts[ringOrder[slot]].id});
   }).then(result=>{
    if(scope.disposed)return null;
    engine=result;stage.dataset.moodRenderer=result?'ready':'failed';invalidate();return result;
   }).catch(()=>{stage.dataset.moodRenderer='failed';return null;});
  }
  return enginePromise;
 }
 async function prepareSelection(slot){
  const request=token;
  modelPending=!engine?.isReady(slot);
  rendererFailed=false;
  if(modelPending)ui();
  const readyEngine=await boot();
  const ready=readyEngine&&await readyEngine.whenReady(slot);
  if(scope.disposed||request!==token||slot!==selected)return;
  modelPending=false;
  rendererFailed=!ready;
  if(ready)chapters=productChapters(currentEntry).filter(step=>!step.node||readyEngine.hasPart(slot,step.node));
  else{
   retry.textContent=readyEngine?'Retry 3D view':'Reload 3D view';
   say('The 3D view is unavailable. The flavour and product information are still available.');
  }
  retry.hidden=Boolean(ready);
  ui();
  invalidate();
 }
 function syncFilm(){
  if(paused||!motion()||!visible||document.hidden)engine?.pauseCinema();
  if(!film)return;const allow=!cinemaOpen&&visible&&!document.hidden&&motion()&&!paused&&focusAmount>.15&&['focus','detail','returning'].includes(mode)&&!scope.disposed;
  const still=String(!allow);if(root.dataset.atmosphereStill!==still)root.dataset.atmosphereStill=still;if(!allow){film.pause();return;}const src=`assets/${currentEntry?.film||'ehf-wheel-motion.mp4'}`;
  if(!film.hasAttribute('poster')&&film.dataset.poster)film.poster=film.dataset.poster;
  if(film.getAttribute('src')!==src){film.src=src;film.load();}
  if(film.paused&&!startingFilm){startingFilm=true;film.play().catch(()=>{}).finally(()=>{startingFilm=false;if(!visible||paused||!motion()||scope.disposed)film.pause();});}
 }
 function route(entry=null,{replace=false,collection=family}={}){const u=new URL(location.href);if(collection)u.searchParams.set('collection',collection);else u.searchParams.delete('collection');if(entry)u.searchParams.set('product',entry.id);else u.searchParams.delete('product');u.hash='collections';const previous=Number(history.state?.ehfWheelLevel)||0,state={...history.state,ehfWheel:true,ehfWheelLevel:replace?previous:previous+1,ehfScroll:[scrollX,scrollY]};history[replace?'replaceState':'pushState'](state,'',u);document.dispatchEvent(new Event('ehf-wheel-route'));}
 function describe(slot){currentEntry=entryFor(slot,true);chapters=productChapters(currentEntry);chapterIndex=0;chapterBusy=false;const p=currentEntry,profile=flavourProfile(p);$('[data-mood-name]').textContent=p.name;$('[data-mood-line]').textContent=profile?.line||'';$('[data-mood-description]').textContent=p.family==='gummies'?`${profile.copy} Fine sugar crystals give the rounded edges a lightly textured finish.`:profile?.copy||p.description;$('[data-mood-facts]').innerHTML=p.facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');$('[data-mood-qualification]').textContent=p.qualification;$('[data-product-information]').open=false;root.style.setProperty('--scene-colour',p.colour);root.style.setProperty('--study-ink',profile?.ink||'#173d2a');root.dataset.productFamily=p.family;root.dataset.productConcept=String(Boolean(p.concept));
  art.hidden=cinemaOpen||!p.art;
  if(!art.hidden)art.src=`assets/flavours/${p.art}`;
  focus.setAttribute('aria-label',p.family==='gummies'?`3D view of ${p.name}`:`Inspect ${p.name} or choose a part.`);
  refreshParts();describeCinema();
 }
 function describeCinema(){if(!currentEntry)return;const profile=flavourProfile(currentEntry);if(!profile)return;
    const name = (currentEntry.name || '').toUpperCase();

    const leftEl = $('[data-henrietta-word-left]'), rightEl = $('[data-henrietta-word-right]');
    if(leftEl){
      // Render individual animated letter spans for kinetic Henrietta-style motion
      leftEl.innerHTML = name.split('').map((char, i) => {
        if(char === ' ') return '<span class="henrietta-space" style="display:inline-block; width:0.35em;">&nbsp;</span>';
        return `<span class="henrietta-char" style="--char-index:${i};">${char}</span>`;
      }).join('');
      if(rightEl) rightEl.textContent = '';

      // Scale font-size dynamically so long flavour names fit cleanly without overlapping or getting cut off
      const len = name.length;
      if(len > 15){ // e.g. GRANDDADDY PURPLE (17), LONDON POUND CAKE (17), PINEAPPLE EXPRESS (17)
        leftEl.style.fontSize = 'clamp(46px, 9.8vw, 155px)';
        leftEl.style.letterSpacing = '-0.02em';
      } else if(len > 10){ // e.g. SOUR DIESEL (11), PINK CANDY (10), BLUE DREAM (10)
        leftEl.style.fontSize = 'clamp(60px, 13vw, 210px)';
        leftEl.style.letterSpacing = '-0.03em';
      } else { // e.g. OG KUSH (7), GELATO (6), RUNTZ (5)
        leftEl.style.fontSize = 'clamp(80px, 18vw, 280px)';
        leftEl.style.letterSpacing = '-0.04em';
      }

     // Remove all enter and exit animation classes
     const animClasses = [
       'henrietta-word-enter-left', 'henrietta-word-enter-right',
       'slide-out-left', 'slide-out-right',
       'enter-diagonal-prev', 'enter-diagonal-next', 'exit-diagonal-prev', 'exit-diagonal-next',
       'enter-vertical-prev', 'enter-vertical-next', 'exit-vertical-prev', 'exit-vertical-next',
       'enter-horizontal-prev', 'enter-horizontal-next', 'exit-horizontal-prev', 'exit-horizontal-next'
     ];
     leftEl.classList.remove(...animClasses);
     rightEl.classList.remove(...animClasses);
     void leftEl.offsetWidth; // trigger reflow

     // Apply entrance class matching this flavor's motion pattern (0: diagonal, 1: vertical, 2: horizontal)
     const currentIndex = members.indexOf(selected);
     const motionMode = ((currentIndex % 3) + 3) % 3;
     const motionType = motionMode === 0 ? 'diagonal' : motionMode === 1 ? 'vertical' : 'horizontal';
     const enterClass = `enter-${motionType}-${lastTravelDirection}`;
     leftEl.classList.add(enterClass);
     rightEl.classList.add(enterClass);
   }

   const badgeStrain = $('[data-henrietta-badge-strain]');
   if(badgeStrain) badgeStrain.textContent = currentEntry.name;

   const tagEl = $('[data-cinema-tag]');
   if(tagEl) tagEl.textContent = currentEntry.family==='vapes'?'Vape Bar':currentEntry.family==='gummies'?'Edible':'Pre-roll';

   const descEl = $('[data-cinema-description]');
   if(descEl) descEl.textContent = profile.copy || currentEntry.description || '';

   // Theme colors for Henrietta: vibrant signature color per strain
   // Signature color matching each vape packaging and device
   const vapeThemes = {
     'og-kush': { bg: '#12826a', text: '#bbf1e4', badge: '#0c5c4a' }, // Deep emerald teal matching OG Kush pouch & pen
     'grape-rush': { bg: '#7b2cbf', text: '#f1d6ff', badge: '#5a189a' }, // Deep violet purple
     'granddaddy-purple': { bg: '#7b2cbf', text: '#f1d6ff', badge: '#5a189a' },
     'mango-mirage': { bg: '#e89400', text: '#fff2cc', badge: '#b26e00' }, // Pineapple gold/orange
     'pineapple-express': { bg: '#e89400', text: '#fff2cc', badge: '#b26e00' },
     'cherry-drift': { bg: '#c2185b', text: '#fce4ec', badge: '#880e4f' }, // Candy berry pink
     'pink-candy': { bg: '#c2185b', text: '#fce4ec', badge: '#880e4f' },
     'blueberry-cobbler': { bg: '#1565c0', text: '#d0e6ff', badge: '#0d47a1' }, // Cobalt blue
     'blue-dream': { bg: '#1565c0', text: '#d0e6ff', badge: '#0d47a1' },
     'berry-blast': { bg: '#a3a817', text: '#f9fbd4', badge: '#787b0c' }, // Gold lime & berry (Runtz)
     'runtz': { bg: '#a3a817', text: '#f9fbd4', badge: '#787b0c' },
     'melon-wave': { bg: '#e86e42', text: '#ffe3d6', badge: '#b84d26' }, // Peach satin (Gelato)
     'gelato': { bg: '#e86e42', text: '#ffe3d6', badge: '#b84d26' },
     'sour-diesel': { bg: '#5b8e1f', text: '#e4f4cb', badge: '#3e6312' }, // Acid lime green
     'london-pound-cake': { bg: '#c45187', text: '#fdeaf3', badge: '#913260' } // Rose pink
   };

   const theme = vapeThemes[currentEntry.id] || {
     bg: profile.shade || '#e65100',
     text: '#ffffff',
     badge: profile.extract || '#bf360c'
   };

   root.style.setProperty('--henrietta-bg', theme.bg);
   root.style.setProperty('--henrietta-text', theme.text);
   root.style.setProperty('--henrietta-badge', theme.badge);

   // Legacy attributes
   $('[data-cinema-name]').textContent=currentEntry.name;
   $('[data-cinema-model]').setAttribute('aria-label',`Look inside ${currentEntry.name}`);
   $('[data-cinema-line]').textContent=profile.line;
   $('[data-cinema-qualification]').textContent=currentEntry.qualification;

   const i=members.indexOf(selected),previous=entryFor(members[(i-1+members.length)%members.length],true),next=entryFor(members[(i+1)%members.length],true);
   const prevLabel=$('[data-cinema-prev-label]'),nextLabel=$('[data-cinema-next-label]');
   if(prevLabel) prevLabel.textContent=previous.name;
   if(nextLabel) nextLabel.textContent=next.name;

   if(cinemaDots.dataset.family!==family){
     cinemaDots.dataset.family=family;
     cinemaDots.innerHTML=members.map((slot,index)=>`<button type="button" data-cinema-index="${index}" aria-label="${entryFor(slot,true).name}" aria-current="${slot===selected?'true':'false'}"><span></span></button>`).join('');
   } else {
     for(const dot of cinemaDots.querySelectorAll('button')) dot.setAttribute('aria-current',String(members[Number(dot.dataset.cinemaIndex)]===selected));
   }
   root.style.setProperty('--cinema-paper',theme.bg);
   root.style.setProperty('--cinema-ink','#ffffff');
  }
  function syncCinema(){const amount=cinemaOpen?focusAmount*(1-inspectionMix):0;root.style.setProperty('--cinema-progress',String(amount));root.style.setProperty('--cinema-dwell',String(storyElapsed/STORY_DWELL));
  const study=cinemaOpen?focusAmount*inspectionMix:0;
  root.style.setProperty('--study-progress',String(study));
  if(studyLight.hidden===Boolean(study))studyLight.hidden=!study;
  const active=cinemaOpen&&focusAmount>.01;
  const handoff=family==='gummies'&&storyTween?gummyHandoff(storyPosition,storyTween,members.length):null;
  const scenes=handoff||members.map((_,index)=>{
   const distance=cinemaDistance(index,storyPosition,members.length);
   return {index,distance,alpha:Math.max(0,1-Math.abs(distance))};
  });
  const items=active?scenes.filter(scene=>scene.alpha>0).map(scene=>({...scene,entry:entryFor(members[scene.index],true)})):[];
  const destination=storyTween?slotAt(storyTween.to):cinemaOpen&&selected>=0?selected:undefined;
  if(items.length){
   const [first,second]=items;
   const colour=flavourProfile(first.entry).colour;
   root.style.setProperty('--cinema-paper',second?blendCinemaColour(colour,flavourProfile(second.entry).colour,second.alpha):colour);
  }
  const preparing=allowCinemaMedia();
  backdrop.sync(items,{preparing,running:preparing&&!smoke.busy&&['focus','story'].includes(mode),compact:w<700,destination:destination===undefined?null:entryFor(destination,true),exposure:1-inspectionMix*.79});
  const centre=members[Math.round(-phase*members.length/TAU+members.length*1000)%members.length];
  const beltLabel=$('[data-belt-current]'),name=centre===undefined?'':entryFor(centre,true).name;
  if(beltLabel.textContent!==name)beltLabel.textContent=name;
 }
 function lightStudy(){
  studyLighting?.cancel();
  if(!cinemaOpen||!inside||paused||!visible||!motion())return;
  studyLighting=studyLight.animate(
   [{transform:'translate3d(8%,3%,0)'},{transform:'translate3d(0,0,0)'}],
   {duration:940,easing:'cubic-bezier(.25,1,.5,1)'}
  );
 }
 function allowCinemaMedia(){return cinemaOpen&&visible&&!document.hidden&&motion()&&!paused&&!inside&&!navigator.connection?.saveData;}
 function slotAt(position){
  const index=Math.round(position)%members.length;
  return members[(index+members.length)%members.length];
 }
 function shiftStory(direction,index=null){
  if(mode!=='story'||storyTween||inspectionTween||smoke.busy)return;
  foil=0;foilTween=null;carton=0;cartonTween=null;
  const destination=index===null?storyPosition+direction:nearestCinemaPosition(storyPosition,index,members.length);
  storyElapsed=0;
  if(destination===storyPosition)return;

  // Determine traversal direction
  const isNext = destination > storyPosition;
  lastTravelDirection = isNext ? 'next' : 'prev';

  // Animate giant typography slide-out in the current flavor's specific trajectory
  const leftEl = $('[data-henrietta-word-left]'), rightEl = $('[data-henrietta-word-right]');
  if(leftEl && rightEl){
    const animClasses = [
      'henrietta-word-enter-left', 'henrietta-word-enter-right',
      'slide-out-left', 'slide-out-right',
      'enter-diagonal-prev', 'enter-diagonal-next', 'exit-diagonal-prev', 'exit-diagonal-next',
      'enter-vertical-prev', 'enter-vertical-next', 'exit-vertical-prev', 'exit-vertical-next',
      'enter-horizontal-prev', 'enter-horizontal-next', 'exit-horizontal-prev', 'exit-horizontal-next'
    ];
    leftEl.classList.remove(...animClasses);
    rightEl.classList.remove(...animClasses);
    void leftEl.offsetWidth;

    const currentIndex = members.indexOf(selected);
    const motionMode = ((currentIndex % 3) + 3) % 3;
    const motionType = motionMode === 0 ? 'diagonal' : motionMode === 1 ? 'vertical' : 'horizontal';
    const exitClass = `exit-${motionType}-${lastTravelDirection}`;
    leftEl.classList.add(exitClass);
    rightEl.classList.add(exitClass);
  }

  const slot=slotAt(destination),entry=entryFor(slot,true),splash=flavourSplash(entry);
  if(splash){
   engine?.prepareEffect(splash);
   // Preload adjacent slots in advance so gummies video/posters don't delay
   const prevSplash=flavourSplash(entryFor(slotAt(destination-1),true));
   const nextSplash=flavourSplash(entryFor(slotAt(destination+1),true));
   if(prevSplash)engine?.prepareEffect(prevSplash);
   if(nextSplash)engine?.prepareEffect(nextSplash);
  }
  if(family!=='gummies'&&family!=='vapes'&&family!=='pre-rolls')smoke.play(flavourProfile(entry),{reverse:destination<storyPosition,gatherPair:family==='vapes'});
  engine?.whenReady(slot).then(()=>invalidate());
  
  // Vape & pre-rolls delay curve for outro: typography slides out first (~160ms lead),
  // then the items follow and smoothly settle into the destination slot
  const vapeDelayedOutroEase = t => {
   const delay = 0.08; // subtle lead: typography begins just a beat before the item slides
   if (t <= delay) return 0;
   const scaledT = Math.min(1, Math.max(0, (t - delay) / (1 - delay)));
   return scaledT < 0.5 ? 2 * scaledT * scaledT : 1 - Math.pow(-2 * scaledT + 2, 2) / 2;
  };

  const isSnappyHandoff = family==='gummies';
  const useDelayedOutro = family==='vapes'||family==='pre-rolls';
  storyTween=tween(storyPosition,destination,isSnappyHandoff?420:(family==='vapes'?800:760),()=>{
   storyPosition=destination;
   root.dataset.storyChanging='false';
   route(currentEntry,{replace:true});
   prepareSelection(selected);
   ui();
  }, useDelayedOutro?vapeDelayedOutroEase:easeInOut);
  root.dataset.storyChanging='true';
  invalidate();
 }
 function finishStudyReveal(){
  const active=document.activeElement;
  const restoreFocus=detail.contains(active)||cinema.contains(active)||active===document.body;
  setMode('detail');
  if(!rendererFailed&&currentEntry.family!=='gummies'){
   opened=true;
   poseTween=tween(pose,1,currentEntry.family==='pre-rolls'?2600:2100,()=>{refreshParts();ui();});
   ui();
  }
  if(restoreFocus)$('[data-mood-name]').focus({preventScroll:true});
 }
 function startStudyReveal(){
  const animate=motion()&&!paused&&!rendererFailed;
  const initial=inspectionMix<1;
  if(!animate){inspectionMix=1;finishStudyReveal();return;}
  orbitProgress=0;
  orbitTween=tween(0,1,PRODUCT_ORBIT_MS,finishStudyReveal,value=>value);
  if(initial)inspectionTween=tween(inspectionMix,1,850);
  setMode('focus');
  lightStudy();
  if(w<=900)alignCollection();
  skipStudy.focus({preventScroll:true});
 }
 function skipStudyReveal(){
  if(!orbitTween)return;
  studyLighting?.cancel();
  orbitTween.elapsed=orbitTween.duration;
  if(inspectionTween)inspectionTween.elapsed=inspectionTween.duration;
  invalidate();
 }
 function lookInside(){
  if(modelPending)return;
  smoke.finish();storyElapsed=0;inside=true;chapterIndex=0;
  startStudyReveal();
  if(mode==='detail'&&w<=900)alignCollection();
 }
 function returnToStory(){if(!cinemaOpen||!inside||(!orbitTween&&physicalBusy()))return;alignCollection();clearInspection(()=>{setMode('returning');const travel=()=>{inspectionTween=tween(inspectionMix,0,850,()=>{inside=false;setMode('story');(insideButton||modelButton)?.focus({preventScroll:true});});invalidate();};const close=()=>{opened=false;foil=0;foilTween=null;carton=0;cartonTween=null;if(pose>.001)poseTween=tween(pose,0,currentEntry.family==='pre-rolls'?1800:1100,travel);else travel();invalidate();};if(unroll>.001)unrollTween=tween(unroll,0,1200,close);else close();});}
 function turnBelt(direction){if(mode!=='family'||phaseTween)return;pendingSlot=-1;autoHold=0;manualTurn=true;const step=TAU/members.length,target=(Math.round(phase/step)-direction)*step;phaseTween=tween(phase,target,920,()=>{phaseTarget=phase;manualTurn=false;});invalidate();}
 function refreshParts(){if(!currentEntry)return;const f=currentEntry.family;let names=f==='vapes'?(opened?['Mouthpiece','Collar','Cartridge','DeviceHousing','Wrapper']:['DeviceHousing','Wrapper']):f==='pre-rolls'?(opened?(unroll>.99?['RollingPaper','HempFlower','Filter','StorageTube','TubeCap']:['Roll_1','StorageTube','TubeCap']):['StorageTube']):[];
  names=names.filter(name=>!engine||engine.hasPart(selected,name));
  const disabled=poseTween||foilTween||unrollTween||inspectTween||cartonTween;
  labels.innerHTML=names.map(name=>{
   const tear=name==='Wrapper'&&foil<.99,openCarton=name==='Packaging'&&carton<.99,title=componentCopy[name].title;
   const label=tear?'Tear open wrapper':openCarton?'Open carton':`Inspect ${title.toLowerCase()}`;
   const text=tear?'Tear open':openCarton?'Open carton':name==='DeviceHousing'&&!opened?'Vape':title;
   return `<button type="button" data-node="${name}" aria-label="${label}"${tear?' data-tear-action':''}${disabled?' disabled':''}><span class="mood-part-dot" aria-hidden="true"></span><span class="mood-part-text">${text}</span></button>`;
  }).join('');
  annotate();invalidate();
 }
 function clearInspection(done){
  if(!done)chapterIndex=0;
  if(!inspectNode){done?.();return;}
  const wrapper=inspectNode==='Wrapper';
  const restoreFocus=inspectNote.contains(document.activeElement)||(wrapper&&document.activeElement===focus);
  if(wrapper&&!done&&(inspectTween||foilTween)){
   foilTween=null;chapterBusy=false;
   if(foil>0&&foil<1){animateFoil(0,()=>clearInspection());return;}
  }
  inspectTween=tween(inspectAmount,0,650,()=>{
   inspectNode=null;inspectNote.hidden=true;ui();refreshParts();fitDetail();
   if(restoreFocus)(wrapper?labels.querySelector('[data-node="Wrapper"]')||assemble:assemble).focus({preventScroll:true});
   done?.();
  });ui();invalidate();
 }
 function inspectPart(name,done=null){if(mode!=='detail'||poseTween||foilTween||unrollTween||inspectTween||cartonTween||rendererFailed)return;if(currentEntry.family==='gummies'){done?.();return;}
  alignCollection();
  if(name==='Packaging'&&carton<.99){cartonTween=tween(carton,1,1100,()=>{refreshParts();ui();inspectPart('Packaging',done);});ui();invalidate();return;}
  if((!opened&&currentEntry.family!=='gummies'&&!['Packaging','Wrapper'].includes(name))){assembleProduct();return;}
  if(currentEntry.family==='pre-rolls'&&['RollingPaper','HempFlower','Filter'].includes(name)&&unroll<.99)name='Roll_1';const info=productComponent(currentEntry,name);if(!info)return;
  if(!done){const at=chapters.findIndex(step=>step.node===name);if(at>=0)chapterIndex=at;}
  if(!done)lightStudy();
  const wrapper=name==='Wrapper',tear=wrapper&&foil<.99;
  inspectNode=name;$('[data-inspect-title]').textContent=info.title;$('[data-inspect-copy]').textContent=info.copy;inspectNote.hidden=false;
  if(labels.contains(document.activeElement))(wrapper?focus:inspectBack).focus({preventScroll:true});
  const finish=()=>{
   ui();
   if(wrapper&&document.activeElement===focus)inspectBack.focus({preventScroll:true});
   say(tear?'Wrapper opened.':info.title+'. '+info.copy);
   done?.();
  };
  inspectTween=tween(inspectAmount,1,wrapper?520:750,()=>{if(tear)animateFoil(1,finish);else finish();});
  ui();fitDetail();invalidate();
 }
 function unrollProduct(){if(mode!=='detail'||poseTween||unrollTween||foilTween||inspectTween||cartonTween||!opened)return;alignCollection();clearInspection(()=>{unrollTween=tween(unroll,unroll>.5?0:1,1900,()=>{ui();refreshParts();say(unroll>.5?'Paper opened. Select hemp filling, rolling paper or filter.':'Pre-roll formed again.');});ui();invalidate();});}
 function enterFamily(slot,{auto=true,write=true,instant=false,loadFamily=true}={}){
  smoke.cancel();
  cinemaOpen=inside=false;inspectionMix=0;inspectionTween=storyTween=null;storyElapsed=0;
  token++;orbitProgress=0;orbitTween=null;pendingSlot=auto?slot:-1;autoHold=0;selected=-1;family=moodProducts[ringOrder[slot]].family;members=familySlots(family);opened=false;pose=focusAmount=carton=foil=unroll=inspectAmount=0;inspectNode=null;inspectNote.hidden=true;cartonTween=foilTween=unrollTween=inspectTween=null;focusTween=poseTween=null;orbitX=orbitY=0;hovered=-1;lastPointer=null;velocity=0;historyBusy=false;
  $('[data-mood-pick-title]').textContent=moodFamilies[family].name;$('[data-mood-pick-description]').textContent='Choose a flavour.';
  smoke.prepare();
  if(loadFamily)engine?.activate(family);
  if(family==='gummies'&&engine){
   members.forEach(mSlot=>{
    const e=entryFor(mSlot,true),s=flavourSplash(e);
    if(s)engine.prepareEffect(s);
   });
  }
  if(write)route();setMode('turning');say(`Turning to the ${moodFamilies[family].name.toLowerCase()} collection.`);
  const duration=instant?1:1050;phaseTarget=turnTarget(phase,slot,members);phaseTween=tween(phase,phaseTarget,duration,()=>{phaseTarget=phase;setMode('family');autoHold=pendingSlot>=0?(motion()?180:1):0;say(`${moodFamilies[family].name}. Select a product to explore.`);});familyTween=tween(familyAmount,1,instant?1:960);
 }
 function focusStory(){
  if(!focusAfterOpen||mode!=='story'||smoke.busy)return;
  focusAfterOpen=false;
  (modelPending?$('[data-cinema-name]'):(insideButton||modelButton))?.focus({preventScroll:true});
 }
 function openProduct(slot,{rotate=true,write=true}={}){
  if(!members.includes(slot))return;cinemaOpen=true;inside=false;inspectionMix=0;inspectionTween=storyTween=null;storyElapsed=0;storyPosition=-phase*members.length/TAU;storyPosition=nearestCinemaPosition(storyPosition,members.indexOf(slot),members.length);const request=++token;orbitProgress=0;orbitTween=null;pendingSlot=-1;autoHold=0;selected=slot;describe(slot);rendererFailed=false;retry.hidden=true;opened=false;pose=0;carton=foil=unroll=inspectAmount=0;inspectNode=null;inspectNote.hidden=true;cartonTween=foilTween=unrollTween=inspectTween=null;orbitX=orbitY=0;hovered=-1;velocity=0;lastPointer=null;root.setAttribute('aria-busy','true');if(write)route(currentEntry);
  smoke.cancel();
  smoke.prepare();
  const splash=flavourSplash(currentEntry);
  if(splash&&allowCinemaMedia()){
   if(engine){
    engine.prepareEffect(splash);
    // Preload previous and next gummies splash immediately
    const curIdx=members.indexOf(slot);
    if(curIdx>=0){
     const prevEntry=entryFor(members[(curIdx-1+members.length)%members.length],true);
     const nextEntry=entryFor(members[(curIdx+1)%members.length],true);
     const sPrev=flavourSplash(prevEntry),sNext=flavourSplash(nextEntry);
     if(sPrev)engine.prepareEffect(sPrev);
     if(sNext)engine.prepareEffect(sNext);
    }
   }
   else splashVideo.src=flavourSplashSource(splash,w<700);
  }
  prepareSelection(slot);
  const revealStory=()=>{
   if(scope.disposed||request!==token)return;
   // Pre-rolls use the Henrietta cinema background — no product smoke overlay needed.
   // Smoke is only for vape-adjacent families; keeping it on pre-rolls causes smoke.busy
   // to block shiftStory and the auto-advance loop, making the section appear frozen.
   if(family!=='gummies'&&family!=='vapes'&&family!=='pre-rolls')smoke.play(flavourProfile(currentEntry),{done:focusStory});
   // Lead with typography: show cinema background typography first
   if(family==='vapes'||family==='pre-rolls'){
     root.dataset.cinema = 'true';
     describeCinema();
   }
   setMode('focus');
   // Add a 150ms delay curve on vape & pre-roll focus zoom so background typography enters first
   const vapeFocusDelayedEase = t => {
     const delay = 0.08; // subtle lead: typography enters just a beat before product zooms in
     if (t <= delay) return 0;
     const scaledT = (t - delay) / (1 - delay);
     return scaledT < 0.5 ? 2 * scaledT * scaledT : 1 - Math.pow(-2 * scaledT + 2, 2) / 2;
   };
   const useDelayedEase = family==='vapes'||family==='pre-rolls';
   focusTween=tween(focusAmount,1,useDelayedEase?760:730,()=>{
    root.removeAttribute('aria-busy');
    setMode('story');
    say(`${currentEntry.name}. Explore the flavour and finish.`);
    focusStory();
   }, useDelayedEase?vapeFocusDelayedEase:easeInOut);
  };
  if(rotate){
   setMode('aligning');
   phaseTarget=phase+angleDelta(phase,-members.indexOf(slot)*TAU/members.length);
   phaseTween=tween(phase,phaseTarget,560,()=>{phaseTarget=phase;revealStory();});
  }else revealStory();
  invalidate();
 }
 function assembleProduct(){if(mode!=='detail'||poseTween||unrollTween||foilTween||inspectTween||cartonTween||rendererFailed||currentEntry?.family==='gummies')return;alignCollection();const go=()=>{chapterIndex=0;opened=!opened;poseTween=tween(pose,Number(opened),currentEntry.family==='pre-rolls'?2600:2100,()=>{refreshParts();ui();say(opened?'Choose a part or Continue to explore.':'Product assembled. Click the product to open it.');});ui();invalidate();};clearInspection(()=>{if(unroll>.001){unrollTween=tween(unroll,0,1500,()=>{ui();refreshParts();go();});ui();invalidate();}else go();});}
 function alignCollection(){const top=root.getBoundingClientRect().top;if(top< -24||top>64)root.scrollIntoView({block:'start',behavior:motion()?'smooth':'instant'});}
 function closeStoryFamily(done){smoke.cancel();token++;pendingSlot=-1;autoHold=0;storyTween=null;phase=phaseTarget=-storyPosition*TAU/members.length;phaseTween=null;const chosen=selected,collection=family;setMode('returning');focusTween=tween(focusAmount,0,850,()=>{cinemaOpen=inside=false;inspectionMix=0;selected=-1;pose=carton=foil=unroll=0;opened=false;setMode('family');buttons[chosen]?.focus({preventScroll:true});done?.();boot().then(ready=>{if(mode==='family'&&family===collection)ready?.activate(collection);});});invalidate();}
 function showFamily(done){if(cinemaOpen&&!inside){closeStoryFamily(done);return;}if(cinemaOpen)phase=phaseTarget=-storyPosition*TAU/members.length;cinemaOpen=inside=false;inspectionMix=0;inspectionTween=storyTween=null;storyElapsed=0;engine?.activate(family);alignCollection();orbitTween=null;orbitProgress=0;chapterBusy=false;inspectNode=null;inspectAmount=0;inspectTween=null;inspectNote.hidden=true;cartonTween=foilTween=unrollTween=poseTween=null;token++;pendingSlot=-1;autoHold=0;phaseTween=null;focusTween=null;historyBusy=false;root.setAttribute('aria-busy','false');root.dataset.labels='false';if(focusAmount<.001){selected=-1;pose=carton=foil=unroll=0;setMode('family');done?.();return;}setMode('returning');const travel=()=>{focusTween=tween(focusAmount,0,850,()=>{selected=-1;opened=false;pose=carton=foil=unroll=0;orbitX=orbitY=0;setMode('family');buttons[members[0]]?.focus({preventScroll:true});done?.();});};const close=()=>{if(pose>.001){opened=false;poseTween=tween(pose,0,currentEntry?.family==='pre-rolls'?1800:1000,travel);}else{poseTween=null;travel();}};if(unroll>.001){unrollTween=tween(unroll,0,1000,close);}else close();}
 function showAll(){const clear=()=>{smoke.cancel();engine?.activate();alignCollection();token++;pendingSlot=-1;autoHold=0;pose=focusAmount=0;selected=-1;phaseTween=null;historyBusy=false;setMode('unfiltering');familyTween=tween(familyAmount,0,850,()=>{family=null;members=[];currentEntry=null;setMode('all');buttons[0]?.focus({preventScroll:true});say('All EHF products.');});};if(focusAmount>.001)showFamily(clear);else clear();}
 function backOne(){if(cinemaOpen&&inside){returnToStory();return;}if(mode==='story'){route(null,{replace:true});showFamily();return;}if(historyBusy||mode==='all'||mode==='returning'||mode==='unfiltering')return;if(['focus','detail','aligning','loading'].includes(mode)){route(null,{replace:true});showFamily();}else backToMain();}
 function restoreRoute(){historyBusy=false;focusAfterOpen=false;const u=new URL(location.href),f=u.searchParams.get('collection'),id=u.searchParams.get('product');if(!Object.hasOwn(moodFamilies,f)){showAll();return;}
  const slots=familySlots(f),slot=productSlot(f,id);
  if(family===f&&familyAmount>.999){if(slot!==undefined)openProduct(slot,{rotate:false,write:false});else showFamily();return;}
  enterFamily(slot??slots[0],{auto:false,write:false,instant:true,loadFamily:slot===undefined});if(slot!==undefined){phaseTween.done=()=>{phaseTarget=phase;setMode('family');openProduct(slot,{rotate:false,write:false});};}
 }
 function journeyUI(){
  const title=$('[data-mood-name]'),mobileHeading=$('[data-mood-mobile-heading]'),copy=$('.mood-detail__copy');if(w<=900){if(title.parentElement!==mobileHeading)mobileHeading.append(title);}else if(title.parentElement!==copy)copy.prepend(title);
  const media=w<=900&&(!cinemaOpen||inside)&&['focus','detail','returning'].includes(mode)?$('[data-mood-route-media]'):$('.mood-circle__footer-right');if(pause.parentElement!==media)media.append(pause);
  journey.hidden=!chapters.length;
  if(!currentEntry||!chapters.length)return;const busy=physicalBusy()||mode!=='detail'||rendererFailed,step=chapters[chapterIndex];root.dataset.chapter=String(chapterIndex);root.dataset.chapterBusy=String(busy);
  $('[data-journey-count]').textContent=`${chapterIndex+1} / ${chapters.length}`;$('[data-journey-mini]').textContent=`${chapterIndex+1} / ${chapters.length}`;$('[data-journey-title]').textContent=step.title;
  detail.style.setProperty('--study-chapter-progress',String((chapterIndex+1)/chapters.length));
  journeyPrev.disabled=busy;journeyNext.disabled=busy;journeyPrev.setAttribute('aria-disabled',String(busy));journeyNext.setAttribute('aria-disabled',String(busy));journeyPrev.setAttribute('aria-label',chapterIndex===0?`Return to ${family}`:`Return to ${chapters[chapterIndex-1].title.toLowerCase()}`);journeyNext.setAttribute('aria-label',chapterIndex===chapters.length-1?`Continue to ${family}`:`Continue to ${chapters[chapterIndex+1].title.toLowerCase()}`);$('[data-journey-next-label]').textContent='Continue';
  $('[data-journey-hint]').textContent=busy?'':chapterIndex===chapters.length-1?'Continue to the collection.':'Choose Continue to explore the next detail.';
 }
 function backToMain(){if(['all','returning','unfiltering'].includes(mode))return;route(null,{replace:true,collection:null});showAll();}
 function stepChapter(direction){if(mode!=='detail'||!chapters.length||physicalBusy()||rendererFailed)return;if(chapterIndex+direction<0){backOne();return;}
  if(chapterIndex+direction>=chapters.length){if(cinemaOpen)returnToStory();else{route(null,{replace:true});showFamily();}return;}
  const index=chapterIndex+direction,step=chapters[index],request=token;chapterIndex=index;chapterBusy=true;journeyUI();lightStudy();
  const safe=fn=>()=>{if(!scope.disposed&&token===request&&mode==='detail')fn();};
  const finished=safe(()=>{chapterBusy=false;refreshParts();ui();say(`${index+1} of ${chapters.length}. ${step.title}.`);});
  const inspect=safe(()=>{if(step.node)inspectPart(step.node,finished);else finished();});
  const openCarton=safe(()=>{if(Math.abs(carton-step.carton)>.001){cartonTween=tween(carton,step.carton,1000,inspect);invalidate();}else inspect();});
  const tear=safe(()=>{if(step.node!=='Wrapper'&&Math.abs(foil-step.foil)>.001)animateFoil(step.foil,openCarton);else openCarton();});
  const unfold=safe(()=>{if(Math.abs(unroll-step.unroll)>.001){unrollTween=tween(unroll,step.unroll,1700,tear);invalidate();}else tear();});
  const expose=safe(()=>{if(Math.abs(pose-step.pose)>.001){opened=step.pose>.5;poseTween=tween(pose,step.pose,currentEntry.family==='pre-rolls'?2400:1800,unfold);invalidate();}else unfold();});
  clearInspection(safe(()=>{if(unroll>.001&&step.unroll===0){unrollTween=tween(unroll,0,1500,expose);invalidate();}else expose();}));ui();invalidate();
 }
 function advance(value,t,dt){if(!t)return [value,null,null];if(!motion())t.elapsed=t.duration;t.elapsed+=dt;const n=clamp01(t.elapsed/t.duration),v=mix(t.from,t.to,t.ease(n));return n>=1?[v,null,t.done]:[v,t,null];}
 function annotate(){
  const shown=mode==='detail'&&!poseTween&&!foilTween&&!unrollTween&&!inspectNode&&!rendererFailed;
  if(root.dataset.labels!==String(shown))root.dataset.labels=String(shown);
  if(labels.inert===shown){labels.inert=!shown;labels.setAttribute('aria-hidden',String(!shown));}
  if(!shown||!engine)return;
  const box=focus.getBoundingClientRect(),s=stage.getBoundingClientRect();
  const notes=[...labels.querySelectorAll('[data-node]')].map(label=>{
   const part=label.dataset.node,notch=label.hasAttribute('data-tear-action')&&engine.project(selected,'WrapperTearNotch');
   return {label,width:label.offsetWidth,textWidth:label.querySelector('.mood-part-text')?.offsetWidth||140,p:notch||engine.project(selected,part)};
  }).sort((a,b)=>(a.p?.y||0)-(b.p?.y||0));
  let bottom=-100;
  notes.forEach(({label,width,textWidth,p})=>{
   if(!p){label.hidden=true;return;}
   label.hidden=false;
   const offset=box.left-s.left,gap=7,limit=w<700?s.width-offset-2:box.width-4;
   const right=p.right-offset+gap,left=p.left-offset-width-gap,flipped=right+width>limit&&left>=4;
   const x=Math.max(4,Math.min(limit-width,flipped?left:right));
   const tear=label.hasAttribute('data-tear-action'),rise=w<700&&tear?39:22;
   const anchorY=p.y-(box.top-s.top)-rise;
   const y=Math.max(6,Math.min(box.height-44,tear?anchorY:Math.max(bottom+45,anchorY)));
   if(!tear)bottom=y;
   label.dataset.side=flipped?'left':'right';label.style.left=`${x}px`;label.style.top=`${y}px`;
   label.dataset.textSide=offset+x+34+textWidth>s.width-8?'left':'right';
  });
 }
 function updateInspectNotePosition(){
  if(!inspectNode||inspectNote.hidden||!engine)return;
  const p=engine.project(selected,inspectNode);
  if(p){
   const box=focus.getBoundingClientRect(),s=stage.getBoundingClientRect();
   const midY=p.y-(box.top-s.top);
   const clampY=Math.max(16,Math.min(box.height-inspectNote.offsetHeight-16,midY-inspectNote.offsetHeight/2));
   inspectNote.style.top=`${clampY}px`;
   const partLeft=p.left-(box.left-s.left);
   const noteWidth=inspectNote.offsetWidth||220;
   if(partLeft>noteWidth+20){
    const leftPos=Math.max(12,Math.min(partLeft-noteWidth-16,partLeft-noteWidth));
    inspectNote.style.left=`${leftPos}px`;
    inspectNote.style.right='auto';
   }else{
    const partRight=p.right-(box.left-s.left);
    if(box.width-partRight>noteWidth+20){
     inspectNote.style.left=`${partRight+16}px`;
     inspectNote.style.right='auto';
    }else{
     inspectNote.style.left='16px';
     inspectNote.style.right='auto';
    }
   }
   inspectNote.style.transform='none';
  }
 }
 function tick(now){
  frame=0;
  const activeTween=Boolean(inspectionTween||storyTween||phaseTween||familyTween||focusTween||poseTween||foilTween||unrollTween||inspectTween||cartonTween||orbitTween);
  if(scope.disposed||(!visible&&!activeTween)||document.hidden){last=0;return;}
  const reveal=smoke.frame,finite=activeTween,steering=Math.abs(phaseTarget-phase)>.0005||Math.abs(velocity)>.001,interval=(reveal||finite||steering||orbitDrag)?15:32;
  if(!storyTween&&lastDraw&&now-lastDraw<interval){invalidate();return;}
  const elapsed=last?now-last:16,dt=Math.min(50,elapsed);last=lastDraw=now;if(!enginePromise)boot();
  if(motion()&&!paused){if(!wheelHeld()&&!smoke.busy)time+=dt/1000;if(['all','family'].includes(mode)&&!phaseTween){const next=wheelMotionStep({phase,target:phaseTarget,velocity,dt,held:wheelHeld(),coasting:now-lastSteer>100});phase=next.phase;phaseTarget=next.target;velocity=next.velocity;if(mode==='family'&&!wheelHeld()){const drift=(.12*TAU/members.length-.008)*dt/1000;phase+=drift;phaseTarget+=drift;}if(manualTurn&&Math.abs(phaseTarget-phase)<.002&&Math.abs(velocity)<.002)manualTurn=false;}}
  const completions=[];
  // Commit the new scene only when the outgoing product is fully covered.
  const covered=reveal?.veil>=.99&&reveal.subject<=.01;
  if(covered){
   if(storyTween)storyTween.elapsed=storyTween.duration;
   if(focusTween&&cinemaOpen&&!inside&&mode==='focus')focusTween.elapsed=focusTween.duration;
  }
  {const a=advance(inspectionMix,inspectionTween,orbitTween?elapsed:dt);inspectionMix=a[0];inspectionTween=a[1];if(a[2])completions.push(a[2]);}
  if(storyTween&&(!smoke.busy||covered)){
   const transition=storyTween;
   const [position,next,done]=advance(storyPosition,transition,dt);
   storyPosition=position;storyTween=next;
   if(done)completions.push(done);
   const handoff=family==='gummies'?gummyHandoff(position,transition,members.length):null;
   let slot=slotAt(position);
   if(handoff&&transition){
    const goingNext=transition.to>transition.from;
    const destIdx=goingNext?handoff[1]:handoff[0];
    const origIdx=goingNext?handoff[0]:handoff[1];
    slot=members[destIdx.alpha>=.20?destIdx.index:origIdx.index];
   }
   if(slot!==selected){selected=slot;describe(slot);}
  }
  if(mode==='story'&&!storyTween&&!smoke.busy&&!paused&&motion()&&!storyHeld&&!storyModelHeld&&!cinema.contains(document.activeElement)&&!$('.mood-cinema-information').open){storyElapsed+=dt;if(storyElapsed>=STORY_DWELL)shiftStory(1);}
  for(const key of ['phase','family','focus','pose']){const pair=key==='phase'?advance(phase,phaseTween,dt):key==='family'?advance(familyAmount,familyTween,dt):key==='focus'?advance(focusAmount,focusTween,cinemaOpen&&family==='gummies'?elapsed:dt):advance(pose,poseTween,dt);if(key==='phase'){phase=pair[0];phaseTween=pair[1];}else if(key==='family'){familyAmount=pair[0];familyTween=pair[1];}else if(key==='focus'){focusAmount=pair[0];focusTween=pair[1];}else{pose=pair[0];poseTween=pair[1];}if(pair[2])completions.push(pair[2]);}
  for(const key of ['foil','unroll','inspect']){const pair=key==='foil'?advance(foil,foilTween,dt):key==='unroll'?advance(unroll,unrollTween,dt):advance(inspectAmount,inspectTween,dt);if(key==='foil'){foil=pair[0];foilTween=pair[1];}else if(key==='unroll'){unroll=pair[0];unrollTween=pair[1];}else{inspectAmount=pair[0];inspectTween=pair[1];}if(pair[2])completions.push(pair[2]);}
  {const pair=advance(carton,cartonTween,dt);carton=pair[0];cartonTween=pair[1];if(pair[2])completions.push(pair[2]);}
  {const pair=advance(orbitProgress,orbitTween,elapsed);orbitProgress=pair[0];orbitTween=pair[1];if(pair[2])completions.push(pair[2]);}
  const target=focusAmount<=0?null:cinemaOpen&&(!inside||orbitTween)?(storyFrame??=frameBox()):frameBox();
  const cinematicAngle=orbitProgress>0&&orbitProgress<1?productOrbit(orbitProgress):null;
  const clippedReveal=reveal&&w<=900&&clip.top>64;
  const revealTop=clip.top+80, revealHeight=Math.max(0,clip.bottom-revealTop);
  if(clippedReveal){
   root.toggleAttribute('data-product-smoke-clipped',true);
   root.style.setProperty('--product-smoke-mark-y',`${revealTop+revealHeight*.22}px`);
   root.style.setProperty('--product-smoke-plume-y',`${revealTop+revealHeight*.55}px`);
  }else if(root.hasAttribute('data-product-smoke-clipped')){
   root.removeAttribute('data-product-smoke-clipped');
   root.style.removeProperty('--product-smoke-mark-y');
   root.style.removeProperty('--product-smoke-plume-y');
  }
  const gummySwap=family==='gummies'&&storyTween?gummyHandoff(storyPosition,storyTween,members.length):null;
  const hoverEase=1-Math.exp(-dt/90);
  const placements=ringOrder.map((_,slot)=>{
   let p;
   hover[slot]+=(Number(slot===hovered)-hover[slot])*hoverEase;
   if(cinemaOpen){
   const index=members.indexOf(slot),scene=gummySwap?.find(item=>item.index===index);
   if(index<0||(gummySwap&&!scene))return {alpha:0};
   p=cinemaPose(index,storyPosition,{width:w,height:h,time,count:members.length,family,morph:focusAmount,hover:hover[slot],distance:scene?.distance});
   if(inspectionMix>0)p=focusPlacement(p,target,inspectionMix,slot===selected);
   if(reveal&&slot===selected){
    const compact=w<=900;
    const y=clippedReveal?revealTop+revealHeight*.57:h*(compact?.53:.56);
    const height=clippedReveal?Math.min(p.height*.9,revealHeight*.50):p.height*(compact?.9:.79);
    p.x=mix(p.x,w*.5,reveal.framing);
    p.y=mix(p.y,y,reveal.framing);
    p.height=mix(p.height,height,reveal.framing);
    p.gather=reveal.gather;
   }
   if(family==='gummies'&&(gummySwap||slot===selected)&&p.alpha>.008){
    const entry=entryFor(slot,true);
    p.effect=flavourSplash(entry);
    p.effectGrade=flavourMediaGrade(entry);
    const splashSettle=clamp01(1-Math.abs(scene?.distance??0)/0.25);
     p.effectAlpha=p.alpha*focusAmount*(1-inspectionMix)*splashSettle;
   }
   }else{
    const all=circlePlacement(slot,phase,w,h,time),index=members.indexOf(slot);
    const collection=index>=0?cinemaPose(index,-phase*members.length/TAU,{width:w,height:h,time,count:members.length,family}):{...all,alpha:0};
    p=blendPlacement(all,collection,familyAmount);
    p.height*=1+hover[slot]*.13;
    p.yaw+=hover[slot]*pointer.x*.18;
   }
   if(focusAmount>0){
    if(!cinemaOpen)p=focusPlacement(p,target,focusAmount,slot===selected);
    if(slot!==selected)return p;
    p.pose=mix(p.pose||0,pose,focusAmount);p.carton=carton;p.foil=(cinemaOpen&&!inside)?0:foil;p.unroll=unroll;p.inspectNode=inspectNode;p.inspectAmount=inspectAmount;p.aspect=target.width/target.height;
    if(inspectAmount>0){
     const wrapper=p.inspectNode==='Wrapper';
     if(w>600){p.height*=mix(1,wrapper?1.12:.78,inspectAmount);p.inspectWidthFraction=.53;}
     else{const box=focus.getBoundingClientRect(),origin=stage.getBoundingClientRect(),noteHeight=inspectNote.offsetHeight,available=Math.max(80,box.height-noteHeight-36),modelHeight=wrapper?Math.min(322,available*1.08):Math.min(280,available);p.y=mix(p.y,box.top-origin.top+16+available/2,inspectAmount);p.height=mix(p.height,modelHeight,inspectAmount);p.aspect=mix(p.aspect,target.width/modelHeight,inspectAmount);p.inspectWidthFraction=.9;}
    }
    if(inspectNode){const angles={Filter:[-.58,.24],StorageTube:[.28,-.28],TubeCap:[-.5,.35],RollingPaper:[-.17,.3],HempFlower:[-.12,.2],Mouthpiece:[-.1,.3],Cartridge:[.10,.28],DeviceHousing:[-.1,-.25],Packaging:[.12,-.34],Wrapper:[.29,.24],Collar:[-.45,.22],Roll_1:[-.12,.2]}[inspectNode]||[0,.08];p.pitch=mix(p.pitch,angles[0],inspectAmount);p.yaw=mix(p.yaw,angles[1],inspectAmount);}
    if(cinematicAngle){
     p.yaw+=cinematicAngle.yaw;
     p.pitch+=cinematicAngle.pitch;
     p.tilt+=cinematicAngle.roll;
     const zoom=w<700?(family==='gummies'?.21:.11):.12;
     p.height*=1+cinematicAngle.zoom*zoom;
    }
    p.yaw+=orbitY;p.pitch+=orbitX;
   }
   return p;
  });
  placements.forEach((p,slot)=>{
   const b=buttons[slot];
   if(p.alpha<=.008){if(b.style.opacity!=='0')b.style.opacity='0';return;}
   if(cinemaOpen&&b.dataset.live==='true'){
    const opacity=String(p.alpha);
    if(b.style.opacity!==opacity)b.style.opacity=opacity;
    return;
   }
   const product=moodProducts[ringOrder[slot]],ratio=product.family==='gummies'?1.03:product.family==='pre-rolls'?.46:mix(.28,.9,p.fit||0),rawWidth=p.height*ratio,bw=Math.max(44,Math.abs(Math.cos(p.tilt))*rawWidth+Math.abs(Math.sin(p.tilt))*p.height+8),bh=Math.max(44,Math.abs(Math.cos(p.tilt))*p.height+Math.abs(Math.sin(p.tilt))*rawWidth+8);b.style.width=`${bw}px`;b.style.height=`${bh}px`;b.style.transform=`translate3d(${p.x-bw/2}px,${p.y-bh/2}px,0)`;b.style.opacity=String(p.alpha);b.style.zIndex=String(Math.round(p.depth));if(b.dataset.live==='true')return;const preview=b.querySelector('[data-mood-preview]'),img=b.querySelector('img');const image=product.deviceImage&&p.fit<=.5?'assets/'+product.deviceImage:img.dataset.src;if(img.getAttribute('src')!==image)img.src=image;preview.style.width=`${rawWidth}px`;preview.style.height=`${p.height}px`;preview.style.transform=`translate(-50%,-50%) rotate(${-p.tilt}rad) rotateY(${p.yaw}rad)`;});
  root.style.setProperty('--cinema-copy-opacity',String(storyTween&&!smoke.busy?Math.abs(Math.cos(Math.PI*clamp01(storyTween.elapsed/storyTween.duration))):1));
  if(!reveal||reveal.subject>.01||completions.length)
   engine?.draw(placements,w,h,clip,allowCinemaMedia()&&['focus','story'].includes(mode));
  syncCinema();annotate();updateInspectNotePosition();root.dataset.moodPhase=phase.toFixed(4);root.dataset.moodPose=pose.toFixed(4);root.dataset.moodFocus=focusAmount.toFixed(4);root.dataset.moodCollection=family||'';root.dataset.moodFamilyAmount=familyAmount.toFixed(4);root.dataset.moodSelection=selected<0?'':entryFor(selected,true).id;root.style.setProperty('--detail-progress',String(focusAmount));root.style.setProperty('--family-progress',String(familyAmount*(1-focusAmount)));root.dataset.moodCarton=carton.toFixed(4);root.dataset.moodUnroll=unroll.toFixed(4);root.dataset.moodFoil=foil.toFixed(4);root.dataset.inspectedPart=inspectNode||'';root.dataset.inspectAmount=inspectAmount.toFixed(4);root.style.setProperty('--inspect-copy-progress',String(clamp01((inspectAmount-.55)/.45)));syncFilm();completions.forEach(fn=>fn());if(completions.length)journeyUI();
  if(mode==='family'&&pendingSlot>=0&&autoHold>0){autoHold-=dt;if(autoHold<=0){const slot=pendingSlot;pendingSlot=-1;openProduct(slot,{rotate:false});}}
  const settling=hover.some((v,i)=>Math.abs(v-Number(i===hovered))>.01);if(activeTween||(mode==='story'&&!paused&&motion())||settling||autoHold>0||(motion()&&!paused&&!wheelHeld()&&['all','family'].includes(mode))){if(!scope.disposed)frame=requestAnimationFrame(tick);}else last=0;
 }
 function steer(delta,now,cancelAuto=true){if(!['all','family'].includes(mode)||(pendingSlot>=0&&!cancelAuto)||(!cancelAuto&&wheelHeld()))return;manualTurn=cancelAuto;const bounded=Math.max(-.22,Math.min(.22,delta));phaseTarget+=bounded;velocity=Math.max(-.7,Math.min(.7,bounded*18));lastSteer=now;if(!motion()||paused){phase=phaseTarget;velocity=0;manualTurn=false;}pendingSlot=-1;autoHold=0;invalidate();}
 scope.on(stage,'pointerdown',e=>{if(!['all','family'].includes(mode)||e.button!==0)return;const r=stage.getBoundingClientRect(),m=ringMetrics(w,h);wheelDrag={id:e.pointerId,x:e.clientX,y:e.clientY,angle:Math.atan2(e.clientY-r.top-m.y,e.clientX-r.left-m.x),moved:false};lastPointer=null;});
 scope.on(stage,'pointermove',e=>{if(!['all','family'].includes(mode))return;const r=stage.getBoundingClientRect(),m=ringMetrics(w,h),dx=e.clientX-r.left-m.x,dy=e.clientY-r.top-m.y,angle=Math.atan2(dy,dx),radius=Math.hypot(dx,dy),now=performance.now();pointer.x=dx/Math.max(1,m.radius);pointer.y=dy/Math.max(1,m.radius);
  if(mode==='family'){if(wheelDrag){const dx=e.clientX-wheelDrag.x;if(!wheelDrag.moved&&Math.abs(dx)>9&&Math.abs(dx)>Math.abs(e.clientY-wheelDrag.y)*1.2){wheelDrag.moved=true;stage.setPointerCapture(e.pointerId);}if(wheelDrag.moved){steer(dx/Math.max(1,w)*2,now);wheelDrag.x=e.clientX;e.preventDefault();}}return;}
  if(wheelDrag){if(!wheelDrag.moved&&Math.hypot(e.clientX-wheelDrag.x,e.clientY-wheelDrag.y)>6){wheelDrag.moved=true;stage.setPointerCapture(e.pointerId);}if(wheelDrag.moved){steer(angleDelta(wheelDrag.angle,angle),now);wheelDrag.angle=angle;e.preventDefault();}}
  else if(e.pointerType==='mouse'&&radius>m.radius*.58&&radius<m.radius*1.5){if(lastPointer!==null)steer(angleDelta(lastPointer,angle)*.75,now,false);lastPointer=angle;}else lastPointer=null;
 });
 const endWheel=e=>{if(wheelDrag?.moved)ignoreClickUntil=performance.now()+250;wheelDrag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);};scope.on(stage,'pointerup',endWheel);scope.on(stage,'pointercancel',endWheel);scope.on(stage,'lostpointercapture',endWheel);scope.on(stage,'pointerleave',()=>{lastPointer=null;});
 scope.on(stage,'wheel',e=>{if(!['all','family'].includes(mode)||(!e.shiftKey&&Math.abs(e.deltaX)<=Math.abs(e.deltaY)))return;e.preventDefault();steer((e.deltaX||e.deltaY)*.002,performance.now());},{passive:false});
 buttons.forEach((b,slot)=>{scope.on(b,'click',e=>{if(performance.now()<ignoreClickUntil)return;focusAfterOpen=e.detail===0;pointed=focused=-1;manualTurn=false;if(mode==='all')enterFamily(slot);else if(mode==='family')openProduct(slot);});scope.on(b,'pointerenter',e=>{if(!b.disabled&&e.pointerType==='mouse'){pointed=slot;manualTurn=false;updateHover();}});scope.on(b,'pointerleave',()=>{if(pointed===slot)pointed=-1;updateHover();});scope.on(b,'focus',()=>{if(!b.disabled&&b.matches(':focus-visible')){focused=slot;manualTurn=false;updateHover();}});scope.on(b,'blur',()=>{if(focused===slot)focused=-1;updateHover();});});
 scope.on(root,'keydown',e=>{if(mode==='story'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();shiftStory(e.key==='ArrowRight'?1:-1);return;}if(mode==='family'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();turnBelt(e.key==='ArrowRight'?1:-1);return;}if(mode==='detail'&&chapters.length&&['PageDown','PageUp'].includes(e.key)){e.preventDefault();stepChapter(e.key==='PageDown'?1:-1);}else if(e.key==='Escape'){e.preventDefault();if(inspectNode)clearInspection();else backOne();}else if(['all','family'].includes(mode)&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();pendingSlot=-1;autoHold=0;manualTurn=true;phaseTarget+=(e.key==='ArrowRight'?1:-1)*TAU/(mode==='all'?16:Math.max(1,members.length));velocity=0;if(!motion()||paused){phase=phaseTarget;manualTurn=false;}lastSteer=performance.now();invalidate();}});
 scope.on($('[data-cinema-prev]'),'click',()=>shiftStory(-1));scope.on($('[data-cinema-next]'),'click',()=>shiftStory(1));scope.on($('[data-cinema-inside]'),'click',lookInside);
 scope.on($('[data-cinema-model]'),'click',lookInside);
 if(insideButton)scope.on(insideButton,'click',lookInside);
 scope.on(cinemaDots,'click',e=>{const b=e.target.closest('[data-cinema-index]');if(b)shiftStory(0,Number(b.dataset.cinemaIndex));});
 scope.on($('[data-belt-prev]'),'click',()=>turnBelt(-1));scope.on($('[data-belt-next]'),'click',()=>turnBelt(1));
 scope.on(cinemaCopy,'pointerenter',()=>storyHeld=true);scope.on(cinemaCopy,'pointerleave',()=>{storyHeld=false;invalidate();});scope.on(cinema,'focusout',()=>invalidate());
 scope.on(cinema,'focusin',e=>{
  if(smoke.busy&&!e.target.closest('.mood-cinema-navigation')){
   focusAfterOpen=false;
   smoke.finish();
  }
 });
 scope.on(root,'wheel',e=>{if(mode!=='story'||e.ctrlKey||Math.abs(e.deltaX)<15||Math.abs(e.deltaX)<Math.abs(e.deltaY)*1.25)return;e.preventDefault();if(performance.now()-lastStoryWheel>600){lastStoryWheel=performance.now();shiftStory(e.deltaX>0?1:-1);}},{passive:false});
 scope.on(root,'pointermove',e=>{if(mode!=='story'||e.pointerType!=='mouse')return;const box=stage.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;storyModelHeld=x>w*.34&&x<w*.75&&y>h*.25&&y<h*.80;});scope.on(root,'pointerleave',()=>{storyModelHeld=false;storyHeld=false;invalidate();});
 scope.on(root,'pointerdown',e=>{if(mode==='story'&&e.pointerType==='touch')storyGesture={x:e.clientX,y:e.clientY};});scope.on(root,'pointerup',e=>{if(!storyGesture)return;const dx=e.clientX-storyGesture.x,dy=e.clientY-storyGesture.y;storyGesture=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3)shiftStory(dx<0?1:-1);});scope.on(root,'pointercancel',()=>storyGesture=null);
 scope.on(skipStudy,'click',skipStudyReveal);
 scope.on(replayStudy,'click',startStudyReveal);
 scope.on(journeyNext,'click' ,()=>{alignCollection();stepChapter(1);});scope.on(journeyPrev,'click',()=>{alignCollection();stepChapter(-1);});scope.on($('[data-journey-main]'),'click',backToMain);
 scope.on($('[data-product-information]'),'toggle',()=>fitDetail());

 scope.on(root,'dragstart' ,e=>e.preventDefault());scope.on(back,'click',backOne);scope.on(assemble,'click',assembleProduct);scope.on(pause,'click',()=>{paused=!paused;if(paused){skipStudyReveal();studyLighting?.cancel();smoke.finish();}ui();invalidate();});
 scope.on(labels,'click',e=>{const b=e.target.closest('[data-node]');if(b){e.stopPropagation();inspectPart(b.dataset.node);}});
 scope.on(focus,'pointerdown',e=>{if(e.button===0)detailPointer={x:e.clientX,y:e.clientY,moved:false};});scope.on(focus,'pointermove',e=>{if(detailPointer&&Math.hypot(e.clientX-detailPointer.x,e.clientY-detailPointer.y)>7)detailPointer.moved=true;});scope.on(focus,'pointerup',e=>{if(detailPointer?.moved){ignoreClickUntil=performance.now()+250;}detailPointer=null;});scope.on(focus,'pointercancel',()=>detailPointer=null);
 scope.on(focus,'click',e=>{if(performance.now()<ignoreClickUntil||e.target.closest('button,aside')||mode!=='detail'||poseTween||foilTween||unrollTween||inspectTween||cartonTween)return;const r=stage.getBoundingClientRect(),name=engine?.pick(selected,e.clientX-r.left,e.clientY-r.top);if(name)inspectPart(name);});
 scope.on(inspectBack,'click',()=>clearInspection());
 scope.on(wrapperReset,'click',()=>{
  focus.focus({preventScroll:true});
  animateFoil(0,()=>{clearInspection();say('Wrapper reset.');});
 });
 scope.on(cartonReset,'click',()=>clearInspection(()=>{cartonTween=tween(carton,0,950,()=>{refreshParts();ui();say('Carton closed.');});ui();invalidate();}));scope.on(unrollButton,'click',unrollProduct);
 scope.on(retry,'click',async()=>{if(!engine){location.reload();return;}retry.disabled=true;const request=++token,ok=await engine.retry(selected);if(scope.disposed||request!==token)return;retry.disabled=false;if(ok){rendererFailed=false;retry.hidden=true;if(currentEntry?.family!=='gummies'){opened=true;poseTween=tween(pose,1,2100,()=>ui());}ui();invalidate();}});
 scope.on(stage,'ehf-mood-renderer-failed',()=>{engine=null;enginePromise=Promise.resolve(null);rendererFailed=true;assemble.hidden=true;retry.hidden=false;retry.textContent='Reload 3D view';say('The 3D view is unavailable. Reload the view to try again.');skipStudyReveal();invalidate();});
 scope.own(new IntersectionObserver(entries=>{if(entries[0].intersectionRatio>0)boot();},{threshold:[0,.01]})).observe(root);scope.on(window,'scroll',queueMeasure,{passive:true});scope.own(new ResizeObserver(queueMeasure)).observe(root);scope.own(new IntersectionObserver(queueMeasure,{threshold:0})).observe(root);scope.on(document,'visibilitychange',()=>{last=0;if(document.hidden){backdrop.pause();engine?.pauseCinema();}syncFilm();invalidate();});scope.on(reduced,'change',()=>{ui();invalidate();});scope.own(new MutationObserver(()=>{ui();invalidate();})).observe(document.body,{attributes:true,attributeFilter:['class']});scope.on(document,'ehf-wheel-pop',restoreRoute);
 scope.cleanup(()=>{backdrop.pause();token++;cancelAnimationFrame(frame);cancelAnimationFrame(measureFrame);film.pause();film.removeAttribute('src');film.load();splashVideo.pause();splashVideo.removeAttribute('src');splashVideo.load();delete document.body.dataset.moodVisible;});
 history.replaceState({...history.state,ehfWheel:true,ehfWheelLevel:Number(history.state?.ehfWheelLevel)||0},'',location.href);ui();measure();
 let interacted=false;scope.on(root,'pointerdown',()=>interacted=true,{once:true});requestAnimationFrame(()=>{if(scope.disposed)return;const u=new URL(location.href);if(!interacted&&(u.hash==='#collections'||(!u.hash&&u.searchParams.has('collection'))))root.scrollIntoView({block:'start',behavior:'instant'});const initial=root.dataset.initialCollection,legacy=u.searchParams.get('flavour');if(!u.searchParams.has('collection')&&(initial||legacy)){u.searchParams.set('collection',legacy?'vapes':initial);if(legacy&&moodProducts.some(p=>p.id===legacy)){u.searchParams.set('product',legacy);u.searchParams.delete('flavour');}history.replaceState(history.state,'',u);}if(u.searchParams.has('collection'))restoreRoute();});
}

