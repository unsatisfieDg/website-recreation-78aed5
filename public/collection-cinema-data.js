import {editions} from './editions.js?v=cbe2b6b94c45';
import {approvedFlavours,vapeCopy,vapeInformation} from './product-content.js?v=c73acc77c6a5';
const vapeProduct=({vapeId:id,shade:colour},slug)=>{
 const copy=vapeCopy[id],name=copy.strain;
 return {id,name,category:'Vape bar',colour,
  href:slug?`${slug}.html`:`vapes.html?collection=vapes&product=${id}#collections`,
  image:`vape-range/${id}-runway.webp`,deviceImage:`vape-range/${id}-device.webp`,
  phrase:copy.cinema.line,lead:copy.cinema.line,description:copy.description,
  detail:copy.parts.DeviceHousing,action:`View ${name}`,qualification:vapeInformation(id)};
};
export const cinemaProducts=[
 ...approvedFlavours.slice(0,4).map(profile=>vapeProduct(profile,editions.find(e=>e.id===profile.vapeId)?.slug)),
 {id:'edibles',name:'Gummies',category:'The edible collection',colour:'#9d434d',href:'edibles.html',image:'edible-concept.webp',phrase:'Colour. Texture. Form.',lead:'A different kind of detail.',description:'Sugar-coated cubes in nine flavours, from bright pineapple to dark grape.',detail:'Choose a flavour to see its fruit or dessert notes and sugar-coated finish.',action:'Open the gummy collection',qualification:'Gummy assortment preview. Final ingredients, quantities and specifications remain to be confirmed.'},
 {id:'pre-rolls',name:'Pre-rolls',category:'The pre-roll collection',colour:'#ba9b59',href:'pre-rolls.html',image:'preroll-concept.webp',phrase:'Nature, in the details.',lead:'A form worth unfolding.',description:'Paper, a simple silhouette and a brass-toned tube. Explore the pre-roll collection in three dimensions.',detail:'Unroll the paper study and look closer at the paper tip, the outer sheet and the illustrated filling.',action:'Unroll the collection',qualification:'Category concept. Final contents, sizes and packaging remain to be confirmed.'},
 ...approvedFlavours.slice(4).map(profile=>vapeProduct(profile))
];
