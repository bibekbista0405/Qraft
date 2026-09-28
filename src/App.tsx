import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import {
  ArrowLeft, ArrowRight, Camera, Check, ChevronDown, Clipboard, Download, FileArchive, FileImage,
  FileText, Globe, ImagePlus, Layers, Link2, Mail, MapPin, MessageCircle, Palette, Phone, Play, QrCode,
  RotateCcw, Save, ScanLine, Search, Send, Settings2, Sparkles, Star, Ticket, Trash2, Undo2, Upload,
  UserRound, Video, Wifi, X, Instagram, Facebook, Youtube, Smartphone, ShieldCheck, Wand2, Zap, ExternalLink, Menu,
  SlidersHorizontal, Heart, CircleHelp, FolderOpen, LayoutTemplate, Paintbrush, MousePointer2
} from "lucide-react";

type TypeId = "url"|"text"|"email"|"phone"|"sms"|"wifi"|"vcard"|"location"|"whatsapp"|"instagram"|"facebook"|"youtube"|"tiktok"|"telegram"|"app"|"pdf"|"image"|"video"|"menu"|"event"|"review"|"paypal"|"bitcoin"|"twofa";
type Pattern = "square"|"rounded"|"dots"|"diamond"|"bars";
type Finder = "square"|"rounded"|"circle";
type EC = "L"|"M"|"Q"|"H";
type Step = 1|2|3|4;

type FormState = {
  url:string;text:string;email:string;subject:string;body:string;phone:string;smsBody:string;ssid:string;password:string;security:string;
  firstName:string;lastName:string;organization:string;contactPhone:string;contactEmail:string;lat:string;lng:string;address:string;imageUrl:string;imageData:string;imageName:string;imageAlt:string;
  socialUrl:string;username:string;appUrl:string;fileUrl:string;eventName:string;eventStart:string;eventEnd:string;eventLocation:string;eventDescription:string;
  reviewUrl:string;paypal:string;bitcoin:string;twofaSecret:string;twofaIssuer:string;twofaAccount:string;
};
type DesignState = {title:string;subtitle:string;fg:string;bg:string;pattern:Pattern;finder:Finder;ec:EC;size:number;margin:number;transparent:boolean;logo:string|null;logoName:string;logoSize:number;frame:boolean;cta:string;radius:number;gradient:boolean;accent:string;advanced?:boolean};
type Project = {id:string;name:string;type:TypeId;form:FormState;design:DesignState;updated:number;thumbnail:string};
type Template = {id:string;name:string;category:string;note:string;fg:string;bg:string;accent:string;pattern:Pattern;finder:Finder;gradient:boolean;title:string;subtitle:string;cta:string};
type TypeMeta = {id:TypeId;label:string;note:string;icon:any;group:string};

const initialForm:FormState={url:"https://example.com",text:"",email:"",subject:"",body:"",phone:"+977 ",smsBody:"",ssid:"",password:"",security:"WPA",firstName:"",lastName:"",organization:"",contactPhone:"",contactEmail:"",lat:"28.3949",lng:"84.1240",address:"Nepal",socialUrl:"",username:"",appUrl:"",fileUrl:"",eventName:"",eventStart:"",eventEnd:"",eventLocation:"",eventDescription:"",imageUrl:"https://",imageData:"",imageName:"",imageAlt:"",reviewUrl:"",paypal:"",bitcoin:"",twofaSecret:"",twofaIssuer:"",twofaAccount:""};
const initialDesign:DesignState={title:"Scan me",subtitle:"Open the link",fg:"#17213b",bg:"#ffffff",pattern:"square",finder:"square",ec:"H",size:1200,margin:4,transparent:false,logo:null,logoName:"",logoSize:12,frame:true,cta:"SCAN ME",radius:28,gradient:false,accent:"#6d5dfc",advanced:false};

const types:TypeMeta[]=[
 {id:"url",label:"Website",note:"Open any link",icon:Link2,group:"Popular"},{id:"text",label:"Text",note:"Share a message",icon:MessageCircle,group:"Popular"},{id:"wifi",label:"Wi-Fi",note:"Share network access",icon:Wifi,group:"Popular"},{id:"vcard",label:"Contact",note:"Digital business card",icon:UserRound,group:"Popular"},
 {id:"whatsapp",label:"WhatsApp",note:"Start a chat",icon:MessageCircle,group:"Social"},{id:"instagram",label:"Instagram",note:"Open a profile",icon:Instagram,group:"Social"},{id:"facebook",label:"Facebook",note:"Open a page",icon:Facebook,group:"Social"},{id:"youtube",label:"YouTube",note:"Open a video or channel",icon:Youtube,group:"Social"},{id:"tiktok",label:"TikTok",note:"Open a profile",icon:Play,group:"Social"},{id:"telegram",label:"Telegram",note:"Open a profile or chat",icon:Send,group:"Social"},
 {id:"email",label:"Email",note:"Compose an email",icon:Mail,group:"Contact"},{id:"phone",label:"Phone",note:"Call a number",icon:Phone,group:"Contact"},{id:"sms",label:"SMS",note:"Send a message",icon:MessageCircle,group:"Contact"},{id:"location",label:"Location",note:"Open a place",icon:MapPin,group:"Contact"},
 {id:"app",label:"App",note:"Open an app store link",icon:Smartphone,group:"Business"},{id:"pdf",label:"PDF",note:"Open a document",icon:FileText,group:"Business"},{id:"image",label:"Image",note:"Open an image",icon:ImagePlus,group:"Business"},{id:"video",label:"Video",note:"Open a video",icon:Video,group:"Business"},{id:"menu",label:"Menu",note:"Open a digital menu",icon:Menu,group:"Business"},{id:"event",label:"Event",note:"Share event details",icon:Ticket,group:"Business"},{id:"review",label:"Review",note:"Send customers to reviews",icon:Star,group:"Business"},
 {id:"paypal",label:"PayPal",note:"Open a payment link",icon:Zap,group:"Payments"},{id:"bitcoin",label:"Bitcoin",note:"Bitcoin payment URI",icon:Zap,group:"Payments"},{id:"twofa",label:"2FA",note:"Authenticator setup",icon:Settings2,group:"Advanced"}
];

const templateData=[
 ["clean","Clean","Universal","Simple for anything","#17213b","#ffffff","#6d5dfc","square","square",false,"Scan me","Open the link","SCAN ME"],
 ["minimal","Minimal","Universal","Quiet and elegant","#111827","#ffffff","#111827","rounded","square",false,"Hello","Scan to open","OPEN"],
 ["soft","Soft","Friendly","Warm pastel style","#8c3156","#fff5f8","#ff6f9e","dots","circle",true,"Hello!","Scan to connect","OPEN"],
 ["business","Business","Business","Professional brand card","#174ea6","#f3f7ff","#4c8bf5","rounded","rounded",false,"Visit us","Scan for details","VISIT NOW"],
 ["corporate","Corporate","Business","Clean company style","#12304a","#eef6fb","#1c9bd1","square","square",false,"Our company","Learn more","VISIT"],
 ["agency","Creative Agency","Business","Bold studio look","#43206b","#faf4ff","#a855f7","diamond","circle",true,"Let's create","Explore our work","EXPLORE"],
 ["menu","Menu","Food","Restaurant ready","#7b3f18","#fff8ed","#d68a3a","bars","rounded",true,"Today's Menu","Scan • Choose • Enjoy","VIEW MENU"],
 ["cafe","Cafe","Food","Warm coffee shop","#5b3a29","#fffaf4","#b8794b","dots","circle",false,"Our Cafe","Menu & hours","VIEW MENU"],
 ["bakery","Bakery","Food","Sweet bakery card","#8a3c5c","#fff4f7","#e879a8","rounded","circle",true,"Fresh today","See our menu","ORDER"],
 ["restaurant","Restaurant","Food","Dinner and booking","#3f2a1d","#f9f4ee","#c58b45","square","rounded",false,"Welcome","Menu & reservations","BOOK"],
 ["social","Social","Social","Creator friendly","#7b1d5c","#fff3fb","#e747a4","dots","circle",true,"Find me online","Scan to connect","FOLLOW"],
 ["creator","Creator","Social","Personal brand","#4c1d95","#f5f3ff","#8b5cf6","rounded","circle",true,"Follow along","All my links","FOLLOW"],
 ["instagram","Instagram","Social","Profile sharing","#7c2d5b","#fff1f7","#d946ef","dots","circle",true,"@yourname","Follow my profile","FOLLOW"],
 ["video","Video","Social","Video creator","#7f1d1d","#fff5f5","#ef4444","rounded","rounded",false,"Watch now","Latest video","WATCH"],
 ["event","Event","Events","Invites and tickets","#5b21b6","#f7f2ff","#9b6cff","diamond","circle",true,"You're invited","Everything you need","OPEN EVENT"],
 ["wedding","Wedding","Events","Elegant invitation","#7f4050","#fff8fa","#d99aaa","dots","circle",false,"Our day","Details & location","VIEW"],
 ["party","Party","Events","Fun invitation","#173b68","#eef7ff","#38bdf8","dots","circle",true,"Let's party","Date • place • details","JOIN"],
 ["contact","Contact","Business","Digital business card","#0f766e","#effcf9","#2cb9a4","rounded","square",false,"Let's connect","Save my contact","SAVE CONTACT"],
 ["freelancer","Freelancer","Business","Personal services","#1e3a8a","#eff6ff","#3b82f6","rounded","rounded",false,"Work with me","Portfolio & contact","VIEW"],
 ["portfolio","Portfolio","Business","Show your work","#334155","#f8fafc","#64748b","square","square",false,"My portfolio","Projects & contact","EXPLORE"],
 ["job","Resume","Business","CV and profile","#3f3f46","#fafafa","#71717a","rounded","square",false,"My resume","Experience & contact","VIEW CV"],
 ["wifi","Wi-Fi","Utility","Share access easily","#075985","#effaff","#06b6d4","rounded","circle",false,"Wi-Fi","Connect instantly","CONNECT"],
 ["review","Review","Business","Customer feedback","#854d0e","#fffbeb","#eab308","dots","circle",false,"Enjoyed it?","Leave a quick review","REVIEW"],
 ["google","Review","Business","Review shortcut","#155e75","#ecfeff","#06b6d4","square","square",false,"Tell us","Your feedback matters","REVIEW"],
 ["payment","Payment","Payments","Simple payment card","#166534","#f0fdf4","#22c55e","rounded","rounded",false,"Pay securely","Scan to continue","PAY NOW"],
 ["donation","Donation","Payments","Support a cause","#7c2d12","#fff7ed","#f97316","dots","circle",true,"Support us","Every contribution helps","DONATE"],
 ["product","Product","Business","Product details","#334155","#f8fafc","#0ea5e9","rounded","square",false,"Learn more","Scan for product info","OPEN"],
 ["menu-dark","Dark Menu","Food","Premium dark menu","#ffffff","#17151b","#c084fc","rounded","rounded",true,"Tonight's menu","Scan to browse","VIEW MENU"],
 ["midnight","Midnight","Modern","Bold dark style","#ffffff","#101521","#8b7cff","rounded","rounded",true,"Scan to open","Fast & direct","SCAN NOW"],
 ["neon","Neon","Modern","High-energy modern","#f8fafc","#111827","#22d3ee","dots","circle",true,"Tap in","Discover more","OPEN"],
 ["soft-blue","Soft Blue","Modern","Calm and clean","#1e40af","#eff6ff","#60a5fa","rounded","rounded",true,"Welcome","Scan to continue","OPEN"],
 ["green","Fresh Green","Modern","Fresh natural style","#166534","#f0fdf4","#34d399","dots","circle",false,"Go green","Scan to learn more","OPEN"],
 ["education","Education","Business","School/course card","#1e3a8a","#eef2ff","#6366f1","square","rounded",false,"Learn with us","Courses & resources","LEARN"],
 ["real-estate","Property","Business","Property listing","#164e63","#ecfeff","#0891b2","rounded","rounded",false,"View property","Photos & details","VIEW"],
 ["medical","Healthcare","Business","Clinic information","#155e75","#f0f9ff","#0ea5e9","square","square",false,"Welcome","Appointments & info","OPEN"],
 ["app","App","Modern","App download card","#312e81","#eef2ff","#6366f1","rounded","circle",true,"Get the app","Available on your store","DOWNLOAD"],
 ["twofa","Security","Advanced","Authenticator setup","#1f2937","#f9fafb","#64748b","square","square",false,"Secure access","Scan to set up","SET UP"]
].map(x=>({id:x[0],name:x[1],category:x[2],note:x[3],fg:x[4],bg:x[5],accent:x[6],pattern:x[7] as Pattern,finder:x[8] as Finder,gradient:x[9] as boolean,title:x[10],subtitle:x[11],cta:x[12]})) as Template[];
const templates:Template[]=templateData;

