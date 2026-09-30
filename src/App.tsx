import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import jsQR from "jsqr";
import type { LucideIcon } from "lucide-react";
import { payloadFor, validatePayload, normUrl, decodeEmbeddedImage } from "./lib/payload";
import type { TypeId, FormState } from "./lib/payload";
import { loadProjects, saveProjects, clearProjects as clearStoredProjects } from "./lib/storage";
import { renderQR, qrSvg, verifyQR, prepareLogo, frameGeometry, titleFontSize, ctaFontSize, MIN_MARGIN, loadImage } from "./lib/render";
import type { Pattern, Finder, EC, FrameStyle, BodyShape, DesignState } from "./lib/render";
import {
  ArrowLeft, ArrowRight, Camera, Check, ChevronDown, Clipboard, Download, FileArchive, FileImage,
  FileText, ImagePlus, Layers, Link2, Mail, MapPin, MessageCircle, Palette, Phone, Play, QrCode,
  ScanLine, Search, Send, Settings2, Sparkles, Star, Ticket, Trash2, Undo2, Redo2, Upload,
  UserRound, Video, Wifi, X, Instagram, Facebook, Youtube, Smartphone, ShieldCheck, Zap, Menu,
  SlidersHorizontal, CircleHelp, FolderOpen, LayoutTemplate, Paintbrush, Copy, Command, Clock3, WifiOff, DownloadCloud, Sun, Moon, RotateCcw
} from "lucide-react";

type Step = 1|2|3|4;

type Project = {id:string;name:string;type:TypeId;form:FormState;design:DesignState;updated:number;thumbnail:string;favorite?:boolean;tags?:string[]};
type Template = {id:string;name:string;category:string;note:string;fg:string;bg:string;accent:string;pattern:Pattern;finder:Finder;gradient:boolean;title:string;subtitle:string;cta:string;frame?:FrameStyle};
type TypeMeta = {id:TypeId;label:string;note:string;icon:LucideIcon;group:string};

const LOGO_SRC=`${import.meta.env.BASE_URL}qraft-logo.png`;
type Snap={type:TypeId;form:FormState;design:DesignState};
const VIEWS=["landing","create","templates","tools","projects","scanner","privacy","terms","developer"] as const;
const PALETTES=[["Cobalt","#0f172a","#ffffff","#2563eb"],["Slate","#1e293b","#f8fafc","#475569"],["Teal","#134e4a","#f0fdfa","#0f766e"],["Indigo","#312e81","#eef2ff","#4f46e5"],["Berry","#831843","#fff1f2","#e11d48"],["Amber","#78350f","#fffbeb","#d97706"],["Forest","#14532d","#f0fdf4","#16a34a"],["Mono","#111827","#ffffff","#111827"]].map(([name,fg,bg,accent])=>({name,fg,bg,accent}));
const initialForm:FormState={url:"https://example.com",text:"",email:"",subject:"",body:"",phone:"+977 ",smsBody:"",ssid:"",password:"",security:"WPA",firstName:"",lastName:"",organization:"",contactPhone:"",contactEmail:"",lat:"28.3949",lng:"84.1240",address:"Nepal",socialUrl:"",username:"",appUrl:"",fileUrl:"",eventName:"",eventStart:"",eventEnd:"",eventLocation:"",eventDescription:"",imageUrl:"https://",imageData:"",imageName:"",imageAlt:"",reviewUrl:"",paypal:"",bitcoin:"",twofaSecret:"",twofaIssuer:"",twofaAccount:""};
const initialDesign:DesignState={title:"Scan me",subtitle:"Open the link",fg:"#0f172a",bg:"#ffffff",bodyShape:"square",finder:"square",ec:"H",size:1200,margin:6,transparent:false,logo:null,logoName:"",logoEnabled:false,logoSize:12,frame:true,frameStyle:"badge",cta:"SCAN ME",radius:20,gradient:false,inkGradient:false,gradientEnd:"#2563eb",accent:"#2563eb",advanced:false};

const socialThemes:Record<string,{fg:string;bg:string;accent:string;title:string;subtitle:string;cta:string;frameStyle:FrameStyle;logo:string}>= {
 whatsapp:{fg:"#075e54",bg:"#f1fff8",accent:"#25d366",title:"Chat on WhatsApp",subtitle:"Start a conversation instantly",cta:"CHAT NOW",frameStyle:"soft",logo:""},
 instagram:{fg:"#8a2a72",bg:"#fff5fb",accent:"#e1306c",title:"Follow on Instagram",subtitle:"See the latest updates",cta:"FOLLOW",frameStyle:"badge",logo:""},
 facebook:{fg:"#1877f2",bg:"#f3f8ff",accent:"#1877f2",title:"Find us on Facebook",subtitle:"Connect with our page",cta:"OPEN FACEBOOK",frameStyle:"badge",logo:""},
 youtube:{fg:"#b91c1c",bg:"#fff6f5",accent:"#ff0000",title:"Watch on YouTube",subtitle:"Open the latest video",cta:"WATCH NOW",frameStyle:"soft",logo:""},
 tiktok:{fg:"#111827",bg:"#f6fbfb",accent:"#25f4ee",title:"Follow on TikTok",subtitle:"Discover short videos",cta:"FOLLOW",frameStyle:"scan",logo:""},
 telegram:{fg:"#1479b8",bg:"#f1faff",accent:"#229ed9",title:"Message on Telegram",subtitle:"Start a chat or open the profile",cta:"OPEN TELEGRAM",frameStyle:"badge",logo:""}
};
function svgData(mark:string){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mark)}`}
function socialLogoDataUrl(id:string){
 if(id==="instagram") return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#f58529"/><stop offset=".45" stop-color="#dd2a7b"/><stop offset="1" stop-color="#8134af"/></linearGradient></defs><rect x="8" y="8" width="84" height="84" rx="25" fill="url(#g)"/><rect x="28" y="28" width="44" height="44" rx="13" fill="none" stroke="#fff" stroke-width="8"/><circle cx="50" cy="50" r="11" fill="none" stroke="#fff" stroke-width="8"/><circle cx="69" cy="31" r="5.5" fill="#fff"/></svg>`);
 if(id==="facebook") return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#1877f2"/><path fill="#fff" d="M56 84V55h10l2-12H56v-7c0-4 2-7 8-7h5V18c-2-.3-5-.8-8.7-.8-10.2 0-17.1 6.2-17.1 17.5V43H33v12h10v29h13z"/></svg>`);
 if(id==="youtube") return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100"><rect x="7" y="20" width="106" height="60" rx="18" fill="#ff0000"/><path fill="#fff" d="M49 36v28l28-14-28-14z"/></svg>`);
 if(id==="whatsapp") return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#25d366"/><path fill="#fff" d="M70 59.7c-1.6-7.3-9.5-14.7-16.8-16.3-4.8-1-9.8.1-13.5 3.8-4.9 4.9-5.1 12.7-.9 17.9 4.8 5.9 11.2 8.8 18.9 8.8 1.6 0 3.2-.1 4.9-.4l7.4 3 3.1-7.1c.5-3.1.2-6.2-1-9.7zm-8.5 7.6-5-2c-1.1-.4-2.3-.3-3.3.1-1.1.5-2.4.6-3.6.3-4.8-1.3-8.8-4.2-10.8-8.5-.8-1.7-.5-3.7.8-5.1l2.2-2.4c.5-.6 1.4-.7 2-.1l3.5 3.2c.6.6.7 1.5.1 2.1l-1.2 1.5c1.4 2.1 3.3 3.8 5.6 4.9l1-1.4c.5-.7 1.4-.9 2.1-.5l4.3 2.5c.8.5 1.1 1.5.7 2.3z"/></svg>`);
 if(id==="telegram") return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#229ed9"/><path fill="#fff" d="M24 49.2 72.7 29c2.2-.9 4.2 1.1 3.4 3.3L57.8 72.9c-.7 2-3.5 2.1-4.3.2l-8.8-17.8-17.9-4.9c-2.3-.6-2.5-4.3-.8-5.2zm24.2 4.1 5.2 10.5 10.4-27.1-25.5 10.6 9.9 2.9z"/></svg>`);
 return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#111827"/><path fill="#25f4ee" d="M53 27v30.5c0 6-4.2 10.1-9.3 10.1-4 0-7.2-2.8-7.2-6.2 0-4.3 4-7.3 9.5-7.3 1.3 0 2.6.2 3.8.5V39.5c-8.5 2.5-16.6 8.2-16.6 18.4 0 8.3 6.7 14.2 15.4 14.2 10.7 0 17.7-7.3 17.7-18.4V42.2c4.1 4 8.9 6.5 14.8 6.7V38.1c-7-.7-12.4-4.8-14.8-11.1H53z"/><path fill="#fe2c55" d="M56 24v30.5c0 6-4.2 10.1-9.3 10.1-4 0-7.2-2.8-7.2-6.2 0-4.3 4-7.3 9.5-7.3 1.3 0 2.6.2 3.8.5V36.5c-8.5 2.5-16.6 8.2-16.6 18.4 0 8.3 6.7 14.2 15.4 14.2 10.7 0 17.7-7.3 17.7-18.4V39.2c4.1 4 8.9 6.5 14.8 6.7V35.1C77.4 34.4 72 30.3 69.6 24H56z"/></svg>`);
}
for(const id of Object.keys(socialThemes)){socialThemes[id].logo=socialLogoDataUrl(id)}

const types:TypeMeta[]=[
 {id:"url",label:"Website",note:"Open any link",icon:Link2,group:"Popular"},{id:"text",label:"Text",note:"Share a message",icon:MessageCircle,group:"Popular"},{id:"wifi",label:"Wi-Fi",note:"Share network access",icon:Wifi,group:"Popular"},{id:"vcard",label:"Contact",note:"Digital business card",icon:UserRound,group:"Popular"},{id:"image",label:"Image · Offline",note:"Embed an image in the QR",icon:ImagePlus,group:"Popular"},
 {id:"whatsapp",label:"WhatsApp",note:"Start a chat",icon:MessageCircle,group:"Social"},{id:"instagram",label:"Instagram",note:"Open a profile",icon:Instagram,group:"Social"},{id:"facebook",label:"Facebook",note:"Open a page",icon:Facebook,group:"Social"},{id:"youtube",label:"YouTube",note:"Open a video or channel",icon:Youtube,group:"Social"},{id:"tiktok",label:"TikTok",note:"Open a profile",icon:Play,group:"Social"},{id:"telegram",label:"Telegram",note:"Open a profile or chat",icon:Send,group:"Social"},
 {id:"email",label:"Email",note:"Compose an email",icon:Mail,group:"Contact"},{id:"phone",label:"Phone",note:"Call a number",icon:Phone,group:"Contact"},{id:"sms",label:"SMS",note:"Send a message",icon:MessageCircle,group:"Contact"},{id:"location",label:"Location",note:"Open a place",icon:MapPin,group:"Contact"},
 {id:"app",label:"App",note:"Open an app store link",icon:Smartphone,group:"Business"},{id:"pdf",label:"PDF",note:"Open a document",icon:FileText,group:"Business"},{id:"video",label:"Video",note:"Open a video",icon:Video,group:"Business"},{id:"menu",label:"Menu",note:"Open a digital menu",icon:Menu,group:"Business"},{id:"event",label:"Event",note:"Share event details",icon:Ticket,group:"Business"},{id:"review",label:"Review",note:"Send customers to reviews",icon:Star,group:"Business"},
 {id:"paypal",label:"PayPal",note:"Open a payment link",icon:Zap,group:"Payments"},{id:"bitcoin",label:"Bitcoin",note:"Bitcoin payment URI",icon:Zap,group:"Payments"},{id:"twofa",label:"2FA",note:"Authenticator setup",icon:Settings2,group:"Advanced"}
];

const isRecord=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const allowedTypes=new Set<TypeId>(types.map(t=>t.id));
const allowedPatterns=new Set<Pattern>(["square","rounded","dots","diamond","bars","pill","hex","leaf"]);
const allowedFinders=new Set<Finder>(["square","rounded","circle","diamond"]);
const allowedEC=new Set<EC>(["L","M","Q","H"]);
const allowedFrames=new Set<FrameStyle>(["none","soft","badge","scan","ticket","ribbon","outline","corner","stamp"]);
function normalizeImportedProject(value:unknown):Project|null{
  if(!isRecord(value)||typeof value.id!=="string"||!value.id||value.id.length>120||typeof value.name!=="string"||!value.name.trim()||value.name.length>100||typeof value.type!=="string"||!allowedTypes.has(value.type as TypeId)||!isRecord(value.form)||!isRecord(value.design))return null;
  const formKeys=Object.keys(initialForm) as (keyof FormState)[];
  const form={...initialForm} as FormState;
  for(const k of formKeys){const v=value.form[k as string];if(v!==undefined&&typeof v!=="string")return null;if(typeof v==="string")form[k]=v.slice(0,100000);}
  form.password="";form.twofaSecret="";
  const d=value.design;
  if(d.fg!==undefined&&typeof d.fg!=="string"||d.bg!==undefined&&typeof d.bg!=="string"||d.accent!==undefined&&typeof d.accent!=="string")return null;
  const design={...initialDesign,...d} as DesignState;
  if(!/^#[0-9a-f]{6}$/i.test(design.fg)||!/^#[0-9a-f]{6}$/i.test(design.bg)||!/^#[0-9a-f]{6}$/i.test(design.accent)||!/^#[0-9a-f]{6}$/i.test(design.gradientEnd||design.accent))return null;
  if(!allowedPatterns.has(design.bodyShape)||!allowedFinders.has(design.finder)||!allowedEC.has(design.ec)||!allowedFrames.has(design.frameStyle))return null;
  design.size=Math.max(256,Math.min(4096,Number.isFinite(Number(design.size))?Number(design.size):initialDesign.size));
  design.margin=Math.max(MIN_MARGIN,Math.min(32,Number.isFinite(Number(design.margin))?Number(design.margin):initialDesign.margin));
  design.logoSize=Math.max(5,Math.min(25,Number.isFinite(Number(design.logoSize))?Number(design.logoSize):initialDesign.logoSize));
  if(design.logo!==null&&typeof design.logo!=="string")return null;
  if(typeof design.logo==="string"&&design.logo.length>2_000_000)return null;
  if(typeof design.title!=="string"||typeof design.subtitle!=="string"||typeof design.cta!=="string")return null;
  design.title=design.title.slice(0,32);design.subtitle=design.subtitle.slice(0,48);design.cta=design.cta.slice(0,20);
  const thumb=typeof value.thumbnail==="string"&&value.thumbnail.startsWith("data:image/")&&value.thumbnail.length<=1_500_000?value.thumbnail:"";
  if(!thumb)return null;
  const tags=Array.isArray(value.tags)?value.tags.filter((x):x is string=>typeof x==="string").map(x=>x.slice(0,40)).slice(0,8):[];
  const updated=Number(value.updated);
  return {id:value.id,name:value.name.trim(),type:value.type as TypeId,form,design,updated:Number.isFinite(updated)?updated:Date.now(),thumbnail:thumb,favorite:value.favorite===true,tags};
}

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
 ["google","Google Review","Business","Review shortcut","#155e75","#ecfeff","#06b6d4","square","square",false,"Tell us","Your feedback matters","REVIEW"],
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
 ["twofa","Security","Advanced","Authenticator setup","#1f2937","#f9fafb","#64748b","square","square",false,"Secure access","Scan to set up","SET UP"],
 ["glass","Glass","Modern","Soft translucent look","#1e293b","#f8fafc","#6366f1","pill","circle",true,"Scan softly","A clean modern experience","OPEN"],
 ["hex-tech","Hex Tech","Modern","Technical geometric style","#0f3b4a","#effcff","#06b6d4","hex","diamond",false,"Tech inside","Explore the details","OPEN"],
 ["leaf-natural","Leaf Natural","Nature","Organic and calm","#166534","#f4fbf3","#65a30d","leaf","circle",true,"Stay natural","Scan for more","DISCOVER"],
 ["luxury","Luxury","Premium","Elegant premium card","#3b2a14","#fffaf0","#c79a45","diamond","rounded",true,"A little luxury","Details worth seeing","EXPLORE"],
 ["mono-stamp","Mono Stamp","Minimal","Editorial black and white","#111111","#ffffff","#111111","pill","diamond",false,"READ MORE","Scan the code","OPEN"],
 ["ribbon-sale","Ribbon","Commerce","Promotional product card","#7f1d1d","#fff7f7","#dc2626","bars","rounded",true,"Special offer","Scan for today's deal","SHOP"],
 ["corner-frame","Corner","Minimal","Architectural corner frame","#172554","#f8fbff","#3b82f6","rounded","circle",false,"Discover","Open the details","OPEN"],
 ["outline-frame","Outline","Universal","Clean outlined frame","#334155","#ffffff","#64748b","square","rounded",false,"Scan here","Simple and direct","SCAN"],
 ["stamp-frame","Stamp","Events","Ticket-like event card","#831843","#fff1f2","#e11d48","dots","diamond",true,"You're invited","Scan for event details","VIEW EVENT"],
 ["playful","Playful","Friendly","Bright rounded style","#164e63","#ecfeff","#14b8a6","pill","circle",true,"Hello there","Scan and discover","LET'S GO"],
 ["soft-lavender","Lavender","Friendly","Dreamy soft purple","#5b21b6","#faf5ff","#a78bfa","leaf","rounded",true,"Welcome","Scan to continue","OPEN"]
].map(x=>({id:x[0],name:x[1],category:x[2],note:x[3],fg:x[4],bg:x[5],accent:x[6],pattern:x[7] as Pattern,finder:(x[8]==="circle"?"rounded":x[8]) as Finder,gradient:x[9] as boolean,title:x[10],subtitle:x[11],cta:x[12]})) as Template[];
const templateFrameMap:Record<string,FrameStyle>={clean:"outline",minimal:"corner",soft:"soft",business:"badge",corporate:"outline",agency:"ribbon",menu:"ticket",cafe:"soft",bakery:"badge",restaurant:"ribbon",social:"badge",creator:"badge",instagram:"badge",video:"scan",event:"stamp",wedding:"soft",party:"ribbon",contact:"outline",freelancer:"corner",portfolio:"outline",job:"stamp",wifi:"badge",review:"badge",google:"outline",payment:"ribbon",donation:"soft",product:"corner","menu-dark":"ribbon",midnight:"scan",neon:"ribbon","soft-blue":"soft",green:"outline",education:"outline","real-estate":"corner",medical:"outline",app:"badge",twofa:"stamp",glass:"badge","hex-tech":"outline","leaf-natural":"corner",luxury:"stamp","mono-stamp":"stamp","ribbon-sale":"ribbon","corner-frame":"corner","outline-frame":"outline","stamp-frame":"stamp",playful:"badge","soft-lavender":"soft"};
const templates:Template[]=templateData.map(t=>({...t,frame:templateFrameMap[t.id]||"badge"}));

