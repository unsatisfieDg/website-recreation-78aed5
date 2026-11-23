// A tiny procedural photographic room, baked once. No HDR download or per-frame lights.
export function createStudioLight(THREE,renderer,scene){
 const room=new THREE.Scene();room.background=new THREE.Color('#252b28');
 const geometry=new THREE.PlaneGeometry(1,1),materials=[];
 const panel=(colour,power,x,y,z,w,h)=>{const material=new THREE.MeshBasicMaterial({color:new THREE.Color(colour).multiplyScalar(power),side:THREE.DoubleSide});materials.push(material);const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,1);mesh.lookAt(0,0,0);room.add(mesh);};
 panel('#fff5df',4.2,-4,2,4,2.4,7);
 panel('#e2ede8',2.6,4,1,2,1.2,6);
 panel('#ffffff',3.4,0,5,-2,6,2);
 panel('#c4b48a',1.2,-1,0,-5,3,6);
 const pmrem=new THREE.PMREMGenerator(renderer),map=pmrem.fromScene(room,.035,.1,30);
 scene.environment=map.texture;scene.environmentIntensity=.85;
 geometry.dispose();materials.forEach(m=>m.dispose());pmrem.dispose();
 return ()=>{scene.environment=null;map.dispose();};
}