const quickStyles=[
 {id:"classic",label:"Classic",fg:"#17213b",bg:"#fff",accent:"#6d5dfc",pattern:"square" as Pattern,finder:"square" as Finder,gradient:false},
 {id:"soft",label:"Soft",fg:"#8c3156",bg:"#fff5f8",accent:"#ff6f9e",pattern:"dots" as Pattern,finder:"circle" as Finder,gradient:true},
 {id:"bold",label:"Bold",fg:"#fff",bg:"#101521",accent:"#8b7cff",pattern:"rounded" as Pattern,finder:"rounded" as Finder,gradient:true},
 {id:"fresh",label:"Fresh",fg:"#0f766e",bg:"#effcf9",accent:"#2cb9a4",pattern:"rounded" as Pattern,finder:"square" as Finder,gradient:false}
];
const colors=["#17213b","#6d5dfc","#e747a4","#0f766e","#2563eb","#c75b1d","#7b3f18","#15803d","#111827"];

function esc(v:string){return v.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");}
function payloadFor(t:TypeId,f:FormState){
 const u=(v:string)=>v.trim();
 switch(t){
  case "url":return u(f.url);case "pdf":case "video":case "menu":return u(f.fileUrl);case "image":return f.imageData ? `QRAFTIMG1|${f.imageData}` : "";case "review":return u(f.reviewUrl);case "paypal":return u(f.paypal);case "app":return u(f.appUrl);case "text":return f.text;
  case "email":return `mailto:${u(f.email)}?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(f.body)}`;case "phone":return `tel:${f.phone.replace(/\s+/g,"")}`;case "sms":return `SMSTO:${f.phone.replace(/\s+/g,"")}:${f.smsBody}`;
  case "wifi":return `WIFI:T:${f.security};S:${esc(f.ssid)};P:${esc(f.password)};;`;case "vcard":return `BEGIN:VCARD\nVERSION:3.0\nN:${esc(f.lastName)};${esc(f.firstName)};;;\nFN:${esc(`${f.firstName} ${f.lastName}`.trim())}\nORG:${esc(f.organization)}\nTEL:${esc(f.contactPhone)}\nEMAIL:${esc(f.contactEmail)}\nEND:VCARD`;
  case "location":return `geo:${f.lat},${f.lng}?q=${encodeURIComponent(f.address)}`;case "whatsapp":return `https://wa.me/${f.phone.replace(/\D/g,"")||f.username.replace(/\D/g,"")}`;
  case "instagram":return f.socialUrl||`https://instagram.com/${f.username.replace(/^@/,"")}`;case "facebook":return f.socialUrl||`https://facebook.com/${f.username}`;case "youtube":return f.socialUrl||`https://youtube.com/${f.username}`;case "tiktok":return f.socialUrl||`https://tiktok.com/@${f.username.replace(/^@/,"")}`;case "telegram":return f.socialUrl||`https://t.me/${f.username.replace(/^@/,"")}`;
  case "event":return `BEGIN:VEVENT\nSUMMARY:${esc(f.eventName)}\nDTSTART:${f.eventStart.replace(/[-:]/g,"")}\nDTEND:${f.eventEnd.replace(/[-:]/g,"")}\nLOCATION:${esc(f.eventLocation)}\nDESCRIPTION:${esc(f.eventDescription)}\nEND:VEVENT`;
  case "bitcoin":return `bitcoin:${u(f.bitcoin)}`;case "twofa":return `otpauth://totp/${encodeURIComponent(f.twofaIssuer)}:${encodeURIComponent(f.twofaAccount)}?secret=${encodeURIComponent(f.twofaSecret)}&issuer=${encodeURIComponent(f.twofaIssuer)}`;
 }
}
async function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error("Logo could not be loaded"));i.src=src;});}

/**
 * Qraft uses the qrcode library's real module matrix for every QR render.
 * We intentionally do not repaint data modules with decorative shapes: that can
 * change module geometry and make a QR unreadable. Templates style the card/frame
 * around the QR while the QR itself remains standards-compliant.
 */
async function renderQR(payload:string,d:DesignState,size=d.size){
 const embedded=payload.startsWith("QRAFTIMG1|");const safe={...d,size,margin:Math.max(4,d.margin),ec:embedded?"L" as EC:(d.logo?"H" as EC:d.ec),logo:embedded?null:d.logo};
 const canvas=document.createElement("canvas");
 await new Promise<void>((resolve,reject)=>{
   QRCode.toCanvas(canvas,payload||" ",{
     width:size,
     margin:safe.margin,
     errorCorrectionLevel:safe.ec,
     color:{dark:safe.fg,light:safe.transparent?"rgba(0,0,0,0)":safe.bg},
   },(err:Error|null)=>err?reject(err):resolve());
 });
 const ctx=canvas.getContext("2d");
 if(!ctx) throw new Error("Canvas is not available");
 ctx.imageSmoothingEnabled=false;
 if(safe.logo){
   try{
     const img=await loadImage(safe.logo);
     const max=size*.16;
     const logoSize=Math.min(max,Math.max(size*.07,size*safe.logoSize/100));
     const x=(size-logoSize)/2,y=(size-logoSize)/2;
     const pad=Math.max(size*.018,logoSize*.16);
     ctx.save();
     ctx.fillStyle=safe.bg || "#ffffff";
     ctx.beginPath();
     ctx.roundRect(x-pad,y-pad,logoSize+pad*2,logoSize+pad*2,Math.min(24,pad));
     ctx.fill();
     ctx.drawImage(img,x,y,logoSize,logoSize);
     ctx.restore();
   }catch{ /* QR remains valid even if optional logo loading fails. */ }
 }
 return canvas;
}
async function qrSvg(payload:string,d:DesignState){
 const qr=await QRCode.toString(payload||" ",{type:"svg",margin:Math.max(4,d.margin),errorCorrectionLevel:d.logo?"H":d.ec,color:{dark:d.fg,light:d.transparent?"#00000000":d.bg}});
 if(!d.logo)return qr;
 // Preserve a true QR SVG while embedding the optional logo as an overlay.
 try{
   const img=await loadImage(d.logo);
   const logoData=await new Promise<string>((resolve)=>{const c=document.createElement("canvas");const side=220;c.width=side;c.height=side;c.getContext("2d")!.drawImage(img,0,0,side,side);resolve(c.toDataURL("image/png"));});
   return qr.replace('</svg>',`<rect x="38%" y="38%" width="24%" height="24%" rx="3%" fill="${d.bg||'#fff'}"/><image href="${logoData}" x="40%" y="40%" width="20%" height="20%" preserveAspectRatio="xMidYMid meet"/></svg>`);
 }catch{return qr}
}
function dataUrlBlob(url:string){const [meta,b64]=url.split(",");const bin=atob(b64);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:meta.match(/:(.*?);/)?.[1]||"image/png"});}
function downloadBlob(blob:Blob,name:string){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200);}
function safeName(s:string){return(s||"qraft-qr").replace(/[^a-z0-9-_]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,55)||"qraft-qr";}
function contrastRatio(a:string,b:string){const lum=(hex:string)=>{const n=hex.replace("#","");const r=parseInt(n.slice(0,2),16)/255,g=parseInt(n.slice(2,4),16)/255,bl=parseInt(n.slice(4,6),16)/255;const f=(v:number)=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);return .2126*f(r)+.7152*f(g)+.0722*f(bl)};const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}

