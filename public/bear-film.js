export function initBearFilm(scope){
 document.querySelectorAll('[data-bear-story],[data-knowledge-film],[data-footer-film]').forEach(root=>mountFilm(root,scope));
}
function mountFilm(root,scope){
 const video=root.querySelector('video'),button=root.querySelector('[data-bear-toggle],[data-knowledge-film-toggle],[data-footer-film-toggle]'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=video.dataset.mobileSrc?matchMedia('(max-width: 760px)'):null;
 const name=root.hasAttribute('data-knowledge-film')?'details background':root.hasAttribute('data-footer-film')?'footer background':'bear';
 let visible=false,paused=false,starting=false,failed=false;
 const still=()=>failed||reduced.matches||document.body.classList.contains('motion-off');
 const allowed=()=>visible&&!paused&&!still()&&!document.hidden&&!scope.disposed;
 function sync(){
  button.disabled=still();button.setAttribute('aria-pressed',String(paused||still()));button.setAttribute('aria-label',still()?`${name} film still`:paused?`Play ${name} film`:`Pause ${name} film`);
  const label=button.querySelector('[data-film-label]');if(label)label.textContent=still()?'Still':paused?'Play film':'Pause film';
  if(!allowed()){video.pause();return;}
  const source=mobile?.matches?video.dataset.mobileSrc:video.dataset.src;
  if(video.getAttribute('src')!==source){video.src=source;video.load();}
  if(starting||!video.paused)return;starting=true;video.play().catch(()=>{}).finally(()=>{starting=false;if(!allowed())video.pause();});
 }
 const strip=root.hasAttribute('data-knowledge-film')?root.querySelector('.studies-intro'):(root.querySelector('.bear-story__film,.footer-campaign__art')||root);
 if(root.hasAttribute('data-knowledge-film')){const fit=()=>root.style.setProperty('--details-film-height',`${Math.max(0,strip.getBoundingClientRect().bottom-root.getBoundingClientRect().top)}px`);scope.own(new ResizeObserver(fit)).observe(strip);scope.on(window,'resize',fit);fit();}
 scope.own(new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.12})).observe(strip);
 const preferences=scope.own(new MutationObserver(sync));preferences.observe(document.body,{attributes:true,attributeFilter:['class']});
 scope.on(button,'click',()=>{paused=!paused;sync();});scope.on(reduced,'change',sync);if(mobile)scope.on(mobile,'change',sync);scope.on(document,'visibilitychange',sync);
 scope.on(video,'error',()=>{failed=true;video.removeAttribute('src');video.load();sync();});
 scope.cleanup(()=>{video.pause();video.removeAttribute('src');video.load();});sync();
}
