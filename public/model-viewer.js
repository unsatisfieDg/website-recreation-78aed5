import {addSurfaceDetails} from './surface-details.js?v=4c7de86ff887';
import {createMaterialFinishes} from './material-finishes.js?v=d586bda1302e';
import {createStudioLight} from './studio-light.js?v=7700b6f2c0ac';
import {mountBarViewer} from './bar-viewer.js?v=834658f760e5';
import {findVariant,vapeVariants} from './vape-variants.js?v=2aa87c105d21';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n)),smooth=t=>t*t*(3-2*t);
const modelRevision='approved-range-20261112';
export const chooseVariant=value=>findVariant(value).id;
export function renderSize(width,height,dpr=1){const ratio=Math.min(Math.max(dpr,1.25),1.75,Math.sqrt(1600000/Math.max(1,width*height)));return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};}
export function initModelViewers(scope){
 document.querySelectorAll('[data-model-editor]:not([data-scene-managed])').forEach(root=>['vapes','pre-rolls'].includes(root.dataset.modelEditor)?mountBarViewer(root,scope):mountEditor(root,scope));
}
function mountEditor(root,scope){
 const kind=root.dataset.modelEditor,stage=root.querySelector('[data-model-stage]'),canvas=root.querySelector('canvas'),poster=root.querySelector('[data-model-poster]'),open=root.querySelector('[data-model-open]'),reset=root.querySelector('[data-model-reset]'),gesture=root.querySelector('[data-model-gesture]'),status=root.querySelector('[data-model-status]');
 const sceneRoot=root.closest('[data-range-scene]'),names=sceneRoot?.querySelectorAll('[data-model-name]')||[],parts=sceneRoot?.querySelectorAll('[data-model-part]')||[];
 let selected=kind==='vapes'?chooseVariant(new URLSearchParams(location.search).get('flavour')):kind;
 let finishes,disposeStudio;
 let THREE,loader,renderer,scene,camera,rig,model,moves=[],fades=[],opened=false,visible=false,loading=false,ready=false,failed=false,revision=0,request=null,frame=0,animation=null,rotationX=0,rotationY=.13,drag=null,part=null;
 let cameraTarget,cameraPosition,focusTarget,focusPosition,cameraTargetHome,enginePromise;
 const motion=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('motion-off');
 function showStage(){const anchor=root.closest('[data-range-inspector]')?.querySelector('.inspector-heading')||stage,rect=anchor.getBoundingClientRect();if(rect.top<95||root.getBoundingClientRect().bottom>innerHeight-20)window.scrollTo({top:scrollY+rect.top-100,behavior:motion()?'smooth':'auto'});}
 const signalMotion=active=>{root.dataset.modelInteracting=String(active);root.dispatchEvent(new Event('ehf-model-motion',{bubbles:true}));};
 function disposeModel(asset){if(!asset)return;const textures=new Set(),geometries=new Set(),materials=new Set();asset.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:[node.material])if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture&&!value.userData.sharedFinish)textures.add(value);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});}
 function info(){
  root.dataset.variant=selected;const v=findVariant(selected);
  if(kind==='vapes'){
   root.style.setProperty('--flavour',v.color);poster.src=`assets/vape-range/${v.id}-poster.webp?v=${modelRevision}`;poster.alt=`${v.name} vape and matching packaging`;
   root.querySelectorAll('[data-model-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modelVariant===selected)));
   root.querySelector('[data-model-count]').textContent=`0${vapeVariants.indexOf(v)+1} / 06`;
   sceneRoot?.dispatchEvent(new CustomEvent('ehf-flavour-changed',{detail:{id:selected}}));
   names.forEach(n=>n.textContent=v.name);sceneRoot?.querySelectorAll('[data-model-note]').forEach(n=>n.textContent=v.note);
   sceneRoot?.querySelectorAll('[data-model-download]').forEach(a=>a.href=`assets/models/${selected}.glb`);
  }
  open.setAttribute('aria-pressed',String(opened));open.querySelector('b').textContent=opened?'Click to reassemble':kind==='vapes'?'Click to disassemble':kind==='edibles'?'Explore the gummies':'Explore the form';
  parts.forEach(b=>b.setAttribute('aria-pressed',String(part===b.dataset.modelPart)));
  const text=sceneRoot?.querySelector('[data-model-part-copy]');if(text)text.textContent=part==='Mouthpiece'?'The colour-matched mouthpiece lifts away from the connection collar.':part==='Cartridge'?`${v.name}: the extract follows this flavour’s colour palette. This is a visual treatment; the actual liquid appearance is to be confirmed.`:part==='DeviceHousing'?'The illustrated outer housing carries the supplied bear-and-cloud artwork, separated here from the cartridge.':'Click a component to separate the device and bring that detail into focus.';
 }
 function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const size=renderSize(w,h,animation||drag?1:devicePixelRatio);renderer.setSize(size.width,size.height,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();}
 function draw(){if(scope.disposed||!ready||!visible||document.hidden||!renderer)return;rig.rotation.set(rotationX,rotationY,0);camera.lookAt(cameraTarget);const started=performance.now();renderer.render(scene,camera);root.dataset.modelDrawMs=(performance.now()-started).toFixed(1);root.dataset.modelDrawCalls=String(renderer.info.render.calls);root.dataset.modelTriangles=String(renderer.info.render.triangles);}
 function tick(now){
  frame=0;if(!animation||scope.disposed||!visible||document.hidden)return;
  const t=motion()?clamp((now-animation.start)/animation.duration,0,1):1,e=smooth(t);
  for(const m of moves)m.node.position.lerpVectors(m.from,m.to,e);
  for(const item of fades){
   const weight=item.from+(item.to-item.from)*e;item.weight=weight;item.node.visible=weight>.001;
   for(const m of item.materials){const transparent=m.userData.baseTransparent||weight<.999;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=m.userData.baseOpacity*weight;m.depthWrite=m.userData.baseDepthWrite&&weight>.98;}
  }
  camera.position.lerpVectors(animation.cameraFrom,focusPosition,e);cameraTarget.lerpVectors(animation.targetFrom,focusTarget,e);draw();
  if(t<1)frame=requestAnimationFrame(tick);else{animation=null;signalMotion(false);root.dataset.modelState=opened?'open':'assembled';resize();}
 }
 function pose(focus=null){
  if(!ready)return;part=focus;if(focus)root.dataset.modelFocus=focus;else delete root.dataset.modelFocus;
  for(const m of moves){m.from=m.node.position.clone();m.to=m.base.clone().addScaledVector(m.delta,opened?1:0);}
  for(const item of fades){item.from=item.weight;item.to=focus&&item.component!==focus?0:1;if(item.to>0)item.node.visible=true;}
  focusTarget=cameraTargetHome.clone();focusPosition=cameraPosition.clone();
  if(focus){
   const target=model.getObjectByName(focus),matching=moves.find(m=>m.node===target),previous=target?.position.clone();
   if(target&&matching)target.position.copy(matching.to);rig.updateMatrixWorld(true);
   if(target){focusTarget=new THREE.Box3().setFromObject(target).getCenter(new THREE.Vector3());focusPosition=focusTarget.clone().add(new THREE.Vector3(.015,.008,.15));}
   if(previous)target.position.copy(previous);
  }
  if(focus){gesture.textContent=`${focus==='Cartridge'?'FLAVOUR-COLOURED EXTRACT':focus==='Mouthpiece'?'MOUTHPIECE':'ILLUSTRATED HOUSING'} / DRAG TO ROTATE`;}
  else gesture.textContent='DRAG TO ROTATE / CLICK TO OPEN';
  showStage();
  signalMotion(true);animation={start:performance.now(),duration:motion()?1500:1,cameraFrom:camera.position.clone(),targetFrom:cameraTarget.clone()};root.dataset.modelState='animating';cancelAnimationFrame(frame);resize();frame=requestAnimationFrame(tick);info();status.textContent=focus?`${focus==='Cartridge'?'Flavour-coloured extract':focus==='DeviceHousing'?'Illustrated housing':'Mouthpiece'} in focus.`:opened?'Product opened into separate components.':'Product assembled.';
 }
 async function boot(){
  if(loading||failed||scope.disposed)return;loading=true;const mine=++revision;request?.abort();request=new AbortController();ready=false;open.disabled=true;canvas.hidden=true;root.dataset.modelReady='false';gesture.textContent='Loading the 3D study…';
  try{
   if(!enginePromise)enginePromise=(async()=>{
    const imports=await Promise.all([import('./vendor/three/three.module.min.js'),import('./vendor/three/addons/loaders/GLTFLoader.js')]);THREE=imports[0];if(scope.disposed)return;
    loader=new imports[1].GLTFLoader();renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    scene=new THREE.Scene();finishes=createMaterialFinishes(THREE,renderer);disposeStudio=createStudioLight(THREE,renderer,scene);camera=new THREE.PerspectiveCamera(31,1,.001,10);rig=new THREE.Group();scene.add(rig);scene.add(new THREE.HemisphereLight(0xf4f1da,0x35473b,2.2));
    for(const [color,power,location] of [[0xffe9ca,2.6,[1,2,3]],[0xb6dcff,1.7,[-2,.6,1]],[0xedffdb,2.8,[.5,1,-2]]]){const light=new THREE.DirectionalLight(color,power);light.position.set(...location);scene.add(light);}
   })();
   await enginePromise;if(scope.disposed||mine!==revision)return;
   const response=await fetch(`assets/models/${selected}.glb?v=${modelRevision}`,{signal:request.signal});if(!response.ok)throw new Error('Model unavailable');const gltf=await loader.parseAsync(await response.arrayBuffer(),'');
   if(scope.disposed||mine!==revision){disposeModel(gltf.scene);return;}if(model){rig.remove(model);disposeModel(model);}model=gltf.scene;addSurfaceDetails(THREE,model,kind);root.dataset.modelSurfaceDetails=JSON.stringify(model.userData.surfaceDetails||{});rig.add(model);rig.rotation.set(0,0,0);model.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),extent=Math.max(size.y,size.x*1.3);
   cameraTargetHome=center.clone();cameraTarget=center.clone();cameraPosition=center.clone().add(new THREE.Vector3(0,.014,extent*2.3));camera.position.copy(cameraPosition);
   const manifest=await fetch(`assets/models/${selected}.json?v=${modelRevision}`,{signal:request.signal}).then(r=>r.json());if(scope.disposed||mine!==revision)return;
   moves=Object.entries(manifest.motion||{}).flatMap(([name,delta])=>{const node=model.getObjectByName(name);return node?[{node,base:node.position.clone(),delta:new THREE.Vector3(...delta)}]:[];});
   fades=[];const oldMaterials=new Set();
   model.traverse(node=>{if(node.isMesh&&!node.userData.retiredDetail){
    const list=Array.isArray(node.material)?node.material:[node.material],materials=list.map(original=>{oldMaterials.add(original);const m=finishes.finish(original);m.userData.baseOpacity=m.opacity;m.userData.baseTransparent=m.transparent;m.userData.baseDepthWrite=m.depthWrite;return m;});
    node.material=Array.isArray(node.material)?materials:materials[0];let component=node;while(component.parent&&!['Mouthpiece','Cartridge','Collar','DeviceHousing','Packaging'].includes(component.name))component=component.parent;
    fades.push({node,component:component.name,materials,weight:1,from:1,to:1});
   }});oldMaterials.forEach(m=>m.dispose());
   camera.lookAt(cameraTarget);if(renderer.compileAsync)await renderer.compileAsync(scene,camera);if(scope.disposed||mine!==revision)return;
   opened=false;part=null;delete root.dataset.modelFocus;rotationX=0;rotationY=.13;ready=true;canvas.hidden=false;root.dataset.modelReady='true';root.dataset.modelState='assembled';open.disabled=!moves.length;gesture.textContent='DRAG TO ROTATE / CLICK TO OPEN';status.textContent=`${kind==='vapes'?findVariant(selected).name:kind} 3D study ready.`;info();resize();signalMotion(false);
  }catch(error){if(scope.disposed||mine!==revision||error.name==='AbortError')return;failed=true;gesture.textContent='3D view unavailable. The product artwork remains visible.';root.dataset.modelReady='false';status.textContent=gesture.textContent;}
  finally{if(mine===revision)loading=false;}
 }
 scope.on(open,'click',()=>{opened=!opened;pose();});scope.on(reset,'click',()=>{rotationX=0;rotationY=.13;opened=false;pose();});
 function selectVariant(id){
  id=chooseVariant(id);if(selected===id){showStage();if(ready){opened=false;pose();}else if(!loading)boot();return;}
  selected=id;opened=false;part=null;failed=false;request?.abort();revision++;loading=false;cancelAnimationFrame(frame);animation=null;signalMotion(false);info();showStage();boot();
 }
 root.querySelectorAll('[data-model-variant]').forEach(button=>scope.on(button,'click',()=>selectVariant(button.dataset.modelVariant)));
 if(kind==='vapes')scope.on(sceneRoot,'ehf-select-flavour',event=>selectVariant(event.detail.id));
