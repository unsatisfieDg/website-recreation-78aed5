// A quiet filmed intermission. Decode only while its compact frame is on screen.
export function initHempInterlude(scope){
 const video=document.querySelector('[data-interlude-film]');if(!video)return;
 const section=video.closest('.hemp-interlude'),toggle=section.querySelector('[data-interlude-toggle]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=false,paused=false,starting=false,failed=false;
 const allowed=()=>!scope.disposed&&!failed&&!reduced.matches&&!document.hidden&&!document.body.classList.contains('motion-off')&&!document.documentElement.classList.contains('cinema-pending');
 function sync(){
  const still=reduced.matches||document.body.classList.contains('motion-off')||failed;
  toggle.disabled=still;toggle.setAttribute('aria-pressed',String(paused||still));
  toggle.setAttribute('aria-label',still?'Hemp film still':paused?'Play hemp film':'Pause hemp film');
  if(!visible||paused||!allowed()){video.pause();return;}
  if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}
  if(!video.paused||starting)return;starting=true;
  video.play().catch(()=>{}).finally(()=>{starting=false;if(!visible||paused||!allowed())video.pause();});
 }
 scope.own(new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.01})).observe(section);
 const preferences=scope.own(new MutationObserver(sync));
 preferences.observe(document.body,{attributes:true,attributeFilter:['class']});
 preferences.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 scope.on(toggle,'click',()=>{paused=!paused;sync();});
 scope.on(reduced,'change',sync);scope.on(document,'visibilitychange',sync);
 scope.on(video,'error',()=>{failed=true;video.removeAttribute('src');video.load();sync();});
 scope.cleanup(()=>{video.pause();video.removeAttribute('src');video.load();});
 sync();
}
