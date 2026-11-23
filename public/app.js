'use strict';
import {initEntrance} from './entrance.js?v=61114bfd923d';
import {products,categories} from './catalogue.js?v=9ae734471d9d';
import {initPlaylist} from './soundscape.js?v=f3cb54df834d';
import {createPageScope} from './page-scope.js?v=5fbc86d3ec7f';
import {initNavigation} from './navigation.js?v=46193e463fb2';
// Only import route features when their surface exists.
function loadFeature(scope,selector,load,entry){
 const roots=[...document.querySelectorAll(selector)];if(!roots.length||scope.disposed)return Promise.resolve();
 return load().then(module=>{if(!scope.disposed)module[entry](scope);}).catch((err)=>{
  console.warn('Feature load error for', entry, err);
  if(scope.disposed)return;roots.forEach(root=>root.dataset.featureError='true');
 });
}
function mountPage(){
const scope=createPageScope();
let off=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{off=off||localStorage.getItem('ehf-motion')==='off';}catch{}
document.body.classList.toggle('motion-off',off);
initEntrance(scope);
initPlaylist();
mountContent(scope);
return ()=>scope.dispose();
}
function mountContent(scope){
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let motionOff=reduced.matches;
try{motionOff=motionOff||localStorage.getItem('ehf-motion')==='off';}catch{}
function setMotion(off){motionOff=off;document.body.classList.toggle('motion-off',off);document.body.classList.toggle('js-motion',!off);$$('[data-motion-toggle]').forEach(b=>{b.textContent=off?'Enable motion':'Reduce motion';b.setAttribute('aria-pressed',String(off));});}
setMotion(motionOff);
// Delegation keeps the footer and the music player's motion controls in sync.
scope.on(document,'click',e=>{if(!e.target.closest('[data-motion-toggle]'))return;setMotion(!motionOff);try{localStorage.setItem('ehf-motion',motionOff?'off':'on');}catch{}});
scope.on(reduced,'change',e=>{if(e.matches)setMotion(true);});
const header=$('.site-header');
loadFeature(scope,'[data-section-jumper]',()=>import('./section-jumper.js?v=d2729092449b'),'initSectionJumper');
function onScroll(){header?.classList.toggle('scrolled',scrollY>80);}
scope.on(window,'scroll',onScroll,{passive:true});onScroll();
const menu=$('#mobile-menu'),menuButton=$('.menu-toggle');
function closeMenu(restoreFocus=false){if(!menu)return;const wasOpen=!menu.hidden;menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');$$('main,.site-footer').forEach(el=>el.inert=false);if(!document.querySelector('dialog[open]'))document.body.classList.remove('no-scroll');if(wasOpen&&restoreFocus)menuButton.focus();}
scope.on(menuButton,'click',()=>{if(!menu.hidden){closeMenu(true);return;}menu.hidden=false;menuButton.setAttribute('aria-expanded','true');menuButton.setAttribute('aria-label','Close navigation');$$('main,.site-footer').forEach(el=>el.inert=true);document.body.classList.add('no-scroll');$('a',menu)?.focus();});
$$('a',menu||document.createElement('div')).forEach(a=>scope.on(a,'click',closeMenu));
scope.on(window,'keydown',e=>{if(!menu||menu.hidden)return;if(e.key==='Escape'){e.preventDefault();closeMenu(true);}if(e.key==='Tab'){const links=$$('a',menu);const first=links[0],last=links.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();menuButton.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();menuButton.focus();}else if(document.activeElement===menuButton){e.preventDefault();(e.shiftKey?last:first)?.focus();}}});
function toast(message){const t=$('.toast');t.textContent=message;t.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('visible'),3200);}
const observer=scope.own(new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}}),{threshold:.12}));
$$('.intro-body,.section-heading,.collection-card').forEach(el=>{el.classList.add('reveal');observer.observe(el);});

