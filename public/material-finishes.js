// Physical surface response shared by the carousel and close-up viewers.
// These maps are static, seeded and reused; no postprocessing or refraction pass.
export function createMaterialFinishes(THREE,renderer){
 const textures=new Map();
 function variation(kind){
  if(textures.has(kind))return textures.get(kind);const size=128,data=new Uint8Array(size*size*4);let seed=94213;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){seed=(1664525*seed+1013904223)>>>0;const r=seed/4294967296,i=(y*size+x)*4,fibre=Math.pow(Math.max(0,Math.sin(x*.19+Math.sin(y*.025)*.4)),16),value=kind==='paper-colour'?.93+r*.06-fibre*.035:.68+r*.30;data[i]=data[i+1]=data[i+2]=Math.round(value*255);data[i+3]=255;}
  const map=new THREE.DataTexture(data,size,size);map.userData.sharedFinish=true;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(kind==='paper-colour'?1:4,kind==='paper-colour'?2:4);map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.needsUpdate=true;if(kind==='paper-colour')map.colorSpace=THREE.SRGBColorSpace;textures.set(kind,map);return map;
 }
 function normal(kind){
  if(textures.has(kind))return textures.get(kind);
  const size=256,data=new Uint8Array(size*size*4);let seed=12837;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const heights=new Float32Array(size*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)heights[y*size+x]=kind==='paper'?random()*.22+Math.sin(x*1.1+y*.13)*.18:kind==='sugar'?Math.pow(random(),5):random()*.07+Math.sin(y*2.3)*.16;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const at=(a,b)=>heights[((b+size)%size)*size+(a+size)%size];
   const n=new THREE.Vector3((at(x-1,y)-at(x+1,y))*.7,(at(x,y-1)-at(x,y+1))*.7,1).normalize(),i=(y*size+x)*4;
   data[i]=(n.x*.5+.5)*255;data[i+1]=(n.y*.5+.5)*255;data[i+2]=(n.z*.5+.5)*255;data[i+3]=255;
  }
  const map=new THREE.DataTexture(data,size,size);map.userData.sharedFinish=true;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(kind==='sugar'?5:8,kind==='paper'?20:12);map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.needsUpdate=true;textures.set(kind,map);return map;
 }
 function finish(source){
  const material=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(material,source);material.name=source.name;
  const name=source.name.toLowerCase();material.envMapIntensity=1;material.forceSinglePass=true;
  if(/glass|transparent window|mouthpiece|polymer/.test(name)){material.roughness=.085;material.metalness=.015;material.clearcoat=.96;material.clearcoatRoughness=.065;material.ior=1.46;}
  else if(/fruit colour/.test(name)){material.roughness=.52;material.roughnessMap=variation('gel-roughness');material.metalness=0;material.clearcoat=.28;material.clearcoatRoughness=.24;material.sheen=.08;material.sheenColor.set('#e7dcc7');material.ior=1.43;material.normalMap=normal('sugar');material.normalScale.setScalar(.22);material.transparent=true;material.opacity=.94;}
  else if(/extract/.test(name)){material.roughness=.23;material.metalness=0;material.clearcoat=.48;material.clearcoatRoughness=.23;material.ior=1.43;material.normalMap=normal('sugar');material.normalScale.setScalar(.025);material.transparent=true;material.opacity=.46;material.depthWrite=false;}
  else if(/sugar/.test(name)){material.metalness=0;material.roughness=.46;material.clearcoat=.12;if(!/fine sugar/.test(name)){material.normalMap=normal('sugar');material.normalScale.setScalar(.4);}}
  else if(/paper|carton/.test(name)){material.metalness=.02;material.roughness=.77;material.normalMap=normal('paper');material.normalScale.setScalar(.08);if(/carton/.test(name)){material.roughness=.52;material.metalness=.08;material.clearcoat=.2;material.clearcoatRoughness=.3;}if(/interior paper/.test(name)){material.roughness=.9;material.metalness=0;material.clearcoat=0;}if(/natural paper|paper tip/.test(name)&&!material.map){material.map=variation('paper-colour');material.roughnessMap=variation('paper-roughness');}}
  else if(/brass|contact|tube$|interior foil/.test(name)){material.metalness=.86;material.roughness=.26;material.normalMap=normal('metal');material.normalScale.setScalar(.045);}
  else if(/wrapper|approved foil/.test(name)){material.metalness=.32;material.roughness=.33;material.clearcoat=.44;material.clearcoatRoughness=.22;}
  else if(/anodised|device print|reference artwork|cloud continuation/.test(name)){material.metalness=/print|artwork|continuation/.test(name)?.08:.43;material.roughness=.32;material.clearcoat=.3;material.clearcoatRoughness=.28;material.normalMap=normal('metal');material.normalScale.setScalar(.025);}
  if(material.map)material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return material;
 }
 return {finish,dispose(){textures.forEach(t=>t.dispose());textures.clear();}};
}
