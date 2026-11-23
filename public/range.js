import {createPageScope} from './page-scope.js?v=5fbc86d3ec7f';
import {products} from './catalogue.js?v=9ae734471d9d';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export function initRangeMotion(scope=createPageScope()){
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const motion=()=>!document.body.classList.contains('motion-off');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 document.body.classList.add('range-enhanced');
 // Retire one-time entrances after they finish, including during screenshots and page transitions.
 $$('.hero-line,.hero-script').forEach(el=>scope.on(el,'animationend',e=>{if(e.animationName==='enter-up')el.style.animation='none';}));
 const stage=$('[data-stage]');let chosen='vapes';
 function choose(id){const product=products.find(p=>p.id===id);if(!product)return;chosen=id;if(stage)stage.dataset.focus=id;$$('[data-hero-format]').forEach(el=>{const active=el.dataset.heroFormat===id;el.classList.toggle('is-active',active);el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});if($('[data-hero-link]'))$('[data-hero-link]').href=`${id}.html`;if($('[data-hero-label]'))$('[data-hero-label]').textContent=`Explore ${product.name}`;}
 $$('[data-hero-format]').forEach(el=>scope.on(el,'click',()=>choose(el.dataset.heroFormat)));
 scope.on(stage,'pointermove',e=>{if(!motion()||!fine.matches)return;const r=stage.getBoundingClientRect();stage.style.setProperty('--stage-x',`${(e.clientX-r.left-r.width/2)/r.width*10}deg`);stage.style.setProperty('--stage-y',`${-(e.clientY-r.top-r.height/2)/r.height*7}deg`);});
 scope.on(stage,'pointerleave',()=>{stage.style.setProperty('--stage-x','0deg');stage.style.setProperty('--stage-y','0deg');});

 $$('[data-tilt]').forEach(card=>{scope.on(card,'pointermove',e=>{if(!fine.matches||!motion())return;const r=card.getBoundingClientRect();card.style.setProperty('--tilt-x',`${(e.clientX-r.left-r.width/2)/r.width*12}deg`);card.style.setProperty('--tilt-y',`${-(e.clientY-r.top-r.height/2)/r.height*10}deg`);});scope.on(card,'pointerleave',()=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});});
 // Decorative CSS motion sleeps outside the viewport, including behind the entrance.
 const sceneObserver=scope.own(new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('scene-resting',!entry.isIntersecting)),{rootMargin:'60px'}));
 $$('.hero,.marquee,.product-gallery').forEach(element=>sceneObserver.observe(element));
 const cursor=$('.explore-cursor');
 $$('[data-explore-cursor]').forEach(el=>{scope.on(el,'pointermove',e=>{if(!cursor||!motion()||!fine.matches)return;cursor.classList.add('visible');cursor.style.transform=`translate(${e.clientX-46}px,${e.clientY-46}px)`;});scope.on(el,'pointerleave',()=>cursor?.classList.remove('visible'));scope.on(el,'click',()=>cursor?.classList.remove('visible'));});
 scope.on(document,'visibilitychange',()=>{document.body.classList.toggle('page-resting',document.hidden);if(document.hidden)cursor?.classList.remove('visible');});
}
