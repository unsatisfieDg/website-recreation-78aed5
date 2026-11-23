import {createLiquidAtmosphere} from './liquid-atmosphere.js?v=67b13429b73f';
import {createMaterialFinishes} from './material-finishes.js?v=d586bda1302e';
import {createStudioLight} from './studio-light.js?v=7700b6f2c0ac';
import {findVariant,vapeVariants,VAPE_MODEL_REVISION} from './vape-variants.js?v=2aa87c105d21';
import {descriptionPlacement} from './model-annotations.js?v=82d3cb5bb29f';
import {productComponent,approvedFlavours} from './product-content.js?v=c73acc77c6a5';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const phase=(p,a,b)=>ease((p-a)/(b-a));
export function barPartOffset(name,p,delta){
 p=clamp(p);const [x,y,z]=delta;
 if(name==='Mouthpiece')return [x*phase(p,.55,1),y*phase(p,0,.38),z*p];
 if(name==='Cartridge')return [x*phase(p,.76,1),y*phase(p,.24,.73),z*p];
 if(name==='Collar')return [x*phase(p,.55,1),y*phase(p,.10,.49),z*p];
 return delta.map(n=>n*ease(p));
}
export function foilMorphWeights(p,count=16){
 const t=clamp(p)*count,a=Math.floor(t),f=t-a;
 return Array.from({length:count},(_,i)=>(i+1===a?1-f:0)+(i===a?f:0));
}
export function mountBarViewer(root,scope){
 const sceneRoot=root.closest('[data-range-scene]'),stage=root.querySelector('[data-model-stage]'),canvas=root.querySelector('canvas'),poster=root.querySelector('[data-model-poster]'),open=root.querySelector('[data-model-open]'),reset=root.querySelector('[data-model-reset]'),tear=root.querySelector('[data-wrapper-open]'),gesture=root.querySelector('[data-model-gesture]'),status=root.querySelector('[data-model-status]'),parts=sceneRoot.querySelectorAll('[data-model-part]');
 const flow=root.hasAttribute('data-model-flow'),labels=[...root.querySelectorAll('[data-flow-label]')];let finishes,replayNext=null,atmosphere,ambientFrame=0,ambientLast=0,ambientTime=0,backgroundPaused=root.closest('[data-product-reveal]')?.dataset.scenePaused==='true';
 const markers=[...root.querySelectorAll('[data-model-marker]')],detail=root.querySelector('[data-model-detail]'),leader=root.querySelector('[data-model-detail-leader]'),annotated=root.hasAttribute('data-model-annotations');
 const kind=root.dataset.modelEditor||'vapes';
 const isPreRoll=kind==='pre-rolls';
 const getFlavourColor=(id)=>{
  if(isPreRoll){
   const match=approvedFlavours.find(f=>f.id===id);
   return match?match.shade:'#8c7a4a';
  }
  return findVariant(id).color;
 };
 let selected=isPreRoll?(root.dataset.initialFlavour||'granddaddy-purple'):findVariant(root.dataset.initialFlavour||new URLSearchParams(location.search).get('flavour')).id;
 let activeFlavourColor=getFlavourColor(selected);
 let disposeStudio,THREE,loader,renderer,scene,camera,rig,model,moves=[],surfaces=[],morphs=[],manifest,request,engine;
 let ready=false,visible=false,loading=false,failed=false,epoch=0,frame=0,animation=null,opened=false,torn=false,progress=0,foil=0,view='set',part=null,rx=0,ry=.11,drag=null,target,goalTarget,goalPosition,eye,orbit;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motion=()=>!reduced.matches&&!document.body.classList.contains('motion-off');
 const signal=active=>{root.dataset.modelInteracting=String(active);root.dispatchEvent(new Event('ehf-model-motion',{bubbles:true}));};
 function refreshVisibility(){const r=stage.getBoundingClientRect();visible=r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;root.dataset.modelVisible=String(visible);}
 const component=node=>{for(let n=node;n&&n!==model;n=n.parent)if(['Mouthpiece','Cartridge','DeviceHousing','Collar','Packaging','Wrapper'].includes(n.name))return n.name;return 'DeviceHousing';};
 function dispose(asset){if(!asset)return;const gs=new Set(),ms=new Set(),ts=new Set();asset.traverse(n=>{if(n.geometry)gs.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){ms.add(m);Object.values(m).forEach(t=>{if(t?.isTexture&&!t.userData.sharedFinish)ts.add(t);});}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>{t.dispose();t.source?.data?.close?.();});}
 function showStage(){if(flow)return;const r=stage.getBoundingClientRect();if(r.top<90||r.bottom>innerHeight-30)stage.scrollIntoView({block:'center',behavior:motion()?'smooth':'auto'});}
 function info(){
  if(flow){
   root.dataset.variant=selected;root.dataset.modelView=view;root.dataset.wrapperState=torn?'open':'sealed';
   const retry=root.querySelector('[data-model-reset]');retry.hidden=!failed;retry.textContent=root.dataset.engineFailed==='true'||root.dataset.contextLost==='true'?'Reload 3D view':'Retry 3D view';
   open.hidden=failed;open.disabled=!ready||Boolean(animation);open.querySelector('b').textContent='Replay';
   root.querySelectorAll('[data-model-view]').forEach(b=>{b.setAttribute('aria-pressed',String(view===b.dataset.modelView));b.disabled=!ready||(b.dataset.modelView==='wrapper'&&!manifest?.tearTargets);});
   if(isPreRoll){poster.src='assets/preroll-concept.webp';}else{poster.src=`assets/vape-range/${selected}-runway.webp?v=approved-range-20261112`;}gesture.textContent=failed?'The product image is still available.':!ready?'Loading 3D...':'Drag to rotate';
   return;
  }
  const v=findVariant(selected),bar=Boolean(manifest?.tearTargets);root.dataset.variant=selected;root.dataset.modelView=view;root.dataset.wrapperSupported=String(bar);root.dataset.wrapperState=torn?'open':'sealed';
  root.style.setProperty('--flavour',v.color);poster.src=`assets/vape-range/${selected}-poster.webp?v=approved-range-20261112`;poster.alt=`${v.name} vape and foil pouch`;
  root.querySelectorAll('[data-model-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modelVariant===selected)));
  root.querySelectorAll('[data-model-view]').forEach(b=>{b.setAttribute('aria-pressed',String(view===b.dataset.modelView&&!part));b.disabled=!ready||(b.dataset.modelView==='wrapper'&&!bar);});
  root.querySelector('[data-model-count]').textContent=`0${vapeVariants.indexOf(v)+1} / 06`;
  sceneRoot.querySelectorAll('[data-model-name]').forEach(n=>n.textContent=v.name);sceneRoot.querySelectorAll('[data-model-note]').forEach(n=>n.textContent=v.note);
  sceneRoot.querySelectorAll('[data-model-download]').forEach(a=>a.href=`assets/models/${selected}.glb`);
  open.disabled=!ready;open.setAttribute('aria-pressed',String(opened));open.querySelector('b').textContent=opened?'Click to reassemble':'Click to disassemble';
  tear.hidden=!bar;tear.disabled=!ready;tear.setAttribute('aria-pressed',String(torn));tear.textContent=torn?'Reset wrapper':'Tear open wrapper';
  parts.forEach(b=>{b.disabled=!ready;b.setAttribute('aria-pressed',String(part===b.dataset.modelPart));});
  const copy=sceneRoot.querySelector('[data-model-part-copy]');
  const partInfo=productComponent({id:selected,family:'vapes'},part);
  copy.textContent=partInfo?.copy??(view==='wrapper'
   ?'Tear the top seal to reveal the bar in the model.'
   :'Choose a part to see it up close.');
  if(detail){detail.hidden=!partInfo;detail.dataset.visible='false';detail.querySelector('[data-model-detail-title]').textContent=partInfo?.title??'';}
  gesture.textContent=!ready?'Loading the 3D study…':annotated?'DRAG TO ROTATE / SELECT A MARKER':view==='wrapper'?'DRAG TO ROTATE / CLICK TO TEAR':'DRAG TO ROTATE / CLICK TO OPEN';
  sceneRoot.dispatchEvent(new CustomEvent('ehf-flavour-changed',{detail:{id:selected}}));
 }
 
 function applyPreRollColor(hex){
  if(!model||!isPreRoll||!hex)return;
  model.traverse(node=>{
   if(node.isMesh){
    const mats=Array.isArray(node.material)?node.material:[node.material];
    for(const m of mats){
     if(m && (m.name==='Brass tube' || ['StorageTube','TubeCap','Brass storage','Brass lid'].includes(node.name||node.parent?.name))){
      m.color.set(hex);
      m.needsUpdate=true;
     }
    }
   }
  });
 }

 function applyPose(p,w){
  for(const m of moves){const offset=manifest.tearTargets?barPartOffset(m.node.name,p,m.delta):m.delta.map(n=>n*ease(p));m.node.position.copy(m.base).add(new THREE.Vector3(...offset));}
  for(const n of morphs){const weights=foilMorphWeights(w,n.morphTargetInfluences.length);n.morphTargetInfluences.forEach((_,i)=>n.morphTargetInfluences[i]=weights[i]);}
 }
 function weight(s){return part?s.component===part?1:0:view==='wrapper'?(flow?['Wrapper','Packaging'].includes(s.component):s.component==='Wrapper')?1:0:view==='device'?s.component==='Wrapper'?0:s.component==='Packaging'?(flow&&stage.clientWidth>500?1:0):1:1;}
 function settleSurfaces(){for(const s of surfaces){s.alpha=s.from=s.to=weight(s);s.node.visible=s.alpha>.001;for(const m of s.materials){m.opacity=m.userData.baseOpacity*s.alpha;m.transparent=m.userData.wasTransparent||s.alpha<.995;m.depthWrite=m.userData.wasDepthWrite&&s.alpha>.98;m.needsUpdate=true;}}}
 function aim(){
  const oldP=progress,oldW=foil;applyPose(flow?1:opened?1:0,torn?1:0);rig.rotation.set(0,0,0);rig.updateMatrixWorld(true);
  const bounds=new THREE.Box3();for(const s of surfaces)if(weight(s)>0)bounds.union(new THREE.Box3().setFromObject(s.node));
  goalTarget=bounds.getCenter(new THREE.Vector3());const size=bounds.getSize(new THREE.Vector3()),tan=Math.tan(31*Math.PI/360);
  const phone=annotated&&stage.clientWidth<600;
  const distance=Math.max(size.y/(2*tan*(part&&phone?.50:1)),size.x/(2*tan*Math.max(.4,camera.aspect)*(part&&annotated&&!phone?.58:1)))*1.22;
  if(part&&annotated){if(phone)goalTarget.y-=distance*tan*.50;else goalTarget.x+=distance*tan*camera.aspect*.34;}
  if(flow&&stage.clientWidth<500)goalTarget.x+=distance*tan*camera.aspect*.30;
  goalPosition=goalTarget.clone().add(new THREE.Vector3(0,0,Math.max(.065,distance)));
  atmosphere?.frame(goalTarget,goalPosition.distanceTo(goalTarget));applyPose(oldP,oldW);
 }
 function projected(name){const node=model?.getObjectByName(name);if(!node)return null;const b=new THREE.Box3().setFromObject(node),centre=b.getCenter(new THREE.Vector3()).project(camera),points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new THREE.Vector3(x,y,z).project(camera));const w=stage.clientWidth,h=stage.clientHeight;return {anchor:{x:(centre.x+1)*w/2,y:(1-centre.y)*h/2},object:{left:Math.min(...points.map(p=>(p.x+1)*w/2)),right:Math.max(...points.map(p=>(p.x+1)*w/2)),top:Math.min(...points.map(p=>(1-p.y)*h/2)),bottom:Math.max(...points.map(p=>(1-p.y)*h/2))}};}
 function annotations(){
  if(flow){
   const w=stage.clientWidth,h=stage.clientHeight,small=w<500;
   for(const label of labels){const name=label.dataset.flowLabel,p=projected(name),shown=ready&&!animation&&(view==='wrapper'?name==='Wrapper':name!=='Wrapper')&&(view==='wrapper'?foil>.98:progress>.98);
    label.dataset.visible=String(shown);label.setAttribute('aria-hidden',String(!shown));if(!p||!shown)continue;
    const x=Math.min(w-(small?125:160),Math.max(8,p.object.right+(small?14:28))),y=Math.max(10,Math.min(h-60,p.anchor.y-15));label.style.left=`${x}px`;label.style.top=`${y}px`;
   }return;
  }
  if(!annotated)return;const w=stage.clientWidth,h=stage.clientHeight,shown=[];
  for(const button of markers){const name=button.dataset.modelMarker,enabled=ready&&!part&&(view==='set'?['Packaging','Wrapper','DeviceHousing'].includes(name):view==='wrapper'?name==='Wrapper':(['Mouthpiece','Cartridge','DeviceHousing'].includes(name)||(opened&&name==='Collar')));button.hidden=!enabled;button.setAttribute('aria-pressed',String(name===part));if(!enabled)continue;const p=projected(name);if(!p)continue;let y=p.anchor.y+(view==='set'?{Packaging:-65,Wrapper:25,DeviceHousing:100}[name]:0);let x=view==='device'?p.object.right+56:p.anchor.x+15;shown.push({button,x,y});}
  shown.sort((a,b)=>a.y-b.y);let previous=-100;for(const item of shown){const y=Math.max(35,Math.min(h-40,Math.max(previous+46,item.y)));previous=y;item.button.style.left=`${Math.max(w<600?22:65,Math.min(w-(w<600?22:70),item.x))}px`;item.button.style.top=`${y}px`;}
  if(!part){if(leader)leader.dataset.visible='false';return;}const p=projected(part);if(!p)return;
  const place=descriptionPlacement({...p,width:w,height:h,cardWidth:detail.offsetWidth||250,cardHeight:detail.offsetHeight||220});detail.style.left=`${place.x}px`;detail.style.top=`${place.y}px`;
  const settled=!animation||performance.now()-animation.start>animation.duration*.72;detail.dataset.visible=String(settled);leader.dataset.visible=String(settled);leader.querySelector('path').setAttribute('d',place.path);leader.querySelector('circle').setAttribute('cx',p.anchor.x);leader.querySelector('circle').setAttribute('cy',p.anchor.y);root.dataset.annotationVisible=String(settled);
 }
 function draw(){if(!ready||!visible||document.hidden||scope.disposed)return;camera.position.copy(eye).sub(target).applyEuler(orbit.set(rx,ry,0,'YXZ')).add(target);camera.lookAt(target);const t=performance.now();renderer.render(scene,camera);annotations();root.dataset.modelDrawMs=(performance.now()-t).toFixed(1);root.dataset.modelTriangles=String(renderer.info.render.triangles);root.dataset.modelDrawCalls=String(renderer.info.render.calls);root.dataset.deviceProgress=progress.toFixed(4);root.dataset.tearProgress=foil.toFixed(4);if(flow)root.dataset.cameraFrame=[...eye.toArray(),...target.toArray()].map(n=>n.toFixed(6)).join(',');}
 function resize(){if(!renderer||!stage.clientWidth||!stage.clientHeight)return;const w=stage.clientWidth,h=stage.clientHeight,ratio=Math.min(Math.max(devicePixelRatio,1.25),1.75,Math.sqrt(1600000/(w*h)));renderer.setSize(Math.round(w*ratio),Math.round(h*ratio),false);camera.aspect=w/h;camera.updateProjectionMatrix();if(ready&&!animation){if(flow)settleSurfaces();aim();eye.copy(goalPosition);target.copy(goalTarget);}if(flow){const box=sceneRoot.getBoundingClientRect(),padding=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0;root.querySelectorAll('button').forEach(b=>{const r=b.getBoundingClientRect();b.style.scrollMarginTop=`${Math.max(0,2*(r.top-box.top)+r.height-innerHeight-padding)}px`;});}draw();}
 function tick(now){
  frame=0;if(!animation||!visible||document.hidden||scope.disposed)return;
  const t=motion()?clamp((now-animation.start)/animation.duration):1,e=ease(t);
  progress=animation.p+(Number(opened)-animation.p)*e;foil=animation.w+(Number(torn)-animation.w)*e;applyPose(progress,foil);
  for(const s of surfaces){const a=s.from+(s.to-s.from)*e;s.alpha=a;s.node.visible=a>.001;for(const m of s.materials){const blended=m.userData.wasTransparent||a<.995;if(m.transparent!==blended){m.transparent=blended;m.needsUpdate=true;}m.opacity=m.userData.baseOpacity*a;m.depthWrite=m.userData.wasDepthWrite&&a>.98;}}
  eye.lerpVectors(animation.camera,goalPosition,e);target.lerpVectors(animation.target,goalTarget,e);draw();
  if(t<1)frame=requestAnimationFrame(tick);else{animation=null;root.dataset.modelState=opened?'open':'assembled';root.dataset.wrapperState=torn?'open':'sealed';signal(false);info();annotations();if(replayNext){const next=replayNext;replayNext=null;next();}}
 }
 function transition({focus=null,mode=view,duration=1900}={}){
  if(!ready)return;refreshVisibility();part=focus;view=mode;if(part)root.dataset.modelFocus=part;else delete root.dataset.modelFocus;
  surfaces.forEach(s=>{s.from=s.alpha;s.to=weight(s);if(s.to)s.node.visible=true;});aim();
  animation={start:performance.now(),duration:motion()?duration:1,p:progress,w:foil,camera:eye.clone(),target:target.clone()};root.dataset.modelState='animating';cancelAnimationFrame(frame);signal(true);info();frame=requestAnimationFrame(tick);showStage();
  status.textContent=part?`${part} in focus.`:view==='wrapper'?(torn?'Opening the wrapper.':'Wrapper reset.'):opened?'Separating the device components.':'Device assembled.';
 }
 async function boot(){
  if(loading||failed||scope.disposed)return;loading=true;ready=false;manifest=null;canvas.hidden=true;open.disabled=true;if(tear)tear.disabled=true;root.dataset.modelReady='false';const mine=++epoch;request?.abort();request=new AbortController();info();
  try{
   if(!engine)engine=(async()=>{const imports=await Promise.all([import('./vendor/three/three.module.min.js'),import('./vendor/three/addons/loaders/GLTFLoader.js')]);THREE=imports[0];if(scope.disposed)return;loader=new imports[1].GLTFLoader();renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;scene=new THREE.Scene();finishes=createMaterialFinishes(THREE,renderer);disposeStudio=createStudioLight(THREE,renderer,scene);rig=new THREE.Group();scene.add(rig);camera=new THREE.PerspectiveCamera(31,1,.001,10);target=new THREE.Vector3();eye=new THREE.Vector3();orbit=new THREE.Euler();scene.add(new THREE.HemisphereLight(0xf6f2e5,0x56645d,1));for(const [color,power,pos] of [[0xfff1da,2.2,[1,2,3]],[0xcbdfff,1.5,[-2,.6,1]],[0xffffff,1.6,[.5,1,-2]]]){const l=new THREE.DirectionalLight(color,power);l.position.set(...pos);scene.add(l);}})().catch(error=>{disposeStudio?.();finishes?.dispose();renderer?.dispose();renderer=null;scene=null;engine=null;root.dataset.engineFailed='true';throw error;});
   await engine;if(scope.disposed||mine!==epoch)return;
   const revision=VAPE_MODEL_REVISION;const [response,meta]=await Promise.all([fetch(`assets/models/${isPreRoll?'pre-rolls':selected}.glb?v=${revision}`,{signal:request.signal}),fetch(`assets/models/${isPreRoll?'pre-rolls':selected}.json?v=${revision}`,{signal:request.signal}).then(r=>{if(!r.ok)throw Error('Missing model information');return r.json();})]);if(!response.ok)throw Error('Missing model');const gltf=await loader.parseAsync(await response.arrayBuffer(),'');
   if(scope.disposed||mine!==epoch){dispose(gltf.scene);return;}if(model){rig.remove(model);dispose(model);}model=gltf.scene;manifest=meta;rig.add(model);moves=Object.entries(meta.motion||{}).flatMap(([name,delta])=>{const node=model.getObjectByName(name);return node?[{node,base:node.position.clone(),delta}]:[];});surfaces=[];morphs=[];const replaced=new Set();
   model.traverse(node=>{if(!node.isMesh)return;const originals=Array.isArray(node.material)?node.material:[node.material],mats=originals.map(m=>{replaced.add(m);return finishes.finish(m);});node.material=Array.isArray(node.material)?mats:mats[0];for(const m of mats){if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());m.userData.baseOpacity=m.opacity;m.userData.wasTransparent=m.transparent;m.forceSinglePass=true;m.userData.wasDepthWrite=m.depthWrite;}surfaces.push({node,materials:mats,component:component(node),alpha:1,from:1,to:1});if(node.morphTargetInfluences?.length){node.morphTargetInfluences.fill(0);morphs.push(node);}});replaced.forEach(m=>m.dispose());
   opened=false;torn=false;progress=foil=0;view=flow?'device':'set';part=null;rx=0;ry=.11;delete root.dataset.modelFocus;applyPose(0,0);if(flow)settleSurfaces();camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();aim();eye.copy(goalPosition);target.copy(goalTarget);
   if(flow){atmosphere?.dispose();atmosphere=createLiquidAtmosphere(THREE,scene,activeFlavourColor); if(goalTarget&&goalPosition) atmosphere.frame(goalTarget,goalPosition.distanceTo(goalTarget)); if(isPreRoll) applyPreRollColor(activeFlavourColor);}if(renderer.compileAsync)await renderer.compileAsync(scene,camera);if(scope.disposed||mine!==epoch)return;
   if(flow&&root.hasAttribute('data-wait-for-entrance'))atmosphere.setVisible(false);
   ready=true;canvas.hidden=false;root.dataset.modelReady='true';root.dataset.modelState='assembled';info();resize();signal(false);status.textContent=`${isPreRoll?'Pre-rolls':findVariant(selected).name} 3D set ready.`;if(flow){root.dispatchEvent(new Event('ehf-model-ready'));if(!root.hasAttribute('data-wait-for-entrance'))startEntrance();}
  }catch(e){if(scope.disposed||mine!==epoch||e.name==='AbortError')return;failed=true;gesture.textContent='3D view could not load. Reset view to retry; the product image remains available.';status.textContent=gesture.textContent;root.dataset.modelReady='false';if(flow){info();root.dispatchEvent(new Event('ehf-model-failed'));}}
  finally{if(mine===epoch)loading=false;}
 }
 function startEntrance(){if(!ready)return;atmosphere?.setVisible(true);opened=true;transition({mode:'device',duration:2200});startAmbient();}
 function updateAtmosphere(seconds){atmosphere?.update(seconds);const panel=root.closest('[data-product-reveal]')||sceneRoot;if(panel){const wave=Math.sin(seconds*Math.PI/8);panel.style.setProperty('--splash-x',`${(wave*8).toFixed(2)}px`);panel.style.setProperty('--splash-y',`${(-wave*6).toFixed(2)}px`);panel.style.setProperty('--splash-angle',`${(wave*.65).toFixed(3)}deg`);}}
 function startAmbient(){if(!flow||ambientFrame||scope.disposed||!visible||document.hidden||!motion()||backgroundPaused)return;ambientFrame=requestAnimationFrame(ambientTick);}
 function ambientTick(now){ambientFrame=0;if(scope.disposed||!visible||document.hidden||!motion()||backgroundPaused){ambientLast=0;return;}if(!ambientLast)ambientLast=now;const delta=Math.min(50,now-ambientLast);if(delta>=30){ambientLast=now;ambientTime+=delta/1000;updateAtmosphere(ambientTime);root.dataset.atmosphereTime=ambientTime.toFixed(3);if(!animation)draw();}ambientFrame=requestAnimationFrame(ambientTick);}
 scope.on(root,'ehf-scene-entered',startEntrance);scope.on(root,'ehf-scene-pause',e=>{backgroundPaused=e.detail.paused;if(backgroundPaused){cancelAnimationFrame(ambientFrame);ambientFrame=0;ambientLast=0;}else startAmbient();});
 scope.on(reduced,'change',()=>{startAmbient();if(!motion()){updateAtmosphere(0);draw();}});scope.own(new MutationObserver(()=>{startAmbient();if(!motion()){updateAtmosphere(0);draw();}})).observe(document.body,{attributes:true,attributeFilter:['class']});
 function toggleDevice(){opened=!opened;transition({mode:view==='wrapper'?'device':view});}
 function toggleWrapper(){if(!manifest?.tearTargets)return;torn=!torn;transition({mode:'wrapper',duration:2300});}
 function select(id, colorOverride){
  if(isPreRoll){
   selected=id;
   activeFlavourColor=colorOverride||getFlavourColor(id);
   applyPreRollColor(activeFlavourColor);
   if(atmosphere){
    atmosphere.dispose();
    atmosphere=createLiquidAtmosphere(THREE,scene,activeFlavourColor);
    if(goalTarget && goalPosition) atmosphere.frame(goalTarget, goalPosition.distanceTo(goalTarget));
   }
   draw();
   return;
  }
  id=findVariant(id).id;
  if(id===selected){showStage();return;}
  selected=id;
  request?.abort();
  epoch++;
  loading=false;
  failed=false;
  cancelAnimationFrame(frame);
  animation=null;
  signal(false);
  showStage();
  boot();
}
 function replay(){if(!ready||animation)return;const mode=view;const again=()=>{if(mode==='wrapper')torn=true;else opened=true;transition({mode,duration:mode==='wrapper'?2600:2400});};if(mode==='wrapper'?foil>.01:progress>.01){if(mode==='wrapper')torn=false;else opened=false;replayNext=again;transition({mode,duration:1100});}else again();}
 scope.on(open,'click',flow?replay:toggleDevice);scope.on(tear,'click',toggleWrapper);scope.on(reset,'click',()=>{if(failed){if(root.dataset.contextLost==='true'||root.dataset.engineFailed==='true'){location.reload();return;}failed=false;loading=false;boot();return;}rx=0;ry=.11;opened=torn=false;transition({mode:'set',duration:1500});});
 root.querySelectorAll('[data-model-view]').forEach(b=>scope.on(b,'click',()=>{replayNext=null;if(flow){if(b.dataset.modelView==='wrapper')torn=true;else opened=true;}transition({mode:b.dataset.modelView,duration:flow?2400:800});}));
 root.querySelectorAll('[data-model-variant]').forEach(b=>scope.on(b,'click',()=>select(b.dataset.modelVariant)));
 scope.on(sceneRoot,'ehf-select-flavour',e=>select(e.detail.id, e.detail.color||e.detail.shade));
 scope.on(root,'ehf-select-flavour',e=>select(e.detail.id, e.detail.color||e.detail.shade));
 scope.on(document,'ehf-select-flavour',e=>select(e.detail.id, e.detail.color||e.detail.shade));
 function inspect(name){if(!ready)return;const device=!['Packaging','Wrapper'].includes(name);if(device)opened=true;transition({focus:name,mode:device?'device':name==='Wrapper'?'wrapper':'set'});}
 parts.forEach(b=>scope.on(b,'click',()=>inspect(b.dataset.modelPart)));
 markers.forEach(b=>scope.on(b,'click',()=>inspect(b.dataset.modelMarker)));
 root.querySelectorAll('[data-model-unfocus]').forEach(b=>scope.on(b,'click',()=>transition({mode:view,duration:900})));
 scope.on(sceneRoot,'keydown',e=>{if(e.key==='Escape'&&part){e.preventDefault();transition({mode:view,duration:900});canvas.focus();}});
 scope.on(canvas,'pointerdown',e=>{if(e.button!==0||!ready)return;if(animation)return;drag={x:e.clientX,y:e.clientY,rx,ry,moved:false};canvas.setPointerCapture(e.pointerId);signal(true);});
 scope.on(canvas,'pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved||=Math.abs(dx)+Math.abs(dy)>5;ry=Math.max(-1.25,Math.min(1.25,drag.ry+dx*.008));rx=Math.max(-.4,Math.min(.4,drag.rx+dy*.005));draw();});
 function end(e){if(!drag)return;const moved=drag.moved;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);signal(false);if(!moved&&!flow){if(annotated){const r=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(surfaces.filter(s=>s.node.visible&&s.alpha>.5).map(s=>s.node),false)[0];if(hit)inspect(component(hit.object));}else(view==='wrapper'?toggleWrapper:toggleDevice)();}}
 scope.on(canvas,'pointerup',end);scope.on(canvas,'pointercancel',()=>{drag=null;signal(false);});
 scope.on(canvas,'keydown',e=>{if(!ready||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key))return;e.preventDefault();if(e.key==='Enter'||e.key===' '){(flow?replay:view==='wrapper'?toggleWrapper:toggleDevice)();return;}ry=Math.max(-1.25,Math.min(1.25,ry+(e.key==='ArrowRight'?.12:e.key==='ArrowLeft'?-.12:0)));rx=Math.max(-.4,Math.min(.4,rx+(e.key==='ArrowDown'?.08:e.key==='ArrowUp'?-.08:0)));draw();});
 function resume(){startAmbient();if(animation){animation.start=performance.now();animation.p=progress;animation.w=foil;animation.camera=eye.clone();animation.target=target.clone();surfaces.forEach(s=>s.from=s.alpha);frame=requestAnimationFrame(tick);}else draw();}
 scope.own(new IntersectionObserver(()=>{refreshVisibility();if(visible){if(!ready&&!loading&&!failed)boot();else resume();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:.04})).observe(stage);
 scope.own(new ResizeObserver(resize)).observe(stage);
 scope.on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(visible)resume();});
 scope.on(canvas,'webglcontextlost',e=>{e.preventDefault();ready=false;failed=true;canvas.hidden=true;root.dataset.modelReady='false';gesture.textContent='3D view paused. Reload the page to restore it.';root.dataset.contextLost='true';if(flow)info();});
 // A direct detail link must settle after the optional inspector and fonts have laid out.
 if(location.hash==='#vape-study')document.fonts.ready.then(()=>{if(scope.disposed)return;requestAnimationFrame(()=>{if(!scope.disposed&&location.hash==='#vape-study')root.closest('[data-range-inspector]')?.scrollIntoView({block:'start',behavior:'instant'});});});
 scope.cleanup(()=>{epoch++;request?.abort();cancelAnimationFrame(frame);cancelAnimationFrame(ambientFrame);atmosphere?.dispose();dispose(model);disposeStudio?.();finishes?.dispose();renderer?.dispose();renderer?.forceContextLoss();});info();
}
