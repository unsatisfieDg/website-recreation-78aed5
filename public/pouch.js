// The supplied printed pouch is the texture. Geometry bends the film without
// replacing the artwork, and both sides share exactly the same fracture edge.
const clamp=v=>Math.max(0,Math.min(1,v));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const phase=(p,a,b)=>ease((p-a)/(b-a));
export const POUCH_SEAM=.1175;
export function tearEdge(u){
 return POUCH_SEAM+.00125*Math.sin(u*231)+.00065*Math.sin(u*517)+.0004*Math.sin(u*929);
}
export function pouchState(progress,ratio=4/3){
 const p=clamp(progress),tear=phase(p,.035,.36),release=phase(p,.36,.56);
 const relax=phase(p,.36,.83),breath=Math.sin(Math.PI*relax);
 const width=284+10*relax+4*breath,height=width*ratio*(1-.035*relax);
 const x=320,y=292+16*relax-2*Math.sin(Math.PI*tear);
 return {p,tear,release,relax,breath,width,height,x,y,left:x-width/2,top:y-height/2,
  front:1-tear,aperture:phase(p,.34,.59),curl:tear*(1.1+.5*release)};
}
export function pouchPoint(s,u,v){
 const across=Math.sin(Math.PI*clamp((u-.055)/.89));
 const lip=12*s.aperture*across*Math.exp(-Math.max(0,v-POUCH_SEAM)*19);
 const bulge=1+.016*s.breath*Math.sin(Math.PI*clamp((v-POUCH_SEAM)/(1-POUCH_SEAM)));
 return [s.x+(u-.5)*s.width*bulge,s.top+v*s.height+lip];
}
export function stripPoint(s,u,v){
 const t=clamp((u-s.front)/Math.max(.00001,1-s.front));
 const length=s.width*(1-s.front)*(1-.17*s.release),angle=t*s.curl;
 const hingeX=mix(s.left+s.front*s.width,385,s.release);
 const hingeY=mix(s.top+tearEdge(s.front)*s.height,150,s.release);
 const radius=length/Math.max(.00001,s.curl);
 const depth=(v-tearEdge(u))*s.height;
 const turn=t*s.tear*2.18,fold=Math.cos(turn);
 return [hingeX+radius*Math.sin(angle)-depth*Math.sin(angle)*.42,
  hingeY-radius*(1-Math.cos(angle))*.4+depth*fold+1.5*s.tear*Math.sin(t*19)*t];
}

function polygon(ctx,points){
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
}
// Affine triangles allow local folds while keeping printed lettering attached
// to the material. A subpixel overlap prevents hairline mesh seams at high DPI.
function textureTriangle(ctx,img,uv,points){
 const source=uv.map(([u,v])=>[u*img.naturalWidth,v*img.naturalHeight]);
 const [[x0,y0],[x1,y1],[x2,y2]]=source,[[a0,b0],[a1,b1],[a2,b2]]=points;
 const det=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);if(Math.abs(det)<.00001)return;
 const a=(a0*(y1-y2)+a1*(y2-y0)+a2*(y0-y1))/det;
 const b=(b0*(y1-y2)+b1*(y2-y0)+b2*(y0-y1))/det;
 const c=(a0*(x2-x1)+a1*(x0-x2)+a2*(x1-x0))/det;
 const d=(b0*(x2-x1)+b1*(x0-x2)+b2*(x1-x0))/det;
 const e=(a0*(x1*y2-x2*y1)+a1*(x2*y0-x0*y2)+a2*(x0*y1-x1*y0))/det;
 const f=(b0*(x1*y2-x2*y1)+b1*(x2*y0-x0*y2)+b2*(x0*y1-x1*y0))/det;
 const cx=(a0+a1+a2)/3,cy=(b0+b1+b2)/3;
 ctx.save();polygon(ctx,points.map(([x,y])=>{const n=Math.hypot(x-cx,y-cy)||1;return [x+(x-cx)*.3/n,y+(y-cy)*.3/n];}));
 ctx.clip();ctx.transform(a,b,c,d,e,f);ctx.drawImage(img,0,0);ctx.restore();
}
function textureQuad(ctx,img,uv,points){
 textureTriangle(ctx,img,[uv[0],uv[1],uv[2]],[points[0],points[1],points[2]]);
 textureTriangle(ctx,img,[uv[0],uv[2],uv[3]],[points[0],points[2],points[3]]);
}
function edgePoints(s,start=.065,end=.936,offset=0){
 return Array.from({length:91},(_,i)=>{const u=mix(start,end,i/90),point=pouchPoint(s,u,tearEdge(u));return [point[0],point[1]+offset];});
}
function stroke(ctx,points,colour,width){
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.stroke();
}

