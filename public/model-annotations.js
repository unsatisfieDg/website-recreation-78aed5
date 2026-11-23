const bound=(n,a,b)=>Math.max(a,Math.min(Math.max(a,b),n));
// Keep the reading surface inside the stage, beside the real projected component.
export function descriptionPlacement({anchor,object,width,height,cardWidth,cardHeight}){
 const w=Math.min(cardWidth,width-24),h=Math.min(cardHeight,height-32),phone=width<600;
 let x,y;
 if(phone){x=bound(anchor.x-w/2,12,width-w-12);y=bound(object.bottom+22,16,height-h-22);}
 else{x=object.right+w+40<width?object.right+24:object.left-w-24;x=bound(x,16,width-w-16);y=bound(anchor.y-h*.42,20,height-h-28);}
 const end=phone?{x:bound(anchor.x,x+20,x+w-20),y}:{x:x>anchor.x?x:x+w,y:bound(anchor.y,y+24,y+h-24)};
 const path=phone?`M${anchor.x},${anchor.y} L${anchor.x},${end.y-12} L${end.x},${end.y}`:`M${anchor.x},${anchor.y} L${end.x+(end.x>anchor.x?-16:16)},${end.y} L${end.x},${end.y}`;
 return {x,y,width:w,height:h,path};
}