async function embedImageFile(file:File):Promise<{data:string;name:string}> {
 const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();const url=URL.createObjectURL(file);i.onload=()=>{URL.revokeObjectURL(url);resolve(i)};i.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Image could not be read"))};i.src=url});
 const attempts=[[64,.46],[56,.44],[48,.42],[40,.40],[32,.38]] as const;
 for(const [side,quality] of attempts){
  const c=document.createElement("canvas");c.width=side;c.height=side;const ctx=c.getContext("2d")!;ctx.fillStyle="#fff";ctx.fillRect(0,0,side,side);
  const scale=Math.min(side/img.width,side/img.height);const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));ctx.drawImage(img,Math.round((side-w)/2),Math.round((side-h)/2),w,h);
  const data=c.toDataURL("image/jpeg",quality).split(",")[1];
  if(data.length<=1500)return {data:`image/jpeg|${data}`,name:file.name};
 }
 throw new Error("This image is too detailed to fit safely inside a QR. Try a smaller image.");
}
function decodeEmbeddedImage(value:string){
 if(!value.startsWith("QRAFTIMG1|"))return null;
 const raw=value.slice("QRAFTIMG1|".length);
 const sep=raw.indexOf("|");
 if(sep<0)return null;
 const mime=raw.slice(0,sep);const b64=raw.slice(sep+1);
 if(!/^image\/(jpeg|png|webp)$/i.test(mime)||!b64)return null;
 return `data:${mime};base64,${b64}`;
}


type View = "landing"|"create"|"templates"|"tools"|"projects"|"scanner"|"privacy"|"terms"|"developer";

function Header({view,onNavigate,onHome}:{view:View;onNavigate:(v:View)=>void;onHome:()=>void}){
 const items:[View,string][]=[["create","Create"],["templates","Templates"],["tools","Tools"],["projects","Projects"],["scanner","Scan & test"]];
 return <header className="app-header">
   <button className="app-brand" onClick={onHome} aria-label="Qraft home"><img src="/qraft-logo.png" alt="Qraft"/><span><b>Qraft</b><small>QR maker, made easy</small></span></button>
   <nav className="app-nav">{items.map(([id,label])=><button key={id} className={view===id?"active":""} onClick={()=>onNavigate(id)}>{label}</button>)}</nav>
   <div className="header-actions"><button className="header-icon" onClick={()=>onNavigate("scanner")} title="Scan and test"><ScanLine size={17}/></button><button className="header-cta" onClick={()=>onNavigate("create")}><QrCode size={16}/> Create QR</button></div>
 </header>
}

function Footer({onNavigate}:{onNavigate:(v:View)=>void}){
 return <footer className="app-footer"><div className="footer-brand"><img src="/qraft-logo.png" alt=""/><div><b>Qraft</b><span>Make something worth scanning.</span></div></div><div className="footer-links"><button onClick={()=>onNavigate("privacy")}>Privacy Policy</button><button onClick={()=>onNavigate("terms")}>Terms & Conditions</button><button onClick={()=>onNavigate("developer")}>Developer Details</button></div><span className="footer-copy">© {new Date().getFullYear()} Qraft</span></footer>
}

function Landing({go}:{go:(v:View)=>void}){
 return <div className="landing-new"><Header view="landing" onNavigate={go} onHome={()=>go("landing")}/>
   <section className="hero-editorial">
    <div className="hero-paper hero-paper-a"/><div className="hero-paper hero-paper-b"/>
    <div className="hero-copy">
      <div className="hero-kicker"><span className="kicker-dot"/> A QR studio for people who care about the little details</div>
      <h1>Make it <i>yours.</i><br/><span>Make it scan.</span></h1>
      <p>Create polished QR codes with sweet templates, professional logos, useful controls, and a workflow that stays out of your way.</p>
      <div className="hero-buttons"><button className="hero-main-btn" onClick={()=>go("create")}><QrCode size={18}/> Start creating <ArrowRight size={17}/></button><button className="hero-ghost-btn" onClick={()=>go("templates")}><LayoutTemplate size={17}/> Browse templates</button></div>
      <div className="hero-mini-row"><span><Check size={15}/> Local-first projects</span><span><Check size={15}/> PNG · SVG · PDF</span><span><Check size={15}/> Built-in QR test</span></div>
    </div>
    <div className="hero-stage">
      <div className="hero-grid-line"/><div className="hero-squiggle">⌁</div><div className="hero-star star-a">✦</div><div className="hero-star star-b">✦</div>
      <div className="hero-note note-left"><Sparkles size={14}/> Cute by default</div>
      <div className="hero-note note-right"><ShieldCheck size={14}/> Scan checked</div>
      <div className="hero-board">
        <div className="board-top"><span>QRAFT / PREVIEW</span><span className="board-pill">LIVE</span></div>
        <div className="board-copy"><small>YOUR NEXT QR</small><h3>Sweet details.<br/>Solid scanability.</h3><p>Templates · color · logo · spacing</p></div>
        <div className="board-qr"><MiniQR fg="#2e2342" bg="#fff" ec="H"/><div className="qr-badge"><img src="/qraft-logo.png" alt=""/></div></div>
        <div className="board-foot"><span>SCAN ME</span><span>01 / 06</span></div>
      </div>
      <div className="hero-card-small small-one"><b>01</b><span>Pick a style</span></div>
      <div className="hero-card-small small-two"><b>02</b><span>Add your content</span></div>
    </div>
   </section>
   <section className="landing-strip"><div><small>01</small><b>Create</b><span>Start with the QR type that fits your idea.</span></div><div><small>02</small><b>Customize</b><span>Color, spacing, logo, card and finishing details.</span></div><div><small>03</small><b>Ship it</b><span>Export, scan-test, save or print.</span></div></section>
   <section className="landing-feature-grid"><article><div className="feature-index">A</div><Layers size={22}/><h2>One editor, not ten popups.</h2><p>Templates open directly into the editor so your content and design stay together.</p><button onClick={()=>go("templates")}>See templates <ArrowRight size={15}/></button></article><article><div className="feature-index">B</div><Paintbrush size={22}/><h2>More control, less clutter.</h2><p>Keep the common controls visible and tuck the professional finishing tools into one calm panel.</p><button onClick={()=>go("create")}>Open creator <ArrowRight size={15}/></button></article><article><div className="feature-index">C</div><ScanLine size={22}/><h2>Scan before you share.</h2><p>Camera scan, image scan and an internal self-test live on their own dedicated page.</p><button onClick={()=>go("scanner")}>Open scanner <ArrowRight size={15}/></button></article></section>
   <section className="landing-cta"><div><span className="eyebrow">MAKE IT FEEL LIKE YOUR BRAND</span><h2>Start with a template.<br/>Finish it your way.</h2></div><button className="hero-main-btn" onClick={()=>go("templates")}>Explore Qraft templates <ArrowRight size={17}/></button></section>
   <Footer onNavigate={go}/>
 </div>
}

function TypePicker({type,selectType}:{type:TypeId;selectType:(id:TypeId)=>void}){
 const popular=types.filter(t=>t.group==="Popular"); const groups=["Social","Contact","Business","Payments","Advanced"];
 return <div className="type-panel">
  <div className="page-eyebrow">CREATE / 01</div><h1>What are you sharing?</h1><p>Choose a destination first. Qraft keeps the rest focused.</p>
  <div className="type-section"><h3>Popular</h3><div className="type-grid">{popular.map(t=><TypeTile key={t.id} t={t} active={type===t.id} onClick={selectType}/>)}</div></div>
  {groups.map(g=><div className="type-section" key={g}><h3>{g}</h3><div className="type-grid compact">{types.filter(t=>t.group===g).map(t=><TypeTile key={t.id} t={t} active={type===t.id} onClick={selectType}/>)}</div></div>)}
 </div>
}
function TypeTile({t,active,onClick}:{t:TypeMeta;active:boolean;onClick:(id:TypeId)=>void}){const I=t.icon;return <button className={active?"type-tile active":"type-tile"} onClick={()=>onClick(t.id)}><span className="type-icon"><I size={18}/></span><span><b>{t.label}</b><small>{t.note}</small></span>{active&&<Check size={15}/>} </button>}

