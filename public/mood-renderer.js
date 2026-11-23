import {VAPE_MODEL_REVISION} from './vape-variants.js?v=2aa87c105d21';
import {createPreRollStudy,refineProductSurfaces,applyCartonStudy} from './inspection-rig.js?v=hideroll1795346400';
import {createMaterialFinishes} from './material-finishes.js?v=d586bda1302e';
import {createFlavourEffects} from './flavour-effects.js?v=instantposter1795326720';
import {createStudioLight} from './studio-light.js?v=7700b6f2c0ac';
import {addSurfaceDetails} from './surface-details.js?v=4c7de86ff887';
import {barPartOffset,foilMorphWeights} from './bar-viewer.js?v=834658f760e5';
import {ringOrder,mix,easeInOut,gummyConcepts,gummySlots,preRollEditions,preRollSlots} from './mood-layout.js?v=0db75fe570d3';
import {modelLoadOrder,createModelLoader} from './model-loading.js?v=73d752244746';
export async function createMoodRenderer({stage,buttons,products,scope,invalidate,splashVideo,initialFamily=null,initialProduct=null}){
 const [T,{GLTFLoader}]=await Promise.all([import('./vendor/three/three.module.min.js'),import('./vendor/three/addons/loaders/GLTFLoader.js')]);if(scope.disposed)return null;
 const canvas=document.createElement('canvas');canvas.className='mood-canvas';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
 let renderer;try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance',precision:'highp'});}catch{canvas.remove();return null;}
 renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,6000),loader=new GLTFLoader(),abort=new AbortController(),finishes=createMaterialFinishes(T,renderer),records=new Map(),framingByProduct=new Map(),prototypes=[],instances=[];
 const brandMap=new T.TextureLoader().load('assets/ehf-logo.webp',()=>{if(!scope.disposed)invalidate();});brandMap.colorSpace=T.SRGBColorSpace;const herbMap=new T.TextureLoader().load('assets/studies/roll-hemp.webp',()=>{if(!scope.disposed)invalidate();});herbMap.colorSpace=T.SRGBColorSpace;herbMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const paperMap=new T.TextureLoader().load('assets/studies/roll-paper.webp',()=>{if(!scope.disposed)invalidate();});paperMap.colorSpace=T.SRGBColorSpace;paperMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());camera.position.z=2000;const disposeStudio=createStudioLight(T,renderer,scene);scene.add(new T.HemisphereLight(0xf8f3e7,0x4c674d,.8));
 for(const [c,p,pos] of [[0xfff4dc,2.2,[1,2,4]],[0xe1eddf,1.25,[-2,1,2]],[0xffffff,1.8,[.5,1,-2]]]){const light=new T.DirectionalLight(c,p);light.position.set(...pos);scene.add(light);}
 const cinemaEffects=createFlavourEffects(T,scene,scope,invalidate,splashVideo);
 let width=0,height=0,quality=0,draws=0,failed=false,last=null,warm=Promise.resolve();
 const bounds=root=>{root.updateMatrixWorld(true);const box=new T.Box3();root.traverseVisible(n=>{if(n.isMesh&&!n.userData.retiredDetail)box.union(new T.Box3().setFromObject(n));});return box;};
 function pose(record,p,foil=p,unroll=0,carton=0){applyCartonStudy(record.source,carton);if(record.source.userData.applyInspection){record.source.userData.applyInspection(p,unroll);return;}for(const item of record.packStyles||[]){item.node.position.copy(item.position);item.node.scale.copy(item.scale);}for(const n of record.morphs||[]){const weights=foilMorphWeights(foil,n.morphTargetInfluences.length);n.morphTargetInfluences.forEach((_,i)=>n.morphTargetInfluences[i]=weights[i]);}for(const m of record.moves){const d=record.meta.tearTargets?barPartOffset(m.node.name,p,m.delta):m.delta.map(v=>v*easeInOut(p));m.node.position.copy(m.base).add(new T.Vector3(...d));}}
 function componentOf(node,source){for(let n=node;n&&n!==source;n=n.parent)if(['Mouthpiece','Cartridge','Collar','DeviceHousing','Packaging','Wrapper','RollingPaper','HempFlower','Filter','Roll_1','TubeCap','StorageTube'].includes(n.name))return n.name;return null;}
 const sealedGeometryBounds=new WeakMap();
 function localBounds(node,source){
  source.updateMatrixWorld(true);
  const inverse=source.matrixWorld.clone().invert(),box=new T.Box3();
  node.traverseVisible(mesh=>{
   if(!mesh.isMesh||mesh.userData.retiredDetail)return;
   const geometry=mesh.geometry,weights=mesh.morphTargetInfluences;
   let shape;
   if(weights?.some(v=>v>0)){
    shape=new T.Box3();
    const vertex=new T.Vector3();
    for(let i=0;i<geometry.attributes.position.count;i++)shape.expandByPoint(mesh.getVertexPosition(i,vertex));
   }else if(weights?.length){
    shape=sealedGeometryBounds.get(geometry);
    if(!shape){shape=new T.Box3().setFromBufferAttribute(geometry.attributes.position);sealedGeometryBounds.set(geometry,shape);}
   }else{
    const owner=mesh.isInstancedMesh?mesh:geometry;
    if(!owner.boundingBox)owner.computeBoundingBox();
    shape=owner.boundingBox;
   }
   box.union(shape.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld)));
  });
  return box;
 }
 function treat(source,id){if(id!=='pre-rolls')addSurfaceDetails(T,source,id);refineProductSurfaces(T,source,id);const originals=new Set();source.traverse(n=>{if(!n.isMesh)return;const old=Array.isArray(n.material)?n.material:[n.material],treated=old.map(m=>{originals.add(m);return finishes.finish(m);});n.material=Array.isArray(n.material)?treated:treated[0];for(const m of treated)if(m.map){m.map.colorSpace=T.SRGBColorSpace;m.map.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());}});originals.forEach(m=>m.dispose());}
 function stylePackaging(record,fit){const k=mix(1,.76,fit);for(const item of record.packStyles){item.node.scale.copy(item.scale).multiplyScalar(k);item.node.position.addScaledVector(item.centerOffset,1-k);item.node.position.x-=.009*fit;item.node.position.z-=.012*fit;}}
 function positionRevealPair(pair,amount){
  if(!pair)return;
  const {wrapper,device}=pair;
  if(pair.offset){
   wrapper.position.x=pair.wrapperX;
   device.position.x=pair.deviceX;
  }
  // The approved models share this spacing. Leave a visible gap at the closest point.
  pair.offset=.018*amount;
  if(!pair.offset)return;
  pair.wrapperX=wrapper.position.x;
  pair.deviceX=device.position.x;
  wrapper.position.x+=pair.offset;
  device.position.x-=pair.offset;
 }
 function gummyGradient(mesh,stops){
  const geometry=mesh.geometry.clone(),position=geometry.attributes.position,uv=geometry.attributes.uv;
  geometry.computeBoundingBox();const {min,max}=geometry.boundingBox;
  const colours=stops.map(stop=>new T.Color(stop)),pixels=new Uint8Array(128*4),sample=new T.Color();
  for(let i=0;i<128;i++){
   const progress=i/127*(colours.length-1),start=Math.min(Math.floor(progress),colours.length-2);
   sample.copy(colours[start]).lerp(colours[start+1],progress-start).convertLinearToSRGB();
   pixels.set([sample.r*255,sample.g*255,sample.b*255,255],i*4);
  }
  for(let i=0;i<uv.count;i++)uv.setY(i,(max.y-position.getY(i))/(max.y-min.y));
  uv.needsUpdate=true;mesh.geometry=geometry;
  const map=new T.DataTexture(pixels,1,128,T.RGBAFormat);map.minFilter=map.magFilter=T.LinearFilter;map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;
  return map;
 }
 function makeRecord(source,meta,slot){
  const group=new T.Group(),pivot=new T.Group();pivot.add(source);group.add(pivot);const moves=Object.entries(meta.motion||{}).flatMap(([name,delta])=>{const node=source.getObjectByName(name);return node?[{node,base:node.position.clone(),delta}]:[];});
  const materials=new Set(),morphs=[],packNodes=['Packaging','Wrapper'].map(name=>source.getObjectByName(name)).filter(Boolean);source.traverse(n=>{if(!n.isMesh)return;if(n.morphTargetInfluences?.length)morphs.push(n);let pack=false;for(let parent=n;parent&&parent!==source;parent=parent.parent)if(['Packaging','Wrapper'].includes(parent.name))pack=true;const m=(Array.isArray(n.material)?n.material:[n.material]).map(v=>{const c=v.clone();let ancestor=n,gummyNode=null;while(ancestor&&ancestor!==source){if(/^Gummy_[1-5]$/.test(ancestor.name)){gummyNode=ancestor.name;break;}ancestor=ancestor.parent;}c.userData.gummyNode=gummyNode;c.userData.component=componentOf(n,source);c.userData.baseOpacity=v.opacity;c.userData.pack=pack;c.userData.baseDepthWrite=v.depthWrite;c.transparent=true;c.forceSinglePass=true;materials.add(c);return c;});n.material=Array.isArray(n.material)?m:m[0];});
  const packStyles=packNodes.map(node=>{
   const wasVisible=node.visible;node.visible=true;
   const center=localBounds(node,node).getCenter(new T.Vector3()).applyMatrix4(node.matrix);
   node.visible=wasVisible;
   return {node,position:node.position.clone(),scale:node.scale.clone(),centerOffset:center.sub(node.position)};
  });
  const gummy=gummyConcepts[gummySlots.indexOf(slot)];
  const wrapper=source.getObjectByName('Wrapper'),device=source.getObjectByName('Device');
  const revealPair=meta.tearTargets&&wrapper&&device?{wrapper,device,offset:0}:null;
  const r={group,pivot,source,moves,meta,materials,morphs,packNodes,packStyles,revealPair,slot,ready:false};
  pose(r,0);
  r.gummyNodes=Array.from({length:5},(_,i)=>source.getObjectByName('Gummy_'+(i+1))).filter(Boolean);
  r.variantIndex=r.gummyNodes.findIndex(node=>node.name===gummy?.node);
  r.gummyNodes[r.variantIndex]?.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const surfaces=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).filter(material=>/^Fruit colour /.test(material.name));
   if(!surfaces.length)return;
   if(gummy.gradient){
    const map=gummyGradient(mesh,gummy.gradient);
    surfaces.forEach(material=>{material.map=map;material.color.set('#ffffff');});
   }else surfaces.forEach(material=>material.color.set(gummy.colour));
  });
  // Identical source clones share exact framing; each retains its own physical rig.
  const cached=framingByProduct.get(ringOrder[slot]);
  if(cached)Object.assign(r,cached);else{
   const closed=bounds(source),closedSize=closed.getSize(new T.Vector3());r.closedCenter=closed.getCenter(new T.Vector3());r.unit=Math.max(closedSize.y,closedSize.x*.85);packNodes.forEach(n=>n.visible=true);pose(r,1,1,1,1);stylePackaging(r,1);const full=localBounds(source,source).union(closed);r.fullCenter=full.getCenter(new T.Vector3());r.fullSize=full.getSize(new T.Vector3());
   const envelope=wrapper?.userData.tearEnvelope;
   // The offline envelope keeps the same framing throughout the pull and recoil.
   if(envelope){
    const transform=source.matrixWorld.clone().invert().multiply(wrapper.matrixWorld);
    r.wrapperEnvelope=new T.Box3(new T.Vector3(...envelope.slice(0,3)),new T.Vector3(...envelope.slice(3))).applyMatrix4(transform);
   }
   pose(r,0);r.variants=[];
   if(r.gummyNodes.length){for(const selected of r.gummyNodes){r.gummyNodes.forEach(n=>n.visible=n===selected);const b=bounds(source),size=b.getSize(new T.Vector3());r.variants.push({center:b.getCenter(new T.Vector3()),size,unit:Math.max(size.y,size.x*.85)});}r.gummyNodes.forEach(n=>n.visible=true);}
   framingByProduct.set(ringOrder[slot],{closedCenter:r.closedCenter,unit:r.unit,fullCenter:r.fullCenter,fullSize:r.fullSize,wrapperEnvelope:r.wrapperEnvelope,variants:r.variants});
  }
  scene.add(group);return r;
 }
 async function load(index){
  try{
   const {id,family}=products[index],revision=family==='vapes'?VAPE_MODEL_REVISION:'approved-range-20261112';let meta,source;
   if(id==='pre-rolls'){meta={id,inspectionRig:true,motion:{}};source=createPreRollStudy(T,brandMap,herbMap,paperMap);}else{const [response,metaResponse]=await Promise.all([fetch(`assets/models/${id}.glb?v=${revision}`,{signal:abort.signal}),fetch(`assets/models/${id}.json?v=${revision}`,{signal:abort.signal})]);if(!response.ok||!metaResponse.ok)throw Error('Model unavailable');meta=await metaResponse.json();const asset=await loader.parseAsync(await response.arrayBuffer(),'');source=asset.scene;}
   if(scope.disposed){release([source]);return false;}prototypes.push(source);
   treat(source,id);for(const name of ['Packaging','Wrapper']){const node=source.getObjectByName(name);if(node)node.visible=false;}
   const fresh=[];for(const [slot,product] of ringOrder.entries()){if(product!==index)continue;await new Promise(resolve=>setTimeout(resolve,0));if(scope.disposed)return false;let instance;if(id==='pre-rolls'){instance=createPreRollStudy(T,brandMap,herbMap,paperMap,preRollEditions[preRollSlots.indexOf(slot)]?.colour,preRollEditions[preRollSlots.indexOf(slot)]?.gradient);treat(instance,id);}else instance=source.clone(true);const record=makeRecord(instance,meta,slot);fresh.push(record);instances.push(record.group);}
   // Warm once before replacing any photographic fallback. Geometry and texture data are shared.
   warm=warm.then(()=>renderer.compileAsync?.(scene,camera));await warm;if(scope.disposed)return false;
   fresh.forEach(r=>{r.ready=true;records.set(r.slot,r);});stage.dataset.moodLoaded=String(new Set([...records.keys()].map(s=>ringOrder[s])).size);invalidate();return true;
  }catch(error){if(!scope.disposed&&error.name!=='AbortError')stage.dataset.moodPartial='true';return false;}
 }
 function release(roots){const gs=new Set(),ms=new Set(),ts=new Set();roots.forEach(root=>root.traverse(n=>{if(n.geometry)gs.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){ms.add(m);Object.values(m).forEach(v=>{if(v?.isTexture&&!v.userData.sharedFinish)ts.add(v);});}}));gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>{t.dispose();t.source?.data?.close?.();});}
 function draw(placements,w,h,clip={left:0,top:0,right:w,bottom:h},moving=false){
  if(scope.disposed||failed||!w||!h)return;last={placements,w,h};const focused=placements.some(p=>p.fit>.999),ratio=focused?Math.min(1.75,Math.sqrt(2000000/(w*h))):Math.min(Math.max(devicePixelRatio,1),1.6,Math.sqrt(1450000/(w*h)));if(w!==width||h!==height||ratio!==quality){width=w;height=h;quality=ratio;renderer.setSize(Math.round(w*ratio),Math.round(h*ratio),false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
  for(const [slot,r] of records){const p=placements[slot],reach=p.height;r.group.visible=p.alpha>.008&&p.x+reach>clip.left&&p.x-reach<clip.right&&p.y+reach>clip.top&&p.y-reach<clip.bottom;if(!r.group.visible)continue;
   // Keep the existing framing and inspection bounds based on the resting pose.
   positionRevealPair(r.revealPair,0);
   const fit=p.fit||0,packWeight=easeInOut(Math.max(0,Math.min(1,(fit-.35)/.65)));r.packNodes.forEach(n=>n.visible=packWeight>.001);const articulation=[p.pose||0,p.foil??p.pose??0,p.unroll||0,p.carton||0,fit],changed=!r.articulation||articulation.some((value,i)=>value!==r.articulation[i]);if(changed){pose(r,...articulation.slice(0,4));stylePackaging(r,fit);r.articulation=articulation;}const variantAmount=p.variantAmount||0,variant=r.variants[r.variantIndex],closedCenter=r.closedCenter.clone(),fullCenter=r.fullCenter.clone(),fullSize=r.fullSize.clone();let closedUnit=r.unit;if(variant){closedCenter.lerp(variant.center,variantAmount);fullCenter.lerp(variant.center,variantAmount);fullSize.lerp(variant.size,variantAmount);closedUnit=mix(closedUnit,variant.unit,variantAmount);}r.gummyNodes.forEach(n=>n.visible=variantAmount<.999||n.name===r.gummyNodes[r.variantIndex]?.name);const amount=p.inspectAmount||0,wrapperFrame=p.inspectNode==='Wrapper'&&r.wrapperEnvelope;if(fit>0&&!variant&&!(wrapperFrame&&amount>=.999)){const key=[p.pose||0,p.foil||0,p.unroll||0,p.carton||0,fit].join('|');if(r.framingCache?.key!==key){const box=localBounds(r.source,r.source);r.framingCache={key,center:box.getCenter(new T.Vector3()),size:box.getSize(new T.Vector3())};}fullCenter.copy(r.framingCache.center);fullSize.copy(r.framingCache.size);}let unit=mix(closedUnit,Math.max(fullSize.y,fullSize.x/Math.max(.6,p.aspect||1)*1.1),fit),center=closedCenter.lerp(fullCenter,fit);const inspected=p.inspectNode&&r.source.getObjectByName(p.inspectNode);if(inspected&&amount>0){const cacheKey=[p.inspectNode,p.pose||0,p.foil||0,p.unroll||0,p.carton||0].join('|');if(!wrapperFrame&&r.inspectionCache?.key!==cacheKey)r.inspectionCache={key:cacheKey,box:localBounds(inspected,r.source)};const box=wrapperFrame||r.inspectionCache.box,size=box.getSize(new T.Vector3());center.lerp(box.getCenter(new T.Vector3()),amount);unit=mix(unit,Math.max(size.y,size.x/Math.max(.4,(p.aspect||1)*(p.inspectWidthFraction||.53)))*1.15,amount);}r.pivot.position.copy(center).multiplyScalar(-1);r.group.position.set(p.x-w/2,h/2-p.y,p.depth);r.group.scale.setScalar(p.height/unit);r.group.rotation.set(p.pitch,p.yaw,p.tilt);
   if(p.gather)positionRevealPair(r.revealPair,p.gather);
   const gummyNode=r.gummyNodes[r.variantIndex]?.name;
   if(r.lastAlpha!==p.alpha||r.lastPackWeight!==packWeight||r.lastVariant!==variantAmount||r.lastPart!==p.inspectNode||r.lastAmount!==amount){
    for(const m of r.materials){
     const part=m.userData.component,partAlpha=variant&&m.userData.gummyNode&&m.userData.gummyNode!==gummyNode?1-variantAmount:1;
     const inspectedWeight=p.inspectNode&&part!==p.inspectNode&&!(p.inspectNode==='Roll_1'&&['RollingPaper','HempFlower','Filter'].includes(part))?1-amount:1;
     const alpha=p.alpha*(m.userData.pack?packWeight:1)*partAlpha*inspectedWeight;
     m.opacity=m.userData.baseOpacity*alpha;
     m.depthWrite=m.userData.baseDepthWrite&&alpha>.98;
    }
    r.lastAlpha=p.alpha;r.lastPackWeight=packWeight;r.lastVariant=variantAmount;r.lastPart=p.inspectNode;r.lastAmount=amount;
   }
  }
  cinemaEffects.update(placements,w,h,moving);
  // Render only the visible strip while scrolling between the 3D scene and films.
  const left=Math.max(0,Math.floor(clip.left*quality)),bottom=Math.max(0,Math.floor((h-clip.bottom)*quality)),right=Math.min(canvas.width,Math.ceil(clip.right*quality)),top=Math.min(canvas.height,Math.ceil((h-clip.top)*quality)),paintWidth=Math.max(0,right-left),paintHeight=Math.max(0,top-bottom);
  renderer.setScissor(left,bottom,paintWidth,paintHeight);renderer.setScissorTest(true);
  const start=performance.now();renderer.render(scene,camera);for(const [slot] of records)if(buttons[slot].dataset.live!=='true')buttons[slot].dataset.live='true';if(++draws%20===1){stage.dataset.moodDrawMs=(performance.now()-start).toFixed(2);stage.dataset.moodCalls=String(renderer.info.render.calls);stage.dataset.moodTriangles=String(renderer.info.render.triangles);stage.dataset.moodPixels=String(canvas.width*canvas.height);stage.dataset.moodPaintPixels=String(paintWidth*paintHeight);}stage.dataset.moodDraws=String(draws);
 }
 function project(slot,name){const r=records.get(slot),node=r?.source.getObjectByName(name);if(!node||!last)return null;r.group.updateMatrixWorld(true);const box=new T.Box3().setFromObject(node),points=[];if(box.isEmpty())box.expandByPoint(node.getWorldPosition(new T.Vector3()));for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));const point=box.getCenter(new T.Vector3()).project(camera);return {x:(point.x+1)*width/2,y:(1-point.y)*height/2,left:Math.min(...points.map(p=>(p.x+1)*width/2)),right:Math.max(...points.map(p=>(p.x+1)*width/2)),top:Math.min(...points.map(p=>(1-p.y)*height/2)),bottom:Math.max(...points.map(p=>(1-p.y)*height/2))};}
 function pick(slot,x,y){const r=records.get(slot);if(!r||!last)return null;r.group.updateMatrixWorld(true);const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/width*2-1,1-y/height*2),camera);const hits=ray.intersectObject(r.source,true).filter(h=>h.object.visible&&!h.object.userData.retiredDetail&&(Array.isArray(h.object.material)?h.object.material:[h.object.material]).some(m=>m.opacity>.5));return hits.map(hit=>componentOf(hit.object,r.source)).find(Boolean)||null;}
 scope.on(canvas,'webglcontextlost',event=>{event.preventDefault();failed=true;canvas.hidden=true;buttons.forEach(b=>delete b.dataset.live);stage.dataset.moodRenderer='failed';stage.dispatchEvent(new Event('ehf-mood-renderer-failed'));invalidate();});
 scope.cleanup(()=>{abort.abort();release([...prototypes,...instances]);disposeStudio();finishes.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();});
 // Two bounded workers; no video or postprocessing competes with the product scene.
 const loading=createModelLoader(load,{concurrency:2});scope.cleanup(()=>loading.stop());const activate=(family=null,chosen=null)=>Promise.all(modelLoadOrder(products,family,chosen).map(index=>loading.ensure(index)));const ready=Promise.all(modelLoadOrder(products,initialFamily,initialProduct,{selectedOnly:true}).map(index=>loading.ensure(index)));
 return {draw,prepareEffect:cinemaEffects.prepare,pauseCinema:()=>cinemaEffects.pause(),project,pick,activate,hasPart:(slot,name)=>Boolean(records.get(slot)?.source.getObjectByName(name)),ready,isReady:slot=>records.has(slot),async whenReady(slot){return scope.disposed?false:loading.ensure(ringOrder[slot],{priority:true});},async retry(slot){return scope.disposed?false:loading.ensure(ringOrder[slot],{priority:true,retry:true});}};
}