export function createPouchRenderer(rig,img){
 const body=document.createElement('canvas'),strip=document.createElement('canvas');
 body.className='pouch-canvas pouch-film';strip.className='pouch-canvas pouch-strip';
 body.setAttribute('aria-hidden','true');strip.setAttribute('aria-hidden','true');
 const bodyContext=body.getContext('2d'),stripContext=strip.getContext('2d');
 if(!bodyContext||!stripContext)return null;
 const scale=Math.min(2,Math.max(1,(rig.closest?.('.study-scene')?.clientWidth||640)/640*(window.devicePixelRatio||1)));
 for(const canvas of [body,strip]){canvas.width=640*scale;canvas.height=520*scale;rig.append(canvas);}
 for(const ctx of [bodyContext,stripContext]){ctx.scale(scale,scale);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';}
 rig.classList.add('pouch-rendered');

 function drawBody(s){
  const ctx=bodyContext;ctx.clearRect(0,0,640,520);
  if(!s.tear){ctx.drawImage(img,s.left,s.top,s.width,s.height);return;}
  // Dark interior and a brushed silver back lip sit behind the front laminate.
  if(s.aperture>0){
   const front=edgePoints(s),left=front[0][0],right=front.at(-1)[0];
   const baseline=s.top+POUCH_SEAM*s.height;
   const back=front.map(([x],i)=>[x,baseline-12*s.aperture*Math.sin(Math.PI*i/90)]);
   ctx.save();polygon(ctx,[...back,...front.slice().reverse()]);
   const mouth=ctx.createLinearGradient(0,baseline-14,0,baseline+16);
   mouth.addColorStop(0,'#e5e3df');mouth.addColorStop(.17,'#555856');mouth.addColorStop(.42,'#111c19');mouth.addColorStop(.8,'#17241f');mouth.addColorStop(1,'#899087');
   ctx.fillStyle=mouth;ctx.fill();
   stroke(ctx,back,'#f3f1e5',1.35);stroke(ctx,back.map(([x,y])=>[x,y+1.5]),'#8d9490',.9);
   ctx.restore();
   // Fine front and back creases converge at the still-sealed side welds.
   ctx.beginPath();ctx.ellipse((left+right)/2,baseline+4,(right-left)*.48,5*s.aperture,0,0,Math.PI*2);
   ctx.fillStyle='#08131088';ctx.fill();
  }
  ctx.save();
  const edge=Array.from({length:121},(_,i)=>pouchPoint(s,i/120,tearEdge(i/120)));
  polygon(ctx,[...edge,pouchPoint(s,1,1.01),pouchPoint(s,0,1.01)]);ctx.clip();
  if(!s.aperture&&!s.breath)ctx.drawImage(img,s.left,s.top,s.width,s.height);
  else{
   const columns=10,rows=14;
   for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const u0=col/columns,u1=(col+1)/columns,v0=mix(POUCH_SEAM-.004,1,row/rows),v1=mix(POUCH_SEAM-.004,1,(row+1)/rows);
    const uv=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
    textureQuad(ctx,img,uv,uv.map(([u,v])=>pouchPoint(s,u,v)));
   }
  }
  ctx.restore();
  if(s.aperture>0){
   stroke(ctx,edgePoints(s,.065,.936,.45),'#fcf9eb',1.3);
   stroke(ctx,edgePoints(s,.067,.934,1.9),'#797f7766',.7);
   // Short irregular fibres catch light along the fresh fracture, not across the print.
   for(let i=0;i<39;i++){
    const u=.07+i*.0224,[x,y]=pouchPoint(s,u,tearEdge(u));
    stroke(ctx,[[x,y],[x+.55*Math.sin(i*7),y-1.2-(i%3)*.35]],'#f4f2e3b0',.45);
   }
  }
  // Untorn film retains exactly the original image until the tear reaches it.
  if(s.front>0){
   ctx.save();const edge=Array.from({length:91},(_,i)=>{const u=s.front*i/90;return [s.left+u*s.width,s.top+tearEdge(u)*s.height+.2];});
   polygon(ctx,[[s.left,s.top],[s.left+s.front*s.width,s.top],...edge.slice().reverse()]);ctx.clip();
   ctx.drawImage(img,s.left,s.top,s.width,s.height);ctx.restore();
  }
 }
 function drawStrip(s){
  const ctx=stripContext;ctx.clearRect(0,0,640,520);if(!s.tear)return;
  const columns=36,rows=2;
  // Each narrow strip follows the bend; the far end flips to the unprinted foil.
  for(let col=0;col<columns;col++){
   const u0=mix(s.front,1,col/columns),u1=mix(s.front,1,(col+1)/columns),mid=(col+.5)/columns;
   const underside=Math.cos(mid*s.tear*2.18)<0;
   for(let row=0;row<rows;row++){
    const v0=row/rows,v1=(row+1)/rows;
    const uv=[[u0,tearEdge(u0)*v0],[u1,tearEdge(u1)*v0],[u1,tearEdge(u1)*v1],[u0,tearEdge(u0)*v1]];
    const points=uv.map(([u,v])=>stripPoint(s,u,v));
    textureQuad(ctx,img,uv,points);
    if(underside){
     // Keep the original alpha silhouette at the rounded edge of the pouch.
     ctx.save();ctx.globalCompositeOperation='source-atop';polygon(ctx,points);
     const light=Math.round(158+66*Math.sin(mid*18+row*.4));
     ctx.fillStyle=`rgb(${light} ${light+3} ${light+1})`;ctx.fill();ctx.restore();
    }else{
     ctx.save();ctx.globalCompositeOperation='source-atop';polygon(ctx,points);
     ctx.fillStyle=`rgba(15,27,23,${.13*s.tear*(.5+.5*Math.sin(mid*25))})`;ctx.fill();ctx.restore();
    }
   }
  }
  const lower=Array.from({length:101},(_,i)=>{const u=mix(Math.max(s.front,.065),.936,i/100);return stripPoint(s,u,tearEdge(u));});
  if(s.front<.936)stroke(ctx,lower,'#e9ead9',.65);
 }
 let previousProgress=-1;
 return {draw(p){if(p===previousProgress)return;previousProgress=p;const state=pouchState(p,img.naturalHeight/img.naturalWidth);drawBody(state);drawStrip(state);},
  dispose(){body.remove();strip.remove();rig.classList.remove('pouch-rendered');}};
}