if(kind==='pre-rolls'){
  const applyTubeColor = (event) => {
    const hex = event.detail?.color || event.detail?.shade;
    if(hex && model){
      model.traverse(node => {
        if(node.isMesh){
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          for(const m of mats){
            if(m && (m.name === 'Brass tube' || ['StorageTube','TubeCap','Brass storage','Brass lid'].includes(node.name || node.parent?.name))){
              m.color.set(hex);
              m.needsUpdate = true;
            }
          }
        }
      });
      draw();
    }
  };
  scope.on(root, 'ehf-select-flavour', applyTubeColor);
  if(sceneRoot) scope.on(sceneRoot, 'ehf-select-flavour', applyTubeColor);
  scope.on(document, 'ehf-select-flavour', applyTubeColor);
}
 parts.forEach(button=>scope.on(button,'click',()=>{if(!ready)return;opened=true;pose(button.dataset.modelPart);}));
 scope.on(canvas,'pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,rx:rotationX,ry:rotationY,moved:false};canvas.setPointerCapture(e.pointerId);signalMotion(true);});
 scope.on(canvas,'pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved=drag.moved||Math.abs(dx)+Math.abs(dy)>5;rotationY=clamp(drag.ry+dx*.008,-1.25,1.25);rotationX=clamp(drag.rx+dy*.005,-.4,.4);draw();});
 function endDrag(e){if(!drag)return;const moved=drag.moved;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);signalMotion(false);if(!moved&&ready){opened=!opened;pose();}}
 scope.on(canvas,'pointerup',endDrag);scope.on(canvas,'pointercancel',()=>{drag=null;signalMotion(false);});
 scope.on(canvas,'keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();if(e.key==='Enter'||e.key===' '){opened=!opened;pose();}else{rotationY=clamp(rotationY+(e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0),-1.25,1.25);rotationX=clamp(rotationX+(e.key==='ArrowUp'?-.08:e.key==='ArrowDown'?.08:0),-.4,.4);draw();}}});
 scope.on(canvas,'webglcontextlost',e=>{e.preventDefault();failed=true;ready=false;canvas.hidden=true;root.dataset.modelReady='false';gesture.textContent='3D view paused. Product artwork is available.';});
 scope.own(new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;root.dataset.modelVisible=String(visible);if(visible){if(!renderer&&!loading)boot();else if(animation){animation.start=performance.now();moves.forEach(m=>m.from=m.node.position.clone());animation.cameraFrom=camera.position.clone();animation.targetFrom=cameraTarget.clone();frame=requestAnimationFrame(tick);}else draw();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:.05})).observe(stage);
 scope.own(new ResizeObserver(resize)).observe(stage);
 scope.on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(visible){if(animation){animation.start=performance.now();frame=requestAnimationFrame(tick);}else draw();}});
 scope.on(document,'ehf-page-ready',()=>{resize();draw();});
 scope.cleanup(()=>{revision++;request?.abort();cancelAnimationFrame(frame);disposeModel(model);disposeStudio?.();finishes?.dispose();renderer?.dispose();renderer?.forceContextLoss();});info();
}
