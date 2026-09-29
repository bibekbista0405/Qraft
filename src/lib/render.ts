/** Canvas / SVG rendering and verification of Qraft QR codes. */
import QRCode from "qrcode";
import jsQR from "jsqr";
import { isEmbeddedImagePayload, contrastRatio, relLum } from "./payload";

export type Pattern = "square"|"rounded"|"dots"|"diamond"|"bars";
export type Finder = "square"|"rounded"|"circle";
export type EC = "L"|"M"|"Q"|"H";
export type FrameStyle = "none"|"soft"|"badge"|"scan"|"ticket";
export type BodyShape = Pattern;
export type DesignState = {title:string;subtitle:string;fg:string;bg:string;pattern:Pattern;bodyShape:BodyShape;finder:Finder;ec:EC;size:number;margin:number;transparent:boolean;logo:string|null;logoName:string;logoSize:number;frame:boolean;frameStyle:FrameStyle;cta:string;radius:number;gradient:boolean;accent:string;advanced?:boolean;logoPreset?:boolean};

/** The QR spec requires a 4-module quiet zone. */
export const MIN_MARGIN = 4;

export function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error("Logo could not be loaded"));i.src=src;});}

/** Downscale any uploaded logo to a 256px transparent PNG so projects stay small enough for localStorage. */
export async function prepareLogo(file:Blob):Promise<string>{
  const url=URL.createObjectURL(file);
  try{
    const img=await loadImage(url);
    const S=256,w=img.naturalWidth||S,h=img.naturalHeight||S,s=Math.min(S/w,S/h);
    const c=document.createElement("canvas");c.width=S;c.height=S;
    const ctx=c.getContext("2d");if(!ctx)throw new Error("Canvas is not available");
    ctx.imageSmoothingQuality="high";
    ctx.drawImage(img,(S-w*s)/2,(S-h*s)/2,w*s,h*s);
    return c.toDataURL("image/png");
  }finally{URL.revokeObjectURL(url)}
}

function setup(payload:string,d:DesignState){
  const embedded=isEmbeddedImagePayload(payload);
  const ec:EC=embedded?"L":(d.logo?"H":d.ec);
  const shape:BodyShape=embedded?"square":(d.bodyShape||d.pattern);
  const finder:Finder=embedded?"square":d.finder;
  const logo=embedded?null:d.logo;
  const qr=QRCode.create(payload||" ",{errorCorrectionLevel:ec});
  const modules=qr.modules.size;
  const data=qr.modules.data as unknown as ArrayLike<number>;
  const margin=Math.max(MIN_MARGIN,d.margin);
  const align=alignmentCenters(qr.version,modules);
  const solid=(r:number,c:number)=>align.some(([ar,ac])=>Math.abs(r-ar)<=2&&Math.abs(c-ac)<=2);
  return {embedded,shape,finder,logo,modules,data,margin,solid};
}
/** Centres of the alignment patterns (QR spec table algorithm), excluding those that overlap finders. */
function alignmentCenters(version:number,modules:number):[number,number][]{
  if(version<2)return [];
  const n=Math.floor(version/7)+2;
  const step=version===32?26:Math.ceil((modules-13)/(2*n-2))*2;
  const pos=[6];for(let p=modules-7;pos.length<n;p-=step)pos.splice(1,0,p);
  const out:[number,number][]=[];
  for(const r of pos)for(const c of pos){
    if((r===6&&c===6)||(r===6&&c===modules-7)||(r===modules-7&&c===6))continue;
    out.push([r,c]);
  }
  return out;
}
const inFinder=(r:number,c:number,modules:number)=>((r<7&&c<7)||(r<7&&c>=modules-7)||(r>=modules-7&&c<7));
function logoGeometry(size:number,d:DesignState){
  const logoSize=Math.min(size*.16,Math.max(size*.07,size*d.logoSize/100));
  const pad=Math.max(size*.018,logoSize*.16);
  return {logoSize,pad,x:(size-logoSize)/2,y:(size-logoSize)/2};
}
const rrPath=(x:number,y:number,w:number,h:number,r:number)=>{
  r=Math.max(0,Math.min(r,w/2,h/2));const f=(n:number)=>+n.toFixed(3);
  return `M${f(x+r)} ${f(y)}h${f(w-2*r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(r)}v${f(h-2*r)}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(r)}h${f(-(w-2*r))}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(-r)}v${f(-(h-2*r))}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(-r)}z`;
};

/**
 * Renders the real module matrix from `qrcode`. Finder patterns are drawn as a ring
 * (even-odd fill) so a transparent background stays transparent instead of turning
 * each finder into a solid block.
 */