const colors=["#17213b","#6d5dfc","#e747a4","#0f766e","#2563eb","#c75b1d","#7b3f18","#15803d","#111827"];

function dataUrlBlob(url:string){const [meta,b64]=url.split(",");const bin=atob(b64);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:meta.match(/:(.*?);/)?.[1]||"image/png"});}
function downloadBlob(blob:Blob,name:string){
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=name;a.rel="noopener";a.style.display="none";
  document.body.appendChild(a);
  try{a.click()}finally{a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1500)}
}
function safeName(s:string){return(s||"qraft-qr").replace(/[^a-z0-9-_]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,55)||"qraft-qr";}

async function embedImageFile(file:File):Promise<{data:string;name:string}> {
 const img=await new Promise<HTMLImageElement>((resolve,reject)=>{
   const i=new Image();
   const url=URL.createObjectURL(file);
   i.onload=()=>{URL.revokeObjectURL(url);resolve(i)};
   i.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Image could not be read"))};
   i.src=url;
 });
 // Standard, self-contained data URL. This is still offline; the QR contains the image bytes.
 // Keep it compact enough for a real QR and progressively reduce dimensions/quality for ordinary photos.
 const maxBase64=3400;
 const attempts=[[256,.62],[240,.60],[224,.58],[208,.56],[192,.54],[176,.52],[160,.50],[144,.48],[128,.46],[112,.44],[96,.42],[80,.40],[72,.36],[64,.32],[56,.28],[48,.24]] as const;
 for(const [side,quality] of attempts){
   const c=document.createElement("canvas"); c.width=side;c.height=side;
   const ctx=c.getContext("2d"); if(!ctx) continue;
   ctx.fillStyle="#fff";ctx.fillRect(0,0,side,side);
   const scale=Math.min(side/img.width,side/img.height);
   const w=Math.max(1,Math.round(img.width*scale));
   const h=Math.max(1,Math.round(img.height*scale));
   ctx.drawImage(img,Math.round((side-w)/2),Math.round((side-h)/2),w,h);
   const dataUrl=c.toDataURL("image/jpeg",quality);
   const parts=dataUrl.split(",");
   if(parts.length===2 && parts[0].includes("image/jpeg") && parts[1].length<=maxBase64){
     return {data:dataUrl,name:file.name};
   }
 }
 throw new Error("This image still cannot fit inside a standard QR. Qraft needs a smaller thumbnail because QR data capacity is limited.");
}


type View = "landing"|"create"|"templates"|"tools"|"projects"|"scanner"|"privacy"|"terms"|"developer";

type ThemeMode="light"|"dark";

function applyTheme(mode:ThemeMode){
 const root=document.documentElement;
 const resolved=mode;
 root.dataset.theme=resolved;
 root.style.colorScheme=resolved;
}

function Header({view,onNavigate,onHome}:{view:View;onNavigate:(v:View)=>void;onHome:()=>void}){
 const items:[View,string][]=[["create","Create"],["templates","Templates"],["tools","Tools"],["projects","Projects"],["scanner","Scan & test"]];
 const [online,setOnline]=useState(()=>navigator.onLine);
 const [installEvent,setInstallEvent]=useState<any>(null);
 const [theme,setTheme]=useState<ThemeMode>(()=>{const stored=localStorage.getItem("qraft-theme");return stored==="dark"?"dark":"light"});
 useEffect(()=>{
   applyTheme(theme);

 },[theme]);
 useEffect(()=>{const onOnline=()=>setOnline(true),onOffline=()=>setOnline(false),onInstall=(e:any)=>{e.preventDefault();setInstallEvent(e)},onInstalled=()=>setInstallEvent(null);window.addEventListener("online",onOnline);window.addEventListener("offline",onOffline);window.addEventListener("beforeinstallprompt",onInstall as EventListener);window.addEventListener("appinstalled",onInstalled);return()=>{window.removeEventListener("online",onOnline);window.removeEventListener("offline",onOffline);window.removeEventListener("beforeinstallprompt",onInstall as EventListener);window.removeEventListener("appinstalled",onInstalled)}},[]);
 const install=async()=>{if(!installEvent)return;try{await installEvent.prompt()}catch{/* browser declined or does not support the prompt */}finally{setInstallEvent(null)}};
 const nextTheme=()=>{const next:ThemeMode=theme==="dark"?"light":"dark";setTheme(next);localStorage.setItem("qraft-theme",next)};
 const ThemeIcon=theme==="dark"?Moon:Sun;
 const themeLabel=theme==="dark"?"Dark mode":"Light mode";
 return <header className="app-header">
   <button className="app-brand" onClick={onHome} aria-label="Qraft home"><img src={LOGO_SRC} alt="Qraft"/><span><b>Qraft</b><small>QR maker, made easy</small></span></button>
   <nav className="app-nav">{items.map(([id,label])=><button key={id} className={view===id?"active":""} onClick={()=>onNavigate(id)}>{label}</button>)}</nav>
   <div className="header-actions">{!online&&<span className="offline-pill" title="Qraft is offline. Local creation and saved projects remain available."><WifiOff size={14}/> Offline</span>}{installEvent&&<button className="header-icon install-action" onClick={()=>void install()} title="Install Qraft"><DownloadCloud size={17}/></button>}<button className="header-icon" onClick={()=>window.dispatchEvent(new Event("qraft:command"))} title="Command palette · Ctrl/⌘ K" aria-label="Open command palette"><Command size={17}/></button><button className="theme-toggle" onClick={nextTheme} title={`Switch to ${theme==="dark"?"Light":"Dark"} mode`} aria-label={`Current theme: ${themeLabel}. Switch to ${theme==="dark"?"Light":"Dark"} mode`}><ThemeIcon size={16}/><span>{theme==="dark"?"Dark":"Light"}</span></button><button className="header-icon" onClick={()=>onNavigate("scanner")} title="Scan and test"><ScanLine size={17}/></button><button className="header-cta" onClick={()=>onNavigate("create")}><QrCode size={16}/> Create QR</button></div>
 </header>
}

function Footer({onNavigate}:{onNavigate:(v:View)=>void}){
 return <footer className="app-footer"><div className="footer-brand"><img src={LOGO_SRC} alt=""/><div><b>Qraft</b><span>Make something worth scanning.</span></div></div><div className="footer-links"><button onClick={()=>onNavigate("privacy")}>Privacy Policy</button><button onClick={()=>onNavigate("terms")}>Terms & Conditions</button><button onClick={()=>onNavigate("developer")}>Developer Details</button></div><span className="footer-copy">© {new Date().getFullYear()} Qraft</span></footer>
}

function Landing({go}:{go:(v:View)=>void}){
 const steps:[string,string,string][]=[["1","Pick a type","Link, Wi-Fi, contact, menu, social and 20+ more."],["2","Add your info","Live checks tell you what is missing before export."],["3","Make it cute","Palettes, shapes, logo and a frame — then download."]];
 const perks:[LucideIcon,string,string][]=[[ShieldCheck,"Scan-checked","Every download is decoded first, so it works."],[Palette,"Sweet palettes","One-click colours that stay readable."],[Layers,"Logos & frames","Add your logo with a safe clear zone."],[Download,"PNG · SVG · PDF","Vector SVG stays sharp on any print."],[FolderOpen,"Local projects","Saved on your device — nothing is uploaded."],[Zap,"Batch mode","Make hundreds of codes from a list."]];
 return <div className="landing-new sweet"><Header view="landing" onNavigate={go} onHome={()=>go("landing")}/>
   <section className="sw-hero"><div className="sw-hero-copy">
     <span className="sw-pill"><Sparkles size={14}/> Free · works offline · no sign-up</span>
     <h1>Cute QR codes that <em>really scan</em></h1>
     <p>Pick a type, add your info, sprinkle on colours and a logo. Qraft double-checks the code scans before you download it.</p>
     <div className="sw-cta"><button className="sw-btn" onClick={()=>go("create")}><QrCode size={18}/> Make my QR <ArrowRight size={16}/></button><button className="sw-btn ghost" onClick={()=>go("templates")}><LayoutTemplate size={16}/> Browse templates</button></div>
     <ul className="sw-trust"><li><Check size={14}/> Private &amp; local</li><li><Check size={14}/> Built-in scan test</li><li><Check size={14}/> Print-ready</li></ul>
   </div><div className="sw-stage"><span className="sw-blob b1"/><span className="sw-blob b2"/>
     <div className="sw-card"><small>DEVELOPER PORTFOLIO</small><h3>Bibek Bista</h3><p>Scan to explore my portfolio</p><div className="sw-qr"><MiniQR fg="#5b3a63" bg="#ffffff" ec="H" pattern="rounded" finder="rounded"/><div className="qr-badge"><img src={LOGO_SRC} alt="Qraft"/></div></div><span className="sw-scan">SCAN TO VISIT</span></div>
     <div className="sw-sticker s1"><ShieldCheck size={15}/> Scan verified</div><div className="sw-sticker s2"><Palette size={15}/> 8 sweet palettes</div><div className="sw-sticker s3"><Sparkles size={15}/> Logos &amp; frames</div>
   </div></section>
   <section className="sw-steps">{steps.map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</section>
   <section className="sw-perks"><h2>Everything you need, nothing you don't</h2><div>{perks.map(([Ic,t,d])=><article key={t}><Ic size={22}/><h3>{t}</h3><p>{d}</p></article>)}</div></section>
   <section className="sw-final"><h2>Ready to make something cute?</h2><p>It takes about a minute.</p><button className="sw-btn" onClick={()=>go("create")}><QrCode size={18}/> Start creating</button></section>
   <Footer onNavigate={go}/>
 </div>
}

function TypeTile({t,active,onClick}:{t:TypeMeta;active:boolean;onClick:(id:TypeId)=>void}){const I=t.icon;const brand=socialThemes[t.id]?.logo;return <button className={active?"type-tile active":"type-tile"} onClick={()=>onClick(t.id)}><span className="type-icon">{brand?<img src={brand} alt=""/>:<I size={18}/>}</span><span><b>{t.label}</b><small>{t.note}</small></span>{active&&<Check size={15}/>} </button>}

function Field({label,children,help}:{label:string;children:ReactNode;help?:string}){return <label className="field"><span>{label}</span>{children}{help&&<small>{help}</small>}</label>}
function ContentForm({type,form,update}:{type:TypeId;form:FormState;update:(k:keyof FormState,v:string)=>void}){
 const input=(k:keyof FormState,placeholder:string)=> <input value={String(form[k]??"")} onChange={e=>update(k,e.target.value)} placeholder={placeholder}/>;
 if(type==="url") return <><Field label="Website URL" help="Use https:// for a direct web destination.">{input("url","https://example.com")}</Field></>;
 if(type==="text") return <Field label="Text message">{<textarea value={form.text} onChange={e=>update("text",e.target.value)} placeholder="Write anything you want to share..."/>}</Field>;
 if(type==="email") return <div className="field-grid"><Field label="Email">{input("email","hello@example.com")}</Field><Field label="Subject">{input("subject","Hello from Qraft")}</Field><Field label="Message">{<textarea value={form.body} onChange={e=>update("body",e.target.value)} placeholder="Optional message"/>}</Field></div>;
 if(type==="phone") return <Field label="Phone number">{input("phone","+977 98XXXXXXXX")}</Field>;
 if(type==="sms") return <div className="field-grid"><Field label="Phone number">{input("phone","+977 98XXXXXXXX")}</Field><Field label="Message">{<textarea value={form.smsBody} onChange={e=>update("smsBody",e.target.value)} placeholder="Your SMS message"/>}</Field></div>;
 if(type==="wifi") return <div className="field-grid"><Field label="Network name (SSID)">{input("ssid","My Wi-Fi")}</Field><Field label="Password" help="Passwords are never written to saved projects.">{input("password","Network password")}</Field><Field label="Security"><select value={form.security} onChange={e=>update("security",e.target.value)}><option>WPA</option><option>WEP</option><option>nopass</option></select></Field></div>;
 if(type==="vcard") return <div className="field-grid"><Field label="First name">{input("firstName","Bibek")}</Field><Field label="Last name">{input("lastName","Bista")}</Field><Field label="Organization">{input("organization","Your company")}</Field><Field label="Phone">{input("contactPhone","+977 ...")}</Field><Field label="Email">{input("contactEmail","hello@example.com")}</Field></div>;
 if(["instagram","facebook","youtube","tiktok","telegram","whatsapp"].includes(type)) return <div className="field-grid"><Field label="Profile / destination URL" help="Use a direct URL for reliable scanning.">{input("socialUrl","https://...")}</Field><Field label="Username (optional)">{input("username","@yourname")}</Field>{type==="whatsapp"&&<Field label="Phone number">{input("phone","+977 ...")}</Field>}</div>;
 if(type==="location") return <div className="field-grid"><Field label="Latitude">{input("lat","28.3949")}</Field><Field label="Longitude">{input("lng","84.1240")}</Field><Field label="Place label">{input("address","Kathmandu, Nepal")}</Field></div>;
 if(["pdf","video","menu"].includes(type)) return <Field label="Destination URL" help="Qraft stores the link in the QR. Hosting is required to open it elsewhere.">{input("fileUrl","https://example.com/file")}</Field>;
 if(type==="image") return <ImageQrField form={form} update={update}/>;
 if(type==="app") return <Field label="App / store URL">{input("appUrl","https://play.google.com/...")}</Field>;
 if(type==="event") return <div className="field-grid"><Field label="Event name">{input("eventName","Qraft Meetup")}</Field><Field label="Start (date &amp; time)">{input("eventStart","2026-09-28 18:00")}</Field><Field label="End (date &amp; time)">{input("eventEnd","2026-09-28 20:00")}</Field><Field label="Location">{input("eventLocation","Kathmandu")}</Field><Field label="Description"><textarea value={form.eventDescription} onChange={e=>update("eventDescription",e.target.value)} placeholder="Event details"/></Field></div>;
 if(type==="review") return <Field label="Review URL">{input("reviewUrl","https://g.page/your-place/review")}</Field>;
 if(type==="paypal") return <Field label="PayPal URL">{input("paypal","https://paypal.me/...")}</Field>;
 if(type==="bitcoin") return <Field label="Bitcoin address">{input("bitcoin","bc1...")}</Field>;
 return <div className="field-grid"><Field label="Secret" help="Base32 secret. Never written to saved projects.">{input("twofaSecret","JBSWY3DPEHPK3PXP")}</Field><Field label="Issuer">{input("twofaIssuer","Qraft")}</Field><Field label="Account">{input("twofaAccount","you@example.com")}</Field></div>;
}

function ImageQrField({form,update}:{form:FormState;update:(k:keyof FormState,v:string)=>void}){
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [dragging,setDragging]=useState(false); const inputRef=useRef<HTMLInputElement>(null);
 const choose=async(file?:File)=>{
  if(!file)return;
  if(!file.type.startsWith("image/")){setError("Please choose a JPG, PNG or WEBP image.");return}
  if(file.size>8*1024*1024){setError("Image must be 8 MB or smaller. Qraft compresses it before embedding it in the QR.");return}
  setError("");setBusy(true);
  try{const out=await embedImageFile(file);update("imageData",out.data);update("imageName",out.name);update("imageAlt",file.name.replace(/\.[^.]+$/,""))}
  catch(e){setError(e instanceof Error?e.message:"Image could not be embedded.")}
  finally{setBusy(false)}
 };
 return <div className="image-editor"><div className="image-editor-copy"><div className="image-editor-icon"><ImagePlus size={20}/></div><div><b>Image inside the QR · offline</b><span>The image is compressed into the QR itself as a self-contained data URL. No image hosting or internet is needed.</span></div></div><label className={`image-drop ${dragging?"dragging":""}`} onDragEnter={e=>{e.preventDefault();setDragging(true)}} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={e=>{e.preventDefault();setDragging(false)}} onDrop={e=>{e.preventDefault();setDragging(false);choose(e.dataTransfer.files?.[0])}}><Upload size={23}/><b>{busy?"Preparing image…":dragging?"Release to embed the image":form.imageName||"Drop image here or choose a file"}</b><small>JPG, PNG or WEBP · max 8 MB · Qraft creates a compact offline image QR</small><input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e=>choose(e.target.files?.[0])}/><span className="image-choose-button">Choose image</span></label>{form.imageData&&<div className="embedded-preview"><span>Embedded preview</span><img src={form.imageData} alt={form.imageAlt||"Embedded"}/><div><b>Stored inside the QR</b><small>The image bytes travel with the QR. Qraft can recover them offline.</small></div><button onClick={()=>{update("imageData","");update("imageName","")}}><Trash2 size={15}/> Remove</button></div>}{error&&<div className="field-error">{error}</div>}</div>
}

