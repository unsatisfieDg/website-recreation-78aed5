// Flavour names and strain classifications follow the supplied approval table.
// Packaging labels describe the separate artwork supplied with the new vape designs.
export const collectionFlavours={
 'Granddaddy Purple':{
  id:'granddaddy-purple',vapeId:'grape-rush',type:'Indica Base',split:'70% Indica / 30% Sativa',packLabel:'Indica',
  line:'Black grape after dark.',copy:'Jammy black grape with a touch of tang on the finish.',
  film:'grape-purple',effect:'purple',art:'grape-fruit.webp',colour:'#e8deed',ink:'#54345e',
  finish:'Violet',shade:'#a954d1',extract:'#774292',gummyNode:'Gummy_5',grade:{film:.68,splash:.45}
 },
 'Pineapple Express':{
  id:'pineapple-express',vapeId:'mango-mirage',type:'Sativa',split:'60% Sativa / 40% Indica',packLabel:'Hybrid',
  line:'Pineapple, with a bite.',copy:'Ripe pineapple with a bright tropical finish and a flicker of citrus.',
  film:'pineapple',effect:'pineapple',colour:'#f5e9be',ink:'#695116',
  finish:'Pineapple gold',shade:'#f4ce28',extract:'#dcae38',gummyNode:'Gummy_3',grade:{film:.54,splash:.40}
 },
 'Pink Candy':{
  id:'pink-candy',vapeId:'cherry-drift',type:'Sativa',split:'80% Sativa / 20% Indica',packLabel:'Indica',
  line:'A little tart. A little bright.',copy:'Tart red cherry gives way to the sweetness of a cherry drop.',
  film:'cherry',effect:'cherry',art:'cherry-fruit.webp',colour:'#f4dce8',ink:'#802c53',
  finish:'Candy pink',shade:'#e83791',extract:'#c83465',gummyNode:'Gummy_2',grade:{film:.72,splash:.80}
 },
 'Blue Dream':{
  id:'blue-dream',vapeId:'blueberry-cobbler',type:'Sativa',split:'60% Sativa / 40% Indica',packLabel:'Sativa',
  line:'Blueberry, slow and sweet.',copy:'Ripe blueberry with the mellow sweetness of a berry compote.',
  film:'blue',effect:'blue',art:'blueberry-fruit-v2.webp',colour:'#dde6ef',ink:'#315574',
  finish:'Cobalt blue',shade:'#427fdb',extract:'#3655ab',gummyNode:'Gummy_4',grade:{film:.85,splash:.58}
 },
 Runtz:{
  id:'runtz',vapeId:'berry-blast',type:'Hybrid',split:'50% Indica / 50% Sativa',packLabel:'Hybrid',
  line:'Sweet berry. Tart finish.',copy:'Sweet strawberry up front, with a tart raspberry finish.',
  film:'strawberry',effect:'strawberry',art:'strawberry-fruit.webp',colour:'#f0e6cd',ink:'#624229',
  finish:'Gold, lime and berry',shade:'#bfce43',gradient:['#f9cf36','#bded50','#ec328f'],extract:'#b95780',gummyNode:'Gummy_1',grade:{film:.83,splash:.82,splashLift:.16}
 },
 Gelato:{
  id:'gelato',vapeId:'melon-wave',type:'Hybrid',split:'55% Indica / 45% Sativa',packLabel:'Hybrid',
  line:'Peach and cream.',copy:'A soft peach note with a cool, creamy finish.',
  film:'gelato-cream',effect:'gelato',mobilePoster:'gelato-cream-mobile-poster.webp',colour:'#f5dfd1',ink:'#783f2c',
  finish:'Peach satin',shade:'#e89673',extract:'#ca815d',gummyNode:'Gummy_3',grade:{film:.36,splash:.45}
 },
 'Sour Diesel':{
  id:'sour-diesel',vapeId:'sour-diesel',type:'Sativa',split:'70%–90% Sativa / 10%–30% Indica',packLabel:'Sativa',
  line:'Citrus with an edge.',copy:'Sharp lemon peel over an earthy, herbal finish.',
  film:'sour-botanical',effect:'sour-diesel',mobilePoster:'sour-botanical-mobile-poster.webp',colour:'#e7eccd',ink:'#3c531b',
  finish:'Acid lime',shade:'#9fcf21',extract:'#809426',gummyNode:'Gummy_3',grade:{film:.42,splash:.56}
 },
 'OG Kush':{
  id:'og-kush',vapeId:'og-kush',type:'Indica',split:'55%–75% Indica / 25%–45% Sativa',packLabel:'Hybrid',
  line:'Pine and earth.',copy:'Earthy pine with a dry, resinous finish.',
  film:'og-botanical',effect:'og-kush',mobilePoster:'og-botanical-mobile-poster.webp',colour:'#d5e9df',ink:'#285950',
  finish:'Deep teal',shade:'#149b81',extract:'#2b856b',gummyNode:'Gummy_4',grade:{film:.67,splash:.74}
 },
 'London Pound Cake':{
  id:'london-pound-cake',vapeId:'london-pound-cake',type:'Indica',split:'70% Indica / 30% Sativa',packLabel:'Indica',
  line:'Vanilla with a twist.',copy:'Vanilla cake notes with a buttery finish and a lift of lemon zest.',
  film:'london-cake',effect:'london-pound-cake',mobilePoster:'london-cake-mobile-poster.webp',colour:'#f2e2d7',ink:'#773e4c',
  finish:'Gold and rose',shade:'#df72aa',gradient:['#ffd84b','#df70b1','#f5ce5a'],extract:'#cc9866',gummyNode:'Gummy_2',grade:{film:.51,splash:.72}
 }
};
export const approvedFlavours=Object.entries(collectionFlavours).map(([name,profile])=>({name,...profile}));

