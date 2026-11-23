import {vapeCopy,vapeReferenceFacts,collectionFlavours,approvedFlavours} from './product-content.js?v=c73acc77c6a5';
import {cinemaProducts} from './collection-cinema-data.js?v=bf4876d5f47b';
export const TAU=Math.PI*2;
export const clamp01=n=>Math.max(0,Math.min(1,n));
export const easeOut=n=>1-Math.pow(1-clamp01(n),4);
export const easeInOut=n=>{n=clamp01(n);return n*n*(3-2*n);};
export const wrapAngle=n=>((n+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
export const mix=(a,b,t)=>a+(b-a)*t;
const finishes={
 'edibles':'Nine flavours, with a fine sugar-coated finish.',
 'pre-rolls':'A paper pre-roll in a fitted brass-tone case.'
};
export const moodProducts=cinemaProducts.map(p=>{
 const vape=vapeCopy[p.id];
 const family=p.id==='edibles'?'gummies':p.id==='pre-rolls'?'pre-rolls':'vapes';
 return {
  ...p,family,
  description:finishes[p.id]||p.description,
  facts:vape?vapeReferenceFacts(p.id):[],
  qualification:vape?p.qualification:family==='gummies'
   ?'Gummy assortment preview. Final ingredients and specifications to be confirmed.'
   :'Category concept. Final contents and specifications to be confirmed.'
 };
});
// Keep the first wheel at sixteen objects. Additional slots only appear inside a collection.
const mainOrder=[0,4,1,5,2,4,3,5,6,4,7,5,8,9,10,4];
export const mainSlots=mainOrder.map((_,slot)=>slot);
const gummySlotsOnWheel=mainSlots.filter(slot=>mainOrder[slot]===4);
const rollSlotsOnWheel=mainSlots.filter(slot=>mainOrder[slot]===5);
const extraGummies=Array(approvedFlavours.length-gummySlotsOnWheel.length).fill(4);
const extraRolls=Array(approvedFlavours.length-rollSlotsOnWheel.length).fill(5);
export const ringOrder=[...mainOrder,...extraGummies,...extraRolls];
export const gummySlots=[...gummySlotsOnWheel,...extraGummies.map((_,i)=>mainSlots.length+i)];
export const preRollSlots=[...rollSlotsOnWheel,...extraRolls.map((_,i)=>mainSlots.length+extraGummies.length+i)];
const vapeSlots=mainSlots.filter(slot=>moodProducts[ringOrder[slot]].family==='vapes');
export const gummyConcepts=approvedFlavours.map(flavour=>({...flavour,colour:flavour.shade,node:flavour.gummyNode}));
export const preRollEditions=approvedFlavours.map(flavour=>({...flavour,colour:flavour.shade}));
const previousProductIds={
 gummies:{'strawberry-kush':'runtz','cherry-haze':'pink-candy','mango-kush':'gelato','blueberry-dream':'blue-dream','grape-gelato':'granddaddy-purple'},
 'pre-rolls':{'pre-rolls':'london-pound-cake','girl-scout-cookies':'london-pound-cake','cherry-haze':'og-kush'}
};
export function productSlot(family,id){
 if(!id)return undefined;
 const productId=previousProductIds[family]?.[id]||id;
 return familySlots(family).find(slot=>{
  const entry=entryFor(slot,true);
  return entry.id===productId||vapeCopy[entry.id]?.id===productId;
 });
}
export function entryFor(slot,collection=false){
 const p=moodProducts[ringOrder[slot]];if(!p)return null;
 const gummy=p.family==='gummies';
 const edition=collection&&(gummy?gummyConcepts[gummySlots.indexOf(slot)]:p.family==='pre-rolls'?preRollEditions[preRollSlots.indexOf(slot)]:null);
 if(edition){
  const {name,id,type,split,finish,copy,colour,art,node}=edition;
  return {
   ...p,name,id,finish,colour,art,flavour:collectionFlavours[name],
   description:`${name}. ${copy}`,
   facts:[['Strain type',type],gummy?['Finish','Fine sugar coating']:['Case finish',finish]],
   qualification:`Strain profile for ${name} (${type}, ${split}). Final ${gummy?'ingredients':'contents'} and specifications are unconfirmed.`,
   variant:node,concept:true,film:gummy?undefined:'hemp-conveyor.mp4'
  };
 }
 const vape=vapeCopy[p.id];
 return {...p,art:vape?.art||null,film:p.family==='pre-rolls'?'hemp-conveyor.mp4':'ehf-wheel-motion.mp4'};
}
export function familySlots(id){return [...(id==='vapes'?vapeSlots:id==='gummies'?gummySlots:preRollSlots)];}
export function turnTarget(phase,slot,members=mainSlots){const i=Math.max(0,members.indexOf(slot));return phase+TAU+wrapAngle(-TAU*i/members.length-phase);}
export function angleDelta(from,to){return wrapAngle(to-from);}
// A hovered target must not drift, including any momentum left by cursor steering.
export function wheelMotionStep({phase,target,velocity,dt,held=false,coasting=true}){if(held)return {phase,target:phase,velocity:0};if(coasting){target+=velocity*dt/1000;velocity*=Math.pow(.88,dt/16);}target+=.008*dt/1000;return {phase:mix(phase,target,1-Math.exp(-dt/90)),target,velocity};}
export function familyPlacement(slot,phase,w,h,time,members){const m=ringMetrics(w,h),i=members.indexOf(slot);if(i<0)return {...circlePlacement(slot,phase,w,h,time),alpha:0};const a=i/members.length*TAU-Math.PI/2+phase,r=m.radius*.9;return {x:m.x+Math.cos(a)*r,y:m.y+Math.sin(a)*r*(w<700?1.13:1),height:Math.min(w<700?108:166,m.size*1.45),yaw:.1+Math.sin(time*.18+slot*.53)*.2,pitch:.025,tilt:wrapAngle(-a-Math.PI/2),alpha:1,depth:100+Math.sin(a)*12,pose:0,fit:0};}
export function blendPlacement(a,b,t){t=easeInOut(t);return {...a,x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),height:mix(a.height,b.height,t),yaw:mix(a.yaw,b.yaw,t),tilt:a.tilt+wrapAngle(b.tilt-a.tilt)*t,alpha:mix(a.alpha,b.alpha,t),depth:mix(a.depth,b.depth,t),variantAmount:t,pose:mix(a.pose||0,b.pose||0,t),fit:mix(a.fit||0,b.fit||0,t)};}
export const moodFamilies={vapes:{name:'Vapes',pick:'Pick your vape.',primary:0},'pre-rolls':{name:'Pre-rolls',pick:'Pick your pre-rolls.',primary:5},gummies:{name:'Gummies',pick:'Pick your gummies.',primary:4}};
export function ringMetrics(w,h){const phone=w<700,radius=Math.min(w*(phone?.405:.365),h*.35,310);return {x:w/2,y:h*.55,radius,ry:radius*(phone?1.13:1),size:Math.max(phone?58:65,Math.min(138,radius*(phone?.4:.43)))};}
export function spinTarget(phase,slot){const base=-TAU*slot/16;return phase+TAU+wrapAngle(base-phase);}
export function circlePlacement(slot,phase,w,h,time=0){const m=ringMetrics(w,h),a=slot/16*TAU-Math.PI/2+phase;return {x:m.x+Math.cos(a)*m.radius,y:m.y+Math.sin(a)*m.ry,height:m.size,yaw:.10+Math.sin(time*.18+slot*.53)*.24,pitch:.025,tilt:wrapAngle(-a-Math.PI/2),alpha:slot<16?1:0,depth:100+Math.sin(a)*12,pose:0,fit:0};}
export function focusPlacement(from,frame,t,selected){const e=easeInOut(t);if(selected)return {...from,x:mix(from.x,frame.x,e),y:mix(from.y,frame.y,e),height:mix(from.height,frame.height,e),yaw:mix(from.yaw,.08,e),pitch:mix(from.pitch,0,e),tilt:mix(from.tilt,0,e),depth:mix(from.depth,300,e),alpha:1,fit:mix(from.fit||0,1,e)};return {...from,x:mix(from.x,frame.cx+(from.x-frame.cx)*3.1,e),y:mix(from.y,frame.cy+(from.y-frame.cy)*3.1,e),height:from.height*(1+e*.7),alpha:from.alpha*(1-e),depth:from.depth};}
