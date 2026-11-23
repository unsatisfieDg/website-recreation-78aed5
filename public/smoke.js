import {createPageScope} from './page-scope.js?v=5fbc86d3ec7f';
// A filmed exhale, revealed through a transparent WebGL surface only on section changes.
export function smokeEntry(boundary,direction){
 const fromLeft=boundary%2===0;
 return (direction<0?!fromLeft:fromLeft)?'left':'right';
}

// Align virtual entrances with the camera's two product-world transitions.
export function productSmokeTops(top,height,viewport,inset=80){
 const travel=Math.max(0,height-(viewport-inset));
 return [.29,.71].map(progress=>top-inset+progress*travel+viewport*.72);
}

// The dead band prevents a touchpad hovering around an edge from replaying the effect.
export class SmokeCrossings{
 constructor(tops,position,deadBand=32){this.deadBand=deadBand;this.reset(tops,position);}
 reset(tops,position){this.tops=tops;this.position=position;this.index=Math.max(0,tops.findLastIndex(top=>top<=position));}
 update(position){
  const direction=Math.sign(position-this.position),previous=this.index;this.position=position;
  if(direction>0)while(this.index<this.tops.length-1&&position>=this.tops[this.index+1]+this.deadBand)this.index++;
  if(direction<0)while(this.index>0&&position<this.tops[this.index]-this.deadBand)this.index--;
  if(previous===this.index)return null;
  // A fast swipe gets one burst at its latest boundary, never a queue of missed bursts.
  const boundary=direction>0?this.index:this.index+1;
  return {section:this.index,boundary,direction,entry:smokeEntry(boundary,direction)};
 }
}

const vertex=`attribute vec2 a_position;varying vec2 v_uv;
void main(){v_uv=vec2(a_position.x*.5+.5,.5-a_position.y*.5);gl_Position=vec4(a_position,0.,1.);}`;
const fragment=`precision mediump float;
uniform sampler2D u_video;uniform float u_flip;uniform float u_envelope;uniform float u_light;
varying vec2 v_uv;
void main(){
 vec2 uv=vec2(mix(v_uv.x,1.-v_uv.x,u_flip),v_uv.y);
 float density=texture2D(u_video,uv).r;
 float spread=mix(.56,.31,uv.x),centre=.50+.065*sin(uv.x*4.8);
 float edges=1.-smoothstep(spread*.42,spread,abs(uv.y-centre));
 edges*=smoothstep(0.,.055,uv.x)*(1.-smoothstep(.985,1.,uv.x));
 float alpha=pow(density,.85)*edges*u_envelope*mix(.60,.40,u_light);
 vec3 colour=mix(vec3(.57,.60,.56),vec3(.93,.93,.87),smoothstep(.02,.60,density));
 colour=mix(colour,mix(vec3(.32,.35,.31),vec3(.65,.67,.61),smoothstep(.02,.60,density)),u_light);
 gl_FragColor=vec4(colour*alpha,alpha);
}`;

export function smokePixelRatio(width,height,ratio=1){
 return Math.min(Math.max(.1,ratio),1.25,Math.sqrt(450000/Math.max(1,width*height)));
}
function createSurface(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'low-power'});
 if(!gl)return null;
 const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error('Smoke shader unavailable');}return shader;};
 const program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
 gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Smoke surface unavailable');
 gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const flip=gl.getUniformLocation(program,'u_flip'),envelope=gl.getUniformLocation(program,'u_envelope'),light=gl.getUniformLocation(program,'u_light');
 function resize(){
  const ratio=smokePixelRatio(canvas.clientWidth,canvas.clientHeight,devicePixelRatio||1),width=Math.round(canvas.clientWidth*ratio),height=Math.round(canvas.clientHeight*ratio);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
 }
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 return {dispose(){observer.disconnect();gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();},draw(video,entry,opacity,lightBackground){
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);
  gl.uniform1f(flip,entry==='left'?1:0);gl.uniform1f(envelope,opacity);gl.uniform1f(light,lightBackground?1:0);gl.drawArrays(gl.TRIANGLES,0,6);
 }};
}

