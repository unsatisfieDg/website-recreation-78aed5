import {createPageScope} from './page-scope.js?v=5fbc86d3ec7f';
const vertexSource=`
attribute vec2 a_uv;
uniform float u_time;
uniform float u_motion;
varying vec2 v_uv;
void main(){
 v_uv=a_uv;
 vec2 hub=vec2(.5,.76),d=a_uv-hub;
 float theta=atan(d.y,d.x);
 float stem=clamp(smoothstep(.025,.11,abs(d.x))+1.-smoothstep(-.01,.05,d.y),0.,1.);
 float flex=smoothstep(.035,.40,length(d))*stem*u_motion;
 float angle=.024*flex*(sin(u_time*.83+theta*1.7)+.25*sin(u_time*1.31+theta*.8));
 float c=cos(angle),s=sin(angle);
 vec2 p=hub+vec2(d.x*c-d.y*s,d.x*s+d.y*c);
 p.y+=.006*flex*sin(u_time*.93+theta*2.2);
 gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);
}`;
const fragmentSource=`
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_uv;
void main(){gl_FragColor=texture2D(u_image,v_uv);}`;

// A continuous mesh bends the photo locally while the palm and stem stay joined.
function createSurface(canvas,img){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!gl)return null;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Leaf shader unavailable');}return s;};
 const program=gl.createProgram(),vs=shader(gl.VERTEX_SHADER,vertexSource),fs=shader(gl.FRAGMENT_SHADER,fragmentSource);
 gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Leaf surface unavailable');
 gl.useProgram(program);
 const columns=36,rows=38,vertices=[],indices=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++)vertices.push(x/columns,y/rows);
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const vertexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
 const uv=gl.getAttribLocation(program,'a_uv');gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
 const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const time=gl.getUniformLocation(program,'u_time'),motion=gl.getUniformLocation(program,'u_motion');
 return {dispose(){gl.deleteTexture(texture);gl.deleteBuffer(vertexBuffer);gl.deleteBuffer(indexBuffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();},draw(seconds,moving){
  const ratio=Math.min(devicePixelRatio||1,1.75),width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(time,seconds);gl.uniform1f(motion,moving?1:0);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 }};
}

export function initClosingLeaf(scope=createPageScope()){
 const sections=[...document.querySelectorAll('.closing-note,.footer-unified')].filter(s=>s.querySelector('.closing-leaf'));
 if(!sections.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),controllers=[];
 const motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off');
 for(const section of sections){
  const art=section.querySelector('.closing-leaf'),img=art.querySelector('img'),canvas=art.querySelector('canvas');
  let surface=null,visible=false,raf=0,last=0,seconds=0;
  scope.cleanup(()=>{stop();surface?.dispose();});
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;art.dataset.animating='false';}
  function frame(now){
   if(!surface||!visible||document.hidden||!motion()){stop();return;}
   seconds+=last?Math.min(now-last,60)/1000:0;last=now;surface.draw(seconds,true);raf=requestAnimationFrame(frame);
  }
  function sync(){
   stop();if(!surface)return;
   surface.draw(seconds,motion());
   if(visible&&!document.hidden&&motion()){art.dataset.animating='true';raf=requestAnimationFrame(frame);}
  }
  function ready(){
   if(surface||!img.naturalWidth)return;
   try{surface=createSurface(canvas,img);if(surface){surface.draw(0,motion());art.classList.add('leaf-ready');art.dataset.renderer='mesh';sync();}else art.dataset.renderer='image';}
   catch{art.dataset.renderer='image';}
  }
  scope.on(img,'load',ready,{once:true});if(img.complete)ready();
  scope.on(canvas,'webglcontextlost',e=>{e.preventDefault();stop();surface=null;art.classList.remove('leaf-ready');art.dataset.renderer='image';});
  scope.on(canvas,'webglcontextrestored',ready);
  scope.own(new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;section.classList.toggle('leaf-in-view',visible);if(visible)img.loading='eager';sync();},{threshold:.05})).observe(art);
  scope.own(new ResizeObserver(()=>{if(surface)surface.draw(seconds,motion());})).observe(art);
  controllers.push(sync);
 }
 scope.own(new MutationObserver(()=>controllers.forEach(sync=>sync()))).observe(document.body,{attributes:true,attributeFilter:['class']});
 scope.on(reduced,'change',()=>controllers.forEach(sync=>sync()));
 scope.on(document,'visibilitychange',()=>controllers.forEach(sync=>sync()));
}
