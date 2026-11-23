const pages=new Set(['index.html','collection.html','vapes.html','pre-rolls.html','edibles.html','story.html','lab-reports.html','privacy.html','404.html','grape.html','mango.html','cherry.html','blueberry.html']);
export function pageStylesheets(doc,url){return [...new Set([...doc.querySelectorAll('link[rel="stylesheet"][href]')].map(link=>new URL(link.getAttribute('href'),url).href))];}

export function localPageURL(link,current=location.href){
 if(!link||link.hasAttribute('download')||link.target&&link.target!=='_self'||link.getAttribute('rel')?.split(/\s+/).includes('external'))return null;
 const href=link.getAttribute('href');if(!href||/^(mailto:|tel:|data:|javascript:)/i.test(href))return null;
 const url=new URL(href,current),base=new URL('.',current);
 if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return null;
 const filename=url.pathname.slice(base.pathname.length)||'index.html';
 return pages.has(filename)?url:null;
}

// Keep the playlist connected to this document while ordinary static pages change.
// Direct visits and browsers without JavaScript still use the same .html files.
export function initNavigation(mountPage){
 const runtimeScript=document.querySelector('script[src*="app.js"]'),runtimeURL=runtimeScript?new URL(runtimeScript.getAttribute('src'),location.href).href:null;
 const stylesheetJobs=new Map();
 function ensureStyles(doc,url){return Promise.all(pageStylesheets(doc,url).map(href=>{
  if(stylesheetJobs.has(href))return stylesheetJobs.get(href);
  if([...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>link.href===href))return Promise.resolve();
  const next=document.createElement('link');next.rel='stylesheet';next.href=href;next.dataset.navigationStyle='';
  const job=new Promise((resolve,reject)=>{const timer=setTimeout(()=>finish(false),8000);function finish(ok){clearTimeout(timer);next.onload=next.onerror=null;if(ok)resolve();else{next.remove();stylesheetJobs.delete(href);reject(new Error('Page styles unavailable'));}}next.onload=()=>finish(true);next.onerror=()=>finish(false);document.head.append(next);});
  stylesheetJobs.set(href,job);return job;
 }));}
 function updateMetadata(doc){
  for(const selector of ['meta[name="description"]','meta[name="robots"]','meta[name="theme-color"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]','meta[property="og:image"]','meta[property="og:type"]','meta[name="twitter:title"]','meta[name="twitter:description"]','meta[name="twitter:image"]','meta[name="twitter:card"]','link[rel="canonical"]']){
   const next=doc.querySelector(selector),previous=document.head.querySelector(selector);if(next){const copy=document.importNode(next,true);if(previous)previous.replaceWith(copy);else document.head.append(copy);}else previous?.remove();
  }
 }
 let dispose=mountPage(),loaded=new URL(location.href),pending=null,revision=0,navigating=false,scrollTimer=0;
 const live=document.createElement('span');live.className='sr-only';live.dataset.persistent='';live.setAttribute('role','status');live.setAttribute('aria-live','polite');document.body.append(live);
 history.scrollRestoration='manual';
 const path=url=>url.pathname+url.search;
 const state=()=>({...history.state,ehfScroll:[scrollX,scrollY]});
 function remember(){if(!navigating)history.replaceState(state(),'',location.href);}
 remember();
 const initialURL=new URL(location.href);
 if(initialURL.hash)document.fonts.ready.then(()=>{if(location.href===initialURL.href)place(initialURL,null,false);});
 addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(remember,120);},{passive:true});
 function place(url,position,focus,smooth=false){
  let target=null;
  if(url.hash){try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch{}}
  const main=document.querySelector('main');
  if(focus){const heading=target||main?.querySelector('h1')||main;if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}}
  if(position)scrollTo({left:position[0],top:position[1],behavior:'instant'});
  else if(target?.hasAttribute('data-collection-cinema'))scrollTo({left:0,top:scrollY+target.getBoundingClientRect().top,behavior:'instant'});
  else if(target)target.scrollIntoView({behavior:smooth&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('motion-off')?'smooth':'instant',block:'start'});
  else scrollTo({left:0,top:0,behavior:'instant'});
 }
 async function navigate(url,{pop=false,position=null,smooth=true}={}){
  const current=++revision;pending?.abort();pending=null;
  if(!pop)remember();
  navigating=true;clearTimeout(scrollTimer);
  if(path(url)===path(loaded)){
   if(!pop)history.pushState({ehfScroll:null},'',url);
   place(url,position,false,smooth&&!pop&&!position);loaded=url;navigating=false;document.querySelector('main')?.removeAttribute('aria-busy');remember();return;
  }
  const controller=new AbortController();pending=controller;
  const timeout=setTimeout(()=>controller.abort(),12000);
  document.querySelector('main')?.setAttribute('aria-busy','true');
  try{
   const response=await fetch(url.pathname+url.search,{signal:controller.signal,headers:{Accept:'text/html'}});
   if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw new Error('Page unavailable');
   const doc=new DOMParser().parseFromString(await response.text(),'text/html');
   if(!doc.querySelector('main')||!doc.body.dataset.page)throw new Error('Not an EHF page');
   if(current!==revision)return;
   const nextScript=doc.querySelector('script[src*="app.js"]');if(runtimeURL&&nextScript&&new URL(nextScript.getAttribute('src'),url).href!==runtimeURL){location.assign(url.href);return;}
   await ensureStyles(doc,url);if(current!==revision)return;
   const fragment=document.createDocumentFragment();
   for(const child of doc.body.children){if(child.tagName!=='SCRIPT')fragment.append(document.importNode(child,true));}
   const commit=()=>{
   dispose?.();
   for(const child of [...document.body.children])if(!child.hasAttribute('data-persistent'))child.remove();
   document.body.className=doc.body.className;document.body.dataset.page=doc.body.dataset.page;
   document.body.toggleAttribute('data-ciao-trial',doc.body.hasAttribute('data-ciao-trial'));
   document.body.append(fragment);
   document.title=doc.title;
   updateMetadata(doc);
   if(!pop)history.pushState({ehfScroll:null},'',url);
   loaded=url;
   dispose=mountPage();

   place(url,position,true);
   live.textContent=document.title;
   document.dispatchEvent(new Event('ehf-page-ready'));
   };
   const quiet=matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-off');
   if(document.startViewTransition&&!quiet){const transition=document.startViewTransition(commit);transition.ready.catch(()=>{});transition.finished.catch(()=>{});await transition.updateCallbackDone;}else commit();
  }catch(error){
   if(current!==revision)return;
   // Native navigation remains the fallback for server/network failures.
   if(pop)location.replace(url.href);else location.assign(url.href);
  }finally{
   clearTimeout(timeout);
   if(current===revision){pending=null;navigating=false;document.querySelector('main')?.removeAttribute('aria-busy');remember();}
  }
 }
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a'),url=localPageURL(link);if(!url)return;
  // The information belt owns its panel anchors, including after page remounts.
  if(url.pathname===location.pathname&&url.hash){const id=url.hash.replace(/^#(?:form-)?/,'');if([...document.querySelectorAll('[data-conveyor] [data-belt-item],[data-conveyor] [data-study]')].some(item=>(item.dataset.beltItem||item.dataset.study)===id))return;}
  event.preventDefault();navigate(url,{smooth:!link.hasAttribute('data-section-jump')});
 });
 document.addEventListener('ehf-wheel-route',()=>{loaded=new URL(location.href);remember();});
 addEventListener('popstate',event=>{const next=new URL(location.href);if(event.state?.ehfWheel&&next.pathname===loaded.pathname&&document.querySelector('[data-mood-circle]')){loaded=next;document.dispatchEvent(new Event('ehf-wheel-pop'));return;}navigate(next,{pop:true,position:event.state?.ehfScroll||null});});
}
