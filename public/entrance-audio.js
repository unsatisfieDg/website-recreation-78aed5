// Local field-recording mix. Every sound stops when the entrance is dismissed.
export function initEntranceAudio(screen,scope){
 const audio=screen.querySelector('[data-cinema-ambience]'),button=screen.querySelector('[data-cinema-sound]'),label=screen.querySelector('[data-cinema-sound-label]');
 let wanted=true,leaving=false,pending=false,fade=0,revision=0;
 try{wanted=localStorage.getItem('ehf-ambience')!=='off';}catch{}
 audio.volume=0;
 const target=.7;
 const save=()=>{try{localStorage.setItem('ehf-ambience',wanted?'on':'off');}catch{}};
 function ui(){const on=!audio.paused;button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Mute landing ambience':'Enable landing ambience');label.textContent=on?'Sound on':'Sound off';}
 function fadeTo(value,duration,finish){
  cancelAnimationFrame(fade);const from=audio.volume,start=performance.now();
  const tick=now=>{const p=Math.min(1,(now-start)/duration);audio.volume=from+(value-from)*(p*p*(3-2*p));if(p<1)fade=requestAnimationFrame(tick);else{fade=0;finish?.();}};
  fade=requestAnimationFrame(tick);
 }
 function stop(){revision++;cancelAnimationFrame(fade);fade=0;audio.pause();audio.volume=0;ui();}
 function play(){
  if(pending||leaving||!wanted||document.hidden)return;
  const current=++revision;pending=true;
  audio.play().then(()=>{
   if(current!==revision||leaving||!wanted||document.hidden){audio.pause();return;}
   fadeTo(target,1100);ui();
  }).catch(()=>{ui();}).finally(()=>{pending=false;});
 }
 scope.on(button,'click',()=>{
  if(!audio.paused){wanted=false;save();stop();}
  else{wanted=true;save();play();}
 });
 // Autoplay can be declined; a real click on the film can then enable ambience.
 scope.on(screen,'pointerdown',event=>{
  if(!event.isTrusted||event.target.closest('button')||!wanted||leaving)return;play();
 },{passive:true});
 scope.on(audio,'play',ui);scope.on(audio,'pause',ui);
 scope.on(audio,'error',()=>{stop();button.disabled=true;label.textContent='Sound unavailable';button.setAttribute('aria-label','Landing ambience unavailable');});
 scope.on(document,'visibilitychange',()=>{if(document.hidden)stop();else play();});
 scope.cleanup(()=>{leaving=true;stop();});
 ui();play();
 return {
  fadeOut(duration){leaving=true;revision++;if(audio.paused)return;fadeTo(0,duration,stop);},
  stop(){leaving=true;stop();}
 };
}