function Field({label,children,help}:{label:string;children:any;help?:string}){return <label className="field"><span>{label}</span>{children}{help&&<small>{help}</small>}</label>}
function ContentForm({type,form,update}:{type:TypeId;form:FormState;update:(k:keyof FormState,v:string)=>void}){
 const input=(k:keyof FormState,placeholder:string)=> <input value={String(form[k]??"")} onChange={e=>update(k,e.target.value)} placeholder={placeholder}/>;
 if(type==="url") return <><Field label="Website URL" help="Use https:// for a direct web destination.">{input("url","https://example.com")}</Field></>;
 if(type==="text") return <Field label="Text message">{<textarea value={form.text} onChange={e=>update("text",e.target.value)} placeholder="Write anything you want to share..."/>}</Field>;
 if(type==="email") return <div className="field-grid"><Field label="Email">{input("email","hello@example.com")}</Field><Field label="Subject">{input("subject","Hello from Qraft")}</Field><Field label="Message">{<textarea value={form.body} onChange={e=>update("body",e.target.value)} placeholder="Optional message"/>}</Field></div>;
 if(type==="phone") return <Field label="Phone number">{input("phone","+977 98XXXXXXXX")}</Field>;
 if(type==="sms") return <div className="field-grid"><Field label="Phone number">{input("phone","+977 98XXXXXXXX")}</Field><Field label="Message">{<textarea value={form.smsBody} onChange={e=>update("smsBody",e.target.value)} placeholder="Your SMS message"/>}</Field></div>;
 if(type==="wifi") return <div className="field-grid"><Field label="Network name (SSID)">{input("ssid","My Wi-Fi")}</Field><Field label="Password">{input("password","Network password")}</Field><Field label="Security"><select value={form.security} onChange={e=>update("security",e.target.value)}><option>WPA</option><option>WEP</option><option>nopass</option></select></Field></div>;
 if(type==="vcard") return <div className="field-grid"><Field label="First name">{input("firstName","Bibek")}</Field><Field label="Last name">{input("lastName","Bista")}</Field><Field label="Organization">{input("organization","Your company")}</Field><Field label="Phone">{input("contactPhone","+977 ...")}</Field><Field label="Email">{input("contactEmail","hello@example.com")}</Field></div>;
 if(["instagram","facebook","youtube","tiktok","telegram","whatsapp"].includes(type)) return <div className="field-grid"><Field label="Profile / destination URL" help="Use a direct URL for reliable scanning.">{input("socialUrl","https://...")}</Field><Field label="Username (optional)">{input("username","@yourname")}</Field>{type==="whatsapp"&&<Field label="Phone number">{input("phone","+977 ...")}</Field>}</div>;
 if(type==="location") return <div className="field-grid"><Field label="Latitude">{input("lat","28.3949")}</Field><Field label="Longitude">{input("lng","84.1240")}</Field><Field label="Place label">{input("address","Kathmandu, Nepal")}</Field></div>;
 if(["pdf","video","menu"].includes(type)) return <Field label="Destination URL" help="Qraft stores the link in the QR. Hosting is required to open it elsewhere.">{input("fileUrl","https://example.com/file")}</Field>;
 if(type==="image") return <ImageQrField form={form} update={update}/>;
 if(type==="app") return <Field label="App / store URL">{input("appUrl","https://play.google.com/...")}</Field>;
 if(type==="event") return <div className="field-grid"><Field label="Event name">{input("eventName","Qraft Meetup")}</Field><Field label="Start (ISO/date)" >{input("eventStart","20260928T180000")}</Field><Field label="End (ISO/date)">{input("eventEnd","20260928T200000")}</Field><Field label="Location">{input("eventLocation","Kathmandu")}</Field><Field label="Description"><textarea value={form.eventDescription} onChange={e=>update("eventDescription",e.target.value)} placeholder="Event details"/></Field></div>;
 if(type==="review") return <Field label="Review URL">{input("reviewUrl","https://g.page/your-place/review")}</Field>;
 if(type==="paypal") return <Field label="PayPal URL">{input("paypal","https://paypal.me/...")}</Field>;
 if(type==="bitcoin") return <Field label="Bitcoin address">{input("bitcoin","bc1...")}</Field>;
 return <div className="field-grid"><Field label="Secret">{input("twofaSecret","JBSWY3DPEHPK3PXP")}</Field><Field label="Issuer">{input("twofaIssuer","Qraft")}</Field><Field label="Account">{input("twofaAccount","you@example.com")}</Field></div>;
}

function ImageQrField({form,update}:{form:FormState;update:(k:keyof FormState,v:string)=>void}){
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const inputRef=useRef<HTMLInputElement>(null);
 const choose=async(file?:File)=>{if(!file)return;setError("");setBusy(true);try{const out=await embedImageFile(file);update("imageData",out.data);update("imageName",out.name);update("imageAlt",file.name.replace(/\.[^.]+$/,""))}catch(e){setError(e instanceof Error?e.message:"Image could not be embedded.")}finally{setBusy(false)}};
 return <div className="image-editor"><div className="image-editor-copy"><div className="image-editor-icon"><ImagePlus size={20}/></div><div><b>Image inside the QR</b><span>Qraft compresses a small image and embeds it into the QR payload. No image hosting is needed for Qraft's scanner.</span></div></div><button className="image-drop" onClick={()=>inputRef.current?.click()}><Upload size={19}/><b>{busy?"Preparing image…":form.imageName||"Add an image"}</b><small>JPG, PNG or WEBP · keep it simple for QR capacity</small><input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e)=>choose(e.target.files?.[0])}/></button>{form.imageData&&<div className="embedded-preview"><span>Embedded preview</span><img src={decodeEmbeddedImage(`QRAFTIMG1|${form.imageData}`)||""} alt={form.imageAlt||"Embedded"}/><button onClick={()=>{update("imageData","");update("imageName","")}}><Trash2 size={15}/> Remove</button></div>}{error&&<div className="field-error">{error}</div>}</div>
}

function DesignControls({design,update,onLogo,onReset}:{design:DesignState;update:(k:keyof DesignState,v:any)=>void;onLogo:(e:ChangeEvent<HTMLInputElement>)=>void;onReset:()=>void}){
 return <div className="design-panel">
   <div className="design-head"><div><span className="eyebrow">STYLE / 03</span><h2>Make it feel yours.</h2></div><button className="text-button" onClick={onReset}>Reset</button></div>
   <div className="control-group"><div className="control-title">Identity</div><div className="field-grid"><Field label="Headline">{<input value={design.title} onChange={e=>update("title",e.target.value)} maxLength={32}/>}</Field><Field label="Supporting line">{<input value={design.subtitle} onChange={e=>update("subtitle",e.target.value)} maxLength={48}/>}</Field><Field label="CTA pill">{<input value={design.cta} onChange={e=>update("cta",e.target.value)} maxLength={20}/>}</Field></div></div>
   <div className="control-group"><div className="control-title">Color system</div><div className="color-grid"><ColorPicker label="QR ink" value={design.fg} onChange={v=>update("fg",v)}/><ColorPicker label="Background" value={design.bg} onChange={v=>update("bg",v)}/><ColorPicker label="Accent" value={design.accent} onChange={v=>update("accent",v)}/></div><div className="swatch-row">{colors.map(c=><button key={c} className="color-swatch" style={{background:c}} aria-label={c} onClick={()=>update("fg",c)}/>)}</div></div>
   <div className="control-group"><div className="control-title">Professional logo</div><div className="logo-drop"><div className="logo-preview"><span>{design.logo?"Your logo":"Logo"}</span>{design.logo&&<img src={design.logo} alt="Uploaded logo"/>}</div><div className="logo-copy"><b>{design.logoName||"Add your brand mark"}</b><small>Centered safely with a white clearance zone and high error correction.</small><div className="logo-actions"><label className="upload-button"><Upload size={15}/> {design.logo?"Replace logo":"Upload logo"}<input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo}/></label>{design.logo&&<button className="text-button danger-text" onClick={()=>{update("logo",null);update("logoName","")}}>Remove</button>}</div></div></div><Field label="Logo size"><input type="range" min="7" max="16" value={design.logoSize} onChange={e=>update("logoSize",Number(e.target.value))}/></Field></div>
   <div className="control-group"><div className="control-title">QR finish</div><div className="field-grid"><Field label="Error correction"><select value={design.ec} onChange={e=>update("ec",e.target.value as EC)}><option value="L">Low</option><option value="M">Medium</option><option value="Q">High</option><option value="H">Highest</option></select></Field><Field label="Resolution"><input type="range" min="512" max="2400" step="64" value={design.size} onChange={e=>update("size",Number(e.target.value))}/><small>{design.size}px</small></Field><Field label="Quiet zone"><input type="range" min="4" max="10" value={Math.max(4,design.margin)} onChange={e=>update("margin",Number(e.target.value))}/><small>{Math.max(4,design.margin)} modules</small></Field><Field label="Card radius"><input type="range" min="0" max="48" value={design.radius} onChange={e=>update("radius",Number(e.target.value))}/></Field></div><div className="check-grid"><label><input type="checkbox" checked={design.frame} onChange={e=>update("frame",e.target.checked)}/><span>Show card frame</span></label><label><input type="checkbox" checked={design.gradient} onChange={e=>update("gradient",e.target.checked)}/><span>Soft background glow</span></label><label><input type="checkbox" checked={design.transparent} onChange={e=>update("transparent",e.target.checked)}/><span>Transparent PNG</span></label></div></div>
   <div className="control-group advanced-box"><button className="advanced-trigger" onClick={()=>update("advanced",!design.advanced)}><span><SlidersHorizontal size={16}/> Advanced finish</span>{design.advanced?<ChevronDown size={16}/>:<ArrowRight size={16}/>}</button>{design.advanced&&<div className="advanced-content"><p>Qraft keeps the QR data matrix standards-safe. Visual personality is applied to colors and the surrounding card so the encoded modules are not manually repainted.</p><div className="preset-row"><button className="soft" onClick={()=>{update("ec","H");update("margin",6);update("logoSize",Math.min(10,design.logoSize))}}><ShieldCheck size={14}/> Safe scan preset</button><button className="soft" onClick={()=>{update("ec","H");update("margin",7);update("size",1600)}}><FileImage size={14}/> Print preset</button></div></div>}</div>
 </div>
}
function ColorPicker({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="color-picker"><span>{label}</span><input type="color" value={value} onChange={e=>onChange(e.target.value)}/><code>{value}</code></label>}

function PreviewCard({payload,design,busy,onExport,onExportSvg,onExportPdf,onExportDesign,onCopy,onTest}:{payload:string;design:DesignState;busy:boolean;onExport:()=>void;onExportSvg:()=>void;onExportPdf:()=>void;onExportDesign:()=>void;onCopy:()=>void;onTest:()=>void}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{let alive=true;(async()=>{try{const c=await renderQR(payload,design,760);if(!alive||!ref.current)return;ref.current.width=c.width;ref.current.height=c.height;ref.current.getContext("2d")?.drawImage(c,0,0)}catch{}})();return()=>{alive=false}},[payload,design]);return <div className="preview-column"><div className="preview-head"><div><span className="eyebrow">LIVE PREVIEW</span><h2>Looks good from every angle.</h2></div><span className="scan-status"><span/> Ready</span></div><div className="preview-stage"><div className="preview-sheet" style={{borderRadius:design.radius,background:design.gradient?`linear-gradient(145deg,${design.bg},${design.accent}22)`:design.bg,color:design.fg}}><div className="preview-sheet-top"><span>QRAFT</span><span>QR / {design.ec}</span></div><h3>{design.title||"Scan me"}</h3><p>{design.subtitle||"Open the link"}</p><div className="preview-qr-box"><canvas ref={ref}/></div>{design.frame&&<span className="preview-cta" style={{background:design.fg,color:design.bg}}>{design.cta||"SCAN ME"}</span>}<small className="preview-footer">Safe quiet zone · readable contrast · export ready</small></div></div><div className="preview-actions"><button className="soft" onClick={onTest}><ShieldCheck size={16}/> Scan test</button><button className="soft" onClick={onCopy}><Clipboard size={16}/> Copy content</button><button className="primary" onClick={onExport} disabled={busy}><Download size={16}/> {busy?"Preparing…":"Export PNG"}</button></div><div className="export-row"><button onClick={onExportSvg}>SVG</button><button onClick={onExportPdf}>PDF</button><button onClick={onExportDesign}>Design PNG</button></div></div>
}

