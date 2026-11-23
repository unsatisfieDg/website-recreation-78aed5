// EHF's assembled flavour stories share the same scene as the collection belt.
// Geometry and transitions modeled after the Henrietta Said showcase.
import {vapeCopy} from './product-content.js?v=c73acc77c6a5';

const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
export const STORY_DWELL=8500;
export function blendCinemaColour(a,b,t){const weight=clamp(t),channel=i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-weight)+parseInt(b.slice(i,i+2),16)*weight).toString(16).padStart(2,'0');return '#'+channel(1)+channel(3)+channel(5);}
export function cinemaDistance(index,position,count){return ((index-position+count/2)%count+count)%count-count/2;}
export function nearestCinemaPosition(position,index,count){return position+cinemaDistance(index,position,count);}

export function cinemaPose(index,position,{width:w,height:h,morph=0,hover=0,time=0,count=6,family='vapes',distance=cinemaDistance(index,position,count)}={}){
 const phone=w<=900,m=clamp(morph),d=distance,a=Math.abs(d);
 const top=phone?188:155,bottom=phone?180:145,band=Math.max(150,h-top-bottom),spacing=w*(phone?.48:.21);
 const beltH=band*.92*(.49+.51*Math.exp(-.8*a*a)),beltX=w*.5+d*spacing,beltY=top+band*.49+a*band*.02+Math.sin(time*.65+index*1.7)*2;
 
 if(family==='vapes'){
  // Multi-axis floating breathing movements:
  const floatY = (Math.sin(time * 2.2 + index) * 14 + Math.cos(time * 1.1 + index * 0.7) * 4) * m;
  const floatX = (Math.sin(time * 1.5 + index * 1.2) * 8 + Math.cos(time * 0.8 + index) * 3) * m;
  const floatTilt = Math.sin(time * 1.8 + index) * 0.035 * m;
  const floatYaw = Math.cos(time * 1.4 + index * 0.8) * 0.045 * m;
  
  // Flavor movement patterns (0: diagonal, 1: vertical, 2: horizontal)
  // Alternate spin direction (left vs right) based on flavor index and travel
  // (index % 2 === 0 rotates clockwise/right, odd rotates counter-clockwise/left)
  const motionMode = ((index % 3) + 3) % 3;
  const spinSign = (index % 2 === 0) ? 1 : -1;
  let offsetX = 0;
  let offsetY = 0;
  let spinAngle = spinSign * d * Math.PI * 0.85;

  if (motionMode === 0) {
    // Diagonal motion: combined X and Y sweep with alternating clockwise/counter-clockwise roll
    offsetX = d * w * (phone ? 0.75 : 0.60);
    offsetY = (d !== 0 ? Math.sign(d) * h * 0.45 * Math.pow(a, 0.9) : 0);
    spinAngle = spinSign * d * Math.PI * 0.90;
  } else if (motionMode === 1) {
    // Vertical motion: dominant Y leap/drop with dynamic right-and-left barrel tilt
    offsetX = d * w * (phone ? 0.22 : 0.16);
    offsetY = (d !== 0 ? Math.sign(d) * h * 0.85 * Math.pow(a, 0.92) : 0);
    spinAngle = spinSign * d * Math.PI * 0.55;
  } else {
    // Horizontal motion: fast horizontal pan across stage with balanced spin
    offsetX = d * w * (phone ? 0.95 : 0.82);
    offsetY = (d !== 0 ? Math.sin(d * Math.PI * 0.5) * h * 0.08 : 0);
    spinAngle = spinSign * d * Math.PI * 0.75;
  }

  const targetX = w * 0.5 + floatX + offsetX;
  const targetY = h * 0.50 + floatY + offsetY;
  
  const beltHeight = beltH;
  // Scaled down: phone 0.38 (was 0.48), desktop 0.52 (was 0.72) for a compact centered look
  const storyHeight = h * (phone ? 0.38 : 0.52) * (1 - Math.min(0.4, a * 0.25));
  const height = (beltHeight + (storyHeight - beltHeight) * m) * (1 + clamp(hover) * 0.05);

  const henriettaRotation = spinAngle + floatTilt;
  const henriettaYaw = spinSign * d * 0.65 + floatYaw;
  const henriettaPitch = 0.02 + Math.sin(time * 1.5) * 0.02;

  // Visibility fade out when off-screen
  // Smooth curve: vape remains visible during transit
  const alpha = Math.max(0, 1 - Math.pow(a / 1.35, 2));

  return {
   x: beltX + (targetX - beltX) * m,
   y: beltY + (targetY - beltY) * m,
   height,
   alpha: ((1 - m) * ease((3.12 - a) / 0.6) + m * alpha),
   tilt: (-d * 4.2 * (1 - m)) * Math.PI / 180 + henriettaRotation * m,
   yaw: (-d * 0.15 * (1 - m)) + henriettaYaw * m,
   pitch: henriettaPitch,
   depth: 150 - a * 60 * m,
   pose: 0,
   fit: m,
   variantAmount: 1,
   aspect: phone ? 0.88 : 0.70,
   gather: m * 0.65
  };
 }

 // Gummy or pre-roll fallback
 const storyH=family==='gummies'?h*(phone?.29:.39):h*(phone?.34:.63),storyX=w*(phone?.48:.515)+d*w*(family==='gummies'?.52:.18),storyY=h*(phone?(family==='gummies'?.55:.50):.52);
 const height=(beltH+(storyH-beltH)*m)*(1+clamp(hover)*.07),edge=phone?ease((1.85-a)/.45):ease((3.12-a)/.6);
 const gummyScale=family==='gummies'?Math.max(0.01, 1 - Math.min(1, a * 0.45)):1;
 if(family==='gummies'){
  // Spin-in: alternate direction per flavour; unwinds to zero as gummy arrives at centre
  const spinSign=(index%2===0)?1:-1;
  // Three entry patterns matching typography: 0=diagonal, 1=vertical, 2=horizontal
  const motionMode=((index%3)+3)%3;
  const centreX=w*(phone?.48:.515);
  const centreY=h*(phone?.55:.52);
  let transitOffX,transitOffY;
  if(motionMode===0){
   // Diagonal: sweeps in from corner — X + Y combined
   transitOffX=d*w*(phone?.42:.38);
   transitOffY=d!==0?Math.sign(d)*h*(phone?.28:.30)*Math.pow(a,.80):0;
  }else if(motionMode===1){
   // Vertical: drops in from above or rises from below
   transitOffX=d*w*(phone?.14:.12);
   transitOffY=d!==0?Math.sign(d)*h*(phone?.58:.62)*Math.pow(a,.85):0;
  }else{
   // Horizontal: fast side sweep (original behaviour)
   transitOffX=d*w*(phone?.52:.52);
   transitOffY=0;
  }
  // Slower spin: 0.9→0.5 yaw, 0.4→0.22 tilt
  const spinYaw=spinSign*d*Math.PI*0.50*m;
  const spinTilt=spinSign*d*Math.PI*0.22*m;
  const ambientYaw=(Math.sin(time*.24)*.13-.08)*m;
  const ambientTilt=(5-Math.sin(time*.35)*2)*m*Math.PI/180;
  const entryX=centreX+transitOffX;
  const entryY=centreY+transitOffY;
  return {x:beltX+(entryX-beltX)*m,y:beltY+(entryY-beltY)*m,height:height*gummyScale,alpha:edge*((1-m)+m*clamp(1-a)),tilt:(-d*4.2*(1-m))*Math.PI/180+spinTilt+ambientTilt,yaw:-d*0.85*(1-m)+spinYaw+ambientYaw,pitch:.025,depth:150-a*5,pose:0,fit:m,variantAmount:1,aspect:phone?.9:.72};
 }
 // Pre-roll: dynamic 3-direction spin-in + floating breathing animation
 if(family==='pre-rolls'){
  const floatY = (Math.sin(time * 2.2 + index) * 12 + Math.cos(time * 1.1 + index * 0.7) * 4) * m;
  const floatX = (Math.sin(time * 1.5 + index * 1.2) * 6 + Math.cos(time * 0.8 + index) * 3) * m;
  const floatTilt = Math.sin(time * 1.8 + index) * 0.030 * m;
  const floatYaw = Math.cos(time * 1.4 + index * 0.8) * 0.040 * m;

  const spinSign=(index%2===0)?1:-1;
  const motionMode=((index%3)+3)%3;
  const centreX=w*(phone?.48:.515);
  const centreY=h*(phone?.50:.52);
  // Directional offsets for 3-pattern entry (diagonal, vertical, horizontal)
  let transitOffX, transitOffY;
  // Multi-axis rotation offsets:
  // Pre-roll is a vertical cylinder, so visible spinning requires dramatic roll/tilt and pitch, as well as yaw.
  let spinYawAngle = spinSign * d * Math.PI * 0.95;
  let spinTiltAngle = spinSign * d * Math.PI * 0.45;
  let spinPitchAngle = 0;

  if (motionMode === 0) {
    // Diagonal: corner sweep
    transitOffX = d * w * (phone ? 0.65 : 0.52);
    transitOffY = (d !== 0 ? Math.sign(d) * h * (phone ? 0.45 : 0.42) * Math.pow(a, 0.82) : 0);
    spinYawAngle = spinSign * d * Math.PI * 1.05;
    spinTiltAngle = spinSign * d * Math.PI * 0.55;
    spinPitchAngle = Math.sign(d) * 0.28 * Math.min(1, a);
  } else if (motionMode === 1) {
    // Vertical: dramatic drop/rise for a tall pre-roll
    transitOffX = d * w * (phone ? 0.18 : 0.14);
    transitOffY = (d !== 0 ? Math.sign(d) * h * (phone ? 0.78 : 0.75) * Math.pow(a, 0.88) : 0);
    spinYawAngle = spinSign * d * Math.PI * 0.70;
    spinTiltAngle = spinSign * d * Math.PI * 0.35;
    spinPitchAngle = Math.sign(d) * 0.38 * Math.min(1, a);
  } else {
    // Horizontal: fast side sweep across stage
    transitOffX = d * w * (phone ? 0.85 : 0.72);
    transitOffY = (d !== 0 ? Math.sin(d * Math.PI * 0.5) * h * 0.08 : 0);
    spinYawAngle = spinSign * d * Math.PI * 0.90;
    spinTiltAngle = spinSign * d * Math.PI * 0.48;
    spinPitchAngle = 0.12 * Math.min(1, a);
  }

  // INTRO ANIMATION: when morphing from collection wheel to cinema center (1 - m > 0)
  // Dynamic 3D tumbling entrance:
  // - introYaw: full 1.25-turn yaw spin (450 deg)
  // - introTilt: dynamic 28-degree roll flourish
  // - introPitch: arching 3D pitch flip
  const ambientTilt = (5 - Math.sin(time * 0.35) * 2) * m * Math.PI / 180;
  const introProgress = 1 - m; // 1 at start of entry, 0 at center
  const introYaw = introProgress * Math.PI * 2.5 * spinSign;
  const introTilt = Math.sin(introProgress * Math.PI) * 0.52 * spinSign;
  const introPitch = Math.sin(introProgress * Math.PI) * 0.32;

  // Total orientation:
  // While traveling between flavors (d !== 0), spinYawAngle & spinTiltAngle animate smoothly.
  // During initial entrance into cinema stage (1 - m), introYaw / introTilt / introPitch provide a vivid 3D tumbling spin.
  const finalTilt = (-d * 4.2 * (1 - m)) * Math.PI / 180 + (spinTiltAngle + floatTilt) * m + ambientTilt + introTilt;
  const finalYaw = (-d * 0.15 * (1 - m)) + (spinYawAngle + floatYaw) * m + introYaw;
  const finalPitch = 0.025 + spinPitchAngle * m + introPitch;

  const entryX = centreX + floatX + transitOffX;
  const entryY = centreY + floatY + transitOffY;
  return {
    x: beltX + (entryX - beltX) * m,
    y: beltY + (entryY - beltY) * m,
    height: height,
    alpha: edge * ((1 - m) + m * clamp(1 - a)),
    tilt: finalTilt,
    yaw: finalYaw,
    pitch: finalPitch,
    depth: 150 - a * 50 * m,
    pose: 0,
    fit: m,
    variantAmount: 1,
    aspect: phone ? 0.9 : 0.72
  };
 }
 // Other families fallback
 return {x:beltX+(storyX-beltX)*m,y:beltY+(storyY-beltY)*m,height:height*gummyScale,alpha:edge*((1-m)+m*clamp(1-a)),tilt:(-d*4.2*(1-m)+(5-Math.sin(time*.35)*2)*m)*Math.PI/180,yaw:-d*0.15*(1-m)+(Math.sin(time*.24)*.13-.08)*m,pitch:.025,depth:150-a*5,pose:0,fit:m,variantAmount:1,aspect:phone?.9:.72};
}

