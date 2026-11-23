// Normalised focus points refer to the photographic board, never to screen pixels.
export const inspectionProducts=[
 {id:'vapes',name:'Vapes',word:'VAPES',collection:'THE VAPE COLLECTION',image:'vape-concept.webp',width:1024,height:1536,text:'Forest green. Warm metal. The details, brought into focus.',note:'Illustrative device construction.',parts:[
  {name:'Mouthpiece',copy:'The shaped top through which vapour is drawn. Its contoured profile sits above the cartridge and device housing.',x:.57,y:.15,scale:2.45},
  {name:'Extract cartridge',copy:'The chamber that holds the vape liquid within the device. This cutaway study shows its position beneath the mouthpiece.',x:.54,y:.32,scale:2.1,image:'studies/vape-cartridge.webp',kind:'cartridge'},
  {name:'Device housing',copy:'The forest-green outer shell surrounds the internal components, with warm metallic detailing at either end.',x:.47,y:.65,scale:1.9}
 ]},
 {id:'edibles',name:'Gummies',word:'GUMMIES',collection:'THE GUMMY FLAVOUR EDIT',image:'edible-concept.webp',width:1280,height:1280,text:'Four colours. Four fruit-led flavour directions. Choose a gummy and explore its pairing.',invitation:'Choose a flavour.',note:'Proposed fruit × hemp cultivar pairings. Final flavours and ingredients to be confirmed.',parts:[
  {name:'Mango + pineapple',pairing:'AMBER / HAWAIIAN HAZE',copy:'Ripe mango sweetness with a bright pineapple edge. A golden, tropical flavour direction, paired here with the Hawaiian Haze hemp cultivar.',x:.49,y:.49,markerX:.48,markerY:.54,scale:2.4},
  {name:'Strawberry',pairing:'RED / SPECIAL SAUCE',copy:'A soft strawberry direction with a sweet berry finish. The red gummy colour study is paired with the Special Sauce hemp cultivar.',x:.29,y:.3,markerX:.24,markerY:.22,scale:2.25},
  {name:'Apple + lime',pairing:'GREEN / SOUR SPACE CANDY',copy:'Crisp green apple meets a sharp lime note. A fresh, tart flavour concept paired with the Sour Space Candy hemp cultivar.',x:.73,y:.32,markerX:.81,markerY:.37,scale:2.35},
  {name:'Black grape',pairing:'PURPLE / ROYAL GRAPES',copy:'Deep grape sweetness with a darker, berry-like finish. The purple gummy colour study is paired with the Royal Grapes hemp cultivar.',x:.74,y:.7,markerX:.82,markerY:.78,scale:2.3}
 ]},
 {id:'pre-rolls',name:'Pre-rolls',word:'PRE-ROLLS',collection:'THE PRE-ROLL COLLECTION',image:'preroll-concept.webp',width:1536,height:1024,text:'Hemp, paper and a shaped tip. An exploration of the rolled form.',note:'Illustrative components; final materials and specifications are unconfirmed.',parts:[
  {name:'Hemp material',copy:'The plant material forms the filling inside the rolling paper. This material study isolates the texture of the hemp from the finished roll.',x:.35,y:.38,scale:2.2,image:'studies/roll-hemp.webp',kind:'hemp'},
  {name:'Rolling paper',copy:'A thin outer sheet wraps around the hemp filling to create the rolled form. The close-up shows the paper separately so its texture is easier to see.',x:.43,y:.59,scale:1.9,image:'studies/roll-paper.webp',kind:'paper'},
  {name:'Paper tip',copy:'The rolled paper support sits at the mouth end of the pre-roll, helping the end keep its shape and containing loose plant material.',x:.53,y:.75,scale:2.05,image:'studies/roll-filter.webp',kind:'tip'}
 ]}
];
export function inspectionCamera(part){
 if(!part)return {x:0,y:0,scale:1};
 const bounded=(value,min,max)=>Math.min(max,Math.max(min,Number.isFinite(value)?value:min));
 const scale=bounded(part.scale,1,2.6),x=bounded(part.x,0,1),y=bounded(part.y,0,1);
 return {x:(.5-x*scale)*100,y:(.5-y*scale)*100,scale};
}
