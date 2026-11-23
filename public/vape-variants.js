import {approvedFlavours} from './product-content.js?v=c73acc77c6a5';

export const VAPE_MODEL_REVISION='foil-tear-20261113';
export const vapeVariants=approvedFlavours.map(({vapeId:id,name,shade:color,extract,line:note})=>({id,name,color,extract,note}));
const defaultVariant=vapeVariants.find(v=>v.id==='berry-blast');
export const findVariant=id=>vapeVariants.find(v=>v.id===id)||defaultVariant;