// A browser-local shortlist. This deliberately creates no order or payment.
let selection=[];
try{const saved=JSON.parse(localStorage.getItem('ehf-selection')||'[]');if(Array.isArray(saved))selection=[...new Set(saved)].filter(id=>products.some(p=>p.id===id));}catch{}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function productCard(p){return `<article class="product-card"><div class="product-image ${p.tone}"><a href="${p.id}.html" aria-label="Explore ${escapeHTML(p.name)}"><img src="assets/${p.image}" width="1000" height="1000" alt="${escapeHTML(p.alt)}" loading="lazy"></a><span class="product-format">${p.format}</span><button class="save-button" data-save="${p.id}" aria-label="Save ${escapeHTML(p.name)}" aria-pressed="${selection.includes(p.id)}"><span aria-hidden="true">${selection.includes(p.id)?'✓':'+'}</span></button></div><a class="product-name" href="${p.id}.html"><h3>${p.name}</h3><span>Discover</span></a><p>${p.note}</p></article>`;}
const featured=$('[data-featured-products]');if(featured)featured.innerHTML=products.filter(p=>p.featured).map(productCard).join('');
const overlay=$('#overlay-root');
overlay.innerHTML=`<dialog class="selection-dialog" aria-labelledby="selection-title"><div class="drawer-heading"><div><span class="small-label">YOUR EDIT</span><h2 id="selection-title">A good <em>selection.</em></h2></div><button class="close-dialog" aria-label="Close selection">×</button></div><div class="selection-content"></div><div class="selection-actions"><p>A saved list, ready when you are. This is not an order.</p><a class="button lime" data-download-selection download="ehf-your-selection.txt" href="#">Download your selection <span class="button-dot" aria-hidden="true"></span></a><a class="text-link" href="https://exclusivehempfarms.com/contact-us/" target="_blank" rel="noopener noreferrer">Contact EHF about availability</a><details class="selection-export"><summary>View a text version</summary><textarea readonly aria-label="Your selection as text" rows="7"></textarea></details></div></dialog>`;
const selectionDialog=$('.selection-dialog');
function updateSelection(){
 $$('[data-selection-count]').forEach(el=>el.textContent=String(selection.length));
 $$('[data-save]').forEach(el=>{const p=products.find(p=>p.id===el.dataset.save);const selected=selection.includes(el.dataset.save);el.setAttribute('aria-pressed',String(selected));el.setAttribute('aria-label',`${selected?'Remove':'Save'} ${p.name}${selected?' from selection':''}`);el.innerHTML=el.classList.contains('save-button')?`<span aria-hidden="true">${selected?'✓':'+'}</span>`:`${selected?'Saved to your selection':'Save to your selection'} <span class="button-dot" aria-hidden="true"></span>`;});
 $('.selection-content').innerHTML=selection.length?selection.map(id=>{const p=products.find(p=>p.id===id);return `<article class="selection-item"><a href="${p.id}.html" class="selection-thumb ${p.tone}"><img src="assets/${p.image}" alt="${escapeHTML(p.name)}" width="100" height="100"></a><div><a href="${p.id}.html">${p.name}</a><p>${p.format}</p><button data-remove="${p.id}" aria-label="Remove ${escapeHTML(p.name)} from selection">Remove</button></div></article>`;}).join(''):`<div class="selection-empty"><span aria-hidden="true"><img class="brand-emblem" src="assets/hemp-gold-circle.webp" width="1254" height="1254" alt="" loading="lazy"></span><h3>Room for something <em>good.</em></h3><p>Save a product as you explore. Your favourites will be waiting here.</p><a class="button lime" href="collection.html">Explore the collection</a></div>`;
 const lines=['EXCLUSIVE HEMP FARMS — YOUR SELECTION','A saved product list. This is not an order.','EU prices and availability are not yet listed in this preview.','',...selection.flatMap(id=>{const p=products.find(p=>p.id===id);return [p.originalName,p.source||'Category concept — final product details pending.',''];})];
 $('[data-download-selection]').href='data:text/plain;charset=utf-8,'+encodeURIComponent(lines.join('\n'));
 $('.selection-export textarea').value=lines.join('\n');
 $('.selection-actions').hidden=!selection.length;
}
function persist(){try{localStorage.setItem('ehf-selection',JSON.stringify(selection));}catch{toast('Saved for this visit. Browser storage is unavailable.');}updateSelection();}
scope.on(document,'click',e=>{const save=e.target.closest('[data-save]');if(save){const id=save.dataset.save;if(!products.some(p=>p.id===id))return;const removing=selection.includes(id);selection=removing?selection.filter(x=>x!==id):[...selection,id];persist();toast(removing?'Removed from your selection':'Added to your selection');}const remove=e.target.closest('[data-remove]');if(remove){selection=selection.filter(id=>id!==remove.dataset.remove);persist();const next=$('[data-remove]',selectionDialog)||$('.close-dialog');next.focus();}});
$$('[data-open-selection]').forEach(b=>scope.on(b,'click',()=>{closeMenu();updateSelection();selectionDialog.showModal();document.body.classList.add('no-scroll');}));
scope.on($('.close-dialog'),'click',()=>selectionDialog.close());
scope.on(selectionDialog,'click',e=>{if(e.target===selectionDialog){const r=selectionDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)selectionDialog.close();}});
scope.on(selectionDialog,'close',()=>document.body.classList.remove('no-scroll'));
updateSelection();
scope.on(document.querySelector('[data-clear-storage]'),'click',()=>{selection=[];try{localStorage.removeItem('ehf-selection');localStorage.removeItem('ehf-motion');localStorage.removeItem('ehf-ambience');}catch{}setMotion(reduced.matches);updateSelection();document.dispatchEvent(new Event('ehf-clear-preferences'));toast('Saved selection and preferences cleared');});