export function flavourProfile(entry){return entry.flavour||vapeCopy[entry.id]||null;}
export function flavourSplash(entry){
 return entry?.family==='gummies'?flavourProfile(entry)?.effect:null;
}

export function flavourSplashSource(effect,compact){
 return `assets/flavour-cinema/${effect}-effect-${compact?'mobile':'desktop'}.mp4`;
}

const mediaGrades=new WeakMap();
export function flavourMediaGrade(entry){
 const profile=flavourProfile(entry);
 if(!profile?.grade)return null;
 if(!mediaGrades.has(profile)){
  const colours=profile.gradient||[profile.shade,profile.shade,profile.shade];
  mediaGrades.set(profile,colours);
 }
 return mediaGrades.get(profile);
}

export function gummyHandoff(position,tween,count){
 if(!tween)return null;
 const goingNext=tween.to>tween.from;
 const origIdx=((Math.round(tween.from)%count)+count)%count;
 const destIdx=((Math.round(tween.to)%count)+count)%count;
 const progress=clamp(tween.duration>0?tween.elapsed/tween.duration:1);
 return [
  {index:origIdx,distance:goingNext?-progress:progress,alpha:1-progress},
  {index:destIdx,distance:goingNext?1-progress:-(1-progress),alpha:progress}
 ];
}

export function createFlavourBackdrop(container,scope,invalidate){
 return {
  sync(){},
  dispose(){},
  pause(){}
 };
}