function FlowSteps({active}:{active:1|2|3|4}){
 const steps=[['01','Choose','QR type'],['02','Add info','Your content'],['03','Design','Make it yours'],['04','Export','Ready to share']];
 return <div className="flow-steps" aria-label="QR creation steps">{steps.map(([n,label,note],i)=><div key={n} className={`flow-step ${active===i+1?'active':''} ${active>i+1?'done':''}`}><span>{active>i+1?<Check size={14}/>:n}</span><div><b>{label}</b><small>{note}</small></div>{i<steps.length-1&&<i/>}</div>)}</div>
}

function TypeChooser({type,setType}:{type:TypeId;setType:(id:TypeId)=>void}){
 const groups=['Popular','Social','Contact','Business','Payments','Advanced'];
 return <section className="type-chooser-full">
   <div className="all-type-groups">{groups.map(g=><div className="all-type-group" key={g}><div className="all-type-group-head"><h3>{g}</h3><span>{types.filter(t=>t.group===g).length}</span></div><div className="type-grid full-list">{types.filter(t=>t.group===g).map(t=><TypeTile key={t.id} t={t} active={type===t.id} onClick={setType}/>)}</div></div>)}</div>
 </section>
}

function CreatePage({state}:{state:AppState}){
 const {type,setType,form,design,updateForm,updateDesign,payload,busy,notify,saveProject,setView,resetDesign,testCurrentQR,copyPayload,exportPng,exportSvg,exportPdf,exportDesign,createStep,setCreateStep}=state;
 const meta=types.find(t=>t.id===type)!;
 const handleLogo=(e:ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;if(file.size>4*1024*1024){notify('Logo must be under 4 MB');return}const reader=new FileReader();reader.onload=()=>{updateDesign('logo',String(reader.result));updateDesign('logoName',file.name);updateDesign('ec','H');updateDesign('logoSize',Math.min(12,design.logoSize))};reader.readAsDataURL(file)};
 const canBack=createStep>1, canNext=createStep<4;
 const goNext=()=>{if(canNext)setCreateStep((createStep+1) as Step)};
 const goBack=()=>{if(canBack)setCreateStep((createStep-1) as Step)};
 return <div className="page-shell create-studio-shell"><Header view="create" onNavigate={setView} onHome={()=>setView('landing')}/><main className="create-studio">
   <div className="studio-topbar"><div><span className="page-eyebrow">QRAFT STUDIO / CREATE</span><h1>Build your QR, one clear step at a time.</h1></div><div className="studio-top-actions"><button className="soft" onClick={()=>setView('templates')}><LayoutTemplate size={15}/> Templates</button><button className="soft" onClick={saveProject}><Save size={15}/> Save</button></div></div>
   <FlowSteps active={createStep}/>
   <div className="studio-frame">
     <aside className="studio-step-rail">
       {([1,2,3,4] as Step[]).map((step)=><button key={step} className={`studio-step-nav ${createStep===step?'active':''} ${createStep>step?'done':''}`} onClick={()=>setCreateStep(step)}><span>{createStep>step?<Check size={14}/>:`0${step}`}</span><div><b>{['Choose','Add info','Design','Export'][step-1]}</b><small>{['Pick the QR type','Enter what it should share','Style and brand it','Test and download'][step-1]}</small></div><ArrowRight size={14}/></button>)}
       <div className="studio-tip"><ShieldCheck size={16}/><div><b>Scan-safe by default</b><span>Qraft keeps the real QR matrix intact and gives logos a safe clearance area.</span></div></div>
     </aside>
     <section className="studio-step-content">
       {createStep===1&&<div className="studio-panel"><div className="studio-panel-head"><div><span className="page-eyebrow">01 / CHOOSE</span><h2>What are you sharing?</h2><p>All {types.length} QR types are listed below. Choose exactly what your QR needs to do.</p></div><span className="type-count">{meta.label}</span></div><TypeChooser type={type} setType={setType}/></div>}
       {createStep===2&&<div className="studio-panel"><div className="studio-panel-head"><div><span className="page-eyebrow">02 / ADD INFO</span><h2>{meta.label}</h2><p>{meta.note}. Your live QR preview stays visible while you enter the content.</p></div><span className="content-status"><Check size={14}/> Live</span></div><div className="wizard-content-card"><ContentForm type={type} form={form} update={updateForm}/></div></div>}
       {createStep===3&&<div className="studio-panel studio-design-panel"><div className="studio-panel-head"><div><span className="page-eyebrow">03 / DESIGN</span><h2>Make it look like yours.</h2><p>Use real QR-safe customization: colors, typography, logo, spacing, finish, and export quality.</p></div><button className="soft" onClick={resetDesign}>Reset design</button></div><DesignControls design={design} update={updateDesign} onLogo={handleLogo} onReset={resetDesign}/></div>}
       {createStep===4&&<div className="studio-panel"><div className="studio-panel-head"><div><span className="page-eyebrow">04 / EXPORT</span><h2>Ready to ship.</h2><p>Run the self-test, save the project, then choose the format you need.</p></div><span className="scan-status"><span/> Ready</span></div><div className="export-finish-grid"><div className="finish-check"><div className="finish-icon"><Check size={18}/></div><div><b>QR content ready</b><span>{meta.label} · {payload.length.toLocaleString()} characters of payload</span></div></div><div className="finish-check"><div className="finish-icon"><Palette size={18}/></div><div><b>Design ready</b><span>{design.logo?'Logo added · ':''}{design.ec} error correction · {design.size}px export</span></div></div><div className="finish-actions"><button className="soft" onClick={testCurrentQR}><ShieldCheck size={16}/> Run scan test</button><button className="soft" onClick={saveProject}><Save size={16}/> Save project</button><button className="primary" onClick={exportPng} disabled={busy}><Download size={16}/> {busy?'Preparing…':'Export PNG'}</button><button className="format-button" onClick={exportSvg}>SVG</button><button className="format-button" onClick={exportPdf}>PDF</button><button className="format-button" onClick={exportDesign}>Design PNG</button><button className="format-button" onClick={copyPayload}><Clipboard size={15}/> Copy QR content</button></div></div></div>}
     </section>
     <aside className="studio-live-preview"><div className="studio-preview-head"><div><span className="page-eyebrow">LIVE PREVIEW</span><h2>Your QR stays in sight.</h2></div><span className="scan-status"><span/> Live</span></div><PreviewCard payload={payload} design={design} busy={busy} onExport={exportPng} onExportSvg={exportSvg} onExportPdf={exportPdf} onExportDesign={exportDesign} onCopy={copyPayload} onTest={testCurrentQR}/></aside>
   </div>
   <div className="studio-navigation"><button className="soft" disabled={!canBack} onClick={goBack}><ArrowLeft size={16}/> Back</button><span>Step {createStep} of 4</span><button className="primary" onClick={canNext?goNext:exportPng} disabled={busy}>{canNext?'Continue':'Export PNG'}{canNext&&<ArrowRight size={16}/>}</button></div>
 </main></div>
}

