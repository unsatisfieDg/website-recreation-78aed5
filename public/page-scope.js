// Everything attached to a page is released before the next page is mounted.
export function createPageScope(){
 const cleanups=[];
 let disposed=false;
 return {
  get disposed(){return disposed;},
  on(target,type,listener,options){
   if(!target)return;
   target.addEventListener(type,listener,options);
   cleanups.push(()=>target.removeEventListener?.(type,listener,options));
  },
  observe(observer,target,options){observer.observe(target,options);cleanups.push(()=>observer.disconnect());return observer;},
  own(observer){cleanups.push(()=>observer.disconnect());return observer;},
  cleanup(fn){cleanups.push(fn);},
  dispose(){if(disposed)return;disposed=true;for(const cleanup of cleanups.reverse())cleanup();cleanups.length=0;}
 };
}