// Collection filtering: reflected in the URL so filtered views can be shared.
const catalogue=$('[data-catalogue]');
if(catalogue){
 const params=new URLSearchParams(location.search);let active=categories.some(c=>c.id===params.get('category'))?params.get('category'):'all';let query=params.get('q')||'';const search=$('#product-search');search.value=query;
 function render(){const filtered=products.filter(p=>(active==='all'||p.category===active)&&`${p.name} ${p.format} ${p.note}`.toLowerCase().includes(query.toLowerCase().trim()));catalogue.innerHTML=filtered.length?filtered.map(productCard).join(''):`<div class="catalogue-empty"><h2>No matches <em>this time.</em></h2><p>Try a different name or explore the full collection.</p><button class="button lime" data-reset-search>Show all categories</button></div>`;$$('[data-filter]').forEach(b=>{const chosen=b.dataset.filter===active;b.classList.toggle('active',chosen);b.setAttribute('aria-pressed',String(chosen));});$('[data-result-count]').textContent=`${filtered.length} ${filtered.length===1?'category':'categories'}`;updateSelection();}
 function setURL(){const p=new URLSearchParams();if(active!=='all')p.set('category',active);if(query.trim())p.set('q',query.trim());history.replaceState(history.state,'',location.pathname+(p.size?'?'+p:''));}
 $$('[data-filter]').forEach(b=>scope.on(b,'click',()=>{active=b.dataset.filter;render();setURL();}));scope.on(search,'input',()=>{query=search.value;render();setURL();});scope.on(document,'click',e=>{if(e.target.closest('[data-reset-search]')){active='all';query='';search.value='';render();setURL();search.focus();}});render();
}

// Native scrolling remains intact. Only decorative layers are transformed.
const hero=$('.hero'),heroImage=$('.hero-image');
let queued=false,scrollFrame=0;scope.cleanup(()=>{cancelAnimationFrame(scrollFrame);clearTimeout(toast.timer);});
function drawScroll(){queued=false;if(motionOff){if(heroImage)heroImage.style.transform='';return;}if(hero&&heroImage){const r=hero.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)heroImage.style.transform=`translateY(${Math.max(-50,r.top*.08)}px) scale(1.1)`;}}
scope.on(window,'scroll',()=>{if(!queued){queued=true;scrollFrame=requestAnimationFrame(drawScroll);}},{passive:true});scope.on(window,'resize',()=>{if(innerWidth>1000)closeMenu();drawScroll();});drawScroll();
$$('.standards-layout,.faq-layout,.product-card,.closing-note h2,.editorial-grid,.article-section').forEach(el=>{el.classList.add('reveal');observer.observe(el);});

loadFeature(scope,'.hero,[data-tilt],[data-explore-cursor],.product-gallery',()=>import('./range.js?v=74235423adac'),'initRangeMotion');