function TemplatesPage({state}:{state:AppState}){
 const {newProject,templateSearch,setTemplateSearch,templateCategory,setTemplateCategory,filteredTemplates,applyTemplate,setView,type,setType,form,design,payload,updateForm,updateDesign,busy,exportPng,exportSvg,exportPdf,exportDesign,testCurrentQR,copyPayload,resetDesign,saveProject}=state;
 const [selected,setSelected]=useState<string>('');
 const selectedTemplate=templates.find(t=>t.id===selected);
 const categories=['All',...Array.from(new Set(templates.map(t=>t.category)))];
 const grouped=templateCategory==='All' ? categories.slice(1).map(category=>({category,items:templates.filter(t=>t.category===category&&`${t.name} ${t.note}`.toLowerCase().includes(templateSearch.toLowerCase()))})).filter(g=>g.items.length) : [{category:templateCategory,items:filteredTemplates}];
 const handleLogo=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>4*1024*1024){setView('templates');return}const r=new FileReader();r.onload=()=>{updateDesign('logo',String(r.result));updateDesign('logoName',f.name);updateDesign('ec','H');updateDesign('logoSize',Math.min(12,design.logoSize))};r.readAsDataURL(f)};
 const choose=(t:Template)=>{setSelected(t.id);applyTemplate(t,false)};
 return <div className="page-shell"><Header view="templates" onNavigate={setView} onHome={()=>setView('landing')}/><main className="templates-page-new">
   <div className="templates-hero"><div><span className="page-eyebrow">TEMPLATE LIBRARY</span><h1>Start with a look that already feels right.</h1><p>Browse the complete library, choose a template, then edit your content and design without leaving this page.</p></div><button className="primary" onClick={newProject}><QrCode size={15}/> Start blank</button></div>
   <div className="template-toolbar-new"><label className="search-field-large"><Search size={17}/><input value={templateSearch} onChange={e=>setTemplateSearch(e.target.value)} placeholder="Search every template…"/></label><div className="category-pills-new">{categories.map(c=><button key={c} className={templateCategory===c?'active':''} onClick={()=>setTemplateCategory(c)}>{c}<span>{c==='All'?templates.length:templates.filter(t=>t.category===c).length}</span></button>)}</div></div>
   <div className="template-library-layout"><section className="template-gallery">{grouped.map(group=><section className="template-category-section" key={group.category}><div className="template-category-head"><div><span>{group.category}</span><h2>{group.category} templates</h2></div><small>{group.items.length} styles</small></div><div className="template-card-grid">{group.items.map(t=><button key={t.id} className={selected===t.id?'template-card-new active':'template-card-new'} onClick={()=>choose(t)}><div className="template-card-art" style={{background:t.bg}}><MiniQR fg={t.fg} bg={t.bg} ec="H" pattern={t.pattern} finder={t.finder}/><span style={{background:t.fg,color:t.bg}}>{t.cta}</span><em>{t.pattern}</em></div><div className="template-card-copy"><div><b>{t.name}</b><span>{t.category}</span></div><p>{t.note}</p></div></button>)}</div></section>)}</section>
   <aside className="template-edit-station"><div className="template-station-inner">{selectedTemplate?<><div className="station-head"><div><span className="page-eyebrow">EDIT TEMPLATE</span><h2>{selectedTemplate.name}</h2><p>Change QR content and appearance here, then save or export.</p></div><button className="text-button" onClick={()=>{setSelected('');resetDesign()}}><X size={15}/> Close</button></div><label className="station-type"><span>QR type</span><select value={type} onChange={e=>setType(e.target.value as TypeId)}>{['Popular','Social','Contact','Business','Payments','Advanced'].map(g=><optgroup key={g} label={g}>{types.filter(t=>t.group===g).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>)}</select></label><div className="station-section"><span className="page-eyebrow">CONTENT</span><ContentForm type={type} form={form} update={updateForm}/></div><div className="station-section"><DesignControls design={design} update={updateDesign} onLogo={handleLogo} onReset={resetDesign}/></div><PreviewCard payload={payload} design={design} busy={busy} onExport={exportPng} onExportSvg={exportSvg} onExportPdf={exportPdf} onExportDesign={exportDesign} onCopy={copyPayload} onTest={testCurrentQR}/><div className="station-save-row"><button className="soft" onClick={saveProject}><Save size={15}/> Save project</button><button className="primary" onClick={exportPng} disabled={busy}><Download size={15}/> Export PNG</button></div></>:<div className="template-selection-empty"><LayoutTemplate size={34}/><span className="page-eyebrow">SELECT A TEMPLATE</span><h2>Edit the moment you choose it.</h2><p>Pick any card from the library. This panel becomes your editor, so there is no second template screen and no hidden workflow.</p></div>}</div></aside>
   </div>
 </main></div>
}

function ToolsPage({state}:{state:AppState}){const {setView,batch,setBatch,batchResults,runBatch,downloadBatch}=state;return <div className="page-shell"><Header view="tools" onNavigate={setView} onHome={()=>setView("landing")}/><main className="simple-page"><div className="page-intro"><div><span className="page-eyebrow">TOOLS</span><h1>Useful utilities, separated cleanly.</h1><p>Batch generation and scan/testing live here so the creator stays focused.</p></div></div><div className="tools-grid"><section className="utility-card wide"><div className="utility-icon"><FileArchive size={22}/></div><span className="eyebrow">BATCH</span><h2>Generate up to 1,000 QR codes</h2><p>One row per QR. Use <b>Name,URL</b> or just a URL.</p><textarea value={batch} onChange={e=>setBatch(e.target.value)} placeholder={'Restaurant,https://example.com/menu\nInstagram,https://instagram.com/qraft\nContact,https://example.com/contact'}/><div className="utility-actions"><button className="primary" onClick={runBatch} disabled={!batch.trim()}><Zap size={15}/> Generate batch</button>{batchResults.length>0&&<button className="soft" onClick={downloadBatch}><Download size={15}/> Download ZIP ({batchResults.length})</button>}</div>{batchResults.length>0&&<div className="batch-grid">{batchResults.slice(0,16).map(r=><div key={r.name}><img src={r.url}/><span>{r.name}</span></div>)}</div>}</section><section className="utility-card"><div className="utility-icon"><ScanLine size={22}/></div><span className="eyebrow">VERIFY</span><h2>Scan & test</h2><p>Camera scan, image drop, and internal self-test — all on one dedicated tool page.</p><button className="primary" onClick={()=>setView("scanner")}><ScanLine size={16}/> Open Scan & test</button></section><section className="utility-card"><div className="utility-icon"><CircleHelp size={22}/></div><span className="eyebrow">WORKFLOW</span><h2>Keep the creator clean</h2><p>Tools stay separate so the main create flow remains focused on your QR and its final design.</p></section></div></main></div>}

function ProjectsPage({state}:{state:AppState}){const {setView,projects,openProject,removeProject,clearProjects,newProject}=state;return <div className="page-shell"><Header view="projects" onNavigate={setView} onHome={()=>setView("landing")}/><main className="simple-page"><div className="page-intro"><div><span className="page-eyebrow">PROJECTS</span><h1>Your saved QR work.</h1><p>Projects live locally on this device. Reopen, refine, and export whenever you need.</p></div><button className="primary" onClick={newProject}><QrCode size={15}/> New project</button></div>{projects.length?<><div className="projects-grid">{projects.map(p=><article className="project-card" key={p.id}><img src={p.thumbnail} alt=""/><div className="project-card-copy"><span>{types.find(t=>t.id===p.type)?.label}</span><h3>{p.name}</h3><small>Updated {new Date(p.updated).toLocaleString()}</small><div><button className="primary" onClick={()=>openProject(p)}>Open project</button><button className="icon-button" onClick={()=>removeProject(p.id)} title="Delete"><Trash2 size={16}/></button></div></div></article>)}</div><button className="danger-outline" onClick={clearProjects}>Clear all projects</button></>:<div className="empty-page"><FolderOpen size={42}/><h2>No saved projects yet.</h2><p>Build a QR in Create, then save it here for later.</p><button className="primary" onClick={newProject}><QrCode size={16}/> Create your first QR</button></div>}</main></div>}