function QRHealth({design,payload}:{design:DesignState;payload:string}){
 const contrast=(a:string,b:string)=>{const lum=(hex:string)=>{const h=hex.replace("#","");const n=parseInt(h.length===3?h.split("").map(x=>x+x).join(""):h,16);const c=[(n>>16)&255,(n>>8)&255,n&255].map(v=>v/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 let score=100;const warnings:string[]=[];const ratio=contrast(design.fg,design.bg);
 if(ratio<4.5){score-=20;warnings.push("Contrast below 4.5:1")};
 if(design.inkGradient){const end=design.gradientEnd||design.accent;const endRatio=contrast(end,design.bg);if(endRatio<3){score-=25;warnings.push("Gradient end is too light")}}
 if(design.margin<4){score-=30;warnings.push("Quiet zone is too small")};
 if(design.logoEnabled && design.logo && design.logoSize>14){score-=12;warnings.push("Logo is large")};
 if(payload.length>900){score-=Math.min(20,Math.ceil((payload.length-900)/250)*5);warnings.push("Payload is dense")};
 const status=score>=90?"Excellent":score>=75?"Good":score>=60?"Needs care":"High risk";
 return <div className={`qr-health health-${status.toLowerCase().replace(/ /g,"-")}`}><div className="qr-health-head"><div><span className="page-eyebrow">QR HEALTH</span><b>{status}</b></div><strong>{score}/100</strong></div><div className="qr-health-bar"><span style={{width:`${Math.max(0,score)}%`}}/></div><div className="qr-health-items"><span className={ratio>=4.5?'ok':''}>● Contrast {ratio.toFixed(1)}:1</span><span className={design.margin>=4?'ok':''}>● Quiet zone {Math.max(4,design.margin)}</span><span className={design.logoSize<=14?'ok':''}>● Logo {design.logoEnabled && design.logo?`${design.logoSize}%`:'None'}</span></div>{warnings.length>0&&<small>{warnings.join(" · ")}</small>}</div>
}
function DesignControls({design,update,updateMany,onLogo,onReset,payload,templateMode=false,templateSection="all"}:{design:DesignState;update:<K extends keyof DesignState>(k:K,v:DesignState[K])=>void;updateMany:(p:Partial<DesignState>)=>void;onLogo:(e:ChangeEvent<HTMLInputElement>)=>void;onReset:()=>void;payload:string;templateMode?:boolean;templateSection?:"all"|"appearance"|"shape"|"branding"|"advanced"}){
 const show=(section:"appearance"|"shape"|"branding"|"advanced")=>!templateMode||templateSection==="all"||templateSection===section;
 return <div className={templateMode?"design-panel template-design-panel":"design-panel"}>
   {!templateMode&&<div className="design-head"><div><span className="eyebrow">STYLE / 03</span><h2>Make it feel yours.</h2></div><button className="text-button" onClick={onReset}>Reset</button></div>}
   {show("appearance")&&<div className="control-group template-control-section"><div className="control-title">Appearance</div><div className="field-grid"><Field label="Headline"><input value={design.title} onChange={e=>update("title",e.target.value)} maxLength={32}/></Field><Field label="Supporting line"><input value={design.subtitle} onChange={e=>update("subtitle",e.target.value)} maxLength={48}/></Field><Field label="CTA pill"><input value={design.cta} onChange={e=>update("cta",e.target.value)} maxLength={20}/></Field></div><div className="color-grid"><ColorPicker label="QR ink" value={design.fg} onChange={v=>update("fg",v)}/><ColorPicker label="Background" value={design.bg} onChange={v=>update("bg",v)}/><ColorPicker label="Accent" value={design.accent} onChange={v=>update("accent",v)}/></div><div className="swatch-row">{colors.map(c=><button key={c} className="color-swatch" style={{background:c}} aria-label={c} onClick={()=>update("fg",c)}/>)}</div><div className="check-grid"><label><input type="checkbox" checked={design.gradient} onChange={e=>update("gradient",e.target.checked)}/><span>Soft background glow</span></label><label><input type="checkbox" checked={design.transparent} onChange={e=>update("transparent",e.target.checked)}/><span>Transparent PNG</span></label></div><div className="gradient-control"><label><input type="checkbox" checked={!!design.inkGradient} onChange={e=>updateMany({inkGradient:e.target.checked})}/><span>Gradient QR ink</span></label>{design.inkGradient&&<div className="field-grid"><ColorPicker label="Gradient end" value={design.gradientEnd||design.accent} onChange={v=>update("gradientEnd",v)}/></div>}</div></div>}
   {show("shape")&&<div className="control-group template-control-section"><div className="control-title">Shape & structure</div><div className="style-choice-block"><span>Body shape</span><div className="style-choice-grid">{([['square','Square'],['rounded','Rounded'],['dots','Dots'],['diamond','Diamond'],['bars','Bars'],['pill','Pill'],['hex','Hex'],['leaf','Leaf']] as [BodyShape,string][]).map(([id,label])=><button key={id} className={design.bodyShape===id?'selected':''} onClick={()=>updateMany({bodyShape:id})}><span className={`shape-icon shape-${id}`}/>{label}</button>)}</div></div><div className="style-choice-block"><span>Finder shape</span><div className="style-choice-grid compact-three">{([['square','Square'],['rounded','Rounded'],['circle','Circle'],['diamond','Diamond']] as [Finder,string][]).map(([id,label])=><button key={id} className={design.finder===id?'selected':''} onClick={()=>update('finder',id)}><span className={`finder-icon finder-${id}`}/>{label}</button>)}</div></div><div className="style-choice-block"><span>Frames</span><div className="style-choice-grid frame-choices">{([['none','None'],['soft','Soft'],['badge','Badge'],['scan','Scan'],['ticket','Ticket'],['ribbon','Ribbon'],['outline','Outline'],['corner','Corner'],['stamp','Stamp']] as [FrameStyle,string][]).map(([id,label])=><button key={id} className={design.frameStyle===id?'selected':''} onClick={()=>updateMany({frameStyle:id,frame:id!=='none'})}><span className={`frame-icon frame-icon-${id}`}/>{label}</button>)}</div></div><div className="field-grid"><Field label="Error correction" help={design.logoEnabled && design.logo?"Locked to Highest while a logo is enabled.":undefined}><select value={design.logoEnabled && design.logo?"H":design.ec} disabled={!!(design.logoEnabled && design.logo)} onChange={e=>update("ec",e.target.value as EC)}><option value="L">Low</option><option value="M">Medium</option><option value="Q">High</option><option value="H">Highest</option></select></Field><Field label="Resolution"><input type="range" min="512" max="2400" step="64" value={design.size} onChange={e=>update("size",Number(e.target.value))}/><small>{design.size}px</small></Field><Field label="Quiet zone"><input type="range" min="4" max="10" value={Math.max(MIN_MARGIN,design.margin)} onChange={e=>update("margin",Number(e.target.value))}/><small>{Math.max(MIN_MARGIN,design.margin)} modules</small></Field><Field label="Corner radius"><input type="range" min="0" max="48" value={design.radius} onChange={e=>update("radius",Number(e.target.value))}/></Field></div></div>}
   {show("branding")&&<div className="control-group template-control-section"><div className="control-title">Branding</div><div className="branding-toggle-row"><div><b>Use a logo</b><small>Keep your uploaded logo saved, but turn it off whenever you want a clean QR.</small></div><button type="button" role="switch" aria-checked={!!(design.logoEnabled&&design.logo)} className={`toggle-switch ${design.logoEnabled&&design.logo?'on':''}`} onClick={()=>design.logo&&update("logoEnabled",!design.logoEnabled)} disabled={!design.logo}><span/></button></div><div className="logo-drop"><div className="logo-preview"><span>{design.logo?"Your logo":"Logo"}</span>{design.logo&&<img src={design.logo} alt="Uploaded logo"/>}</div><div className="logo-copy"><b>{design.logoName||"Add your brand mark"}</b><small>{design.logo ? (design.logoEnabled?"Logo is active. Qraft reserves a safe clear zone.":"Logo is off. The QR will render without it.") : "Upload a logo if you want one on the QR."}</small><div className="logo-actions"><label className="upload-button"><Upload size={15}/> {design.logo?"Replace logo":"Upload logo"}<input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo}/></label>{design.logo&&<button type="button" className="text-button danger-text" onClick={()=>updateMany({logo:null,logoName:"",logoPreset:false,logoEnabled:false})}>Remove</button>}</div></div></div><Field label="Logo size"><input type="range" min="7" max="16" value={design.logoSize} disabled={!design.logoEnabled||!design.logo} onChange={e=>update("logoSize",Number(e.target.value))}/></Field></div>}
   {show("advanced")&&<><QRHealth design={design} payload={payload}/><div className="control-group advanced-box template-control-section"><button className="advanced-trigger" onClick={()=>update("advanced",!design.advanced)}><span><SlidersHorizontal size={16}/> Advanced finish</span>{design.advanced?<ChevronDown size={16}/>:<ArrowRight size={16}/>}</button>{design.advanced&&<div className="advanced-content"><p>Qraft keeps the QR data matrix standards-safe. Visual personality is applied to colors and the surrounding card so the encoded modules are not manually repainted.</p><div className="preset-row"><button className="soft" onClick={()=>updateMany({ec:"H",margin:6,logoSize:Math.min(10,design.logoSize)})}><ShieldCheck size={14}/> Safe scan preset</button><button className="soft" onClick={()=>updateMany({ec:"H",margin:7,size:1600})}><FileImage size={14}/> Print preset</button></div></div>}</div></>}
 </div>
}
function ColorPicker({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="color-picker"><span>{label}</span><input type="color" value={value} onChange={e=>onChange(e.target.value)}/><code>{value}</code></label>}

function PreviewCard({payload,design}:{payload:string;design:DesignState}){
 const ref=useRef<HTMLCanvasElement>(null);
 const artRef=useRef<HTMLDivElement>(null);
 const [rendering,setRendering]=useState(false);
 const [renderError,setRenderError]=useState("");
 const [previewScale,setPreviewScale]=useState(1);
 const renderId=useRef(0);
 useEffect(()=>{
   const el=artRef.current;
   if(!el)return;
   const updateScale=()=>{
     const availableW=Math.max(1,el.clientWidth-20);
     const availableH=Math.max(1,el.clientHeight-20);
     const scale=Math.max(.28,Math.min(1,availableW/560,availableH/616));
     setPreviewScale(prev=>Math.abs(prev-scale)>.008?scale:prev);
   };
   updateScale();
   const ro=new ResizeObserver(updateScale);
   ro.observe(el);
   return()=>ro.disconnect();
 },[]);
 useEffect(()=>{
   let alive=true;
   const id=++renderId.current;
   setRendering(true);setRenderError("");
   (async()=>{
     try{
       const c=await renderQR(payload,design,1100);
       if(!alive||id!==renderId.current||!ref.current)return;
       const target=ref.current;
       target.width=c.width;target.height=c.height;
       const ctx=target.getContext("2d");
       if(!ctx)throw new Error("Preview canvas unavailable");
       ctx.clearRect(0,0,target.width,target.height);ctx.drawImage(c,0,0);
       setRendering(false);
     }catch(error){
       if(!alive||id!==renderId.current||!ref.current)return;
       setRenderError(error instanceof Error ? error.message : "Preview could not render this content yet.");
       setRendering(false);
     }
   })();
   return()=>{alive=false};
 },[payload,design]);
 const sheetStyle={borderRadius:design.radius,background:design.gradient?`linear-gradient(145deg,${design.bg},${design.accent}26)`:design.bg,color:design.fg};
 return <div className="clean-preview">
   <div className="preview-zone-top">
     <div className="preview-zone-title"><span className="eyebrow"><Sparkles size={14}/> LIVE PREVIEW</span><small>{rendering?"Updating your QR…":"Live changes appear here instantly."}</small></div>
     <span className="live-pill"><span className="live-dot"/>{rendering?"Updating":"Live"}</span>
   </div>
   <div className="clean-preview-art" ref={artRef}>
     <div className="preview-poster-wrap" style={{width:560*previewScale,height:616*previewScale}}>
       <div className={`clean-preview-sheet frame-${design.frameStyle||"badge"}`} style={{...sheetStyle,transform:`scale(${previewScale})`,transformOrigin:"top left"}}>
         <div className="clean-preview-brand-center"><span>QRAFT</span></div>
         <h3>{design.title||"Scan me"}</h3>
         <p>{design.subtitle||"Open the link"}</p>
         <div className="clean-preview-qr">
           <canvas ref={ref} aria-label="Live QR preview"/>
           {rendering&&<div className="preview-refresh"><Sparkles size={14}/> Updating</div>}
         </div>
         {design.frame&&design.frameStyle!=="none"&&<span className={`preview-cta frame-cta-${design.frameStyle}`} style={{background:["badge","ribbon"].includes(design.frameStyle)?design.fg:"transparent",color:["badge","ribbon"].includes(design.frameStyle)?design.bg:design.fg}}>{design.cta||"SCAN ME"}</span>}
         <div className="clean-preview-footer">Create · Customize · Share</div>
       </div>
     </div>
   </div>
   <div className="preview-chips"><span><Check size={12}/> Full card</span><span>{design.logoEnabled && design.logo?"Logo · EC H":`EC ${design.ec}`}</span><span>{design.size}px export</span></div>
   {renderError&&<div className="preview-render-error">{renderError}</div>}
 </div>
}

function TypeChooser({type,setType}:{type:TypeId;setType:(id:TypeId)=>void}){
 const groups=['Popular','Social','Contact','Business','Payments','Advanced'];
 return <section className="type-chooser-full">
   <div className="all-type-groups">{groups.map(g=><div className="all-type-group" key={g}><div className="all-type-group-head"><h3>{g}</h3><span>{types.filter(t=>t.group===g).length}</span></div><div className="type-grid full-list">{types.filter(t=>t.group===g).map(t=><TypeTile key={t.id} t={t} active={type===t.id} onClick={setType}/>)}</div></div>)}</div>
 </section>
}

function CreatePage({state}:{state:AppState}){
 const {type,setType,form,design,updateForm,updateDesign,payload,busy,setView,resetDesign,testCurrentQR,copyPayload,exportRawPng,exportPng,exportSvg,exportPdf,createStep,setCreateStep,scanTest,undoAction,redoAction,undo,redo,notify}=state;
 const meta=types.find(t=>t.id===type)!;
 const problem=validatePayload(type,form);
  const canBack=createStep>1, canNext=createStep<4;
 const goTo=(n:Step)=>{if(n>2&&problem){setCreateStep(2);notify(problem);return}setCreateStep(n)};
 const goNext=()=>{if(canNext)goTo((createStep+1) as Step)};
 const goBack=()=>{if(canBack)setCreateStep((createStep-1) as Step)};
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(!e.altKey)return;if(e.key==="ArrowRight"){e.preventDefault();goNext()}else if(e.key==="ArrowLeft"){e.preventDefault();goBack()}};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)});
 return <div className="page-shell create-studio-shell"><Header view="create" onNavigate={setView} onHome={()=>setView('landing')}/><main className="create-studio">
   <div className="studio-topbar compact"><div className="studio-title-mini"><span className="studio-spark"><Sparkles size={13}/></span><div><span className="page-eyebrow">QRAFT STUDIO</span><b>Create QR</b></div></div><div className="studio-top-actions"><button className="soft" onClick={undoAction} disabled={!undo.length} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={15}/></button><button className="soft" onClick={redoAction} disabled={!redo.length} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={15}/></button><button className="soft" onClick={()=>setView('templates')}><LayoutTemplate size={15}/> Templates</button><span className="autosave-pill"><span className="autosave-dot"/>Saved automatically</span></div></div>
   <div className="studio-progress" aria-hidden="true"><i style={{width:`${createStep*25}%`}}/></div>
   <div className="studio-frame">
     <aside className="studio-step-rail">
       {([1,2,3,4] as Step[]).map((step)=><button key={step} className={`studio-step-nav ${createStep===step?'active':''} ${createStep>step?'done':''}`} onClick={()=>goTo(step)} aria-current={createStep===step?"step":undefined}><span>{createStep>step?<Check size={14}/>:`0${step}`}</span><div><b>{['Choose','Add info','Design','Export'][step-1]}</b><small>{['Pick the QR type','Enter what it should share','Style and brand it','Test and download'][step-1]}</small></div><ArrowRight size={14}/></button>)}
       <div className="studio-tip"><ShieldCheck size={16}/><div><b>Scan-safe by default</b><span>Qraft keeps the real QR matrix intact and gives logos a safe clearance area.</span></div></div>
     </aside>
     <section className="studio-step-content">
       {createStep===1&&<div className="studio-panel"><div className="studio-panel-head compact"><div><span className="page-eyebrow">01 / CHOOSE</span><b>Pick a QR type</b><span>All {types.length} types are visible below.</span></div><span className="type-count">{meta.label}</span></div><TypeChooser type={type} setType={setType}/></div>}
       {createStep===2&&<div className="studio-panel"><div className="studio-panel-head compact"><div><span className="page-eyebrow">02 / ADD INFO</span><b>{meta.label} details</b><span>{meta.note}</span></div><span className="content-status"><Check size={14}/> Live</span></div><div className="wizard-content-card"><ContentForm type={type} form={form} update={updateForm}/>{problem&&<div className="field-error" role="alert">Needed before export: {problem}</div>}</div></div>}
       {createStep===3&&<div className="studio-panel studio-design-panel"><div className="studio-panel-head compact"><div><span className="page-eyebrow">03 / DESIGN</span><b>Make it yours</b><span>Colors, logo, spacing and finishing.</span></div><button className="soft" onClick={resetDesign}>Reset</button></div><div className="palette-row" role="group" aria-label="Quick palettes">{PALETTES.map(p=><button key={p.name} type="button" className="palette-chip" title={`${p.name} palette`} onClick={()=>state.updateDesignMany({fg:p.fg,bg:p.bg,accent:p.accent,transparent:false})}><i style={{background:p.fg}}/><i style={{background:p.bg}}/><i style={{background:p.accent}}/><span>{p.name}</span></button>)}</div><DesignControls design={design} update={updateDesign} updateMany={state.updateDesignMany} onLogo={state.onLogoFile} onReset={resetDesign} payload={payload}/></div>}
       {createStep===4&&<div className="studio-panel"><div className="studio-panel-head compact"><div><span className="page-eyebrow">04 / EXPORT</span><b>Ready to export</b><span>Verify once, then choose your format.</span></div><span className={`scan-status ${scanTest.state==='passed'?'scan-status-ok':scanTest.state==='failed'?'scan-status-error':''}`}><span/>{scanTest.state==='running'?'Testing…':scanTest.state==='passed'?'Verified':'Ready'}</span></div><div className="export-finish-grid"><div className="finish-check"><div className="finish-icon"><Check size={18}/></div><div><b>QR content ready</b><span>{meta.label} · {payload.length.toLocaleString()} characters of payload</span></div></div><div className="finish-check"><div className="finish-icon"><Palette size={18}/></div><div><b>Design ready</b><span>{design.logo?'Logo added · ':''}{design.ec} error correction · {design.size}px export</span></div></div><div className={`action-feedback ${scanTest.state==='passed'?'passed':scanTest.state==='failed'?'failed':''}`} role="status"><div>{scanTest.state==='passed'?<Check size={15}/>:scanTest.state==='failed'?<X size={15}/>:<ShieldCheck size={15}/>}</div><span>{scanTest.message}</span></div><div className="export-hero"><button type="button" className="primary" onClick={()=>void exportPng()} disabled={busy}><Download size={18}/> {busy?"Checking & preparing…":"Download QR card"}</button><small>PNG · 1400 × 1540 · verified before download</small></div><div className="export-tiles">{([[FileImage,"QR only","PNG, just the code",exportRawPng],[FileText,"Vector SVG","Sharp at any print size",exportSvg],[FileText,"PDF","Print-ready A4 sheet",exportPdf]] as [LucideIcon,string,string,()=>Promise<void>][]).map(([Ic,t,d,fn])=><button key={t} type="button" className="export-tile" onClick={()=>void fn()} disabled={busy}><Ic size={20}/><b>{t}</b><span>{d}</span></button>)}<button type="button" className="export-tile" onClick={()=>void copyPayload()}><Clipboard size={20}/><b>Copy content</b><span>The raw QR text</span></button></div><button type="button" className="soft export-test" onClick={()=>void testCurrentQR()} disabled={busy||scanTest.state==="running"}><ShieldCheck size={16}/> {scanTest.state==="running"?"Testing QR…":"Run scan test"}</button></div></div>}
     </section>
     <aside className="studio-live-preview"><PreviewCard payload={payload} design={design}/></aside>
   </div>
   <div className="studio-navigation"><button className="soft" disabled={!canBack} onClick={goBack}><ArrowLeft size={16}/> Back</button><span>Step {createStep} of 4</span><button className="primary" onClick={canNext?goNext:exportPng} disabled={busy||(createStep===2&&!!problem)} title={createStep===2&&problem?problem:undefined}>{canNext?'Continue':'Download full card'}{canNext&&<ArrowRight size={16}/>}</button></div>
 </main></div>
}