export const vapeCopy=Object.fromEntries(approvedFlavours.map(profile=>{
 const {name,type,split,finish,line,copy}=profile;
 const palette=finish.toLowerCase();
 return [profile.vapeId,{
  ...profile,strain:name,type,split,referencePack:true,
  cinema:{line,copy},description:`${name}. ${copy}`,
  parts:{
   Mouthpiece:`The gloss-black mouthpiece caps the ${name} bar. Lift it to see where the air channel meets the cartridge.`,
   Cartridge:`The cartridge sits below the tip. Its illustrated tint picks up the ${palette} tones of ${name}.`,
   Collar:`A slim black ring sits where the cartridge meets the ${palette} body.`,
   DeviceHousing:`The ${name} body uses a ${palette} finish. Its oval window gives a view of the reservoir inside.`,
   Wrapper:`The ${name} foil carries the approved front and back artwork in ${palette} tones. The side notch guides the tear across the top seam.`
  }
 }];
}));

export function vapeReferenceFacts(id){
 return [['Volume on pack','1 ml'],['Puffs on pack','600'],['On-pack label',vapeCopy[id].packLabel]];
}
export function vapeInformation(id){
 const {strain,type,split,packLabel}=vapeCopy[id];
 return `Strain profile for ${strain} (${type}, ${split}). The supplied pouch reads 1 ml, 600 puffs and ${packLabel}. Internal construction and extract colour are illustrative.`;
}
export const componentCopy={
 Mouthpiece:{title:'Mouthpiece',copy:'The mouthpiece is the top of the vape. It connects the cartridge’s air channel to the draw.'},
 Cartridge:{title:'Cartridge',copy:'The cartridge holds the vape liquid around a central air channel. It sits beneath the mouthpiece, inside the vape body.'},
 Collar:{title:'Connection ring',copy:'The connection ring sits between the cartridge and the outer body, at the top of the device assembly.'},
 DeviceHousing:{title:'Vape body',copy:'The outer body surrounds the internal assembly. A viewing window shows the cartridge inside.'},
 Packaging:{title:'Carton',copy:'The outer carton carries the flavour name and pack information.'},
 Wrapper:{title:'Foil wrapper',copy:'The sealed sleeve surrounds the vape bar. Opening the top gives access to the device inside.'},
 StorageTube:{title:'Carry case',copy:'The fitted case surrounds the pre-roll during storage. Its cap covers the opening and keeps the roll contained.'},
 TubeCap:{title:'Case cap',copy:'The cap closes the carry case. It releases from the opening so the pre-roll can be removed.'},
 Roll_1:{title:'The pre-roll',copy:'Hemp filling, rolling paper and a paper tip form the pre-roll. Unroll it to see the three components separately.'},
 RollingPaper:{title:'Rolling paper',copy:'The paper wraps around the hemp filling and holds the pre-roll together, with the filter at its base.'},
 HempFlower:{title:'Hemp filling',copy:'The botanical filling sits inside the rolling paper. Opening the paper reveals the filling separately from the wrap and filter.'},
 Filter:{title:'Paper filter',copy:'The folded paper tip supports the mouth end of the pre-roll and helps keep loose filling contained.'}
};
export function productComponent(entry,node){
 const source=componentCopy[node];if(!source)return null;
 const name=entry.name;
 if(entry.family==='vapes'){
  const copy=vapeCopy[entry.id]?.parts[node];
  return copy?{title:source.title,copy}:null;
 }
 if(entry.family==='pre-rolls'){
  if(node==='Roll_1')return {...source,copy:`${entry.flavour.copy} Select Unroll to see the filling, paper and filter.`};
  if(node==='StorageTube')return {...source,copy:`The ${name} pre-roll sits inside a ${entry.finish.toLowerCase()} case. The fitted cap covers the opening.`};
  if(node==='HempFlower')return {...source,copy:`${entry.flavour.copy} This close-up shows the ground hemp filling inside the paper.`};
 }
 return {...source};
}