function ScannerPage({state}:{state:AppState}){const {setView,scanResult,scanError,startCamera,scanFile,testCurrentQR,clearScan}=state;const [dragging,setDragging]=useState(false);const dragDepth=useRef(0);useEffect(()=>{const enter=(e:DragEvent)=>{if(!e.dataTransfer?.types?.includes("Files"))return;e.preventDefault();dragDepth.current++;setDragging(true)};const over=(e:DragEvent)=>{if(e.dataTransfer?.types?.includes("Files")){e.preventDefault();setDragging(true)}};const leave=(e:DragEvent)=>{if(!e.dataTransfer?.types?.includes("Files"))return;e.preventDefault();dragDepth.current--;if(dragDepth.current<=0){dragDepth.current=0;setDragging(false)}};const drop=(e:DragEvent)=>{if(!e.dataTransfer?.files?.length)return;e.preventDefault();dragDepth.current=0;setDragging(false);scanFile(e.dataTransfer.files[0])};window.addEventListener("dragenter",enter);window.addEventListener("dragover",over);window.addEventListener("dragleave",leave);window.addEventListener("drop",drop);return()=>{window.removeEventListener("dragenter",enter);window.removeEventListener("dragover",over);window.removeEventListener("dragleave",leave);window.removeEventListener("drop",drop)}} ,[]);return <div className="page-shell"><Header view="scanner" onNavigate={setView} onHome={()=>setView("landing")}/>{dragging&&<div className="global-drop-capture"><div><div className="capture-icon"><Upload size={30}/></div><h2>Drop your QR image anywhere</h2><p>Qraft caught the file. Release it to scan now.</p></div></div>}<main className="scanner-page"><div className="page-intro"><div><span className="page-eyebrow">SCAN & TEST</span><h1>Verify before you share.</h1><p>Use your camera, add an image, or run Qraft's own generated QR through the decoder.</p></div><button className="soft" onClick={testCurrentQR}><ShieldCheck size={16}/> Test current QR</button></div><div className="scanner-columns"><section className="scanner-card"><div className="scanner-card-head"><div className="scanner-number">01</div><div><span className="eyebrow">CAMERA SCAN</span><h2>Scan with your camera</h2><p>Use the rear camera on a phone or desktop webcam.</p></div></div><video ref={state.cameraRef} className="camera-full" muted playsInline/><canvas ref={state.scanCanvas} hidden/><button className="primary large" onClick={startCamera}><Camera size={18}/> Start camera</button></section><section className="scanner-card"><div className="scanner-card-head"><div className="scanner-number">02</div><div><span className="eyebrow">IMAGE SCAN</span><h2>Add or drop a QR image</h2><p>You can drag a QR image anywhere onto the page — Qraft catches it automatically.</p></div></div><label className="scanner-drop-zone"><Upload size={25}/><b>Choose QR image</b><span>PNG · JPG · WEBP · GIF</span><input type="file" hidden accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)scanFile(f)}}/><em>or drag it anywhere on this page</em></label></section></div>{(scanResult||scanError)&&<section className={scanError?"scan-result-card error-card":"scan-result-card"}><div className="result-title"><div><span className="eyebrow">RESULT</span><h2>{scanError?"Couldn't decode that image":"QR decoded successfully"}</h2></div><button className="text-button" onClick={clearScan}>Clear</button></div>{scanError?<p>{scanError}</p>:<><div className="detected-value">{scanResult}</div>{decodeEmbeddedImage(scanResult)&&<div className="offline-result"><img src={decodeEmbeddedImage(scanResult)!} alt="Embedded in QR"/><div><b>Embedded image recovered</b><span>This image came directly from the QR payload. No internet was used by Qraft.</span></div></div>}<button className="soft" onClick={()=>navigator.clipboard?.writeText(scanResult)}><Clipboard size={15}/> Copy detected content</button></>}</section>}<p className="scanner-note"><ShieldCheck size={15}/> For the most reliable physical check, scan the exported QR at the same print size and lighting you expect in real use.</p></main></div>}

function InfoPage({kind,onBack,onNavigate,onPrivacy,onTerms,onDeveloper}:{kind:"privacy"|"terms"|"developer";onBack:()=>void;onNavigate?:(v:View)=>void;onPrivacy?:()=>void;onTerms?:()=>void;onDeveloper?:()=>void}){const data=kind==="privacy"?{eyebrow:"LEGAL / PRIVACY",title:"Privacy Policy",intro:"Qraft is designed to keep QR creation local and transparent.",sections:[["What Qraft stores","Projects, design settings, and generated thumbnails can be stored in your browser's local storage when you save a project."],["Images & logos","Uploaded images and logos used during creation are processed in your browser. The offline Image QR feature compresses a small image into a Qraft-specific payload."],["Camera access","Camera access is requested only when you start camera scanning. Qraft uses the camera stream in the browser to decode QR content."],["Third-party destinations","A QR can contain links to third-party services. Qraft does not control those external websites or their privacy practices."],["Your control","You can clear local projects from the Projects page or clear your browser's site storage." ]]}:kind==="terms"?{eyebrow:"LEGAL / TERMS",title:"Terms & Conditions",intro:"Use Qraft responsibly and verify your QR before publishing or printing it.",sections:[["Acceptable use","Do not use Qraft to create QR content that violates applicable law, infringes rights, or is intended to deceive or harm others."],["Your content","You are responsible for the URLs, text, images, logos, and other material you enter or embed."],["QR reliability","Qraft uses standard QR generation and includes scan-testing tools, but final readability depends on size, contrast, print quality, surrounding design, and scanning hardware."],["External content","Links encoded in QR codes may lead to third-party services. Qraft is not responsible for the availability or content of those destinations."],["Changes","Qraft may be updated over time as features and safety checks improve." ]]}:{eyebrow:"ABOUT / DEVELOPER",title:"Developer Details",intro:"Qraft is a client-side QR creation and design studio built around a simple product principle: useful first, decoration second.",sections:[["Product","Qraft combines QR creation, templates, design controls, exports, projects, and scanning tools in one browser-based application."],["Technology","The app uses React + TypeScript + Vite, the qrcode package for standards-based QR rendering, jsQR for decoding, jsPDF for PDF export, and JSZip for batch downloads."],["Architecture","Qraft is designed to be local-first for creation and project storage. Generated assets are created in the browser without requiring a Qraft backend for ordinary QR generation."],["Design principle","The interface keeps common tasks visible, moves professional controls into calm sections, and avoids altering the QR data matrix with decorative painting."],["Project information","Developer identity or contact information is intentionally not fabricated here. Add the real name, email, GitHub, or website you want published on this page." ]]};return <div className="info-shell"><div className="info-top"><button className="app-brand" onClick={onBack}><img src="/qraft-logo.png" alt="Qraft"/><span><b>Qraft</b><small>Back to Qraft</small></span></button><button className="soft" onClick={onBack}><ArrowLeft size={15}/> Back</button></div><main className="info-document"><span className="page-eyebrow">{data.eyebrow}</span><h1>{data.title}</h1><p className="info-intro">{data.intro}</p>{data.sections.map(([h,p])=><section key={h}><h2>{h}</h2><p>{p}</p></section>)}</main></div>}

function MiniQR({fg,bg,ec="M",pattern="square",finder="square"}:{fg:string;bg:string;ec:EC;pattern?:Pattern;finder?:Finder}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let alive=true;(async()=>{try{const c=await renderQR("https://qraft.app/preview",{...initialDesign,fg,bg,ec,pattern,finder,margin:4,size:180,logo:null,transparent:false},180);if(alive&&ref.current){ref.current.width=c.width;ref.current.height=c.height;ref.current.getContext("2d")?.drawImage(c,0,0)}}catch{}})();return()=>{alive=false}},[fg,bg,ec,pattern,finder]);
 return <canvas ref={ref} className="mini-real-qr"/>
}

type AppState={
 view:View; setView:(v:View)=>void; newProject:()=>void; createStep:Step; setCreateStep:(s:Step)=>void; type:TypeId; setType:(t:TypeId)=>void; form:FormState; design:DesignState; updateForm:(k:keyof FormState,v:string)=>void; updateDesign:(k:keyof DesignState,v:any)=>void; payload:string; busy:boolean; setBusy:(v:boolean)=>void; notify:(m:string)=>void; saveProject:()=>Promise<void>; resetDesign:()=>void; testCurrentQR:()=>Promise<void>; copyPayload:()=>Promise<void>; exportPng:()=>Promise<void>; exportSvg:()=>Promise<void>; exportPdf:()=>Promise<void>; exportDesign:()=>Promise<void>; undoAction:()=>void; redoAction:()=>void; undo:{form:FormState;design:DesignState}[]; redo:{form:FormState;design:DesignState}[]; projects:Project[]; openProject:(p:Project)=>void; removeProject:(id:string)=>void; clearProjects:()=>void; templateSearch:string; setTemplateSearch:(x:string)=>void; templateCategory:string; setTemplateCategory:(x:string)=>void; filteredTemplates:Template[]; applyTemplate:(t:Template,close?:boolean)=>void; batch:string; setBatch:(x:string)=>void; batchResults:{name:string;url:string}[]; runBatch:()=>Promise<void>; downloadBatch:()=>Promise<void>; scanResult:string; scanError:string; startCamera:()=>Promise<void>; scanFile:(f:File)=>void; clearScan:()=>void; cameraRef:{current:HTMLVideoElement|null}; scanCanvas:{current:HTMLCanvasElement|null};
}

