import {vapeCopy} from './product-content.js?v=c73acc77c6a5';
// Product facts transcribed from the four supplied packaging references.
export const editions=[
 {id:'grape-rush',slug:'grape',colour:'#9950b9',deep:'#321a43',paper:'#f0e9f4',ink:'#291b32',finish:'Violet body / black mouthpiece',pack:'Purple marbled foil',next:'mango'},
 {id:'mango-mirage',slug:'mango',colour:'#f5cf28',deep:'#5c4307',paper:'#f5efd9',ink:'#33290c',finish:'Golden yellow / black mouthpiece',pack:'Gold marbled foil',next:'cherry'},
 {id:'cherry-drift',slug:'cherry',colour:'#e95346',deep:'#651c21',paper:'#f6e7e3',ink:'#3b1b1d',finish:'Coral red / black mouthpiece',pack:'Red marbled foil',next:'blueberry'},
 {id:'blueberry-cobbler',slug:'blueberry',colour:'#78a8ee',deep:'#172f5c',paper:'#e6edf6',ink:'#1a2b42',finish:'Light blue / black mouthpiece',pack:'Blue marbled foil',next:'grape'}
].map(edition=>{
 const copy=vapeCopy[edition.id];
 return {...edition,colour:copy.shade,finish:copy.finish,pack:copy.finish+' foil pouch',name:copy.strain,phrase:copy.cinema.line,lead:copy.cinema.line,description:copy.description,design:copy.parts.DeviceHousing};
});
export const findEdition=value=>editions.find(e=>e.id===value||e.slug===value);
export const editionURL=e=>`${typeof e==='string'?e:e.slug}.html`;
