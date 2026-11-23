const VISITED='ehf-cinema-entered-v1';
import {initEntranceAudio} from './entrance-audio.js?v=0d53ac4eb4af';

export function shouldShowEntrance({page,hash='',search='',visited=false}){
 const params=new URLSearchParams(search);
 return page==='home'&&!hash&&!params.has('collection')&&!params.has('product')&&(params.get('intro')==='1'||!visited);
}
const EXIT_MS = 760;
// Reveal the wordmark over the film before the short homepage crossfade.
export function revealPoint(duration){return Number.isFinite(duration)&&duration>0?Math.min(1.6,duration):1.6;}
// Startup alone is not enough evidence. Use the graceful still treatment only
// after a substantial sample shows that more than one fifth of frames are lost.
export function shouldHoldEntranceFrame(total,dropped){return Number.isFinite(total)&&Number.isFinite(dropped)&&total>=40&&dropped/total>.22;}

// Count visible, unpaused time only; leaving the page permanently cancels the handoff.
export function createEntranceCountdown(finish,{delay=2000,now=()=>performance.now(),schedule=setTimeout,unschedule=clearTimeout}={}){
 let remaining=delay,started=0,timer=null,active=false,done=false;
 return {
  resume(){if(done||active)return;active=true;started=now();timer=schedule(()=>{active=false;done=true;timer=null;finish();},remaining);},
  pause(){if(!active)return;remaining=Math.max(0,remaining-(now()-started));unschedule(timer);timer=null;active=false;},
  cancel(){unschedule(timer);timer=null;active=false;done=true;}
 };
}

