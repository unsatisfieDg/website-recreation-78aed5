import {componentCopy,vapeCopy} from './product-content.js?v=c73acc77c6a5';
export const WRAPPER_TEAR_MS=1480;
export const WRAPPER_RESET_MS=860;
export const PRODUCT_ORBIT_MS=3100;

export function productOrbit(progress){
 const turn=Math.max(0,Math.min(1,(progress-.14)/.86));
 const eased=turn*turn*(3-2*turn);
 const yaw=eased*2*Math.PI;
 const arc=Math.sin(Math.PI*eased);
 return {yaw,pitch:.48*Math.sin(yaw)+.16*arc,roll:-.16*Math.sin(yaw),zoom:arc};
}

// A bounded reading sequence, shared by scroll, touch and explicit controls.
export function productChapters(entry){
 const base={pose:entry.family==='gummies'?0:1,unroll:0,foil:0,carton:0,node:null};
 const step=(title,values={})=>({...base,title,...values});
 if(entry.family==='pre-rolls')return [
  step('Overview'),step('Carry case',{node:'StorageTube'}),
  step('The pre-roll',{node:'Roll_1'}),
  step('Rolling paper',{unroll:1,node:'RollingPaper'}),
  step('Hemp filling',{unroll:1,node:'HempFlower'}),
  step('Paper filter',{unroll:1,node:'Filter'})
 ];
 if(entry.family==='gummies')return [];
 const part=(node,values={})=>step(componentCopy[node].title,{node,...values});
 return [step('Overview'),part('Mouthpiece'),part('Cartridge'),part('DeviceHousing'),...(vapeCopy[entry.id]?.parts.Wrapper?[part('Wrapper',{foil:1})]:[])];
}

// Trackpads emit many events per gesture. Consume at most one chapter until
// a quiet gap; nothing is queued while a physical opening is in progress.
export function scrollChapter(state,delta,now,{busy=false,gap=180,threshold=55}={}){
 const fresh=now-state.at>gap||Math.sign(delta)!==Math.sign(state.sum);
 const next={at:now,sum:fresh?delta:state.sum+delta,used:fresh?false:state.used};
 if(busy){next.used=true;return {state:next,direction:0};}
 if(next.used||Math.abs(next.sum)<threshold)return {state:next,direction:0};
 next.used=true;return {state:next,direction:Math.sign(next.sum)};
}