function TemplatesPage({state}:{state:AppState}){
  const {newProject,templateSearch,setTemplateSearch,templateCategory,setTemplateCategory,filteredTemplates,applyTemplate,setView,type,setType,form,design,payload,busy,exportPng,undoAction,redoAction,undo,redo}=state;
  const [selected,setSelected]=useState<string>('');
  const [editorTab,setEditorTab]=useState<"content"|"appearance"|"shape"|"branding"|"advanced">("content");
  const [completed,setCompleted]=useState(false);
  const selectedTemplate=templates.find(t=>t.id===selected);
  const categories=['All',...Array.from(new Set(templates.map(t=>t.category)))];
  const grouped=templateCategory==='All' ? categories.slice(1).map(category=>({category,items:templates.filter(t=>t.category===category&&`${t.name} ${t.note}`.toLowerCase().includes(templateSearch.toLowerCase()))})).filter(g=>g.items.length) : [{category:templateCategory,items:filteredTemplates}];

  useEffect(()=>{
    if(!selected)return;
    const html=document.documentElement;
    const body=document.body;
    html.classList.add("template-editor-active");
    body.classList.add("template-editor-active");
    return()=>{
      html.classList.remove("template-editor-active");
      body.classList.remove("template-editor-active");
    };
  },[selected]);

  const choose=(t:Template)=>{
    setSelected(t.id);
    setEditorTab("content");
    setCompleted(false);
    applyTemplate(t,false);
  };
  const resetTemplate=()=>{
    if(selectedTemplate){
      applyTemplate(selectedTemplate,false);
      setCompleted(false);
      setEditorTab("content");
    }
  };
  const editForm=(k:keyof FormState,v:string)=>{setCompleted(false);state.updateForm(k,v)};
  const editDesign=<K extends keyof DesignState>(k:K,v:DesignState[K])=>{setCompleted(false);state.updateDesign(k,v)};
  const editDesignMany=(p:Partial<DesignState>)=>{setCompleted(false);state.updateDesignMany(p)};
  const editLogo=(e:ChangeEvent<HTMLInputElement>)=>{setCompleted(false);void state.onLogoFile(e)};
  const customized=!!selectedTemplate && (
    design.fg!==selectedTemplate.fg||
    design.bg!==selectedTemplate.bg||
    design.accent!==selectedTemplate.accent||
    design.bodyShape!==selectedTemplate.pattern||
    design.finder!==selectedTemplate.finder||
    design.title!==selectedTemplate.title||
    design.subtitle!==selectedTemplate.subtitle||
    design.cta!==selectedTemplate.cta||
    design.frameStyle!==(selectedTemplate.frame||"badge")||
    !!(design.logoEnabled&&design.logo)||
    design.inkGradient||
    design.gradient!==selectedTemplate.gradient
  );
  const tabs:[typeof editorTab,string,string][]=[
    ['content','Content','QR information'],
    ['appearance','Appearance','Text & colors'],
    ['shape','Shape','QR geometry'],
    ['branding','Branding','Logo & identity'],
    ['advanced','Advanced','Safety & export']
  ];

  if(selectedTemplate)return <div className="page-shell template-editor-shell">
    <Header view="templates" onNavigate={setView} onHome={()=>setView('landing')}/>
    <main className="template-editor-workspace">
      <header className="template-editor-header">
        <button type="button" className="soft" onClick={()=>setSelected('')}><ArrowLeft size={15}/> Back to Templates</button>
        <div className="template-workspace-title">
          <span className="page-eyebrow">TEMPLATE EDITOR</span>
          <div>
            <h1>{selectedTemplate.name}</h1>
            <span className={`template-state-pill ${completed||customized?'customized':''}`}>{completed?"Ready to export":customized?"Customized":"Editing"}</span>
          </div>
        </div>
        <div className="template-workspace-actions">
          <button type="button" className="soft" onClick={resetTemplate}><RotateCcw size={15}/> Reset</button>
          <button type="button" className="soft" onClick={()=>{setCompleted(false);undoAction()}} disabled={!undo.length} title="Undo" aria-label="Undo"><Undo2 size={15}/></button>
          <button type="button" className="soft" onClick={()=>{setCompleted(false);redoAction()}} disabled={!redo.length} title="Redo" aria-label="Redo"><Redo2 size={15}/></button>
          {completed&&<button type="button" className="primary" onClick={()=>void exportPng()} disabled={busy}><Download size={15}/> Export</button>}
        </div>
      </header>

      <div className="template-workspace-grid">
        <section className="template-workspace-preview">
          <div className="workspace-preview-head">
            <div><span className="page-eyebrow">LIVE PREVIEW</span><b>See every change instantly</b></div>
            <span className="live-dot"><i/> Live</span>
          </div>
          <div className="workspace-preview-stage"><PreviewCard payload={payload} design={design}/></div>
          <div className="workspace-preview-foot">
            <span><Check size={13}/> Auto-saved locally</span>
            <small>{completed?"Customized version is ready to export.":customized?"Your changes are saved automatically.":"Starting from the selected template."}</small>
          </div>
        </section>

        <section className="template-workspace-controls">
          <div className="workspace-controls-inner">
            <nav className="workspace-tabs" role="tablist" aria-label="Template editing sections">
              <span className="workspace-tabs-label">EDIT</span>
              {tabs.map(([id,label,note])=><button type="button" key={id} className={editorTab===id?'active':''} role="tab" aria-selected={editorTab===id} aria-controls={`workspace-panel-${id}`} onClick={()=>{setEditorTab(id);setCompleted(false)}}>
                <span>{label}</span><small>{note}</small>
              </button>)}
            </nav>
            <div className="workspace-control-scroll">
              {editorTab==='content'&&<div id="workspace-panel-content" className="workspace-panel" role="tabpanel">
                <EditorPanelHeader icon={Clipboard} title="Content" text="Choose what this template encodes. Your visual design stays intact."/>
                <label className="station-type"><span>QR type</span><select value={type} onChange={e=>{setType(e.target.value as TypeId);setCompleted(false)}}>{['Popular','Social','Contact','Business','Payments','Advanced'].map(g=><optgroup key={g} label={g}>{types.filter(t=>t.group===g).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>)}</select></label>
                <ContentForm type={type} form={form} update={editForm}/>
              </div>}
              {editorTab==='appearance'&&<div id="workspace-panel-appearance" className="workspace-panel" role="tabpanel">
                <EditorPanelHeader icon={Palette} title="Appearance" text="Tune headline, supporting text, colors, glow, transparency and gradient."/>
                <DesignControls design={design} update={editDesign} updateMany={editDesignMany} onLogo={editLogo} onReset={resetTemplate} payload={payload} templateMode templateSection="appearance"/>
              </div>}
              {editorTab==='shape'&&<div id="workspace-panel-shape" className="workspace-panel" role="tabpanel">
                <EditorPanelHeader icon={Layers} title="Shape" text="Control QR geometry, finder patterns, frames, error correction and spacing."/>
                <DesignControls design={design} update={editDesign} updateMany={editDesignMany} onLogo={editLogo} onReset={resetTemplate} payload={payload} templateMode templateSection="shape"/>
              </div>}
              {editorTab==='branding'&&<div id="workspace-panel-branding" className="workspace-panel" role="tabpanel">
                <EditorPanelHeader icon={ImagePlus} title="Branding" text="Add a logo, switch it on or off, and control its safe size."/>
                <DesignControls design={design} update={editDesign} updateMany={editDesignMany} onLogo={editLogo} onReset={resetTemplate} payload={payload} templateMode templateSection="branding"/>
              </div>}
              {editorTab==='advanced'&&<div id="workspace-panel-advanced" className="workspace-panel" role="tabpanel">
                <EditorPanelHeader icon={SlidersHorizontal} title="Advanced" text="Review QR Health, scan safety and print-oriented presets."/>
                <DesignControls design={design} update={editDesign} updateMany={editDesignMany} onLogo={editLogo} onReset={resetTemplate} payload={payload} templateMode templateSection="advanced"/>
              </div>}
            </div>
          </div>
        </section>
      </div>

      <footer className="template-editor-footer">
        <div className="template-editor-status">
          <span className={`editor-status-dot ${completed?'ready':''}`}/>
          <div><b>{completed?"Ready to export":"Editing"}</b><small>{completed?"Customization is complete. You can export or edit again.":"Changes are saved automatically."}</small></div>
        </div>
        <div className="template-editor-footer-actions">
          {completed
            ? <><button type="button" className="soft" onClick={()=>setCompleted(false)}><Paintbrush size={15}/> Edit again</button><button type="button" className="primary" onClick={()=>void exportPng()} disabled={busy}><Download size={15}/> {busy?"Preparing…":"Export"}</button></>
            : <button type="button" className="primary" onClick={()=>setCompleted(true)}><Check size={15}/> Done</button>}
        </div>
      </footer>
    </main>
  </div>;

  return <div className="page-shell"><Header view="templates" onNavigate={setView} onHome={()=>setView('landing')}/><main className="templates-page-new">
    <div className="templates-hero"><div><span className="page-eyebrow">TEMPLATE LIBRARY</span><h1>Start with a look that already feels right.</h1><p>Browse the complete library, then open any template in the dedicated Qraft editor.</p></div><button className="primary" onClick={newProject}><QrCode size={15}/> Start blank</button></div>
    <div className="template-toolbar-new"><label className="search-field-large"><Search size={17}/><input value={templateSearch} onChange={e=>setTemplateSearch(e.target.value)} placeholder="Search every template…"/></label><div className="category-pills-new">{categories.map(c=><button key={c} className={templateCategory===c?'active':''} onClick={()=>setTemplateCategory(c)}>{c}<span>{c==='All'?templates.length:templates.filter(t=>t.category===c).length}</span></button>)}</div></div>
    <section className="template-gallery template-gallery-full">{grouped.map(group=><section className="template-category-section" key={group.category}><div className="template-category-head"><div><span>{group.category}</span><h2>{group.category} templates</h2></div><small>{group.items.length} styles</small></div><div className="template-card-grid">{group.items.map(t=><button type="button" key={t.id} className="template-card-new" onClick={()=>choose(t)}><div className="template-card-art" style={{background:t.bg}}><MiniQR fg={t.fg} bg={t.bg} ec="H" pattern={t.pattern} finder={t.finder}/><span style={{background:t.fg,color:t.bg}}>{t.cta}</span><em>{t.pattern}</em></div><div className="template-card-copy"><div><b>{t.name}</b><span>{t.category}</span></div><p>{t.note}</p><small className="template-card-edit-hint">Customize template <ArrowRight size={12}/></small></div></button>)}</div></section>)}</section>
  </main></div>;
}
function EditorPanelHeader({icon:Icon,title,text}:{icon:LucideIcon;title:string;text:string}){return <div className="editor-panel-header"><span className="editor-section-icon"><Icon size={17}/></span><div><span className="page-eyebrow">EDIT SECTION</span><b>{title}</b><small>{text}</small></div></div>}

function ToolsPage({state}:{state:AppState}){
 const {setView,batch,setBatch,batchResults,runBatch,downloadBatch,batchProgress,payload,design,testCurrentQR,projects,exportProjects,importProjects,notify}=state;
 const [backupInput,setBackupInput]=useState<HTMLInputElement|null>(null);
 const contrast=(a:string,b:string)=>{const lum=(hex:string)=>{const h=hex.replace("#","");const rgb=[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)].map(v=>{const x=v/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const ratio=contrast(design.fg,design.bg);const labStatus=ratio>=4.5&&design.margin>=4&&design.logoSize<=14?"Ready for testing":ratio>=3?"Review recommended":"High-risk design";
 const downloadBatchSheet=async()=>{
   if(!batchResults.length)return;
   const cols=3,tile=420,gap=30,header=100,perSheet=60;
   const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("QR image failed to load"));img.src=src});
   const makeSheet=async(items:{name:string;url:string}[],index:number)=>{
     const rows=Math.ceil(items.length/cols);
     const c=document.createElement("canvas");c.width=cols*tile+(cols+1)*gap;c.height=header+rows*tile+(rows+1)*gap;
     const ctx=c.getContext("2d");if(!ctx)throw new Error("Canvas is unavailable");
     ctx.fillStyle="#ffffff";ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#0f172a";ctx.font="800 28px Arial";ctx.fillText(`Qraft QR Batch · Sheet ${index+1}`,gap,60);
     let failed=0;
     for(let i=0;i<items.length;i++){
       const item=items[i],col=i%cols,row=Math.floor(i/cols),x=gap+col*(tile+gap),y=header+gap+row*(tile+gap);
       try{const img=await load(item.url);ctx.drawImage(img,x,y,tile,tile-34)}catch{failed++;ctx.fillStyle="#f1f5f9";ctx.fillRect(x,y,tile,tile-34);ctx.fillStyle="#64748b";ctx.font="700 15px Arial";ctx.fillText("Image unavailable",x+18,y+40)}
       ctx.fillStyle="#0f172a";ctx.font="700 16px Arial";ctx.fillText(item.name.slice(0,38),x,y+tile-12);
     }
     const blob=await new Promise<Blob|null>(resolve=>c.toBlob(resolve,"image/png"));
     if(!blob)throw new Error("Contact sheet could not be encoded");
     return {blob,failed};
   };
   try{
     const sheets=[];let totalFailed=0;
     for(let offset=0;offset<batchResults.length;offset+=perSheet){
       const result=await makeSheet(batchResults.slice(offset,offset+perSheet),sheets.length);
       sheets.push(result.blob);totalFailed+=result.failed;
       if(offset+perSheet<batchResults.length)await new Promise(r=>window.setTimeout(r,0));
     }
     if(sheets.length===1){downloadBlob(sheets[0],"qraft-batch-sheet.png")}else{
       const {default:JSZip}=await import("jszip");const zip=new JSZip();sheets.forEach((blob,i)=>zip.file(`qraft-batch-sheet-${String(i+1).padStart(2,"0")}.png`,blob));downloadBlob(await zip.generateAsync({type:"blob"}),"qraft-batch-sheets.zip");
     }
     const suffix=totalFailed?` · ${totalFailed} image${totalFailed===1?"":"s"} unavailable`:"";
     notify(sheets.length===1?`Contact sheet downloaded${suffix}`:`${sheets.length} contact sheets bundled in a ZIP${suffix}`);
   }catch(e){notify(e instanceof Error?e.message:"Contact sheets could not be created.")}
 };
 return <div className="page-shell"><Header view="tools" onNavigate={setView} onHome={()=>setView("landing")}/><main className="simple-page"><div className="page-intro"><div><span className="page-eyebrow">TOOLS / POWER</span><h1>Power tools for testing, batches and backups.</h1><p>Advanced utilities stay separate from the creator so everyday QR design remains focused.</p></div></div><div className="tools-grid">
 <section className="utility-card wide"><div className="utility-icon"><FileArchive size={22}/></div><span className="eyebrow">BATCH</span><h2>Generate up to 1,000 QR codes</h2><p>One row per QR. Use <b>Name,URL</b> or just a URL. Qraft normalizes plain domains and keeps duplicate filenames safe.</p><textarea value={batch} onChange={e=>setBatch(e.target.value)} placeholder={'Restaurant,https://example.com/menu\nInstagram,https://instagram.com/qraft\nContact,https://example.com/contact'}/><div className="utility-actions"><button className="primary" onClick={runBatch} disabled={!batch.trim()||!!batchProgress}><Zap size={15}/> {batchProgress?`Generating ${batchProgress}…`:"Generate batch"}</button>{batchResults.length>0&&<><button className="soft" onClick={downloadBatch}><Download size={15}/> ZIP ({batchResults.length})</button><button className="soft" onClick={downloadBatchSheet}><FileImage size={15}/> Contact sheet</button></>}</div>{batchResults.length>0&&<div className="batch-meta"><b>{batchResults.length} generated</b><span>Previewing the first 16 · PNG output · large batches use multi-sheet ZIP</span></div>}{batchResults.length>0&&<div className="batch-grid">{batchResults.slice(0,16).map(r=><div key={r.name}><img src={r.url} alt={r.name}/><span>{r.name}</span></div>)}</div>}</section>
 <section className="utility-card"><div className="utility-icon"><ShieldCheck size={22}/></div><span className="eyebrow">QR LAB</span><h2>Design diagnostic</h2><p>Review the current design before you publish it. This is a heuristic, not a guarantee of every scanner.</p><div className="lab-score"><strong>{labStatus}</strong><b>{ratio.toFixed(1)}:1</b></div><div className="lab-checks"><span className={ratio>=4.5?"ok":"warn"}>● Contrast {ratio>=4.5?"good":"review"}</span><span className={design.margin>=4?"ok":"warn"}>● Quiet zone {design.margin>=4?"safe":"small"}</span><span className={design.logoSize<=14?"ok":"warn"}>● Logo {design.logoEnabled && design.logo?`${design.logoSize}%`:'none'}</span><span className={payload.length<1200?"ok":"warn"}>● Payload {payload.length.toLocaleString()} chars</span></div><button className="primary" onClick={()=>void testCurrentQR()}><ShieldCheck size={16}/> Run decoder test</button></section>
 <section className="utility-card"><div className="utility-icon"><ScanLine size={22}/></div><span className="eyebrow">VERIFY</span><h2>Scan & test</h2><p>Camera scan, image drop, and generated QR verification live on one dedicated tool page.</p><button className="primary" onClick={()=>setView("scanner")}><ScanLine size={16}/> Open Scan & test</button></section>
 <section className="utility-card"><div className="utility-icon"><FolderOpen size={22}/></div><span className="eyebrow">BACKUPS</span><h2>Project backup</h2><p>Export your local Qraft library to JSON and restore it later on another browser.</p><div className="backup-stat"><b>{projects.length}</b><span>saved projects</span></div><div className="utility-actions"><button className="soft" onClick={exportProjects} disabled={!projects.length}><Download size={15}/> Export JSON</button><button className="soft" onClick={()=>backupInput?.click()}><Upload size={15}/> Import JSON</button><input ref={setBackupInput} type="file" hidden accept="application/json,.json" onChange={e=>{const f=e.target.files?.[0];if(f)void importProjects(f);e.currentTarget.value=""}}/></div></section>
 <section className="utility-card"><div className="utility-icon"><CircleHelp size={22}/></div><span className="eyebrow">WORKFLOW</span><h2>Keep the creator clean</h2><p>Power tools stay here so the main Create flow remains focused on content, design and export.</p></section>
 </div></main></div>}

function ProjectsPage({state}:{state:AppState}){
 const {setView,projects,openProject,removeProject,clearProjects,newProject,duplicateProject,toggleFavorite}=state;
 const [query,setQuery]=useState(""); const [filter,setFilter]=useState<"all"|"favorites">("all");
 const visible=useMemo(()=>projects.filter(p=>{const q=query.trim().toLowerCase();const matches=!q||`${p.name} ${types.find(t=>t.id===p.type)?.label||""} ${(p.tags||[]).join(" ")}`.toLowerCase().includes(q);return matches&&(filter==="all"||!!p.favorite)}),[projects,query,filter]);
 return <div className="page-shell"><Header view="projects" onNavigate={setView} onHome={()=>setView("landing")}/><main className="simple-page"><div className="page-intro"><div><span className="page-eyebrow">PROJECTS</span><h1>Your saved QR work.</h1><p>Local-first project library with search, favorites, duplicate, and quick reopen.</p></div><button className="primary" onClick={newProject}><QrCode size={15}/> New project</button></div>{projects.length?<><div className="projects-toolbar"><label className="search-field-large"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects…"/></label><div className="project-filters"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>All <span>{projects.length}</span></button><button className={filter==="favorites"?"active":""} onClick={()=>setFilter("favorites")}><Star size={13}/> Favorites <span>{projects.filter(p=>p.favorite).length}</span></button></div></div>{visible.length?<div className="projects-grid">{visible.map(p=><article className="project-card" key={p.id}><div className="project-thumb-wrap"><img src={p.thumbnail} alt=""/><button className={p.favorite?"project-favorite active":"project-favorite"} onClick={()=>toggleFavorite(p.id)} title={p.favorite?"Remove favorite":"Add favorite"} aria-label={p.favorite?"Remove favorite":"Add favorite"}><Star size={15} fill={p.favorite?"currentColor":"none"}/></button></div><div className="project-card-copy"><span>{types.find(t=>t.id===p.type)?.label}</span><h3>{p.name}</h3><small><Clock3 size={11}/> Updated {new Date(p.updated).toLocaleString()}</small>{p.tags?.length?<div className="project-tags">{p.tags.map(t=><em key={t}>{t}</em>)}</div>:null}<div><button className="primary" onClick={()=>openProject(p)}>Open project</button><button className="soft" onClick={()=>duplicateProject(p)} title="Duplicate"><Copy size={15}/></button><button className="icon-button" onClick={()=>removeProject(p.id)} title="Delete"><Trash2 size={16}/></button></div></div></article>)}</div>:<div className="empty-page compact-empty"><Search size={36}/><h2>No matching projects.</h2><p>Try another search or switch back to All projects.</p></div>}<button className="danger-outline" onClick={clearProjects}>Clear all projects</button></>:<div className="empty-page"><FolderOpen size={42}/><h2>No saved projects yet.</h2><p>Build a QR in Create and Qraft saves it here automatically.</p><button className="primary" onClick={newProject}><QrCode size={16}/> Create your first QR</button></div>}</main></div>}

function ScannerPage({state}:{state:AppState}){const {setView,scanResult,scanError,startCamera,scanFile,testCurrentQR,clearScan}=state;const [dragging,setDragging]=useState(false);const dragDepth=useRef(0);useEffect(()=>()=>{state.stopScanner()},[]);useEffect(()=>{const enter=(e:DragEvent)=>{if(!e.dataTransfer?.types?.includes("Files"))return;e.preventDefault();dragDepth.current++;setDragging(true)};const over=(e:DragEvent)=>{if(e.dataTransfer?.types?.includes("Files")){e.preventDefault();setDragging(true)}};const leave=(e:DragEvent)=>{if(!e.dataTransfer?.types?.includes("Files"))return;e.preventDefault();dragDepth.current--;if(dragDepth.current<=0){dragDepth.current=0;setDragging(false)}};const drop=(e:DragEvent)=>{if(!e.dataTransfer?.files?.length)return;e.preventDefault();dragDepth.current=0;setDragging(false);scanFile(e.dataTransfer.files[0])};window.addEventListener("dragenter",enter);window.addEventListener("dragover",over);window.addEventListener("dragleave",leave);window.addEventListener("drop",drop);return()=>{window.removeEventListener("dragenter",enter);window.removeEventListener("dragover",over);window.removeEventListener("dragleave",leave);window.removeEventListener("drop",drop)}} ,[]);return <div className="page-shell"><Header view="scanner" onNavigate={setView} onHome={()=>setView("landing")}/>{dragging&&<div className="global-drop-capture"><div><div className="capture-icon"><Upload size={30}/></div><h2>Drop your QR image anywhere</h2><p>Qraft caught the file. Release it to scan now.</p></div></div>}<main className="scanner-page"><div className="page-intro"><div><span className="page-eyebrow">SCAN & TEST</span><h1>Verify before you share.</h1><p>Use your camera, add an image, or run Qraft's own generated QR through the decoder.</p></div><button className="soft" onClick={testCurrentQR}><ShieldCheck size={16}/> Test current QR</button></div><div className="scanner-columns"><section className="scanner-card"><div className="scanner-card-head"><div className="scanner-number">01</div><div><span className="eyebrow">CAMERA SCAN</span><h2>Scan with your camera</h2><p>Use the rear camera on a phone or desktop webcam.</p></div></div><video ref={state.cameraRef} className="camera-full" muted playsInline/><canvas ref={state.scanCanvas} hidden/><button className="primary large" onClick={startCamera}><Camera size={18}/> Start camera</button></section><section className="scanner-card"><div className="scanner-card-head"><div className="scanner-number">02</div><div><span className="eyebrow">IMAGE SCAN</span><h2>Add or drop a QR image</h2><p>You can drag a QR image anywhere onto the page — Qraft catches it automatically.</p></div></div><label className="scanner-drop-zone"><Upload size={25}/><b>Choose QR image</b><span>PNG · JPG · WEBP · GIF</span><input type="file" hidden accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)scanFile(f)}}/><em>or drag it anywhere on this page</em></label></section></div>{(scanResult||scanError)&&<section className={scanError?"scan-result-card error-card":"scan-result-card"}><div className="result-title"><div><span className="eyebrow">RESULT</span><h2>{scanError?"Couldn't decode that image":"QR decoded successfully"}</h2></div><button className="text-button" onClick={clearScan}>Clear</button></div>{scanError?<p>{scanError}</p>:(()=>{const embeddedImage=decodeEmbeddedImage(scanResult);return embeddedImage?<><div className="offline-result offline-result-large"><img src={embeddedImage} alt="Image embedded in QR"/><div><b>Image recovered from this QR</b><span>The image was stored inside the QR itself. Qraft displayed it without using internet or hosting.</span><a className="soft" href={embeddedImage} target="_blank" rel="noreferrer">Open image</a></div></div><button className="soft" onClick={()=>navigator.clipboard?.writeText(scanResult)}><Clipboard size={15}/> Copy image payload</button></>:<><div className="detected-value">{scanResult}</div><button className="soft" onClick={()=>navigator.clipboard?.writeText(scanResult)}><Clipboard size={15}/> Copy detected content</button></>})()}</section>}<p className="scanner-note"><ShieldCheck size={15}/> For the most reliable physical check, scan the exported QR at the same print size and lighting you expect in real use.</p></main></div>}

function InfoPage({kind,onBack,onNavigate,onPrivacy,onTerms,onDeveloper}:{kind:"privacy"|"terms"|"developer";onBack:()=>void;onNavigate?:(v:View)=>void;onPrivacy?:()=>void;onTerms?:()=>void;onDeveloper?:()=>void}){const data=kind==="privacy"?{eyebrow:"LEGAL / PRIVACY",title:"Privacy Policy",intro:"Qraft is designed to keep QR creation local and transparent.",sections:[["What Qraft stores","While you create, projects (content, design settings and a thumbnail) are saved automatically in your browser's local project storage (IndexedDB on supported browsers). Wi-Fi passwords and 2FA secrets are never written to storage, and their thumbnails show a placeholder instead of the real code."],["Images & logos","Uploaded images and logos used during creation are processed in your browser. The offline Image QR feature compresses a small image into a Qraft-specific payload."],["Camera access","Camera access is requested only when you start camera scanning. Qraft uses the camera stream in the browser to decode QR content."],["Third-party destinations","A QR can contain links to third-party services. Qraft does not control those external websites or their privacy practices."],["Your control","You can clear local projects from the Projects page or clear your browser's site storage." ]]}:kind==="terms"?{eyebrow:"LEGAL / TERMS",title:"Terms & Conditions",intro:"Use Qraft responsibly and verify your QR before publishing or printing it.",sections:[["Acceptable use","Do not use Qraft to create QR content that violates applicable law, infringes rights, or is intended to deceive or harm others."],["Your content","You are responsible for the URLs, text, images, logos, and other material you enter or embed."],["QR reliability","Qraft uses standard QR generation and includes scan-testing tools, but final readability depends on size, contrast, print quality, surrounding design, and scanning hardware."],["External content","Links encoded in QR codes may lead to third-party services. Qraft is not responsible for the availability or content of those destinations."],["Changes","Qraft may be updated over time as features and safety checks improve." ]]}:{eyebrow:"ABOUT / DEVELOPER",title:"Developer Details",intro:"Qraft is a client-side QR creation and design studio built around a simple product principle: useful first, decoration second.",sections:[["Product","Qraft combines QR creation, templates, design controls, exports, projects, and scanning tools in one browser-based application."],["Technology","The app uses React + TypeScript + Vite, the qrcode package for standards-based QR rendering, jsQR for decoding, jsPDF for PDF export, and JSZip for batch downloads."],["Architecture","Qraft is designed to be local-first for creation and project storage. Generated assets are created in the browser without requiring a Qraft backend for ordinary QR generation."],["Design principle","The interface keeps common tasks visible, moves professional controls into calm sections, and avoids altering the QR data matrix with decorative painting."],["Project information","Developer identity or contact information is intentionally not fabricated here. Add the real name, email, GitHub, or website you want published on this page." ]]};return <div className="info-shell"><div className="info-top"><button className="app-brand" onClick={onBack}><img src={LOGO_SRC} alt="Qraft"/><span><b>Qraft</b><small>Back to Qraft</small></span></button><button className="soft" onClick={onBack}><ArrowLeft size={15}/> Back</button></div><main className="info-document"><span className="page-eyebrow">{data.eyebrow}</span><h1>{data.title}</h1><p className="info-intro">{data.intro}</p>{data.sections.map(([h,p])=><section key={h}><h2>{h}</h2><p>{p}</p></section>)}</main></div>}

function MiniQR({fg,bg,ec="M",pattern="square",finder="square"}:{fg:string;bg:string;ec:EC;pattern?:Pattern;finder?:Finder}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let alive=true;(async()=>{try{const c=await renderQR("https://bibekbista.vercel.app/",{...initialDesign,fg,bg,ec,bodyShape:pattern,finder,margin:MIN_MARGIN,size:180,logo:null,transparent:false},180);if(alive&&ref.current){ref.current.width=c.width;ref.current.height=c.height;ref.current.getContext("2d")?.drawImage(c,0,0)}}catch{}})();return()=>{alive=false}},[fg,bg,ec,pattern,finder]);
 return <canvas ref={ref} className="mini-real-qr"/>
}

type AppState={
 view:View; setView:(v:View)=>void; newProject:()=>void; createStep:Step; setCreateStep:(s:Step)=>void; type:TypeId; setType:(t:TypeId)=>void; form:FormState; design:DesignState; updateForm:(k:keyof FormState,v:string)=>void; updateDesign:<K extends keyof DesignState>(k:K,v:DesignState[K])=>void; updateDesignMany:(p:Partial<DesignState>)=>void; onLogoFile:(e:ChangeEvent<HTMLInputElement>)=>void; stopScanner:()=>void; batchProgress:string; payload:string; busy:boolean; setBusy:(v:boolean)=>void; notify:(m:string)=>void; resetDesign:()=>void; testCurrentQR:()=>Promise<void>; copyPayload:()=>Promise<void>; exportRawPng:()=>Promise<void>; exportPng:()=>Promise<void>; exportSvg:()=>Promise<void>; exportPdf:()=>Promise<void>; exportDesign:()=>Promise<void>; undoAction:()=>void; redoAction:()=>void; undo:Snap[]; redo:Snap[]; projects:Project[]; openProject:(p:Project)=>void; removeProject:(id:string)=>void; clearProjects:()=>void; duplicateProject:(p:Project)=>void; toggleFavorite:(id:string)=>void; exportProjects:()=>void; importProjects:(file:File)=>Promise<void>; templateSearch:string; setTemplateSearch:(x:string)=>void; templateCategory:string; setTemplateCategory:(x:string)=>void; filteredTemplates:Template[]; applyTemplate:(t:Template,close?:boolean)=>void; batch:string; setBatch:(x:string)=>void; batchResults:{name:string;url:string}[]; runBatch:()=>Promise<void>; downloadBatch:()=>Promise<void>; scanResult:string; scanError:string; scanTest:{state:"idle"|"running"|"passed"|"failed";message:string}; startCamera:()=>Promise<void>; scanFile:(f:File)=>void; clearScan:()=>void; cameraRef:{current:HTMLVideoElement|null}; scanCanvas:{current:HTMLCanvasElement|null};
}

const viewFromHash=():View=>{const h=window.location.hash.replace(/^#\/?/,"");return (VIEWS as readonly string[]).includes(h)?(h as View):"landing"};

function App(){
 const [view,setView]=useState<View>(viewFromHash); const [createStep,setCreateStep]=useState<Step>(1); const [type,setType]=useState<TypeId>("url"); const [form,setForm]=useState<FormState>(initialForm); const [design,setDesign]=useState<DesignState>(initialDesign); const [busy,setBusy]=useState(false); const [toast,setToast]=useState(""); const [downloadSuccess,setDownloadSuccess]=useState("");
 const [undo,setUndo]=useState<Snap[]>([]); const [redo,setRedo]=useState<Snap[]>([]);
 const [projects,setProjects]=useState<Project[]>([]); const projectsLoaded=useRef(false); const savedIdRef=useRef(""); const setSavedId=(v:string)=>{savedIdRef.current=v};
 const [batchProgress,setBatchProgress]=useState(""); const dirtyRef=useRef(false); const editRevisionRef=useRef(0); const lastSnap=useRef({key:"",t:0}); const toastTimer=useRef<number|null>(null); const detectorRef=useRef<{detect:(source:HTMLCanvasElement)=>Promise<{rawValue?:string}[]>}|null|undefined>(undefined); const detectorTick=useRef(0);
 const [templateSearch,setTemplateSearch]=useState(""); const [templateCategory,setTemplateCategory]=useState("All"); const [batch,setBatch]=useState(""); const [batchResults,setBatchResults]=useState<{name:string;url:string}[]>([]);
 const [commandOpen,setCommandOpen]=useState(false);
 const [scanResult,setScanResult]=useState(""); const [scanError,setScanError]=useState(""); const [scanTest,setScanTest]=useState<{state:"idle"|"running"|"passed"|"failed";message:string}>({state:"idle",message:"Run the scan test to verify this QR before publishing it."}); const cameraRef=useRef<HTMLVideoElement>(null); const scanCanvas=useRef<HTMLCanvasElement>(null); const streamRef=useRef<MediaStream|null>(null); const scanFrameRef=useRef<number|null>(null); const scanLastAt=useRef(0);
 const payload=useMemo(()=>payloadFor(type,form),[type,form]); const filteredTemplates=useMemo(()=>templates.filter(t=>(templateCategory==="All"||t.category===templateCategory)&&`${t.name} ${t.note} ${t.category}`.toLowerCase().includes(templateSearch.toLowerCase())),[templateCategory,templateSearch]);
 useEffect(()=>{let live=true;loadProjects<Project>().then(saved=>{if(!live)return;setProjects(cur=>[...cur,...saved.filter(q=>!cur.some(c=>c.id===q.id))]);projectsLoaded.current=true});return()=>{live=false}},[]);
 useEffect(()=>{if(!projectsLoaded.current)return;const id=window.setTimeout(()=>{saveProjects(projects.slice(0,100)).catch(()=>notify("Browser storage is full or blocked — this project could not be saved."))},280);return()=>window.clearTimeout(id)},[projects]); useEffect(()=>()=>{if(scanFrameRef.current!==null)cancelAnimationFrame(scanFrameRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null},[]); useEffect(()=>{window.scrollTo({top:0,behavior:"auto"})},[view]);
 useEffect(()=>{const on=()=>setView(viewFromHash());window.addEventListener("hashchange",on);return()=>window.removeEventListener("hashchange",on)},[]);
 useEffect(()=>{if(!downloadSuccess)return;const prev=document.activeElement as HTMLElement|null;const onTab=(e:KeyboardEvent)=>{const el=document.querySelector<HTMLElement>(".download-success-overlay");if(e.key!=="Tab"||!el)return;const f=[...el.querySelectorAll<HTMLElement>("button,a[href],input,select,textarea,[tabindex]:not([tabindex='-1'])")].filter(x=>!x.hasAttribute("disabled"));if(!f.length)return;const a=document.activeElement;if(!el.contains(a)||(e.shiftKey&&a===f[0])||(!e.shiftKey&&a===f[f.length-1])){e.preventDefault();(e.shiftKey&&el.contains(a)?f[f.length-1]:f[0]).focus()}};document.addEventListener("keydown",onTab);return()=>{document.removeEventListener("keydown",onTab);prev?.focus?.()}},[downloadSuccess]);
 const historyRef=useRef({undo:()=>{},redo:()=>{},active:false}); const successRef=useRef(false);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setCommandOpen(v=>!v)}};const onCommand=()=>setCommandOpen(v=>!v);window.addEventListener("keydown",onKey);window.addEventListener("qraft:command",onCommand);return()=>{window.removeEventListener("keydown",onKey);window.removeEventListener("qraft:command",onCommand)}},[]);
useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"&&successRef.current){setDownloadSuccess("");return}if(!historyRef.current.active||!(e.ctrlKey||e.metaKey))return;const t=e.target as HTMLElement|null;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;const k=e.key.toLowerCase();if(k==="z"&&!e.shiftKey){e.preventDefault();historyRef.current.undo()}else if((k==="z"&&e.shiftKey)||k==="y"){e.preventDefault();historyRef.current.redo()}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
 const notify=(m:string)=>{setToast(m);if(toastTimer.current!==null)window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(""),m.length>60?4200:1900)};
 const snapshot=(key="")=>{const now=Date.now();dirtyRef.current=true;if(key&&lastSnap.current.key===key&&now-lastSnap.current.t<900){lastSnap.current.t=now;return}lastSnap.current={key,t:now};setUndo(u=>[...u,{type,form:{...form},design:{...design}}].slice(-60))};
 const resetScanTest=()=>setScanTest({state:"idle",message:"Changes made — run the scan test again before exporting."});
 const updateForm=(k:keyof FormState,v:string)=>{editRevisionRef.current+=1;snapshot("f:"+k);setRedo([]);resetScanTest();setForm(x=>({...x,[k]:v}))};
 const updateDesign=<K extends keyof DesignState>(k:K,v:DesignState[K])=>{editRevisionRef.current+=1;snapshot("d:"+k);setRedo([]);resetScanTest();setDesign(x=>({...x,[k]:v}))};
 const updateDesignMany=(p:Partial<DesignState>)=>{editRevisionRef.current+=1;snapshot();setRedo([]);resetScanTest();setDesign(x=>({...x,...p}))};
 const onLogoFile=async(e:ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>4*1024*1024){notify("Logo must be under 4 MB");return}try{const data=await prepareLogo(file);updateDesignMany({logo:data,logoName:file.name,logoEnabled:true,logoPreset:false,ec:"H",logoSize:Math.min(12,design.logoSize)})}catch(err){notify(err instanceof Error?err.message:"Logo could not be loaded")}};
 const setTypeSafe=(id:TypeId)=>{
   if(id===type)return;editRevisionRef.current+=1;snapshot();setRedo([]);resetScanTest();setType(id);
   const meta=types.find(t=>t.id===id)!;const social=socialThemes[id];const prevSocial=socialThemes[type];
   if(social){setDesign(d=>({...d,fg:social.fg,bg:social.bg,accent:social.accent,title:social.title,subtitle:social.subtitle,cta:social.cta,frame:true,frameStyle:social.frameStyle,bodyShape:"rounded",finder:"rounded",gradient:false,ec:"H",margin:5,logo:social.logo,logoName:`${meta.label} logo`,logoEnabled:!!social.logo,logoPreset:true,logoSize:11}))}
   else{setDesign(d=>{
     const leaving=!!prevSocial&&d.fg===prevSocial.fg&&d.bg===prevSocial.bg; // untouched social theme -> go back to defaults
     const base=leaving?{...d,fg:initialDesign.fg,bg:initialDesign.bg,accent:initialDesign.accent,bodyShape:initialDesign.bodyShape,finder:initialDesign.finder,frame:initialDesign.frame,frameStyle:initialDesign.frameStyle,margin:initialDesign.margin,logoSize:initialDesign.logoSize}:d;
     return {...base,title:meta.label,subtitle:meta.note,cta:id==="wifi"?"CONNECT":"SCAN ME",logo:d.logoPreset?null:d.logo,logoName:d.logoPreset?"":d.logoName,logoEnabled:d.logoPreset?false:(d.logoEnabled&&!!d.logo),logoPreset:false};
   })}
 };
 const resetDesign=()=>{editRevisionRef.current+=1;snapshot();setRedo([]);resetScanTest();setDesign({...initialDesign})};
 const undoAction=()=>{const x=undo.at(-1);if(!x)return;editRevisionRef.current+=1;dirtyRef.current=true;lastSnap.current={key:"",t:0};setRedo(r=>[...r,{type,form:{...form},design:{...design}}]);setType(x.type);setForm(x.form);setDesign(x.design);setUndo(u=>u.slice(0,-1))};
 const redoAction=()=>{const x=redo.at(-1);if(!x)return;editRevisionRef.current+=1;dirtyRef.current=true;lastSnap.current={key:"",t:0};setUndo(u=>[...u,{type,form:{...form},design:{...design}}]);setType(x.type);setForm(x.form);setDesign(x.design);setRedo(r=>r.slice(0,-1))};
 historyRef.current={undo:undoAction,redo:redoAction,active:view==="create"||view==="templates"}; successRef.current=!!downloadSuccess;
 const templateTypes:Record<string,TypeId>={wifi:"wifi",contact:"vcard",event:"event",wedding:"event",party:"event",review:"review",google:"review",app:"app",twofa:"twofa",instagram:"instagram",video:"video",menu:"menu","menu-dark":"menu",cafe:"menu",bakery:"menu",restaurant:"menu",payment:"paypal",donation:"paypal"};
 const applyTemplate=(t:Template,toastIt=true)=>{editRevisionRef.current+=1;snapshot();setRedo([]);resetScanTest();const target=templateTypes[t.id];if(target&&target!==type)setType(target);setDesign(d=>({...d,fg:t.fg,bg:t.bg,accent:t.accent,bodyShape:t.pattern,finder:t.finder,gradient:t.gradient,inkGradient:false,gradientEnd:t.accent,title:t.title,subtitle:t.subtitle,cta:t.cta,ec:"H",margin:6,frame:t.frame!=="none",frameStyle:t.frame||"badge",logo:d.logoPreset?null:d.logo,logoName:d.logoPreset?"":d.logoName,logoEnabled:d.logoPreset?false:(d.logoEnabled&&!!d.logo),logoPreset:false}));if(toastIt)notify(`${t.name} template applied`)};
 const persistProject=async(showNotice:boolean,requestedRevision=editRevisionRef.current)=>{
   try{
     if(!savedIdRef.current){try{savedIdRef.current=crypto.randomUUID()}catch{savedIdRef.current=`qraft-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}}
     const id=savedIdRef.current; // assigned synchronously so overlapping saves cannot create duplicates
     const sensitive=type==="twofa"||(type==="wifi"&&form.security!=="nopass");
     const c=await renderQR(sensitive?"qraft:private":payload,design,240);
     if(requestedRevision!==editRevisionRef.current)return false;
     const name=design.title||types.find(t=>t.id===type)?.label||"Qraft QR";
     const previous=projects.find(x=>x.id===id); const p:Project={id,name,type,form:{...form,password:"",twofaSecret:""},design,updated:Date.now(),thumbnail:c.toDataURL("image/png"),favorite:previous?.favorite||false,tags:previous?.tags||[types.find(t=>t.id===type)?.group||"General"]};
     setProjects(x=>[p,...x.filter(y=>y.id!==p.id)].slice(0,100));
     if(showNotice)notify("Project saved locally ✨");return true;
   }catch(e){if(showNotice)notify(e instanceof Error?`Save failed: ${e.message}`:"Could not save this project");return false}
 };
 const autosaveTimer=useRef<number|null>(null);
 useEffect(()=>{if(view!=="create"&&view!=="templates")return;if(!dirtyRef.current)return;if(autosaveTimer.current!==null)window.clearTimeout(autosaveTimer.current);const revision=editRevisionRef.current;autosaveTimer.current=window.setTimeout(()=>{void persistProject(false,revision)},1200);return()=>{if(autosaveTimer.current!==null)window.clearTimeout(autosaveTimer.current)}},[view,type,form,design,payload]);
 const openProject=(p:Project)=>{editRevisionRef.current+=1;dirtyRef.current=false;lastSnap.current={key:"",t:0};setUndo([]);setRedo([]);setSavedId(p.id);setType(p.type);setForm({...initialForm,...p.form});const legacy=p.design as DesignState & {pattern?:BodyShape};setDesign({...initialDesign,...legacy,bodyShape:legacy.bodyShape||legacy.pattern||initialDesign.bodyShape});setCreateStep(2);setViewClean("create");notify("Project opened")};
 const newProject=()=>{editRevisionRef.current+=1;dirtyRef.current=false;lastSnap.current={key:"",t:0};setSavedId("");setType("url");setForm({...initialForm});setDesign({...initialDesign});setUndo([]);setRedo([]);setScanResult("");setScanError("");setScanTest({state:"idle",message:"Run the scan test to verify this QR before publishing it."});setCreateStep(1);setViewClean("create");window.scrollTo({top:0,behavior:"auto"});notify("New QR ready")};

 const removeProject=(id:string)=>{if(id===savedIdRef.current)setSavedId("");setProjects(p=>p.filter(x=>x.id!==id))};
 const duplicateProject=(p:Project)=>{const copy:Project={...p,id:`${p.id}-copy-${Date.now()}`,name:`${p.name} Copy`,updated:Date.now(),thumbnail:p.thumbnail,form:{...p.form},design:{...p.design},favorite:false,tags:[...(p.tags||[])]};setProjects(x=>[copy,...x.filter(y=>y.id!==copy.id)].slice(0,100));setSavedId(copy.id);setType(copy.type);setForm({...initialForm,...copy.form});setDesign({...initialDesign,...copy.design});setCreateStep(2);setViewClean("create");notify("Project duplicated")};
 const toggleFavorite=(id:string)=>setProjects(list=>list.map(p=>p.id===id?{...p,favorite:!p.favorite,updated:Date.now()}:p));
 const exportProjects=()=>{
   const payload={app:"Qraft",version:1,exportedAt:new Date().toISOString(),projects:projects.slice(0,100)};
   const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
   downloadBlob(blob,`qraft-projects-${new Date().toISOString().slice(0,10)}.json`);
   notify(`${projects.length} project${projects.length===1?"":"s"} exported`);
 };
 const importProjects=async(file:File)=>{
   try{
     if(file.size>10*1024*1024)throw new Error("Project backup is larger than 10 MB.");
     const raw=JSON.parse(await file.text()) as {app?:unknown;version?:unknown;projects?:unknown};
     if(raw?.app!=="Qraft"||raw.version!==1||!Array.isArray(raw.projects))throw new Error("Unsupported or invalid Qraft backup. Export a fresh Qraft v1 backup and try again.");
     const normalized=(raw.projects as unknown[]).map(normalizeImportedProject).filter((p):p is Project=>p!==null).slice(0,100);
     if(!normalized.length)throw new Error("No valid projects were found in this backup.");
     const merged=Array.from(new Map<string,Project>([...projects.map((p):[string,Project]=>[p.id,p]),...normalized.map((p):[string,Project]=>[p.id,p])]).values()).sort((a:Project,b:Project)=>b.updated-a.updated).slice(0,100);
     await saveProjects(merged);
     setProjects(merged);
     notify(`${normalized.length} project${normalized.length===1?"":"s"} imported`);
   }catch(e){notify(e instanceof Error?e.message:"Could not import that backup")}
 };
 const clearProjects=async()=>{try{await clearStoredProjects();setProjects([]);setSavedId("");notify("All local projects cleared")}catch(e){notify(e instanceof Error?e.message:"Could not clear projects")}};
 const verifyCurrentQR=async():Promise<string|null>=>{
   const problem=validatePayload(type,form);
   if(problem)throw new Error(problem);
   if(!payload.trim())throw new Error("Add your QR content before exporting.");
   return verifyQR(payload,design);
 };
 const withWarning=(base:string,w:string|null)=>w?`${base} ⚠ ${w}`:base;
 const exportRawPng=async()=>{
   setBusy(true);setScanTest({state:"running",message:"Verifying the QR before export…"});
   try{
     {const w=await verifyCurrentQR();setScanTest({state:"passed",message:withWarning("QR verified successfully. Preparing download…",w)})};
     const c=await renderQR(payload,design,design.size);
     downloadBlob(dataUrlBlob(c.toDataURL("image/png")),`${safeName(design.title)}-qr-only.png`);
     setDownloadSuccess("Your standalone QR image is downloaded and passed the automatic scan check ✨");
     notify("QR image exported and verified");
   }catch(e){const message=e instanceof Error?e.message:"QR export failed";setScanTest({state:"failed",message});notify(message)}finally{setBusy(false)}
 };
const makeDesignCanvas=async()=>{
   const c=document.createElement("canvas");
   c.width=1400;c.height=1540;
   const x=c.getContext("2d");
   if(!x)throw new Error("Canvas is unavailable");
   x.textAlign="center";x.textBaseline="middle";
   const bg=design.bg||"#ffffff",fg=design.fg||"#17213b";
   x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);
   if(design.gradient){
     const g=x.createLinearGradient(0,0,1400,1540);
     g.addColorStop(0,bg);g.addColorStop(1,`${design.accent||"#c77aae"}26`);
     x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
   }
   x.fillStyle=fg;x.font="900 30px Arial";x.fillText("QRAFT",700,70);
   const title=design.title||"Scan me";
   x.font=`900 ${titleFontSize(title)}px Arial`;
   x.fillText(title,700,140);
   x.globalAlpha=.68;x.font="500 28px Arial";
   x.fillText((design.subtitle||"Open the link").slice(0,72),700,194);
   x.globalAlpha=1;
   const q=await renderQR(payload,{...design,transparent:false},840);
   x.fillStyle="#ffffff";
   x.beginPath();x.roundRect(235,245,930,930,44);x.fill();
   x.drawImage(q,280,290,840,840);
   if(design.frame&&design.frameStyle!=="none"){
     const g=frameGeometry(design.frameStyle);
     x.beginPath();x.roundRect(g.x,g.y,g.w,g.h,g.r);
     if(g.style==="soft"){x.globalAlpha=.10;x.fillStyle=fg;x.fill();x.globalAlpha=1;}
     else if(g.style==="scan"){x.lineWidth=12;x.strokeStyle=fg;x.stroke();}
     else if(g.style==="outline"){x.lineWidth=8;x.strokeStyle=fg;x.stroke();}
     else if(g.style==="corner"){x.lineWidth=8;x.strokeStyle=fg;x.stroke();}
     else if(g.style==="stamp"){x.lineWidth=7;x.setLineDash([18,10]);x.strokeStyle=fg;x.stroke();x.setLineDash([]);}
     else{x.fillStyle=fg;x.fill();}
     x.fillStyle=(g.style==="soft"||g.style==="scan"||g.style==="outline"||g.style==="corner"||g.style==="stamp")?fg:bg;
     x.font=`900 ${ctaFontSize(g.h)}px Arial`;
     x.fillText(design.cta||"SCAN ME",700,g.y+g.h/2);
   }
   x.fillStyle=fg;x.globalAlpha=.52;x.font="500 19px Arial";x.fillText("Create · Customize · Share",700,1420);
   x.globalAlpha=1;
   return c;
 };
 const verifyCardCanvas=async(card:HTMLCanvasElement)=>{
   const crop=document.createElement("canvas");crop.width=840;crop.height=840;
   const cx=crop.getContext("2d",{willReadFrequently:true});if(!cx)throw new Error("Canvas unavailable");
   cx.drawImage(card,280,290,840,840,0,0,840,840);
   const data=cx.getImageData(0,0,840,840);
   const decoded=jsQR(data.data,data.width,data.height,{inversionAttempts:"attemptBoth"});
   if(decoded?.data!==payload)throw new Error("The final QR card could not be decoded after composition. Try a larger quiet zone or simplify the logo/design.");
 };
 const verifySvgCard=async(svg:string)=>{
   const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));
   try{
     const img=await loadImage(url);
     const card=document.createElement("canvas");card.width=1400;card.height=1540;
     const cctx=card.getContext("2d",{willReadFrequently:true});if(!cctx)throw new Error("Canvas unavailable");
     cctx.drawImage(img,0,0,1400,1540);
     await verifyCardCanvas(card);
   }finally{URL.revokeObjectURL(url)}
 };

 const exportPng=async()=>{
   setBusy(true);setScanTest({state:"running",message:"Verifying the QR before the full card download…"});
   try{
     {const w=await verifyCurrentQR();setScanTest({state:"passed",message:withWarning("QR verified successfully. Preparing the complete card…",w)})};
     const c=await makeDesignCanvas();
     await verifyCardCanvas(c);
     downloadBlob(dataUrlBlob(c.toDataURL("image/png")),`${safeName(design.title)}-qraft-card.png`);
     setDownloadSuccess("Your complete Qraft card is downloaded and passed the automatic scan check ✨");
     notify("Complete Qraft card exported and verified");
   }catch(e){const message=e instanceof Error?e.message:"Card export failed";setScanTest({state:"failed",message});notify(message)}finally{setBusy(false)}
 };
 const exportDesign=async()=>{
   setBusy(true);setScanTest({state:"running",message:"Verifying the QR before the design export…"});
   try{
     {const w=await verifyCurrentQR();setScanTest({state:"passed",message:withWarning("QR verified successfully. Preparing the design card…",w)})};
     const c=await makeDesignCanvas();
     await verifyCardCanvas(c);
     downloadBlob(dataUrlBlob(c.toDataURL("image/png")),`${safeName(design.title)}-qraft-design.png`);
     setDownloadSuccess("Your complete Qraft design card is downloaded and passed the automatic scan check ✨");
     notify("Design card exported and verified");
   }catch(e){const message=e instanceof Error?e.message:"Design export failed";setScanTest({state:"failed",message});notify(message)}finally{setBusy(false)}
 };
const exportSvg=async()=>{
   setBusy(true);setScanTest({state:"running",message:"Verifying the QR before the SVG export…"});
   try{
     {const w=await verifyCurrentQR();setScanTest({state:"passed",message:withWarning("QR verified successfully. Preparing the SVG card…",w)})}
     // The QR is embedded as real vector paths (not a raster <image>) so it stays sharp at any print size.
     const qrInner=(await qrSvg(payload,{...design,transparent:false})).replace(/^<svg[^>]*>/,'<svg x="280" y="290" width="840" height="840" viewBox="0 0 1000 1000">');
     const escSvg=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
     const fg=design.fg||"#17213b",bg=design.bg||"#ffffff",accent=design.accent||fg;
     const title=(design.title||"Scan me").slice(0,72);
     const subtitle=escSvg((design.subtitle||"Open the link").slice(0,96));
     const background=`<rect width="1400" height="1540" fill="${bg}"/>`+(design.gradient?`<defs><linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${accent}" stop-opacity="0.15"/></linearGradient></defs><rect width="1400" height="1540" fill="url(#qg)"/>`:"");
     let frame="";
     if(design.frame&&design.frameStyle!=="none"){
       const g=frameGeometry(design.frameStyle);
       const shape=g.style==="soft"?`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="${g.r}" fill="${fg}" fill-opacity="0.10"/>`:g.style==="scan"?`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="${g.r}" fill="none" stroke="${fg}" stroke-width="12"/>`:g.style==="outline"?`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="${g.r}" fill="none" stroke="${fg}" stroke-width="8"/>`:g.style==="corner"?`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="${g.r}" fill="none" stroke="${fg}" stroke-width="8"/>`:g.style==="stamp"?`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="${g.r}" fill="none" stroke="${fg}" stroke-width="7" stroke-dasharray="18 10"/>`:`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="${g.r}" fill="${fg}"/>`;
       const textFill=(g.style==="soft"||g.style==="scan"||g.style==="outline"||g.style==="corner"||g.style==="stamp")?fg:bg;
       frame=`${shape}<text x="700" y="${g.y+g.h/2}" fill="${textFill}" font-family="Arial, sans-serif" font-size="${ctaFontSize(g.h)}" font-weight="900" text-anchor="middle" dominant-baseline="middle">${escSvg(design.cta||"SCAN ME")}</text>`;
     }
     const card=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1540" viewBox="0 0 1400 1540">${background}<text x="700" y="70" fill="${fg}" font-family="Arial, sans-serif" font-size="30" font-weight="900" text-anchor="middle">QRAFT</text><text x="700" y="140" fill="${fg}" font-family="Arial, sans-serif" font-size="${titleFontSize(title)}" font-weight="900" text-anchor="middle">${escSvg(title)}</text><text x="700" y="194" fill="${fg}" fill-opacity="0.68" font-family="Arial, sans-serif" font-size="28" text-anchor="middle">${subtitle}</text><rect x="235" y="245" width="930" height="930" rx="44" fill="#ffffff"/>${qrInner}${frame}<text x="700" y="1420" fill="${fg}" fill-opacity="0.52" font-family="Arial, sans-serif" font-size="19" text-anchor="middle">Create · Customize · Share</text></svg>`;
     await verifySvgCard(card);
     downloadBlob(new Blob([card],{type:"image/svg+xml;charset=utf-8"}),`${safeName(design.title)}-qraft-card.svg`);
     setDownloadSuccess("Your complete Qraft card SVG is ready ✨");
     notify("Complete SVG card exported and verified");
   }catch(e){const message=e instanceof Error?e.message:"SVG export failed";setScanTest({state:"failed",message});notify(message)}finally{setBusy(false)}
 };
 const exportPdf=async()=>{
   setBusy(true);setScanTest({state:"running",message:"Verifying the QR before the PDF export…"});
   try{
     {const w=await verifyCurrentQR();setScanTest({state:"passed",message:withWarning("QR verified successfully. Preparing the printable card…",w)})};
     const c=await makeDesignCanvas();
     await verifyCardCanvas(c);
     const {jsPDF}=await import("jspdf");const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
     pdf.addImage(c.toDataURL("image/png"),"PNG",25,15,160,176);
     pdf.save(`${safeName(design.title)}-qraft-card.pdf`);
     setDownloadSuccess("Your complete printable Qraft card PDF is ready ✨");
     notify("Complete Qraft card PDF exported");
   }catch(e){const message=e instanceof Error?e.message:"PDF export failed";setScanTest({state:"failed",message});notify(message)}finally{setBusy(false)}
 };
 const copyPayload=async()=>{try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(payload)}else{const ta=document.createElement("textarea");ta.value=payload;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}notify("QR content copied ✨")}catch{notify("Copy is unavailable in this browser")}};
 const getDetector=async()=>{
   if(detectorRef.current!==undefined)return detectorRef.current;
   const Detector=(window as unknown as {BarcodeDetector?:{new(o:{formats:string[]}):{detect:(s:HTMLCanvasElement)=>Promise<{rawValue?:string}[]>};getSupportedFormats?:()=>Promise<string[]>}}).BarcodeDetector;
   if(!Detector){detectorRef.current=null;return null}
   try{
     const desired=["qr_code"];
     const supported=typeof Detector.getSupportedFormats==="function"?await Detector.getSupportedFormats():desired;
     const formats=desired.filter(x=>supported.includes(x));
     detectorRef.current=new Detector({formats:formats.length?formats:["qr_code"]});
   }catch{detectorRef.current=null}
   return detectorRef.current;
 };
 const stopScanner=()=>{streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;if(cameraRef.current)cameraRef.current.srcObject=null;if(scanFrameRef.current!==null){cancelAnimationFrame(scanFrameRef.current);scanFrameRef.current=null}};
 const handleDecodedValue=(value:string)=>{setScanError("");setScanResult(value);stopScanner()};
 const scanCanvasWithPreprocessing=(c:HTMLCanvasElement):string|null=>{
   const ctx=c.getContext("2d",{willReadFrequently:true});if(!ctx)return null;
   const attempts:{canvas:HTMLCanvasElement;close?:()=>void}[]=[];attempts.push({canvas:c});
   // Upscale smaller captures; many phone screenshots contain a QR only a few hundred pixels wide.
   const maxSide=Math.max(c.width,c.height);
   if(maxSide<1200){const scale=Math.min(2.25,1200/maxSide);const up=document.createElement("canvas");up.width=Math.round(c.width*scale);up.height=Math.round(c.height*scale);const uctx=up.getContext("2d",{willReadFrequently:true})!;uctx.imageSmoothingEnabled=false;uctx.drawImage(c,0,0,up.width,up.height);attempts.push({canvas:up});}
   for(const item of attempts){const cc=item.canvas;const cx=cc.getContext("2d",{willReadFrequently:true});if(!cx)continue;const d=cx.getImageData(0,0,cc.width,cc.height);
     const variants=[d];
     // Also inspect centered square crops so a tiny QR surrounded by a large photo/UI can still be found.
     const side=Math.min(cc.width,cc.height);
     for(const fraction of [0.82,0.64,0.46]){
       const cropSide=Math.max(1,Math.floor(side*fraction));
       const sx=Math.floor((cc.width-cropSide)/2), sy=Math.floor((cc.height-cropSide)/2);
       const crop=cx.getImageData(sx,sy,cropSide,cropSide);
       variants.push(crop);
     }
     const gray=new Uint8ClampedArray(d.data.length);
     for(let i=0;i<gray.length;i+=4){const y=Math.round(d.data[i]*.299+d.data[i+1]*.587+d.data[i+2]*.114);gray[i]=gray[i+1]=gray[i+2]=y;gray[i+3]=255;}
     variants.push(new ImageData(gray,d.width,d.height));
     const inv=new Uint8ClampedArray(gray.length);for(let i=0;i<inv.length;i+=4){inv[i]=255-gray[i];inv[i+1]=255-gray[i+1];inv[i+2]=255-gray[i+2];inv[i+3]=255;}variants.push(new ImageData(inv,d.width,d.height));
     for(const variant of variants){const code=jsQR(variant.data,variant.width,variant.height,{inversionAttempts:"attemptBoth"});if(code?.data)return code.data;}
   }
   return null;
 };
 const startCamera=async()=>{try{setScanError("");setScanResult("");stopScanner();if(!navigator.mediaDevices?.getUserMedia)throw new Error();const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});streamRef.current=s;if(cameraRef.current){cameraRef.current.srcObject=s;await cameraRef.current.play();scanLoop()}}catch{setScanError("Camera permission or camera access is unavailable. Try image upload instead.")}};
 const scanLoop=async()=>{const v=cameraRef.current,c=scanCanvas.current;if(!v||!c||!streamRef.current)return;const now=performance.now();if(now-scanLastAt.current<120){scanFrameRef.current=requestAnimationFrame(scanLoop);return}scanLastAt.current=now;if(v.videoWidth){const sc=Math.min(1,720/Math.max(v.videoWidth,v.videoHeight));const w=Math.round(v.videoWidth*sc),h=Math.round(v.videoHeight*sc);if(c.width!==w||c.height!==h){c.width=w;c.height=h}}else if(!c.width){c.width=720;c.height=540}const ctx=c.getContext("2d",{willReadFrequently:true});if(!ctx)return;ctx.drawImage(v,0,0,c.width,c.height);
   const d=ctx.getImageData(0,0,c.width,c.height);const qr=jsQR(d.data,d.width,d.height,{inversionAttempts:"attemptBoth"});if(qr?.data){handleDecodedValue(qr.data);return;}
   detectorTick.current=(detectorTick.current+1)%6;if(detectorTick.current===0){const detector=await getDetector();if(detector){try{const found=await detector.detect(c);const value=found?.find(x=>x.rawValue)?.rawValue;if(value){handleDecodedValue(value);return}}catch{}}}
   if(streamRef.current)scanFrameRef.current=requestAnimationFrame(scanLoop);
 };
 const scanFile=(file:File)=>{if(!file.type.startsWith("image/")){setScanError("Please choose an image file.");return}stopScanner();setScanResult("");setScanError("");const img=new Image();const url=URL.createObjectURL(file);img.onload=async()=>{try{const c=scanCanvas.current!;const max=1800;const scale=Math.min(1,max/Math.max(img.width,img.height));c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const ctx=c.getContext("2d",{willReadFrequently:true})!;ctx.imageSmoothingEnabled=true;ctx.drawImage(img,0,0,c.width,c.height);let value:string|null=null;const detector=await getDetector();if(detector){try{const found=await detector.detect(c);value=found?.find(x=>x.rawValue)?.rawValue||null}catch{}}if(!value)value=scanCanvasWithPreprocessing(c);if(value)handleDecodedValue(value);else setScanError("No readable QR/barcode found. Try a sharper image, better contrast, or crop closer to the code.")}catch{setScanError("This image could not be scanned.")}finally{URL.revokeObjectURL(url)}};img.onerror=()=>{setScanError("This image could not be opened.");URL.revokeObjectURL(url)};img.src=url};
 const testCurrentQR=async()=>{setScanTest({state:"running",message:"Checking the generated QR…"});setScanError("");try{const w=await verifyCurrentQR();setScanResult(payload);setScanTest({state:"passed",message:withWarning("Scan test passed — this generated QR decodes to the exact content above.",w)});notify("QR scan test passed ✨")}catch(e){const message=e instanceof Error?e.message:"QR self-test failed.";setScanTest({state:"failed",message});setScanError(message);notify(message)}};
 const clearScan=()=>{setScanResult("");setScanError("");setScanTest({state:"idle",message:"Run the scan test to verify this QR before publishing it."})};
 const runBatch=async()=>{
   const all=batch.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   const rows=all.slice(0,1000);
   const out:{name:string;url:string}[]=[];const used=new Set<string>();let skipped=0;
   setBatchProgress(`0/${rows.length}`);
   for(let i=0;i<rows.length;i++){
     const row=rows[i];const idx=row.indexOf(",");const head=idx>0?row.slice(0,idx).trim():"";
     const hasName=idx>0&&!/^[a-z][a-z0-9+.-]*:/i.test(head)&&!head.includes("/");
     let value=(hasName?row.slice(idx+1):row).trim();
     if(!value){skipped++;continue}
     if(/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#:].*)?$/i.test(value))value=normUrl(value);
     try{
       const c=await renderQR(value,{...design,logo:null,ec:"H",transparent:false},700);
       const base=safeName(hasName?head:value.replace(/^https?:\/\//i,""))||`QR-${i+1}`;
       let name=base,k=2;while(used.has(name.toLowerCase()))name=`${base}-${k++}`;used.add(name.toLowerCase());
       // Keep batches bounded in memory: 700px PNGs are immediately represented as blobs/data URLs only for the current UI preview.
       out.push({name,url:c.toDataURL("image/png")});
     }catch{skipped++}
     if(i%4===3){setBatchProgress(`${i+1}/${rows.length}`);await new Promise(r=>window.setTimeout(r,0))}
   }
   setBatchProgress("");setBatchResults(out);
   const notes=[all.length>1000?`${all.length-1000} rows over the 1,000 limit ignored`:"",skipped?`${skipped} row${skipped>1?"s":""} skipped`:""].filter(Boolean).join(" · ");
   notify(`${out.length} QR codes generated${notes?` · ${notes}`:""}`);
 };
 const downloadBatch=async()=>{const {default:JSZip}=await import("jszip");const zip=new JSZip();batchResults.forEach(x=>zip.file(`${x.name}.png`,x.url.split(",")[1],{base64:true}));downloadBlob(await zip.generateAsync({type:"blob"}),"qraft-batch.zip");setDownloadSuccess(`${batchResults.length} QR images are bundled and downloaded ✨`);notify("Batch ZIP downloaded")};
 const setViewClean=(v:View)=>{if(window.location.hash!==`#/${v}`)window.location.hash=`#/${v}`;setView(v);window.scrollTo({top:0,behavior:"auto"})};
 const state:AppState={view,setView:setViewClean,newProject,createStep,setCreateStep,type,setType:setTypeSafe,form,design,updateForm,updateDesign,payload,busy,setBusy,notify,resetDesign,testCurrentQR,copyPayload,exportRawPng,exportPng,exportSvg,exportPdf,exportDesign,undoAction,redoAction,undo,redo,projects,openProject,removeProject,clearProjects,duplicateProject,toggleFavorite,exportProjects,importProjects,templateSearch,setTemplateSearch,templateCategory,setTemplateCategory,filteredTemplates,applyTemplate,batch,setBatch,batchResults,runBatch,downloadBatch,scanResult,scanError,scanTest,startCamera,scanFile,clearScan,cameraRef,scanCanvas,updateDesignMany,onLogoFile,stopScanner,batchProgress};
 const commands:[string,string,()=>void][]=[["Create new QR","Start a fresh QR",()=>{newProject();setCommandOpen(false)}],["Open projects","Search and manage saved QR work",()=>{setViewClean("projects");setCommandOpen(false)}],["Open templates","Browse the design library",()=>{setViewClean("templates");setCommandOpen(false)}],["Open scanner","Scan and test a QR",()=>{setViewClean("scanner");setCommandOpen(false)}],["Open tools","Batch generation and utilities",()=>{setViewClean("tools");setCommandOpen(false)}]];
 const wrap=(content:ReactNode)=><>{content}{commandOpen&&<div className="command-overlay" role="dialog" aria-modal="true" aria-label="Qraft command palette" onMouseDown={e=>{if(e.target===e.currentTarget)setCommandOpen(false)}}><div className="command-palette"><div className="command-head"><Command size={18}/><div><b>Qraft commands</b><span>Jump anywhere with Ctrl / ⌘ + K</span></div><button className="icon-button" onClick={()=>setCommandOpen(false)}><X size={16}/></button></div><div className="command-list">{commands.map(([title,desc,action],i)=><button key={title} onClick={action}><span className="command-key">{i+1}</span><span><b>{title}</b><small>{desc}</small></span><ArrowRight size={14}/></button>)}</div></div></div>}{toast&&<div className="qraft-toast" role="status">{toast}</div>}{downloadSuccess&&<div className="download-success-overlay" role="dialog" aria-modal="true" aria-label="Download complete"><div className="download-success-card"><div className="success-orbit"><Check size={28}/></div><span className="page-eyebrow">CONGRATULATIONS</span><h2>Your QR is ready 🎀</h2><p>{downloadSuccess}</p><div className="success-actions"><button className="primary" autoFocus onClick={()=>setDownloadSuccess("")}>Keep editing <Paintbrush size={15}/></button><button className="soft" onClick={()=>{setDownloadSuccess("");newProject()}}><QrCode size={15}/> Create new QR</button><button className="soft" onClick={()=>{setDownloadSuccess("");setViewClean("projects")}}><FolderOpen size={15}/> View projects</button><button className="soft" onClick={()=>{setDownloadSuccess("");setViewClean("scanner")}}><ScanLine size={15}/> Scan & test</button></div></div></div>}</>;
 if(view==="landing")return wrap(<Landing go={setViewClean}/>);
 if(view==="privacy")return wrap(<InfoPage kind="privacy" onBack={()=>setViewClean("landing")} onNavigate={setViewClean} onPrivacy={()=>setViewClean("privacy")} onTerms={()=>setViewClean("terms")} onDeveloper={()=>setViewClean("developer")}/>);
 if(view==="terms")return wrap(<InfoPage kind="terms" onBack={()=>setViewClean("landing")} onNavigate={setViewClean} onPrivacy={()=>setViewClean("privacy")} onTerms={()=>setViewClean("terms")} onDeveloper={()=>setViewClean("developer")}/>);
 if(view==="developer")return wrap(<InfoPage kind="developer" onBack={()=>setViewClean("landing")} onNavigate={setViewClean} onPrivacy={()=>setViewClean("privacy")} onTerms={()=>setViewClean("terms")} onDeveloper={()=>setViewClean("developer")}/>);
 if(view==="create")return wrap(<CreatePage state={state}/>);
 if(view==="templates")return wrap(<TemplatesPage state={state}/>);
 if(view==="tools")return wrap(<ToolsPage state={state}/>);
 if(view==="projects")return wrap(<ProjectsPage state={state}/>);
 return wrap(<ScannerPage state={state}/>);
}

export default App;