export function initEntrance(scope){
 const screen=document.querySelector('.cinema-gateway');
 if(!screen){document.documentElement.classList.remove('cinema-pending');return;}
 let visited=false;try{visited=sessionStorage.getItem(VISITED)==='yes';}catch{}
 if(!shouldShowEntrance({page:document.body.dataset.page,hash:location.hash,search:location.search,visited})){
  document.documentElement.classList.remove('cinema-pending');return;
 }
 const root=document.documentElement,video=screen.querySelector('video'),skip=screen.querySelector('[data-cinema-skip]'),motion=screen.querySelector('[data-cinema-motion]');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let leaving=false,pausedByUser=false,revealed=false,exitTimer=0,stallTimer=0,handoffFrame=0;
 function playbackQuality(){
  const quality=video.getVideoPlaybackQuality?.();if(!quality?.totalVideoFrames)return;
  screen.dataset.decodedFrames=String(quality.totalVideoFrames);
  screen.dataset.droppedFrames=String(quality.droppedVideoFrames);
  screen.dataset.videoSize=`${video.videoWidth}x${video.videoHeight}`;
 }
 const inerted=new Map();
 for(const child of document.body.children){if(child===screen||child.tagName==='SCRIPT')continue;inerted.set(child,child.inert);child.inert=true;}
 root.classList.add('cinema-pending');screen.hidden=false;screen.dataset.ready='';screen.setAttribute('aria-modal','true');
 screen.tabIndex=-1;screen.focus({preventScroll:true});
 const ambience=initEntranceAudio(screen,scope);
 const quiet=()=>reduce.matches||document.body.classList.contains('motion-off');
 screen.style.setProperty('--cinema-exit',`${EXIT_MS}ms`);
 const countdown=createEntranceCountdown(()=>enterSite(false),{delay:quiet()?650:2000});
 function syncCountdown(){screen.dataset.timelinePaused=String(pausedByUser||document.hidden);if(revealed&&!leaving&&!pausedByUser&&!document.hidden)countdown.resume();else countdown.pause();}
 function reveal(){if(leaving||revealed)return;revealed=true;screen.classList.add('is-revealed');syncCountdown();}
 function motionUI(){
  motion.setAttribute('aria-label',pausedByUser?'Resume intro':'Pause intro');
  motion.innerHTML=pausedByUser?'<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="m3 1 8 5-8 5Z"/></svg><span>Resume intro</span>':'<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M2 1h2v10H2zm6 0h2v10H8z"/></svg><span>Pause intro</span>';
 }
 function staticMode(){if(leaving)return;clearTimeout(stallTimer);video.pause();screen.classList.add('is-static');reveal();}
 function adaptPlayback(){
  if(leaving||pausedByUser||document.hidden||screen.classList.contains('is-adaptive-still'))return;
  const quality=video.getVideoPlaybackQuality?.();
  if(quality&&shouldHoldEntranceFrame(quality.totalVideoFrames,quality.droppedVideoFrames)){
   // Retain the actual decoded frame, avoiding a jump back to the poster.
   video.pause();screen.classList.add('is-adaptive-still');screen.dataset.playback='adaptive-still';reveal();
  }
 }
 function play(){video.play().catch(()=>{staticMode();motionUI();});}
 function release(){
  leaving=true;countdown.cancel();ambience.stop();
  playbackQuality();
  clearTimeout(exitTimer);clearTimeout(stallTimer);cancelAnimationFrame(handoffFrame);video.pause();video.removeAttribute('src');video.load();screen.hidden=true;screen.removeAttribute('aria-modal');
  root.classList.remove('cinema-pending','cinema-handoff');for(const [element,wasInert]of inerted)element.inert=wasInert;
  document.querySelector('.playlist-player')?.removeAttribute('inert');
  document.dispatchEvent(new Event('ehf-entrance-released'));
 }
 function enterSite(userGesture=false){
  if(leaving)return;leaving=true;try{sessionStorage.setItem(VISITED,'yes');}catch{}
  countdown.cancel();clearTimeout(stallTimer);
  const url=new URL(location.href);if(url.searchParams.has('intro')){url.searchParams.delete('intro');history.replaceState(history.state,'',url);}
  // Hold the final filmed frame during the crossfade. This avoids simultaneously
  // decoding video and repainting the entire homepage on software graphics.
  video.pause();root.classList.add('cinema-handoff');
  const finish=()=>{
   if(scope.disposed)return;
   ambience.fadeOut(EXIT_MS);screen.classList.add('is-leaving');
   document.dispatchEvent(new CustomEvent('ehf-entrance-complete',{detail:{userGesture}}));
   exitTimer=setTimeout(()=>{release();const heading=document.querySelector('#hero-title');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});},quiet()?0:EXIT_MS);
  };
  if(quiet())finish();
  else handoffFrame=requestAnimationFrame(()=>{handoffFrame=requestAnimationFrame(finish);});
 }
 scope.on(skip,'click',()=>enterSite(true));
 scope.on(screen,'keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();enterSite(true);return;}
  if(event.key!=='Tab')return;
  const buttons=[...screen.querySelectorAll('button')].filter(b=>!b.disabled&&!b.hidden&&getComputedStyle(b).visibility!=='hidden');
  const first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===screen)){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
 scope.on(motion,'click',()=>{pausedByUser=!pausedByUser;if(pausedByUser){video.pause();reveal();}else if(!video.ended&&!screen.classList.contains('is-static')&&!screen.classList.contains('is-adaptive-still'))play();syncCountdown();motionUI();});
 scope.on(video,'play',motionUI);scope.on(video,'pause',()=>{playbackQuality();motionUI();});
 scope.on(video,'timeupdate',()=>{
  if(video.duration)screen.style.setProperty('--cinema-progress',String(Math.min(1,video.currentTime/video.duration)));
  if(video.currentTime>=revealPoint(video.duration))reveal();
  adaptPlayback();
 });
 scope.on(video,'ended',reveal);
 scope.on(video,'error',staticMode);
 scope.on(video,'waiting',()=>{clearTimeout(stallTimer);stallTimer=setTimeout(staticMode,900);});
 scope.on(video,'playing',()=>clearTimeout(stallTimer));
 scope.on(document,'visibilitychange',()=>{syncCountdown();if(document.hidden)video.pause();else if(!leaving&&!pausedByUser&&!video.ended&&!reduce.matches&&!screen.classList.contains('is-static')&&!screen.classList.contains('is-adaptive-still'))play();});
 scope.on(reduce,'change',event=>{if(event.matches)staticMode();});
 scope.cleanup(release);
 if(reduce.matches||document.body.classList.contains('motion-off')||navigator.connection?.saveData){staticMode();return;}
 video.muted=true;const source=matchMedia('(max-width: 760px)').matches?video.dataset.mobile:video.dataset.desktop;
 if(video.getAttribute('src')!==source)video.src=source;
 stallTimer=setTimeout(reveal,1800);play();
}
