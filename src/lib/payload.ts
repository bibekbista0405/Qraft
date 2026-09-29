/**
 * Pure (DOM-free) QR payload logic: types, escaping, normalisation, validation.
 * Kept separate from the UI so it can be unit-tested.
 */
export type TypeId = "url"|"text"|"email"|"phone"|"sms"|"wifi"|"vcard"|"location"|"whatsapp"|"instagram"|"facebook"|"youtube"|"tiktok"|"telegram"|"app"|"pdf"|"image"|"video"|"menu"|"event"|"review"|"paypal"|"bitcoin"|"twofa";

export type FormState = {
  url:string;text:string;email:string;subject:string;body:string;phone:string;smsBody:string;ssid:string;password:string;security:string;
  firstName:string;lastName:string;organization:string;contactPhone:string;contactEmail:string;lat:string;lng:string;address:string;imageUrl:string;imageData:string;imageName:string;imageAlt:string;
  socialUrl:string;username:string;appUrl:string;fileUrl:string;eventName:string;eventStart:string;eventEnd:string;eventLocation:string;eventDescription:string;
  reviewUrl:string;paypal:string;bitcoin:string;twofaSecret:string;twofaIssuer:string;twofaAccount:string;
};

export const DEFAULT_PHONE = "+977 ";

/** Escape for vCard / iCalendar text values (RFC 6350 / 5545). */
export function esc(v:string){return v.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");}
/** Escape for the WIFI: URI scheme (ZXing spec): \ ; , : " */
export function escWifi(v:string){return v.replace(/([\\;,:"])/g,"\\$1");}

/** Add https:// when someone types "example.com" or "www.example.com/x". */
export function normUrl(v:string){
  const s=v.trim();
  if(!s||s==="https://"||s==="http://")return "";
  if(/^[a-z][a-z0-9+.-]*:/i.test(s)&&!/^[a-z0-9.-]+:\d+(\/|$)/i.test(s))return s; // has a scheme
  if(/\s/.test(s))return s;
  return `https://${s.replace(/^\/\//,"")}`;
}

/** Turn "2026-09-28 18:00", "20260928T1800" etc. into iCalendar form. */
export function icalDate(v:string){
  const d=v.replace(/\D/g,"");
  if(d.length===8)return d;
  if(d.length===12)return `${d.slice(0,8)}T${d.slice(8)}00`;
  if(d.length>=14)return `${d.slice(0,8)}T${d.slice(8,14)}`;
  return d;
}

export function normBase32(v:string){return v.replace(/[\s-]+/g,"").toUpperCase();}

export function youtubeUrl(username:string){
  const u=username.trim().replace(/^\/+/,"");
  if(!u)return "";
  if(/^https?:/i.test(u))return u;
  if(/^UC[\w-]{20,}$/.test(u))return `https://youtube.com/channel/${u}`;
  return `https://youtube.com/@${u.replace(/^@/,"")}`;
}

export function payloadFor(t:TypeId,f:FormState):string{
  const u=(v:string)=>v.trim();
  const digits=(v:string)=>v.replace(/\D/g,"");
  switch(t){
    case "url":return normUrl(f.url);
    case "pdf":case "video":case "menu":return normUrl(f.fileUrl);
    case "image":return f.imageData||"";
    case "review":return normUrl(f.reviewUrl);
    case "paypal":return normUrl(f.paypal);
    case "app":return normUrl(f.appUrl);
    case "text":return f.text;
    case "email":{
      const q=[f.subject?`subject=${encodeURIComponent(f.subject)}`:"",f.body?`body=${encodeURIComponent(f.body)}`:""].filter(Boolean).join("&");
      return `mailto:${u(f.email)}${q?`?${q}`:""}`;
    }
    case "phone":return `tel:${f.phone.replace(/\s+/g,"")}`;
    case "sms":return `SMSTO:${f.phone.replace(/\s+/g,"")}:${f.smsBody}`;
    case "wifi":return f.security==="nopass"?`WIFI:T:nopass;S:${escWifi(f.ssid)};;`:`WIFI:T:${f.security};S:${escWifi(f.ssid)};P:${escWifi(f.password)};;`;
    case "vcard":return `BEGIN:VCARD\nVERSION:3.0\nN:${esc(f.lastName)};${esc(f.firstName)};;;\nFN:${esc(`${f.firstName} ${f.lastName}`.trim())}\nORG:${esc(f.organization)}\nTEL:${esc(f.contactPhone)}\nEMAIL:${esc(f.contactEmail)}\nEND:VCARD`;
    case "location":{
      const lat=u(f.lat),lng=u(f.lng),label=u(f.address);
      return `geo:${lat},${lng}?q=${lat},${lng}${label?`(${encodeURIComponent(label)})`:""}`;
    }
    case "whatsapp":{
      if(u(f.socialUrl))return normUrl(f.socialUrl);
      const n=digits(f.phone)||digits(f.username);
      return n?`https://wa.me/${n}`:"";
    }
    case "instagram":return u(f.socialUrl)?normUrl(f.socialUrl):(u(f.username)?`https://instagram.com/${f.username.trim().replace(/^@/,"")}`:"");
    case "facebook":return u(f.socialUrl)?normUrl(f.socialUrl):(u(f.username)?`https://facebook.com/${f.username.trim().replace(/^@/,"")}`:"");
    case "youtube":return u(f.socialUrl)?normUrl(f.socialUrl):youtubeUrl(f.username);
    case "tiktok":return u(f.socialUrl)?normUrl(f.socialUrl):(u(f.username)?`https://tiktok.com/@${f.username.trim().replace(/^@/,"")}`:"");
    case "telegram":return u(f.socialUrl)?normUrl(f.socialUrl):(u(f.username)?`https://t.me/${f.username.trim().replace(/^@/,"")}`:"");
    case "event":return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${esc(f.eventName)}\nDTSTART:${icalDate(f.eventStart)}\nDTEND:${icalDate(f.eventEnd||f.eventStart)}\nLOCATION:${esc(f.eventLocation)}\nDESCRIPTION:${esc(f.eventDescription)}\nEND:VEVENT\nEND:VCALENDAR`;
    case "bitcoin":return `bitcoin:${u(f.bitcoin)}`;
    case "twofa":{
      const issuer=u(f.twofaIssuer),account=u(f.twofaAccount);
      const label=issuer?`${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`:encodeURIComponent(account);
      return `otpauth://totp/${label}?secret=${encodeURIComponent(normBase32(f.twofaSecret))}${issuer?`&issuer=${encodeURIComponent(issuer)}`:""}`;
    }
  }
}

/** Returns a human message when the form is not ready to export, otherwise null. */
export function validatePayload(t:TypeId,f:FormState):string|null{
  const need=(ok:boolean,msg:string)=>ok?null:msg;
  const isUrl=(v:string)=>{const n=normUrl(v);return /^https?:\/\/[^\s/]+\.[^\s/]+/i.test(n)||/^https?:\/\/localhost/i.test(n)};
  const phoneOk=(v:string)=>v.replace(/\D/g,"").length>=5;
  switch(t){
    case "url":return need(isUrl(f.url),"Enter a valid website address, like https://example.com.");
    case "pdf":case "video":case "menu":return need(isUrl(f.fileUrl),"Enter the destination URL before exporting.");
    case "app":return need(isUrl(f.appUrl),"Enter the app or store URL before exporting.");
    case "review":return need(isUrl(f.reviewUrl),"Enter the review URL before exporting.");
    case "paypal":return need(isUrl(f.paypal),"Enter your PayPal link before exporting.");
    case "text":return need(f.text.trim().length>0,"Write some text before exporting.");
    case "email":return need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()),"Enter a valid email address.");
    case "phone":return need(phoneOk(f.phone),"Enter a phone number before exporting.");
    case "sms":return need(phoneOk(f.phone),"Enter a phone number for the SMS.");
    case "wifi":return need(f.ssid.trim().length>0,"Enter the Wi-Fi network name (SSID).")||need(f.security==="nopass"||f.password.length>0,"Enter the Wi-Fi password, or choose “nopass” for an open network.");
    case "vcard":return need((f.firstName+f.lastName+f.organization).trim().length>0,"Add at least a name or organization for the contact.")||need((f.contactPhone+f.contactEmail).trim().length>0,"Add a phone number or email for the contact.");
    case "location":return need(Number.isFinite(Number(f.lat))&&f.lat.trim()!==""&&Math.abs(Number(f.lat))<=90&&Number.isFinite(Number(f.lng))&&f.lng.trim()!==""&&Math.abs(Number(f.lng))<=180,"Latitude must be −90…90 and longitude −180…180.");
    case "whatsapp":return need(payloadFor(t,f)!=="","Add a phone number (with country code) or a WhatsApp link.");
    case "instagram":case "facebook":case "youtube":case "tiktok":case "telegram":return need(payloadFor(t,f)!=="","Add a profile URL or a username.");
    case "event":return need(f.eventName.trim().length>0,"Give the event a name.")||need(icalDate(f.eventStart).length>=8,"Add a start date, like 2026-09-28 18:00.");
    case "bitcoin":return need(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/.test(f.bitcoin.trim()),"That doesn’t look like a Bitcoin address.");
    case "twofa":return need(/^[A-Z2-7]{8,}=*$/.test(normBase32(f.twofaSecret)),"The secret must be a Base32 string (letters A–Z and digits 2–7).")||need(f.twofaAccount.trim().length>0,"Add the account name (for example an email address).");
    case "image":return need(f.imageData.length>0,"Choose an image to embed.");
  }
}

export function isEmbeddedImagePayload(value:string){
  return /^data:image\/(jpeg|png|webp);base64,/i.test(value)||value.startsWith("QRAFTIMG1|");
}
export function decodeEmbeddedImage(value:string){
  if(/^data:image\/(jpeg|png|webp);base64,/i.test(value)) return value;
  if(!value.startsWith("QRAFTIMG1|"))return null;
  const raw=value.slice("QRAFTIMG1|".length);
  const sep=raw.indexOf("|");
  if(sep<0)return null;
  const mime=raw.slice(0,sep);const b64=raw.slice(sep+1);
  if(!/^image\/(jpeg|png|webp)$/i.test(mime)||!b64)return null;
  return `data:${mime};base64,${b64}`;
}

/** WCAG contrast ratio between two #rrggbb colours. */
export function contrastRatio(a:string,b:string){
  const lum=(hex:string)=>{const n=hex.replace("#","");const r=parseInt(n.slice(0,2),16)/255,g=parseInt(n.slice(2,4),16)/255,bl=parseInt(n.slice(4,6),16)/255;const f=(v:number)=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);return .2126*f(r)+.7152*f(g)+.0722*f(bl)};
  const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function relLum(hex:string){return contrastRatio(hex,"#000000")}
