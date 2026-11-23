import {componentCopy} from './product-content.js?v=c73acc77c6a5';
export {componentCopy};
// Physical component travel in metres. Extraction happens before lateral separation.
const clamp=n=>Math.max(0,Math.min(1,n));
const phase=(p,a,b)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
export function preRollMotion(p){
 const unlock=phase(p,0,.12),lift=phase(p,.12,.22),clear=phase(p,.22,.30),withdraw=phase(p,.30,.76),spread=phase(p,.76,1);
 return {capY:.053+unlock*.004+lift*.020,capX:clear*.035,capTurn:unlock*Math.PI*1.6,rollY:withdraw*.108-spread*.035,rollX:spread?-spread*.027:0,tubeX:spread*.013};
}
export function applyColourRamp(T,geometry,stops){
 geometry.computeBoundingBox();
 const {min,max}=geometry.boundingBox,position=geometry.attributes.position,shading=geometry.attributes.color;
 const colours=stops.map(colour=>new T.Color(colour)),values=new Float32Array(position.count*3),sample=new T.Color();
 for(let i=0;i<position.count;i++){
  const progress=clamp((max.y-position.getY(i))/Math.max(1e-6,max.y-min.y))*(colours.length-1);
  const stop=Math.min(Math.floor(progress),colours.length-2);
  sample.copy(colours[stop]).lerp(colours[stop+1],progress-stop).multiplyScalar(shading?shading.getX(i):1);
  sample.toArray(values,i*3);
 }
 geometry.setAttribute('color',new T.BufferAttribute(values,3));
}
export function createPreRollStudy(T,brandMap=null,herbMap=null,paperMap=null,caseColour='#ae8c48',gradient=null){
 const root=new T.Group();root.name='EHFPreRollStudy';root.userData.inspectionRig=true;
 const satin=new T.MeshPhysicalMaterial({name:'Satin brass case',color:caseColour,metalness:.88,roughness:.3,clearcoat:.12});
 const inner=new T.MeshStandardMaterial({name:'Tube inner wall',color:new T.Color(caseColour).multiplyScalar(.64),metalness:.72,roughness:.43});
 const paper=new T.MeshPhysicalMaterial({name:'Natural paper',color:paperMap?'#eee5ce':'#ded6bd',map:paperMap,roughness:.84,metalness:0,side:T.DoubleSide,transparent:true,opacity:.86,depthWrite:false});
 const tipMat=new T.MeshStandardMaterial({name:'Paper tip',color:'#c0ab80',roughness:.86,side:T.DoubleSide});
 function lathe(name,points,material,parent){const g=new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),96);g.computeVertexNormals();const m=new T.Mesh(g,material);m.name=name;parent.add(m);return m;}
 const tube=new T.Group();tube.name='StorageTube';root.add(tube);
 const shell=lathe('Case shell',[[0,-.049],[.0069,-.049],[.0077,-.0488],[.0081,-.048],...(gradient?[[.0081,-.025],[.0081,0],[.0081,.025]]:[]),[.0081,.0468],[.008,.048],[.0076,.0487],[.00705,.0487],[.00695,.048],[.00695,-.0469],[0,-.0469]],satin,tube);
 if(gradient){shell.material=satin.clone();shell.material.vertexColors=true;shell.material.color.set('#ffffff');applyColourRamp(T,shell.geometry,gradient);satin.color.set(gradient[0]);}
 lathe('Inner sleeve',[[.00696,-.0468],[.00696,.0476],[.0068,.0476],[.0068,-.0468]],inner,tube);
 if(brandMap){const mark=new T.Mesh(new T.CylinderGeometry(.00814,.00814,.014,48,1,true,-.65,1.3),new T.MeshStandardMaterial({name:'EHF case mark',map:brandMap,color:'#293328',roughness:.7,transparent:true,alphaTest:.06,depthWrite:false}));mark.name='EHF case mark';mark.position.y=.014;tube.add(mark);}
 const cap=new T.Group();cap.name='TubeCap';root.add(cap);
 lathe('Cap shell',[[0,.0054],[.0069,.0054],[.0079,.005],[.0083,.004],[.0083,-.004],[.0081,-.005],[.0073,-.005],[.0071,-.0046],[.0071,.0032],[0,.0032]],satin,cap);
 function thread(parent,y,r,turns){const path=new T.CatmullRomCurve3(Array.from({length:121},(_,i)=>{const a=i/120*Math.PI*2*turns;return new T.Vector3(Math.cos(a)*r,y+i/120*.004,Math.sin(a)*r);}));const mesh=new T.Mesh(new T.TubeGeometry(path,120,.00016,5,false),inner);mesh.name='Machined thread';parent.add(mesh);}
 thread(tube,.0438,.00715,2);thread(cap,-.004,.00713,2);
 for(const y of [-.0042,.0042]){const rim=new T.Mesh(new T.TorusGeometry(.00815,.00015,6,96),satin);rim.rotation.x=Math.PI/2;rim.position.y=y;cap.add(rim);}
 const roll=new T.Group();roll.name='Roll_1';root.add(roll);
 const sheetGroup=new T.Group();sheetGroup.name='RollingPaper';roll.add(sheetGroup);
 const rows=48,cols=48,positions=new Float32Array((rows+1)*(cols+1)*3),uvs=new Float32Array((rows+1)*(cols+1)*2),indices=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const i=y*(cols+1)+x;uvs.set(paperMap?[.1+(y/rows)*.8,.15+(x/cols)*.7]:[x/cols,y/rows],i*2);if(x<cols&&y<rows){const b=i+cols+1;indices.push(i,b,i+1,b,b+1,i+1);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setAttribute('uv',new T.BufferAttribute(uvs,2));geo.setIndex(indices);
 const sheet=new T.Mesh(geo,paper);sheet.name='Paper sheet';sheetGroup.add(sheet);
 const flower=new T.Group();flower.name='HempFlower';roll.add(flower);
 let seed=9147;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const grainMat=new T.MeshStandardMaterial({name:'Illustrative flower texture',color:'#e2e1c8',map:herbMap,roughness:.93,side:T.DoubleSide,alphaTest:.06}),dummy=new T.Object3D(),leafBatches=[],filling=[];
 for(let batch=0;batch<5;batch++){
  const geometry=batch===3?new T.PlaneGeometry(1,2,6,12):new T.IcosahedronGeometry(1,batch===1?0:1),gp=geometry.attributes.position,uv=geometry.attributes.uv;
  for(let i=0;i<gp.count;i++){const x=gp.getX(i),y=gp.getY(i),z=gp.getZ(i),noise=Math.sin(x*(12+batch*3)+y*19+z*9)*Math.cos(z*17-x*8),k=.73+.27*noise;
   if(batch===3){const t=(y+1)/2;gp.setXYZ(i,x*Math.pow(Math.sin(t*Math.PI),.65)*(1+(i%2)*.10),y,.18*Math.sin(y*3)+Math.abs(x)*.25);}else{const shapes=[[1,1.5,.35],[.28,2.1,.26],[.9,.8,.65],[1,1,1],[.65,.9,1.2]][batch];gp.setXYZ(i,x*k*shapes[0],y*k*shapes[1],z*k*shapes[2]);}
   uv.setXY(i,.08+batch*.16+uv.getX(i)*.15,.3+uv.getY(i)*.4);}
  geometry.computeVertexNormals();const fragments=new T.InstancedMesh(geometry,grainMat,104);fragments.instanceMatrix.setUsage(T.DynamicDrawUsage);fragments.name=['Leaf fragments','Stem fibres','Flower calyx','Folded leaf fragments','Botanical fragments'][batch];leafBatches.push(fragments);flower.add(fragments);
  for(let index=0;index<104;index++){const y=-.025+rand()*.063,r=(.0021+(y+.025)/.063*.0003)*Math.sqrt(rand()),a=rand()*Math.PI*2,theta=rand()*Math.PI*2,v=rand()*2-1,rad=Math.cbrt(rand()),cluster=index%3,spread=Math.sqrt(1-v*v)*rad;
   filling.push({batch,index,closed:new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r),pile:new T.Vector3(Math.cos(theta)*spread*.008+(cluster-1)*.0035,v*rad*.009,Math.sin(theta)*spread*.006),rotation:new T.Euler(rand()*6,rand()*6,rand()*6),scale:(.00027+rand()*.0004)*(batch===1?.8:1)});
   fragments.setColorAt(index,new T.Color().setRGB(.75+rand()*.25,.75+rand()*.25,.65+rand()*.3));}
 }

 const filter=new T.Group();filter.name='Filter';roll.add(filter);filter.position.y=-.0365;
 lathe('Filter rim',[[.0033,-.007],[.0033,.007],[.003,.007],[.003,-.007]],tipMat,filter);
 const spiral=[];for(let i=0;i<=150;i++){const a=i/150*Math.PI*5,r=.00035+i/150*.00255;spiral.push(new T.Vector3(Math.cos(a)*r,-.00705,Math.sin(a)*r));}
 const spiralPath=new T.CatmullRomCurve3(spiral);filter.add(new T.Mesh(new T.TubeGeometry(spiralPath,150,.00013,4,false),tipMat));
 const seam=new T.Mesh(new T.CylinderGeometry(.000075,.000075,.085,5),tipMat);seam.name='Paper seam';seam.position.set(-.0002,.001,.0035);roll.add(seam);
 function apply(p,u=0){if(root.userData.open===p&&root.userData.unroll===u)return;const s=preRollMotion(p);tube.position.x=s.tubeX;cap.position.set(s.capX,s.capY,0);cap.rotation.y=s.capTurn;roll.position.set(s.rollX,s.rollY,0);
  // Hide the roll (joint) when tube is closed so it cannot be seen through the open top
  roll.visible=p>0.001;
  // Case travel changes transforms, not the paper mesh or 520 filling matrices.
  if(root.userData.unroll!==u){const unfurl=phase(u,0,.78),release=phase(u,.28,1);
  sheetGroup.position.set(-unfurl*.018,0,unfurl*.004);flower.position.set(release*.008,release*.007,release*.003);flower.visible=u>.001;for(let i=0;i<filling.length;i++){const f=filling[i];dummy.position.copy(f.closed).lerp(f.pile,release);dummy.rotation.copy(f.rotation);const size=f.scale*(1+release*1.7);dummy.scale.set(size,size*(.8+(i%5)*.07),size*(.65+(i%3)*.12));dummy.updateMatrix();leafBatches[f.batch].setMatrixAt(f.index,dummy.matrix);}for(const fragments of leafBatches){fragments.instanceMatrix.needsUpdate=true;fragments.computeBoundingBox();}filter.position.set(release*.018,-.0365-release*.010,release*.004);seam.visible=u<.02;
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const t=y/rows,wrap=x/cols,r=(.00335+t*.00065)*(1-.72*phase(t,.90,1)),a=(wrap-.5)*Math.PI*2*(1-unfurl*.985)+(1-unfurl)*phase(t,.9,1)*.35,flat=(wrap-.5)*.025;const i=(y*(cols+1)+x)*3;positions[i]=(1-unfurl)*Math.sin(a)*r+unfurl*flat;positions[i+1]=-.029+t*.077;positions[i+2]=(1-unfurl)*Math.cos(a)*r+unfurl*((Math.cos(a)-1)*.008+Math.pow(Math.abs(wrap-.5)*2,3)*.0025+Math.sin(t*Math.PI*2+wrap*1.2)*.0004);}
  geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();geo.computeBoundingBox();}
  root.userData.open=p;root.userData.unroll=u;
 }
 root.userData.applyInspection=apply;apply(0,0);return root;
}

