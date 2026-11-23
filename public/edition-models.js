import {VAPE_MODEL_REVISION} from './vape-variants.js?v=2aa87c105d21';
// A single transparent scene carries the four original GLBs through the gallery.
// Detail viewers keep the complete assembly/foil rigs; this scene shows their sealed pose.
export async function createEditionModels({stage,items,editions,scope,invalidate}){
 const [THREE,{GLTFLoader}]=await Promise.all([import('./vendor/three/three.module.min.js'),import('./vendor/three/addons/loaders/GLTFLoader.js')]);
 if(scope.disposed)return null;
 const canvas=document.createElement('canvas');canvas.className='edition-gallery__models';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{canvas.remove();return null;}
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,6000),loader=new GLTFLoader(),abort=new AbortController(),models=[];
 camera.position.z=2000;scene.add(new THREE.HemisphereLight(0xf6f2e5,0x56645d,2));
 for(const [colour,power,pos] of [[0xfff1da,2.2,[1,2,3]],[0xcbdfff,1.5,[-2,.6,1]],[0xffffff,1.6,[.5,1,-2]]]){const l=new THREE.DirectionalLight(colour,power);l.position.set(...pos);scene.add(l);}
 let width=0,height=0,last=null,failed=false,frameCount=0;
 function disposeModel(model){const geometries=new Set(),materials=new Set(),textures=new Set();model.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){materials.add(m);Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t);});}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});}
 function resize(w,h){
  if(width===w&&height===h)return;width=w;height=h;
  const ratio=Math.min(devicePixelRatio,1.5,Math.sqrt(1300000/(w*h)));
  renderer.setSize(Math.round(w*ratio),Math.round(h*ratio),false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();
 }
 function draw(placements,w,h,{time=0,motion=false,hover=null,pointer={x:0,y:0}}={}){
  if(scope.disposed||failed||!w||!h)return;last=[placements,w,h,{time,motion,hover,pointer}];resize(w,h);
  for(let i=0;i<models.length;i++){
   const record=models[i];if(!record)continue;const p=placements[i],{group,unit}=record;
   const reach=p.size*p.scale*.85;group.visible=p.x+reach>0&&p.x-reach<w&&p.y+reach>0&&p.y-reach<h;
   group.position.set(p.x-w/2,h/2-p.y,p.relative*25);group.scale.setScalar(p.size*p.scale*.94/unit);
   const turn=Math.sin(time*.00038+i*.9)*.15;
   const leanX=hover===i?-pointer.y*.10:0,leanY=(-p.yaw*Math.PI/180)+turn+(hover===i?pointer.x*.38:0),leanZ=-p.tilt*Math.PI/180;
   group.rotation.x+=(leanX-group.rotation.x)*.16;group.rotation.y+=(leanY-group.rotation.y)*.16;group.rotation.z=leanZ;
   if(hover===i)stage.dataset.gallery3dYaw=group.rotation.y.toFixed(4);
  }
  const t=performance.now();renderer.render(scene,camera);
  if(++frameCount%30===1){stage.dataset.gallery3dDrawMs=(performance.now()-t).toFixed(2);stage.dataset.gallery3dCalls=String(renderer.info.render.calls);stage.dataset.gallery3dTriangles=String(renderer.info.render.triangles);stage.dataset.gallery3dPixels=String(canvas.width*canvas.height);}
 }
 scope.on(canvas,'webglcontextlost',e=>{e.preventDefault();failed=true;items.forEach(a=>delete a.dataset.liveModel);canvas.hidden=true;stage.dataset.gallery3d='fallback';});
 scope.cleanup(()=>{abort.abort();models.forEach(r=>r&&disposeModel(r.group));renderer.dispose();renderer.forceContextLoss();canvas.remove();});
 stage.dataset.gallery3d='loading';
 // Sequential decoding/compilation avoids four simultaneous first-frame stalls.
 const ready=(async()=>{
  for(let i=0;i<editions.length;i++){
   if(scope.disposed||failed)return;
   try{
    const response=await fetch(`assets/models/${editions[i].id}.glb?v=${VAPE_MODEL_REVISION}`,{signal:abort.signal});if(!response.ok)throw Error('Model unavailable');
    const gltf=await loader.parseAsync(await response.arrayBuffer(),'');if(scope.disposed){disposeModel(gltf.scene);return;}
    const asset=gltf.scene;
    asset.traverse(node=>{if(!node.isMesh)return;
     // Neutral pose uses the exact base geometry. Unused tear targets need no GPU storage here.
     if(node.geometry.morphAttributes.position?.length){node.geometry.morphAttributes={};node.updateMorphTargets();}
     for(const m of Array.isArray(node.material)?node.material:[node.material]){m.metalness=Math.min(.35,m.metalness||0);m.forceSinglePass=true;if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}
    });
    const bounds=new THREE.Box3().setFromObject(asset),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
    asset.position.sub(centre);const group=new THREE.Group();group.add(asset);scene.add(group);models[i]={group,unit:Math.max(size.x,size.y/(702/589))};
    if(last)draw(...last);if(renderer.compileAsync)await renderer.compileAsync(scene,camera);if(scope.disposed)return;
    items[i].dataset.liveModel='true';stage.dataset.gallery3dLoaded=String(models.filter(Boolean).length);invalidate();
   }catch(e){if(e.name==='AbortError'||scope.disposed)return;if(models[i]){scene.remove(models[i].group);disposeModel(models[i].group);models[i]=null;}items[i].dataset.modelFallback='true';}
  }
  if(!scope.disposed){stage.dataset.gallery3d=models.filter(Boolean).length===editions.length?'ready':'partial';invalidate();}
 })();
 return {draw,ready};
}
