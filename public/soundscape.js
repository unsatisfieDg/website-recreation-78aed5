// One persistent, click-loaded Spotify embed. No local soundtrack or audio loop.
let playlist=null;
export function initPlaylist(){
 if(playlist){playlist.refreshPage();return playlist;}
 const player=document.createElement('aside');
 player.className='playlist-player';player.dataset.persistent='';player.setAttribute('aria-label','EHF Spotify playlist');
 player.innerHTML=`<button class="playlist-launch" aria-label="Open Spotify playlist" aria-expanded="false" aria-controls="ehf-playlist-panel" title="Open playlist"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg></button><section class="playlist-panel" id="ehf-playlist-panel" aria-label="Spotify playlist controls" hidden><div class="playlist-heading"><span>THE EHF PLAYLIST</span><button class="playlist-close" aria-label="Minimize playlist" title="Minimize playlist"><span>Minimize</span><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 10h10"/></svg></button></div><div class="playlist-frame"><span class="playlist-loading" role="status">Opening Spotify…</span></div><a class="playlist-external" href="https://open.spotify.com/playlist/1W82JHDRy8C70j0ebYQdVx" target="_blank" rel="noopener noreferrer">Open in Spotify <span aria-hidden="true">↗</span></a></section>`;
 document.body.append(player);
 const launch=player.querySelector('.playlist-launch'),panel=player.querySelector('.playlist-panel'),close=player.querySelector('.playlist-close'),frame=player.querySelector('.playlist-frame'),status=player.querySelector('.playlist-loading');
 let embed=null;
 function load(){
  if(embed)return;
  embed=document.createElement('iframe');
  embed.title='EHF playlist on Spotify';embed.dataset.testid='embed-iframe';
  embed.width='100%';embed.height='152';embed.loading='lazy';embed.allowFullscreen=true;
  embed.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  embed.src='https://open.spotify.com/embed/playlist/1W82JHDRy8C70j0ebYQdVx?utm_source=generator&si=0399124f11464259&theme=0';
  embed.addEventListener('load',()=>{status.hidden=true;player.dataset.loaded='true';},{once:true});
  embed.addEventListener('error',()=>{status.textContent='Use Open in Spotify below if the player is unavailable.';});
  frame.append(embed);
 }
 function setOpen(open,restoreFocus=false){
  panel.hidden=!open;player.classList.toggle('is-open',open);
  launch.setAttribute('aria-expanded',String(open));launch.setAttribute('aria-label',open?'Minimize Spotify playlist':'Open Spotify playlist');
  if(open)load();else if(restoreFocus)launch.focus({preventScroll:true});
 }
 launch.addEventListener('click',()=>setOpen(panel.hidden));
 close.addEventListener('click',()=>setOpen(false,true));
 player.addEventListener('keydown',event=>{if(event.key==='Escape'){setOpen(false,true);event.preventDefault();}});
 document.addEventListener('click',event=>{if(!panel.hidden&&!event.composedPath().includes(player))setOpen(false);});
 // Browsing takes priority: tuck the controls away as soon as the page moves.
 addEventListener('scroll',()=>{if(!panel.hidden)setOpen(false);},{passive:true});
 function sync(){player.inert=document.body.classList.contains('no-scroll');if(player.inert)setOpen(false);}
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 // Retire settings from the removed theme song; the embed manages its own playback.
 function clearLegacy(){try{localStorage.removeItem('ehf-sound-settings');localStorage.removeItem('ehf-sound-intent');sessionStorage.removeItem('ehf-sound-position');}catch{}}
 clearLegacy();document.addEventListener('ehf-clear-preferences',clearLegacy);
 function refreshPage(){setOpen(false);sync();}
 // Keeping the same iframe preserves playback during enhanced internal navigation.
 playlist={refreshPage};refreshPage();return playlist;
}
