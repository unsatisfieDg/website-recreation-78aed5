// Actual moving geometry in the product's renderer. No video decoder or refraction pass.
export function createLiquidAtmosphere(T,scene,colour){
 const group=new T.Group();scene.add(group);
 const material=new T.MeshPhysicalMaterial({color:new T.Color(colour).lerp(new T.Color('#fff8e8'),.67),metalness:.12,roughness:.13,clearcoat:1,transparent:true,opacity:.62,depthWrite:false,side:T.DoubleSide,envMapIntensity:1.5});
 const steps=96,bands=6,positions=new Float32Array(97*7*3),indices=[];
 for(let i=0;i<steps;i++)for(let j=0;j<bands;j++){const a=i*7+j,b=a+7;indices.push(a,b,a+1,a+1,b,b+1);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setIndex(indices);const sheet=new T.Mesh(geometry,material);sheet.frustumCulled=false;group.add(sheet);
 const sphere=new T.SphereGeometry(1,16,12),glass=new T.MeshPhysicalMaterial({color:'#e6f0e7',metalness:.24,roughness:.08,clearcoat:1,transparent:true,opacity:.62,depthWrite:false,envMapIntensity:2}),drops=new T.InstancedMesh(sphere,glass,34),matrix=new T.Matrix4(),q=new T.Quaternion(),scale=new T.Vector3();drops.frustumCulled=false;group.add(drops);
 function update(seconds){
  for(let i=0;i<=steps;i++){const u=i/steps,a=-Math.PI*.65+u*Math.PI*1.67,lip=Math.pow(Math.sin(Math.PI*u),.65),width=(.014+.055*lip)*(1+.14*Math.sin(u*19-seconds*.8));for(let j=0;j<=bands;j++){const v=j/bands-.5,r=.36+v*width,k=(i*7+j)*3;positions[k]=.12+Math.cos(a)*r+.012*Math.sin(u*13+seconds*.7)*lip;positions[k+1]=Math.sin(a)*r*1.12+.015*Math.cos(u*15-seconds*.9)*lip;positions[k+2]=Math.sin(a*2.2+seconds*.32)*.025+v*v*.12;}}
  geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();
  for(let i=0;i<34;i++){const t=(seconds*(.045+(i%5)*.005)+i*.6180339)%1,r=(.008+(i%7)*.0022)*Math.pow(Math.sin(t*Math.PI),.65);scale.set(r,r*(1.08+.12*Math.sin(seconds+i)),r);matrix.compose(new T.Vector3(.18+Math.sin(i*2.4+t*3)*.42,-.58+t*1.2,-.08+Math.cos(i*1.7)*.10),q,scale);drops.setMatrixAt(i,matrix);}drops.instanceMatrix.needsUpdate=true;
 }
 update(0);
 return {update,setVisible(visible){group.visible=visible;},frame(target,distance){const h=distance*Math.tan(31*Math.PI/360)*2;group.position.copy(target);group.position.z-=h*.24;group.scale.setScalar(h);},dispose(){group.removeFromParent();geometry.dispose();material.dispose();sphere.dispose();glass.dispose();}};
}
