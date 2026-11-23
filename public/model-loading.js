// Load the requested family first. A direct gummy visit needs one model, not every vape.
export function modelLoadOrder(products,family=null,chosen=null,{selectedOnly=false}={}){
 if(!products.some(product=>product.family===family))family=null;
 const indices=products.map((_,i)=>i).filter(i=>!family||products[i].family===family);
 const selected=indices.find(i=>products[i].id===chosen);
 return selected===undefined?indices:selectedOnly?[selected]:[selected,...indices.filter(i=>i!==selected)];
}
export function createModelLoader(load,{concurrency=2}={}){
 const jobs=new Map(),waiting=[];let active=0,stopped=false;
 function pump(){
  while(!stopped&&active<concurrency&&waiting.length){
   const job=waiting.shift();job.state='running';active++;
   Promise.resolve().then(()=>load(job.index)).then(result=>job.resolve(result),()=>job.resolve(false)).finally(()=>{job.state='done';active--;pump();});
  }
 }
 function ensure(index,{priority=false,retry=false}={}){
  if(stopped)return Promise.resolve(false);
  let job=jobs.get(index);
  if(job&&(!retry||job.state!=='done')){
   if(priority&&job.state==='queued'){waiting.splice(waiting.indexOf(job),1);waiting.unshift(job);}
   return job.promise;
  }
  job={index,state:'queued'};job.promise=new Promise(resolve=>job.resolve=resolve);jobs.set(index,job);
  priority?waiting.unshift(job):waiting.push(job);pump();return job.promise;
 }
 return {ensure,stop(){stopped=true;waiting.splice(0).forEach(job=>job.resolve(false));}};
}
