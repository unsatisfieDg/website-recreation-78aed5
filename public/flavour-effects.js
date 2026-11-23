import {flavourSplashSource} from './flavour-cinema.js?v=bidirectional1795288957292';

// Gummy splash plates, composited inside the existing 3D context.
// Packed movies store RGB left / alpha right; a single decoder serves the active fruit.
const splashFragment=`
 uniform sampler2D map;
 uniform float packed;
 uniform float opacity;
 uniform float phone;
 uniform vec3 tint[3];
 uniform float tintStrength;
 uniform float tintLift;
 varying vec2 vUv;
 varying vec2 vScreen;

 void main(){
  vec4 c=texture2D(map,vec2(vUv.x*mix(1.,.5,packed),vUv.y));
  float a=mix(c.a,max(0.,(texture2D(map,vec2(.5+vUv.x*.5,vUv.y)).r-.008)/.992),packed);
  float reading=mix(smoothstep(.29,.40,vScreen.x),1.-smoothstep(.68,.80,vScreen.y),phone);
  if(a==0.||reading==0.)discard;
  vec3 rgb=mix(c.rgb*c.a,c.rgb,packed);
  // Preserve the plate's light, shade and translucent edges while grading the liquid.
  vec3 source=clamp(rgb/max(a,.015),0.,1.);
  const vec3 luma=vec3(.2126,.7152,.0722);
  float light=dot(source,luma);
  light=mix(light,sqrt(light),tintLift);
  float height=1.-vUv.y;
  vec3 palette=mix(mix(tint[0],tint[1],smoothstep(.30,.50,height)),tint[2],smoothstep(.50,.74,height));
  float paletteLight=dot(palette,luma);
  vec3 graded=clamp(light<paletteLight
   ?palette*light/max(paletteLight,.001)
   :mix(palette,vec3(1.),(light-paletteLight)/max(1.-paletteLight,.001)),0.,1.);
  float chroma=max(max(source.r,source.g),source.b)-min(min(source.r,source.g),source.b);
  float strength=tintStrength*mix(.35,1.,smoothstep(.02,.36,chroma));
  rgb=mix(rgb,graded*a,strength);
  gl_FragColor=vec4(rgb*opacity*reading,a*opacity*reading);
 }
`;

export function createFlavourEffects(T,scene,scope,invalidate,video){
 const geometry=new T.PlaneGeometry(1,1),posters=new Map();
 let texture,videoFrame=0;
 const layers=Array.from({length:2},()=>{
  const uniforms={
   map:{value:null},packed:{value:0},opacity:{value:0},phone:{value:0},
   tint:{value:Array.from({length:3},()=>new T.Color())},tintStrength:{value:0},tintLift:{value:0}
  };
  const material=new T.ShaderMaterial({
   uniforms,vertexShader:'varying vec2 vUv;varying vec2 vScreen;void main(){vUv=uv;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);vScreen=p.xy/p.w*.5+.5;gl_Position=p;}',
   fragmentShader:splashFragment,transparent:true,premultipliedAlpha:true,depthWrite:false,depthTest:false,toneMapped:false
  });
  const mesh=new T.Mesh(geometry,material);
  mesh.visible=false;
  mesh.renderOrder=-10;
  scene.add(mesh);
  return {mesh,material,grade:null};
 });
 let active=null,ready=false,pending=false,running=false,generation=0,failed=false,source=null;
 function poster(id){if(!posters.has(id)){const t=new T.TextureLoader().load(`assets/flavour-cinema/${id}-effect-poster.webp`,()=>{if(!scope.disposed)invalidate();});t.colorSpace=T.NoColorSpace;t.generateMipmaps=false;t.minFilter=T.LinearFilter;posters.set(id,t);}return posters.get(id);}
 function releaseTexture(){
  if(videoFrame)video.cancelVideoFrameCallback?.(videoFrame);
  videoFrame=0;
  texture?.dispose();
  texture=null;
 }
 function prepareTexture(){
  // Use Three's video upload path while owning the cancellable frame callback.
  texture=new T.Texture(video);
  texture.isVideoTexture=true;
  texture.update=()=>{};
  texture.colorSpace=T.NoColorSpace;
  texture.generateMipmaps=false;
  texture.minFilter=T.LinearFilter;
  if(!video.requestVideoFrameCallback)return;
  const captureFrame=()=>{
   texture.needsUpdate=true;
   if(!ready){ready=true;invalidate();}
   videoFrame=video.requestVideoFrameCallback(captureFrame);
  };
  videoFrame=video.requestVideoFrameCallback(captureFrame);
 }
 function update(items,w,h,allow){
  running=allow;
  const wanted=items.filter(item=>item.effect&&item.effectAlpha>.008);
  // Keep one decoder. Hand it over immediately to the leading plate so gummies don't stall.
  const leading=wanted.reduce((best,item)=>!best||item.effectAlpha>best.effectAlpha?item:best,null);
  const id=leading?.effect;
  const nextSource=id?flavourSplashSource(id,w<700):null;
  if(nextSource!==source&&(!id||allow)){
   generation++;
   video.pause();
   if(video.hasAttribute('src')&&video.getAttribute('src')!==nextSource){video.removeAttribute('src');video.load();}
   releaseTexture();
   active=id;source=nextSource;ready=false;pending=false;failed=false;
  }
  if(allow&&source&&!texture){
   if(!video.hasAttribute('src'))video.src=source;
   prepareTexture();
  }
  if(!allow||!id)video.pause();else if(video.paused&&!pending&&!failed){pending=true;const request=generation;video.play().catch(error=>{if(request===generation&&running&&error.name!=='AbortError')failed=true;}).finally(()=>{if(request===generation){pending=false;if(!running)video.pause();}});}
  if(texture&&!video.requestVideoFrameCallback&&video.readyState>=2){
   texture.needsUpdate=true;
   ready=true;
  }
  layers.forEach((layer,i)=>{
   const item=wanted[i];
   layer.mesh.visible=Boolean(item);
   if(!item)return;
   const moving=ready&&active===item.effect,{uniforms}=layer.material;
   if(layer.grade!==item.effectGrade){
    layer.grade=item.effectGrade;
    uniforms.tintStrength.value=layer.grade?.splash||0;
    uniforms.tintLift.value=layer.grade?.splashLift||0;
    layer.grade?.colours.forEach((colour,index)=>uniforms.tint.value[index].set(colour).convertLinearToSRGB());
   }
   uniforms.map.value=moving?texture:poster(item.effect);
   uniforms.packed.value=moving?1:0;
   uniforms.opacity.value=item.effectAlpha*.9;
   uniforms.phone.value=w<=900?1:0;
   const height=Math.min(h*.79,w*(w<700?1.08:.75)),width=height*16/9;
   layer.mesh.position.set(item.x-w/2,h/2-item.y,-10);
   layer.mesh.scale.set(width,height,1);
   layer.mesh.rotation.z=item.tilt*.35;
  });
 }
 scope.cleanup(()=>{generation++;running=false;releaseTexture();posters.forEach(t=>t.dispose());layers.forEach(({mesh,material})=>{scene.remove(mesh);material.dispose();});geometry.dispose();});
 return {update,prepare:poster,pause(){running=false;video.pause();}};
}