function App(){
 const [view,setView]=useState<View>("landing"); const [createStep,setCreateStep]=useState<Step>(1); const [type,setType]=useState<TypeId>("url"); const [form,setForm]=useState<FormState>(initialForm); const [design,setDesign]=useState<DesignState>(initialDesign); const [busy,setBusy]=useState(false); const [toast,setToast]=useState("");
 const [undo,setUndo]=useState<{form:FormState;design:DesignState}[]>([]); const [redo,setRedo]=useState<{form:FormState;design:DesignState}[]>([]);
 const [projects,setProjects]=useState<Project[]>(()=>{try{return JSON.parse(localStorage.getItem("qraft-projects")||"[]")}catch{return[]}}); const [savedId,setSavedId]=useState("");
 const [templateSearch,setTemplateSearch]=useState(""); const [templateCategory,setTemplateCategory]=useState("All"); const [batch,setBatch]=useState(""); const [batchResults,setBatchResults]=useState<{name:string;url:string}[]>([]);
 const [scanResult,setScanResult]=useState(""); const [scanError,setScanError]=useState(""); const cameraRef=useRef<HTMLVideoElement>(null); const scanCanvas=useRef<HTMLCanvasElement>(null); const streamRef=useRef<MediaStream|null>(null); const scanFrameRef=useRef<number|null>(null);
 const payload=useMemo(()=>payloadFor(type,form),[type,form]); const filteredTemplates=useMemo(()=>templates.filter(t=>(templateCategory==="All"||t.category===templateCategory)&&`${t.name} ${t.note} ${t.category}`.toLowerCase().includes(templateSearch.toLowerCase())),[templateCategory,templateSearch]);
 useEffect(()=>{localStorage.setItem("qraft-projects",JSON.stringify(projects.slice(0,40)))},[projects]); useEffect(()=>()=>{if(scanFrameRef.current!==null)cancelAnimationFrame(scanFrameRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null},[]); useEffect(()=>{window.scrollTo({top:0,behavior:"auto"})},[view]);
 const notify=(m:string)=>{setToast(m);window.setTimeout(()=>setToast(""),1900)};
 const snapshot=()=>setUndo(u=>[...u,{form:{...form},design:{...design}}].slice(-30));
 const updateForm=(k:keyof FormState,v:string)=>{snapshot();setRedo([]);setForm(x=>({...x,[k]:v}))};
 const updateDesign=(k:keyof DesignState,v:any)=>{snapshot();setRedo([]);setDesign(x=>({...x,[k]:v}))};
 const setTypeSafe=(id:TypeId)=>{if(id===type)return;snapshot();setRedo([]);setType(id);const meta=types.find(t=>t.id===id)!;setDesign(d=>({...d,title:meta.label,subtitle:meta.note,cta:id==="wifi"?"CONNECT":"SCAN ME"}))};
 const resetDesign=()=>{snapshot();setRedo([]);setDesign(initialDesign)};
 const undoAction=()=>{const x=undo.at(-1);if(!x)return;setRedo(r=>[...r,{form:{...form},design:{...design}}]);setForm(x.form);setDesign(x.design);setUndo(u=>u.slice(0,-1))};
 const redoAction=()=>{const x=redo.at(-1);if(!x)return;setUndo(u=>[...u,{form:{...form},design:{...design}}]);setForm(x.form);setDesign(x.design);setRedo(r=>r.slice(0,-1))};
 const applyTemplate=(t:Template,toastIt=true)=>{snapshot();setRedo([]);setDesign(d=>({...d,fg:t.fg,bg:t.bg,accent:t.accent,pattern:t.pattern,finder:t.finder,gradient:t.gradient,title:t.title,subtitle:t.subtitle,cta:t.cta,ec:"H",margin:4}));if(toastIt)notify(`${t.name} template applied`)};
 const saveProject=async()=>{try{const c=await renderQR(payload,design,360);const p:Project={id:savedId||crypto.randomUUID(),name:design.title||types.find(t=>t.id===type)?.label||"Qraft QR",type,form,design,updated:Date.now(),thumbnail:c.toDataURL("image/png")};setProjects(x=>[p,...x.filter(y=>y.id!==p.id)]);setSavedId(p.id);notify("Project saved locally")}catch{notify("Could not save this project")}};
 const openProject=(p:Project)=>{setSavedId(p.id);setType(p.type);setForm(p.form);setDesign(p.design);setCreateStep(2);setView("create");window.scrollTo({top:0,behavior:"auto"});notify("Project opened")};
 const newProject=()=>{setSavedId("");setType("url");setForm({...initialForm});setDesign({...initialDesign});setUndo([]);setRedo([]);setScanResult("");setScanError("");setCreateStep(1);setView("create");window.scrollTo({top:0,behavior:"auto"});notify("New QR ready")};

 const removeProject=(id:string)=>setProjects(p=>p.filter(x=>x.id!==id)); const clearProjects=()=>{setProjects([]);setSavedId("");localStorage.removeItem("qraft-projects")};
 const exportPng=async()=>{setBusy(true);try{const c=await renderQR(payload,design,design.size);downloadBlob(dataUrlBlob(c.toDataURL("image/png")),`${safeName(design.title)}-qr.png`);notify("QR PNG exported")}catch{notify("Export failed")}finally{setBusy(false)}};
 const makeDesignCanvas=async()=>{const c=document.createElement("canvas");c.width=1400;c.height=1540;const x=c.getContext("2d")!;x.fillStyle=design.bg;x.fillRect(0,0,c.width,c.height);if(design.gradient){const g=x.createLinearGradient(0,0,1400,1540);g.addColorStop(0,design.bg);g.addColorStop(1,design.accent+"26");x.fillStyle=g;x.fillRect(0,0,c.width,c.height)}x.fillStyle=design.fg;x.textAlign="center";x.font="800 26px Arial";x.fillText("QRAFT",700,72);x.font="800 58px Arial";x.fillText(design.title||"Scan me",700,150);x.font="26px Arial";x.globalAlpha=.65;x.fillText(design.subtitle||"",700,198);x.globalAlpha=1;const q=await renderQR(payload,{...design,transparent:false},900);x.fillStyle="#fff";x.beginPath();x.roundRect(235,245,930,930,42);x.fill();x.drawImage(q,265,275,870,870);if(design.frame){x.fillStyle=design.fg;x.beginPath();x.roundRect(520,1205,360,62,31);x.fill();x.fillStyle=design.bg;x.font="800 20px Arial";x.fillText(design.cta||"SCAN ME",700,1245)}x.fillStyle=design.fg;x.globalAlpha=.5;x.font="18px Arial";x.fillText("Create · Customize · Share",700,1420);return c};
 const exportDesign=async()=>{setBusy(true);try{const c=await makeDesignCanvas();downloadBlob(dataUrlBlob(c.toDataURL("image/png")),`${safeName(design.title)}-qraft.png`);notify("Design PNG exported")}catch{notify("Design export failed")}finally{setBusy(false)}};
 const exportSvg=async()=>{setBusy(true);try{const svg=await qrSvg(payload,design);downloadBlob(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}),`${safeName(design.title)}.svg`);notify("SVG exported")}catch{notify("SVG export failed")}finally{setBusy(false)}};
 const exportPdf=async()=>{setBusy(true);try{const c=await makeDesignCanvas();const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});pdf.addImage(c.toDataURL("image/png"),"PNG",25,15,160,176);pdf.save(`${safeName(design.title)}.pdf`);notify("PDF exported")}catch{notify("PDF export failed")}finally{setBusy(false)}};
 const copyPayload=async()=>{try{await navigator.clipboard?.writeText(payload);notify("QR content copied")}catch{notify("Clipboard unavailable")}};
 const startCamera=async()=>{try{setScanError("");setScanResult("");if(scanFrameRef.current!==null)cancelAnimationFrame(scanFrameRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;if(!navigator.mediaDevices?.getUserMedia)throw new Error();const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});streamRef.current=s;if(cameraRef.current){cameraRef.current.srcObject=s;await cameraRef.current.play();scanLoop()}}catch{setScanError("Camera permission or camera access is unavailable. Try image upload instead.")}};
 const scanLoop=()=>{const v=cameraRef.current,c=scanCanvas.current;if(!v||!c||!streamRef.current)return;c.width=v.videoWidth||720;c.height=v.videoHeight||540;const ctx=c.getContext("2d");if(!ctx)return;ctx.drawImage(v,0,0,c.width,c.height);const d=ctx.getImageData(0,0,c.width,c.height);const code=jsQR(d.data,d.width,d.height,{inversionAttempts:"attemptBoth"});if(code){setScanResult(code.data);streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;if(scanFrameRef.current!==null)cancelAnimationFrame(scanFrameRef.current);return}scanFrameRef.current=requestAnimationFrame(scanLoop)};
 const scanFile=(file:File)=>{if(!file.type.startsWith("image/")){setScanError("Please choose an image file.");return}streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;if(scanFrameRef.current!==null)cancelAnimationFrame(scanFrameRef.current);setScanResult("");setScanError("");const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{try{const c=scanCanvas.current!;c.width=img.width;c.height=img.height;const ctx=c.getContext("2d")!;ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,c.width,c.height);const code=jsQR(d.data,d.width,d.height,{inversionAttempts:"attemptBoth"});if(code)setScanResult(code.data);else setScanError("No readable QR code found. Try a sharper or larger image.")}catch{setScanError("This image could not be scanned.")}finally{URL.revokeObjectURL(url)}};img.onerror=()=>{setScanError("This image could not be opened.");URL.revokeObjectURL(url)};img.src=url};
 const testCurrentQR=async()=>{try{setScanError("");const c=await renderQR(payload,design,1200);const ctx=c.getContext("2d")!;const d=ctx.getImageData(0,0,c.width,c.height);const code=jsQR(d.data,d.width,d.height,{inversionAttempts:"attemptBoth"});if(code){setScanResult(code.data);notify(code.data===payload?"Self-test passed":"QR decoded, but content changed")}else setScanError("Self-test could not decode this QR. Increase quiet zone or reduce logo size.")}catch{setScanError("QR self-test failed.")}};
 const clearScan=()=>{setScanResult("");setScanError("")};
 const runBatch=async()=>{const rows=batch.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,1000);const out:{name:string;url:string}[]=[];try{for(let i=0;i<rows.length;i++){const [name,...rest]=rows[i].split(",");const value=rest.join(",").trim()||name.trim();const c=await renderQR(value,{...design,logo:null,ec:"H"},700);out.push({name:safeName(name||`QR-${i+1}`),url:c.toDataURL("image/png")})}setBatchResults(out);notify(`${out.length} QR codes generated`)}catch{notify("Batch generation stopped due to an invalid row")}};
 const downloadBatch=async()=>{const zip=new JSZip();batchResults.forEach(x=>zip.file(`${x.name}.png`,x.url.split(",")[1],{base64:true}));downloadBlob(await zip.generateAsync({type:"blob"}),"qraft-batch.zip");notify("Batch ZIP downloaded")};
 const setViewClean=(v:View)=>{setView(v);window.scrollTo({top:0,behavior:"auto"})};
 const state:AppState={view,setView:setViewClean,newProject,createStep,setCreateStep,type,setType:setTypeSafe,form,design,updateForm,updateDesign,payload,busy,setBusy,notify,saveProject,resetDesign,testCurrentQR,copyPayload,exportPng,exportSvg,exportPdf,exportDesign,undoAction,redoAction,undo,redo,projects,openProject,removeProject,clearProjects,templateSearch,setTemplateSearch,templateCategory,setTemplateCategory,filteredTemplates,applyTemplate,batch,setBatch,batchResults,runBatch,downloadBatch,scanResult,scanError,startCamera,scanFile,clearScan,cameraRef,scanCanvas};
 if(view==="landing")return <Landing go={setViewClean}/>;
 if(view==="privacy")return <InfoPage kind="privacy" onBack={()=>setViewClean("landing")} onNavigate={setViewClean} onPrivacy={()=>setViewClean("privacy")} onTerms={()=>setViewClean("terms")} onDeveloper={()=>setViewClean("developer")}/>;
 if(view==="terms")return <InfoPage kind="terms" onBack={()=>setViewClean("landing")} onNavigate={setViewClean} onPrivacy={()=>setViewClean("privacy")} onTerms={()=>setViewClean("terms")} onDeveloper={()=>setViewClean("developer")}/>;
 if(view==="developer")return <InfoPage kind="developer" onBack={()=>setViewClean("landing")} onNavigate={setViewClean} onPrivacy={()=>setViewClean("privacy")} onTerms={()=>setViewClean("terms")} onDeveloper={()=>setViewClean("developer")}/>;
 if(view==="create")return <CreatePage state={state}/>;
 if(view==="templates")return <TemplatesPage state={state}/>;
 if(view==="tools")return <ToolsPage state={state}/>;
 if(view==="projects")return <ProjectsPage state={state}/>;
 return <ScannerPage state={state}/>;
}

export default App;