export async function renderQR(payload:string,d:DesignState,size=d.size):Promise<HTMLCanvasElement>{
  const {shape,finder,logo,modules,data,margin,solid}=setup(payload,d);
  const canvas=document.createElement("canvas");
  canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext("2d");
  if(!ctx) throw new Error("Canvas is not available");
  ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,size,size);
  if(!d.transparent){ctx.fillStyle=d.bg;ctx.fillRect(0,0,size,size);}
  const cell=size/(modules+margin*2);
  const off=margin*cell;
  ctx.fillStyle=d.fg;
  const overlap=Math.min(.3,cell*.06);
  const drawModule=(cx:number,cy:number,shape:BodyShape)=>{
    if(shape==="square"){ctx.fillRect(cx-overlap,cy-overlap,cell+overlap*2,cell+overlap*2);return;}
    ctx.beginPath();
    if(shape==="dots"){ctx.arc(cx+cell/2,cy+cell/2,cell*.41,0,Math.PI*2);ctx.fill();return;}
    if(shape==="diamond"){ctx.moveTo(cx+cell/2,cy+cell*.07);ctx.lineTo(cx+cell*.93,cy+cell/2);ctx.lineTo(cx+cell/2,cy+cell*.93);ctx.lineTo(cx+cell*.07,cy+cell/2);ctx.closePath();ctx.fill();return;}
    if(shape==="bars"){ctx.roundRect(cx+cell*.12,cy+cell*.05,cell*.76,cell*.9,cell*.18);ctx.fill();return;}
    const w=cell*.9,o=(cell-w)/2;ctx.roundRect(cx+o,cy+o,w,w,Math.min(w*.33,cell*.24));ctx.fill();
  };
  for(let r=0;r<modules;r++)for(let c=0;c<modules;c++){
    if(data[r*modules+c]!==1||inFinder(r,c,modules))continue;
    // Alignment patterns stay solid: decoders locate them by run-length, so dotted ones break scanning.
    drawModule(off+c*cell,off+r*cell,solid(r,c)?(shape==="rounded"?"rounded":"square"):shape);
  }
  const rr=finder==="rounded"?cell*.65:0;
  for(const [fr,fc] of [[0,0],[0,modules-7],[modules-7,0]]){
    const x=off+fc*cell,y=off+fr*cell;
    ctx.fillStyle=d.fg;
    ctx.beginPath();
    ctx.roundRect(x,y,cell*7,cell*7,rr);
    ctx.roundRect(x+cell,y+cell,cell*5,cell*5,rr*.68);
    ctx.fill("evenodd");
    ctx.beginPath();ctx.roundRect(x+cell*2,y+cell*2,cell*3,cell*3,rr*.35);ctx.fill();
  }
  if(logo){
    try{
      const img=await loadImage(logo);
      const {logoSize,pad,x,y}=logoGeometry(size,d);
      ctx.save();ctx.fillStyle=d.bg||"#ffffff";ctx.beginPath();ctx.roundRect(x-pad,y-pad,logoSize+pad*2,logoSize+pad*2,Math.min(24,pad));ctx.fill();ctx.drawImage(img,x,y,logoSize,logoSize);ctx.restore();
    }catch{/* a logo that fails to load must not block the QR itself */}
  }
  return canvas;
}

