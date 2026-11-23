// Bounded, deterministic close-up detail. Added under the original mesh nodes so
// the original component hierarchy, pivots, motion and tear targets remain intact.
export function addSurfaceDetails(THREE,model,kind){
 if(model.userData.surfaceDetails||!['edibles','pre-rolls'].includes(kind))return;
 let seed=52391;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const bodies=[];model.traverse(n=>{if(!n.isMesh)return;const names=(Array.isArray(n.material)?n.material:[n.material]).map(m=>m.name).join(' ');if(kind==='edibles'&&/Fruit colour/.test(names))bodies.push(n);if(kind==='edibles'&&/^Sugar/.test(names)){n.visible=false;n.userData.retiredDetail=true;}if(kind==='pre-rolls'&&/Natural paper|Paper tip/.test(names)&&!/^Tip[ _]ring/.test(n.name))bodies.push(n);});
 let instances=0,seams=0;
 for(const mesh of bodies){
  mesh.geometry=mesh.geometry.clone();const geometry=mesh.geometry;geometry.computeBoundingBox();const bounds=geometry.boundingBox,centre=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),minimum=Math.min(size.x,size.y,size.z);
  if(kind==='edibles'){
   const p=geometry.attributes.position,c=new Float32Array(p.count*3);
   for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i),q=v.clone().sub(centre).divide(size),wave=Math.sin(q.x*9.3+q.y*5.2)*Math.cos(q.z*8.1-q.x*3.4);v.addScaledVector(v.clone().sub(centre).normalize(),wave*minimum*.012);p.setXYZ(i,v.x,v.y,v.z);const shade=.90+.08*(.5+.5*Math.sin(q.x*8+q.y*6-q.z*4));c.set([shade,shade,shade],i*3);}
   p.needsUpdate=true;geometry.setAttribute('color',new THREE.BufferAttribute(c,3));geometry.computeVertexNormals();geometry.computeBoundingBox();
   const original=Array.isArray(mesh.material)?mesh.material:[mesh.material];mesh.material=original.map(m=>{const next=m.clone();next.vertexColors=true;return next;});if(!Array.isArray(original)||original.length===1)mesh.material=mesh.material[0];
   // Area-weighted samples follow the real rounded surface, including its edges.
   const position=geometry.attributes.position,normal=geometry.attributes.normal,index=geometry.index,triangles=[];let area=0;
   for(let i=0;i<(index?.count||position.count);i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j),points=ids.map(j=>new THREE.Vector3().fromBufferAttribute(position,j)),a=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).length()/2;area+=a;triangles.push({ids,points,end:area});}
   const crystal=new THREE.OctahedronGeometry(minimum*.009,0),sugar=new THREE.MeshStandardMaterial({name:'Fine sugar crystals',color:0xf4eee0,roughness:.39,metalness:0}),count=1200,grains=new THREE.InstancedMesh(crystal,sugar,count),matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
   grains.name='SurfaceSugar';grains.frustumCulled=false;
   for(let i=0;i<count;i++){
    const pick=random()*area;
    let lo=0,hi=triangles.length-1;
    while(lo<hi){
     const mid=(lo+hi)>>>1;
     if(triangles[mid].end<pick)lo=mid+1;
     else hi=mid;
    }
    const t=triangles[lo],r=Math.sqrt(random()),v=random(),weights=[1-r,r*(1-v),r*v],point=new THREE.Vector3(),n=new THREE.Vector3();for(let j=0;j<3;j++){point.addScaledVector(t.points[j],weights[j]);n.addScaledVector(new THREE.Vector3().fromBufferAttribute(normal,t.ids[j]),weights[j]);}n.normalize();point.addScaledVector(n,minimum*.0017);quaternion.setFromUnitVectors(up,n);const k=.55+random()*.8;scale.set(k,.45+k*.45,k*.7);matrix.compose(point,quaternion,scale);grains.setMatrixAt(i,matrix);grains.setColorAt(i,new THREE.Color().setRGB(.80+random()*.2,.80+random()*.18,.77+random()*.18));
   }
   mesh.add(grains);instances+=count;
  }else{
   const name=(Array.isArray(mesh.material)?mesh.material[0]:mesh.material).name,axis=['x','y','z'].sort((a,b)=>size[b]-size[a])[0],radial=['x','y','z'].filter(a=>a!==axis),radius=Math.max(size[radial[0]],size[radial[1]])/2,p=geometry.attributes.position,rings=new Map();
   for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i),a=v[axis],r=Math.hypot(v[radial[0]]-centre[radial[0]],v[radial[1]]-centre[radial[1]]);rings.set(a,Math.max(rings.get(a)||0,r));}
   const ordered=[...rings].sort((a,b)=>a[0]-b[0]);
   const radiusAt=a=>{const i=ordered.findIndex(r=>r[0]>=a);if(i<=0)return ordered[Math.max(0,i)][1];const lo=ordered[i-1],hi=ordered[i];return lo[1]+(hi[1]-lo[1])*(a-lo[0])/Math.max(1e-9,hi[0]-lo[0]);};
   const make=(a,r,angle)=>{const v=centre.clone();v[axis]=a;v[radial[0]]+=r*Math.cos(angle);v[radial[1]]+=r*Math.sin(angle);return v;};
   const seamMaterial=new THREE.MeshStandardMaterial({name:'Paper overlap edge',color:/tip/.test(name)?0xb8a279:0xc8b995,roughness:.88,metalness:0});
   if(/Natural/.test(name)){const points=Array.from({length:49},(_,i)=>{const t=.025+i/48*.95,a=bounds.min[axis]+size[axis]*t;return make(a,radiusAt(a)*1.003,-1.3+t*.11);});const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,radius*.012,3,false),seamMaterial);seam.name='PaperOverlap';mesh.add(seam);seams++;}
   // Thin paper layers at both ends share one draw call per original surface.
   const layers=[];
   for(const upper of [false,true]){const end=upper?bounds.max[axis]+size[axis]*.0008:bounds.min[axis]-size[axis]*.0008,endRadius=radiusAt(bounds.min[axis]+size[axis]*(upper?.98:.02));for(const fraction of [.25,.46,.68,.88]){const points=Array.from({length:41},(_,i)=>make(end,endRadius*fraction,i/40*Math.PI*2)),g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,radius*.009,3,true),flat=g.toNonIndexed();g.dispose();layers.push(flat);}}
   const combined=new THREE.BufferGeometry();for(const key of ['position','normal','uv']){const length=layers.reduce((sum,g)=>sum+g.attributes[key].array.length,0),data=new Float32Array(length);let offset=0;for(const g of layers){data.set(g.attributes[key].array,offset);offset+=g.attributes[key].array.length;}combined.setAttribute(key,new THREE.BufferAttribute(data,key==='uv'?2:3));}layers.forEach(g=>g.dispose());const edge=new THREE.Mesh(combined,seamMaterial);edge.name='RolledPaperEdges';edge.userData.layerCount=8;mesh.add(edge);
  }
 }
 model.userData.surfaceDetails={kind,instances,seams};
}