export function initScrollSmoke(scope=createPageScope()){
 if(document.getElementById('scroll-smoke'))return;
 const home=Boolean(document.querySelector('.hero'));
 // Inner pages share the same footer entrance without adding bursts to their content.
 const selectors=home?['.hero','#introduction','#collections','#story','#knowledge','.site-footer']:['main','.site-footer'];
 const stops=selectors.flatMap(selector=>{const element=document.querySelector(selector);if(!element)return [];const ordinary={element,key:element.id||selector.replace(/^[.#]/,'')};return element.matches('[data-product-story]')?[{...ordinary,key:'story-vapes'},{...ordinary,key:'story-gummies',chapter:0},{...ordinary,key:'story-pre-rolls',chapter:1}]:[ordinary];});
 const sections=stops.map(stop=>stop.element);
 if(sections.length<2)return;
 const root=document.createElement('div');root.id='scroll-smoke';root.className='scroll-smoke';root.setAttribute('aria-hidden','true');root.dataset.state='idle';
 const canvas=document.createElement('canvas'),video=document.createElement('video');
 canvas.className='scroll-smoke-surface';video.muted=true;video.playsInline=true;video.preload='none';video.hidden=true;video.tabIndex=-1;
 video.setAttribute('disablepictureinpicture','');video.setAttribute('disableremoteplayback','');root.append(canvas,video);document.body.append(root);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const allowed=()=>!document.documentElement.classList.contains('cinema-pending')&&!reduced.matches&&!document.hidden&&!document.body.classList.contains('motion-off')&&!document.body.classList.contains('no-scroll')&&!document.body.classList.contains('page-resting');
 const probe=()=>scrollY+innerHeight*.72;
 const tops=()=>stops.map(stop=>{const top=stop.element.getBoundingClientRect().top+scrollY;if(stop.chapter===undefined)return top;const sticky=stop.element.querySelector('.product-story-sticky'),inset=parseFloat(getComputedStyle(sticky).top)||80;return productSmokeTops(top,stop.element.offsetHeight,innerHeight,inset)[stop.chapter];});
 const tracker=new SmokeCrossings(tops(),probe());
 let armed=false,firstScroll=home,frame=0,scrollFrame=0,revision=0,surface=null,failed=false,lastDraw=0,lastVideoTime=-1;
 function lightBackground(section){
  for(let element=section;element;element=element.parentElement){
   const rgb=getComputedStyle(element).backgroundColor.match(/[\d.]+/g)?.map(Number);
   if(rgb&&rgb.length>=3&&(rgb.length===3||rgb[3]>.5))return (rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)>145;
  }
  return false;
 }
 function stop(state='idle'){
  revision++;cancelAnimationFrame(frame);frame=0;video.pause();root.style.opacity='0';root.dataset.state=state;
 }
 function start(event){
  if(failed||!allowed())return;
  stop();const current=revision,light=lightBackground(sections[event.section]);
  root.dataset.entry=event.entry;root.dataset.direction=event.direction>0?'down':'up';root.dataset.section=stops[event.section].key;
  root.dataset.boundary=String(event.boundary);root.dataset.state='loading';
  try{
   surface||=createSurface(canvas);if(!surface){failed=true;stop('unavailable');return;}
   if(!video.getAttribute('src'))video.src=new URL('./assets/scroll-exhale.mp4',import.meta.url).href;
   video.currentTime=0;
   video.play().then(()=>{
    if(current!==revision)return;
    if(!allowed()){stop('disabled');return;}
    root.dataset.state='playing';lastDraw=0;lastVideoTime=-1;
    const draw=now=>{
     if(current!==revision)return;
     if(!allowed()){stop('disabled');return;}
     const t=video.currentTime,duration=Number.isFinite(video.duration)?video.duration:4.95;
     if(video.ended||t>=duration-.05){stop();return;}
     if(!video.seeking&&video.readyState>=2&&t!==lastVideoTime&&now-lastDraw>=1000/30){
      const opacity=Math.min(1,t/.18)*Math.min(1,Math.max(0,(duration-t)/1.45));
      try{surface.draw(video,event.entry,opacity,light);root.style.opacity='1';}catch{failed=true;stop('unavailable');return;}
      const travel=event.entry==='left'?1:-1;
      canvas.style.transform=`translate3d(${travel*t*1.5}vw,${-t*1.1}vh,0)`;lastDraw=now;lastVideoTime=t;
     }
     frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);
   }).catch(()=>{if(current===revision)stop('unavailable');});
  }catch{failed=true;stop('unavailable');}
 }
 function measure(){if(!scope.disposed)tracker.reset(tops(),probe());}
 function scroll(){
  scrollFrame=0;
  if(!armed||!allowed()){measure();return;}
  const event=tracker.update(probe());
  if(event){firstScroll=false;start(event);}
  else if(firstScroll&&tracker.index===0&&scrollY>32){firstScroll=false;start({section:0,boundary:0,direction:1,entry:'left'});}
 }
 // Restoration, hash loading and resize never produce a spontaneous exhale.
 const arm=()=>{armed=true;};
 for(const name of ['wheel','touchstart','pointerdown','keydown'])scope.on(window,name,arm,{passive:true});
 scope.on(window,'scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(scroll);},{passive:true});
 scope.on(window,'resize',measure,{passive:true});
 scope.on(window,'pageshow',()=>{armed=false;measure();});
 scope.on(window,'pagehide',()=>stop());
 scope.own(new ResizeObserver(measure)).observe(document.querySelector('main'));
 document.fonts?.ready.then(measure);
 const sync=()=>{if(!allowed())stop('disabled');else if(root.dataset.state==='disabled'){root.dataset.state='idle';measure();}};
 scope.own(new MutationObserver(sync)).observe(document.body,{attributes:true,attributeFilter:['class']});
 scope.on(reduced,'change',sync);scope.on(document,'visibilitychange',sync);
 scope.on(canvas,'webglcontextlost',event=>{event.preventDefault();failed=true;surface=null;stop('unavailable');});
 scope.on(canvas,'webglcontextrestored',()=>{failed=false;root.dataset.state='idle';});
 scope.on(video,'ended',()=>stop());scope.on(video,'error',()=>{failed=true;stop('unavailable');});
 scope.cleanup(()=>{stop();cancelAnimationFrame(scrollFrame);video.removeAttribute('src');video.load();surface?.dispose();root.remove();});
 sync();
}
