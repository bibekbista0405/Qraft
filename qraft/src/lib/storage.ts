/** Local-first project storage in IndexedDB with localStorage fallback/migration. */
const DB="qraft";
const STORE="kv";
const KEY="projects";
const LEGACY="qraft-projects";
let dbPromise:Promise<IDBDatabase>|null=null;

function open(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise<IDBDatabase>((resolve,reject)=>{
    if(!("indexedDB" in window)){reject(new Error("IndexedDB unavailable"));return}
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error||new Error("IndexedDB could not open"));
  }).catch(err=>{dbPromise=null;throw err});
  return dbPromise;
}

const tx=<T,>(mode:IDBTransactionMode,fn:(s:IDBObjectStore)=>IDBRequest<T>)=>open().then(db=>new Promise<T>((resolve,reject)=>{
  const t=db.transaction(STORE,mode);
  const r=fn(t.objectStore(STORE));
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error||new Error("Storage request failed"));
  t.onerror=()=>reject(t.error||new Error("Storage transaction failed"));
}));

export async function loadProjects<T>():Promise<T[]>{
  try{
    const v=await tx<unknown>("readonly",s=>s.get(KEY));
    if(Array.isArray(v)&&v.length>0)return v as T[];
    // A working IndexedDB with an empty store can still be an upgrade from the
    // old localStorage implementation. Import the legacy copy before returning.
    const legacyRaw=localStorage.getItem(LEGACY);
    if(legacyRaw){
      const legacy=JSON.parse(legacyRaw);
      if(Array.isArray(legacy)&&legacy.length){
        await tx("readwrite",s=>s.put(legacy,KEY));
        localStorage.removeItem(LEGACY);
        return legacy as T[];
      }
    }
    return [];
  }catch{
    try{
      const v=JSON.parse(localStorage.getItem(LEGACY)||"[]");
      return Array.isArray(v)?v as T[]:[];
    }catch{return[]}
  }
}

export async function saveProjects<T>(list:T[]){
  try{await tx("readwrite",s=>s.put(list,KEY));try{localStorage.removeItem(LEGACY)}catch{/* ignore */}}
  catch{
    try{localStorage.setItem(LEGACY,JSON.stringify(list))}
    catch{throw new Error("Browser storage is full or blocked") }
  }
}

export async function clearProjects(){
  let idbError:unknown=null;
  try{await tx("readwrite",s=>s.delete(KEY))}catch(e){idbError=e}
  if(idbError){
    try{
      localStorage.removeItem(LEGACY);
    }catch{/* ignore */}
    throw new Error("Could not clear the IndexedDB project library. Your projects were not confirmed as deleted.");
  }
  try{localStorage.removeItem(LEGACY)}catch{/* ignore */}
}