// Local mesh bounds retain pivots and supplied printed faces.
function localMeshBox(T,node,parent,baseOnly=false){parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert(),box=new T.Box3();node.traverse(n=>{if(!n.isMesh||n.userData.retiredDetail)return;n.geometry.computeBoundingBox();box.union((baseOnly?new T.Box3().setFromBufferAttribute(n.geometry.attributes.position):n.geometry.boundingBox.clone()).applyMatrix4(inverse.clone().multiply(n.matrixWorld)));});return box;}
export function cartonOpening(p){if(p<=0)return {back:0,left:0,right:0};return {back:-phase(p,.12,1)*1.86,left:phase(p,0,.55)*1.38,right:-phase(p,.04,.62)*1.38};}
export function applyCartonStudy(root,p){const angles=cartonOpening(p);root.traverse(n=>{const h=n.userData.cartonHinge;if(h)n.rotation[h.axis]=angles[h.key];});}
function refineCartridge(T,root){
 const cartridge=root.getObjectByName('Cartridge'),liquid=root.getObjectByName('FlavourExtract');if(!cartridge||!liquid)return;
 const box=localMeshBox(T,liquid,cartridge),size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3()),rx=size.x*.5,rz=size.z*.5,height=size.y;
 const original=Array.isArray(liquid.material)?liquid.material[0]:liquid.material;
 for(const name of ['FlavourExtract','CartridgeGlass','VapourChimney']){const old=root.getObjectByName(name);if(old){old.visible=false;old.userData.retiredDetail=true;}}
 const glassMat=new T.MeshPhysicalMaterial({name:'Optical reservoir glass',color:'#dce5df',transparent:true,opacity:.22,metalness:0,roughness:.07,clearcoat:1,clearcoatRoughness:.07,depthWrite:false,side:T.DoubleSide});
 const fluidMat=original.clone();fluidMat.name='Flavour liquid extract';fluidMat.color.multiplyScalar(.88);fluidMat.transparent=true;fluidMat.opacity=.46;fluidMat.depthWrite=false;
 const outer=new T.Mesh(new T.CylinderGeometry(rx+.0007,rx+.0007,height+.006,96,1,true),glassMat);outer.name='Curved reservoir wall';outer.position.copy(centre);outer.scale.z=(rz+.00065)/(rx+.0007);cartridge.add(outer);
 const volume=new T.Mesh(new T.CylinderGeometry(rx*.94,rx*.94,height,96),fluidMat);volume.name='Liquid volume';volume.position.copy(centre);volume.scale.z=rz/rx;cartridge.add(volume);
 const meniscus=new T.Mesh(new T.SphereGeometry(rx*.94,64,12),fluidMat);meniscus.name='Liquid meniscus';meniscus.scale.set(1,.035,rz/rx);meniscus.position.copy(centre).add(new T.Vector3(0,height/2,0));cartridge.add(meniscus);
 const airway=new T.Mesh(new T.CylinderGeometry(.0008,.0008,height+.010,32),new T.MeshStandardMaterial({name:'Stainless airway',color:'#d0c7a4',metalness:.96,roughness:.19}));airway.name='Central airway';airway.position.copy(centre);cartridge.add(airway);
 const rimMat=new T.MeshStandardMaterial({name:'Polished reservoir lip',color:'#dbe3dd',metalness:.62,roughness:.15});
 for(const side of [-1,1]){const rim=new T.Mesh(new T.TorusGeometry(rx+.00055,.00022,8,96),rimMat);rim.rotation.x=Math.PI/2;rim.scale.y=(rz+.00055)/(rx+.00055);rim.position.copy(centre).add(new T.Vector3(0,side*(height+.006)/2,0));rim.name='Reservoir lip';cartridge.add(rim);}
}
function refineCarton(T,carton){
 const body=carton.getObjectByName('Carton');if(!body?.isMesh)return;const box=localMeshBox(T,body,carton),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()),top=box.max.y,w=size.x,d=size.z;
 const g=body.geometry.clone().toNonIndexed(),position=g.attributes.position,normal=g.attributes.normal,index=[];
 for(let i=0;i<position.count;i+=3){if([0,1,2].every(j=>normal.getY(i+j)>.85))continue;index.push(i,i+1,i+2);}g.clearGroups();g.setIndex(index);g.computeBoundingBox();body.geometry=g;
 for(const child of carton.children)if(child.name==='Top fold'){child.visible=false;child.userData.retiredDetail=true;}
 const lining=new T.MeshStandardMaterial({name:'Carton interior paper',color:'#d6cdb2',roughness:.9,side:T.DoubleSide});
 const wall=(x,y,z,sx,sy,sz)=>{const mesh=new T.Mesh(new T.BoxGeometry(sx,sy,sz),lining);mesh.position.set(x,y,z);mesh.name='Carton lining';carton.add(mesh);};
 wall(c.x,c.y,box.min.z+.00035,w*.98,size.y*.99,.0002);wall(c.x,c.y,box.max.z-.00035,w*.98,size.y*.99,.0002);wall(box.min.x+.00035,c.y,c.z,.0002,size.y*.99,d*.96);wall(box.max.x-.00035,c.y,c.z,.0002,size.y*.99,d*.96);wall(c.x,box.min.y+.00035,c.z,w*.98,.0002,d*.96);
 const back=new T.Group();back.name='Carton back flap';back.position.set(c.x,top,box.min.z);back.userData.cartonHinge={key:'back',axis:'x'};const backFace=new T.Mesh(new T.BoxGeometry(w*.99,.00025,d*.98),lining);backFace.position.z=d*.49;back.add(backFace);carton.add(back);
 for(const side of [-1,1]){const flap=new T.Group();flap.name='Carton side flap';flap.position.set(c.x+side*w/2,top-.0003,c.z);flap.userData.cartonHinge={key:side<0?'left':'right',axis:'z'};const face=new T.Mesh(new T.BoxGeometry(w*.45,.0002,d*.94),lining);face.position.x=-side*w*.225;flap.add(face);carton.add(flap);}
 const edgeMat=new T.MeshStandardMaterial({name:'Folded carton edge',color:'#312c25',roughness:.72});
 for(const side of [-1,1]){const edge=new T.Mesh(new T.CylinderGeometry(.00013,.00013,size.y*.985,6),edgeMat);edge.position.set(c.x+side*w*.496,c.y,box.max.z-.0001);edge.name='Folded edge';carton.add(edge);}
}
function refineFoil(T,wrapper){
 const front=wrapper.getObjectByName('WrapperFront');if(!front)return;const box=localMeshBox(T,front,wrapper,true),size=box.getSize(new T.Vector3()),mat=new T.MeshStandardMaterial({name:'Foil edge crimp',color:'#baaf9e',metalness:.62,roughness:.32});
 // Side seals end below the tear line; no stationary ridge pins the released strip.
 for(const side of [-1,1])for(let i=0;i<3;i++){const path=new T.CatmullRomCurve3(Array.from({length:25},(_,j)=>new T.Vector3(side*(size.x/2-.0005-i*.00045),box.min.y+.001+j/24*(size.y-.006),box.max.z+.00008+Math.sin(j*.8+i)*.00010)));const seam=new T.Mesh(new T.TubeGeometry(path,24,.00009,4,false),mat);seam.name='Foil side seal';wrapper.add(seam);}
 const bottom=new T.Mesh(new T.BoxGeometry(size.x,.0006,.00025),mat);bottom.name='Foil bottom seal';bottom.position.set(0,box.min.y+.0005,box.max.z);wrapper.add(bottom);
}
export function refineProductSurfaces(T,root,id){if(id==='edibles'||id==='pre-rolls')return;refineCartridge(T,root);const carton=root.getObjectByName('Packaging'),wrapper=root.getObjectByName('Wrapper');if(carton)refineCarton(T,carton);if(wrapper&&!wrapper.userData.tearEnvelope)refineFoil(T,wrapper);}