const mountScenes=()=>{
const wheel=$('[data-mood-circle]');
const loadWheel=()=>loadFeature(scope,'[data-mood-circle]',()=>import('./mood-circle.js?v=lookinside_mws9mecg' + Date.now()),'initMoodCircles');
if(wheel){
 if(location.hash==='#collections'||wheel.dataset.initialCollection||new URLSearchParams(location.search).has('collection'))loadWheel();
 else{
  const near=scope.own(new IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting))return;
   near.disconnect();
   loadWheel();
  },{rootMargin:'200px 0px'}));
  near.observe(wheel);
 }
}
const directScene=loadFeature(scope,'[data-collection-cinema],.flavour-page>[data-product-reveal]',()=>import('./collection-cinema.js?v=bc93eb093d72'),'initCollectionCinema');

loadFeature(scope,'[data-edition-gallery],[data-legacy-vape-study]',()=>import('./edition-gallery.js?v=a7aace3187ee'),'initEditionGalleries');
loadFeature(scope,'[data-range-scene]',()=>import('./premium-range.js?v=4380f0389aa9'),'initPremiumRanges');
directScene.then(()=>loadFeature(scope,'[data-model-editor]:not([data-scene-managed])',()=>import('./model-viewer.js?v=ring_mws7r9hl'),'initModelViewers'));
loadFeature(scope,'[data-study]',()=>import('./studies.js?v=e31501e680f9'),'initProductStudies');
loadFeature(scope,'[data-conveyor]',()=>import('./conveyor.js?v=155bee2c4a86'),'initConveyor');
loadFeature(scope,'[data-product-story]',()=>import('./product-story.js?v=04481d9860a4'),'initProductStory');
loadFeature(scope,'[data-interlude-film]',()=>import('./interlude.js?v=6c3c8912bcc6'),'initHempInterlude');
loadFeature(scope,'[data-bear-story],[data-knowledge-film],[data-footer-film]',()=>import('./bear-film.js?v=7fe08c703e71'),'initBearFilm');
// The philosophy footage is decorative: lazy, silent and independently pausable.
const introFilm=$('[data-intro-film]'),introFilmToggle=$('[data-intro-film-toggle]');
if(introFilm){
 let inView=false,paused=false,loading=false,failed=false;
 const section=introFilm.closest('.introduction');
 const sync=()=>{
  const enabled=!motionOff&&!reduced.matches&&!failed&&!document.documentElement.classList.contains('cinema-pending');
  introFilmToggle.disabled=!enabled;introFilmToggle.setAttribute('aria-pressed',String(paused||!enabled));
  introFilmToggle.setAttribute('aria-label',!enabled?'Philosophy background still':paused?'Play philosophy background':'Pause philosophy background');
  if(!enabled||!inView||paused||document.hidden||scope.disposed){introFilm.pause();return;}
  if(!introFilm.getAttribute('src')){introFilm.src=introFilm.dataset.src;introFilm.load();}
  if(!introFilm.paused||loading)return;loading=true;
  introFilm.play().catch(()=>{}).finally(()=>{loading=false;if(scope.disposed||!inView||paused||motionOff||reduced.matches||document.hidden)introFilm.pause();});
 };
 scope.own(new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.02})).observe(section);
 const filmPreferences=scope.own(new MutationObserver(sync));filmPreferences.observe(document.body,{attributes:true,attributeFilter:['class']});filmPreferences.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 scope.on(introFilmToggle,'click',()=>{paused=!paused;sync();});
 scope.on(document,'visibilitychange',sync);scope.on(reduced,'change',sync);
 scope.on(introFilm,'playing',()=>section.dataset.filmReady='true');
 scope.on(introFilm,'error',()=>{failed=true;introFilm.hidden=true;sync();});
 scope.cleanup(()=>{introFilm.pause();introFilm.removeAttribute('src');introFilm.load();});
}

loadFeature(scope,'.closing-leaf',()=>import('./leaf.js?v=48956f6de362'),'initClosingLeaf');
loadFeature(scope,'main',()=>import('./smoke.js?v=656bc2132c91'),'initScrollSmoke');
};
if(document.documentElement.classList.contains('cinema-pending')){
 scope.on(document,'ehf-entrance-released',mountScenes,{once:true});
}else mountScenes();

}
initNavigation(mountPage);