/** Real vector output: one path for square modules, ring paths for finders, logo matched to the PNG geometry. */
export async function qrSvg(payload:string,d:DesignState):Promise<string>{
  const {shape:bodyShape,finder,logo,modules,data,margin,solid}=setup(payload,d);
  const size=1000,cell=size/(modules+margin*2),off=margin*cell;
  const f=(n:number)=>+n.toFixed(3);
  let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  if(!d.transparent)out+=`<rect width="${size}" height="${size}" fill="${d.bg}"/>`;
  let squares="",shapes="";
  for(let r=0;r<modules;r++)for(let c=0;c<modules;c++){
    if(data[r*modules+c]!==1||inFinder(r,c,modules))continue;
    const x=off+c*cell,y=off+r*cell;
    const shape:BodyShape=solid(r,c)?(bodyShape==="rounded"?"rounded":"square"):bodyShape;
    if(shape==="square")squares+=`M${f(x)} ${f(y)}h${f(cell)}v${f(cell)}h${f(-cell)}z`;
    else if(shape==="dots")shapes+=`<circle cx="${f(x+cell/2)}" cy="${f(y+cell/2)}" r="${f(cell*.41)}"/>`;
    else if(shape==="diamond")shapes+=`<polygon points="${f(x+cell/2)},${f(y+cell*.07)} ${f(x+cell*.93)},${f(y+cell/2)} ${f(x+cell/2)},${f(y+cell*.93)} ${f(x+cell*.07)},${f(y+cell/2)}"/>`;
    else if(shape==="bars")shapes+=`<rect x="${f(x+cell*.12)}" y="${f(y+cell*.05)}" width="${f(cell*.76)}" height="${f(cell*.9)}" rx="${f(cell*.18)}"/>`;
    else shapes+=`<rect x="${f(x+cell*.05)}" y="${f(y+cell*.05)}" width="${f(cell*.9)}" height="${f(cell*.9)}" rx="${f(cell*.22)}"/>`;
  }
  out+=`<g fill="${d.fg}">${squares?`<path d="${squares}"/>`:""}${shapes}`;
  const rr=finder==="rounded"?cell*.65:0;
  for(const [fr,fc] of [[0,0],[0,modules-7],[modules-7,0]]){
    const x=off+fc*cell,y=off+fr*cell;
    out+=`<path fill-rule="evenodd" d="${rrPath(x,y,cell*7,cell*7,rr)}${rrPath(x+cell,y+cell,cell*5,cell*5,rr*.68)}"/><path d="${rrPath(x+cell*2,y+cell*2,cell*3,cell*3,rr*.35)}"/>`;
  }
  out+="</g>";
  if(logo){
    try{
      const img=await loadImage(logo);
      const c=document.createElement("canvas");c.width=256;c.height=256;c.getContext("2d")!.drawImage(img,0,0,256,256);
      const {logoSize,pad,x,y}=logoGeometry(size,d);
      out+=`<rect x="${f(x-pad)}" y="${f(y-pad)}" width="${f(logoSize+pad*2)}" height="${f(logoSize+pad*2)}" rx="${f(Math.min(24,pad))}" fill="${d.bg||"#ffffff"}"/><image href="${c.toDataURL("image/png")}" x="${f(x)}" y="${f(y)}" width="${f(logoSize)}" height="${f(logoSize)}" preserveAspectRatio="xMidYMid meet"/>`;
    }catch{/* ignore logo failures */}
  }
  return out+"</svg>";
}

export type FrameGeo={x:number;y:number;w:number;h:number;r:number;style:FrameStyle};
export function frameGeometry(fs:FrameStyle):FrameGeo{
  if(fs==="soft")return{x:390,y:1187,w:620,h:108,r:48,style:fs};
  if(fs==="scan")return{x:390,y:1188,w:620,h:104,r:28,style:fs};
  if(fs==="ticket")return{x:420,y:1190,w:560,h:100,r:20,style:fs};
  return{x:520,y:1205,w:360,h:78,r:39,style:"badge"};
}
export const titleFontSize=(title:string)=>Math.max(42,Math.min(68,68-(title.length>26?(title.length-26)*1.2:0)));
export const ctaFontSize=(h:number)=>Math.min(24,Math.max(18,Math.floor(h*.24)));

/**
 * Decodes the exact pixels that will be exported. Throws when the QR cannot be read;
 * returns a warning string (or null) for things that scan here but may not everywhere.
 */
export async function verifyQR(payload:string,d:DesignState):Promise<string|null>{
  const warnings:string[]=[];
  const inverted=!d.transparent&&relLum(d.fg)>relLum(d.bg);
  if(d.transparent){
    if(contrastRatio(d.fg,"#ffffff")<3)throw new Error("Ink is too light for a transparent QR — it would vanish on most backgrounds. Choose a darker ink color.");
    warnings.push("Transparent background: place this QR on a plain, light surface.");
  }else{
    const ratio=contrastRatio(d.fg,d.bg);
    if(ratio<3)throw new Error(`Ink and background contrast is too low (${ratio.toFixed(1)}:1). Use at least 3:1 — 4.5:1 or more is safer.`);
    if(inverted)warnings.push("Light ink on a dark background is unreadable in some scanner apps; dark ink on light is safest.");
  }
  const vd:DesignState={...d,transparent:false};
  const decode=async(px:number)=>{
    let c:HTMLCanvasElement;
    try{c=await renderQR(payload,vd,px)}catch(e){
      if(e instanceof Error&&/too big|too long/i.test(e.message))throw new Error("This content is too long for a QR code. Shorten it, or lower the error-correction level.");
      throw e;
    }
    const ctx=c.getContext("2d",{willReadFrequently:true});if(!ctx)throw new Error("Canvas unavailable");
    const img=ctx.getImageData(0,0,c.width,c.height);
    return jsQR(img.data,img.width,img.height,{inversionAttempts:inverted?"attemptBoth":"dontInvert"})?.data===payload;
  };
  if(!(await decode(d.size)))throw new Error("The generated QR could not be verified. Try a larger quiet zone, a smaller logo, or higher contrast.");
  if(!isEmbeddedImagePayload(payload)&&!(await decode(300)))warnings.push("This QR is dense and may be hard to scan when small — shorten the content or print it larger.");
  return warnings.length?warnings.join(" "):null;
}
