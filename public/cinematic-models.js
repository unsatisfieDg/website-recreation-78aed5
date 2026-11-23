import {VAPE_MODEL_REVISION} from './vape-variants.js?v=2aa87c105d21';
import {addSurfaceDetails} from './surface-details.js?v=4c7de86ff887';
import {createMaterialFinishes} from './material-finishes.js?v=d586bda1302e';
import {createStudioLight} from './studio-light.js?v=7700b6f2c0ac';
// A single scene carries the existing geometry; it never changes the supplied GLBs.
export async function createCinematicModels({stage,items,products,scope,invalidate}){
 const [THREE,{GLTFLoader}]=await Promise.all([import('./vendor/three/three.module.min.js'),import('./vendor/three/addons/loaders/GLTFLoader.js')]);
 if(scope.disposed)return null;
 const canvas=document.createElement('canvas');canvas.className='cinema-model-canvas';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{canvas.remove();stage.dataset.cinema3d='fallback';return null;}
 renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
 const finishes=createMaterialFinishes(THREE,renderer);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,6000),loader=new GLTFLoader(),abort=new AbortController(),models=[];
 camera.position.z=2000;const disposeStudio=createStudioLight(THREE,renderer,scene);scene.add(new THREE.HemisphereLight(0xf7f0df,0x163021,.9));
 for(const [colour,power,pos] of [[0xfff1da,2.1,[1,2,4]],[0xc5dacb,.9,[-2,1,2]],[0xe1d3ac,1.5,[.5,2,-2]]]){const light=new THREE.DirectionalLight(colour,power);light.position.set(...pos);scene.add(light);}
 let width=0,height=0,last=null,failed=false,counter=0;
 function dispose(model){const gs=new Set(),ms=new Set(),ts=new Set();model.traverse(n=>{if(n.geometry)gs.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){ms.add(m);Object.values(m).forEach(v=>{if(v?.isTexture&&!v.userData.sharedFinish)ts.add(v);});}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>{t.dispose();t.source?.data?.close?.();});}
 function draw(placements,w,h){
  if(scope.disposed||failed||!w||!h)return;last=[placements,w,h];
  if(width!==w||height!==h){width=w;height=h;const ratio=Math.min(Math.max(devicePixelRatio,1.25),1.75,Math.sqrt(2000000/(w*h)));renderer.setSize(Math.round(w*ratio),Math.round(h*ratio),false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
  for(let i=0;i<models.length;i++){const r=models[i];if(!r)continue;const p=placements[i],reach=p.height*.9;r.group.visible=p.alpha>.015&&p.x+reach>0&&p.x-reach<w&&p.y+reach>0&&p.y-reach<h;if(!r.group.visible)continue;r.group.position.set(p.x-w/2,h/2-p.y,p.depth);r.group.scale.setScalar(p.height/r.unit);r.group.rotation.set(p.pitch,p.yaw,p.tilt);for(const m of r.materials){m.color.copy(m.userData.originalColour).multiplyScalar(p.light);m.opacity=m.userData.originalOpacity*p.alpha;const blended=m.userData.originalTransparent||p.alpha<.995;if(m.transparent!==blended){m.transparent=blended;m.needsUpdate=true;}m.depthWrite=m.userData.originalDepthWrite&&p.alpha>.98;}}
  const start=performance.now();renderer.render(scene,camera);if(++counter%24===1){stage.dataset.cinemaDrawMs=(performance.now()-start).toFixed(2);stage.dataset.cinemaCalls=String(renderer.info.render.calls);stage.dataset.cinemaTriangles=String(renderer.info.render.triangles);stage.dataset.cinemaPixels=String(canvas.width*canvas.height);}
 }
 scope.on(canvas,'webglcontextlost',e=>{e.preventDefault();failed=true;canvas.hidden=true;items.forEach(a=>delete a.dataset.liveModel);stage.dataset.cinema3d='fallback';});
 scope.cleanup(()=>{abort.abort();models.forEach(r=>{if(r){dispose(r.group);r.retired.forEach(dispose);}});disposeStudio();finishes.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();});
 stage.dataset.cinema3d='loading';
 const ready=(async()=>{
  for(let i=0;i<products.length;i++){
   if(scope.disposed||failed)return;
   const collection=stage.closest('[data-collection-cinema]');
   if(collection?.dataset.revealOpen==='true')await new Promise(resolve=>{const done=()=>{collection.removeEventListener('ehf-reveal-closed',done);resolve();};collection.addEventListener('ehf-reveal-closed',done,{once:true});scope.cleanup(done);});
   if(scope.disposed||failed)return;
   try{
    const response=await fetch(`assets/models/${products[i].id}.glb?v=${VAPE_MODEL_REVISION}`,{signal:abort.signal});if(!response.ok)throw Error('Model unavailable');
    const gltf=await loader.parseAsync(await response.arrayBuffer(),'');if(scope.disposed){dispose(gltf.scene);return;}
    const source=gltf.scene;addSurfaceDetails(THREE,source,products[i].id);const materials=new Set(),retired=[];
    // The parade presents devices. Their full packaging/tear rigs remain in the detail pages.
    for(const name of ['Packaging','Wrapper']){const part=source.getObjectByName(name);if(part){part.removeFromParent();retired.push(part);}}
    source.traverse(n=>{if(!n.isMesh)return;const original=Array.isArray(n.material)?n.material:[n.material];const treated=original.map(m=>finishes.finish(m));n.material=Array.isArray(n.material)?treated:treated[0];original.forEach(m=>m.dispose());if(n.geometry.morphAttributes.position?.length){n.geometry.morphAttributes={};n.updateMorphTargets();}for(const m of Array.isArray(n.material)?n.material:[n.material]){if(!materials.has(m)){m.userData.originalColour=m.color.clone();m.userData.originalOpacity=m.opacity;m.userData.originalTransparent=m.transparent;m.userData.originalDepthWrite=m.depthWrite;}m.forceSinglePass=true;if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());materials.add(m);}});
    const bounds=new THREE.Box3().setFromObject(source),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());source.position.sub(centre);const group=new THREE.Group();group.add(source);scene.add(group);models[i]={group,unit:Math.max(size.y,size.x*.95),materials,retired};
    if(last)draw(...last);if(renderer.compileAsync)await renderer.compileAsync(scene,camera);if(scope.disposed)return;if(last)draw(...last);items[i].dataset.liveModel='true';stage.dataset.cinemaLoaded=String(models.filter(Boolean).length);invalidate();
   }catch(e){if(e.name==='AbortError'||scope.disposed)return;if(models[i]){scene.remove(models[i].group);dispose(models[i].group);models[i].retired.forEach(dispose);models[i]=null;}items[i].dataset.modelFallback='true';}
  }
  if(!scope.disposed){stage.dataset.cinema3d=models.filter(Boolean).length===products.length?'ready':'partial';invalidate();}
 })();
 return {draw,ready};
}
