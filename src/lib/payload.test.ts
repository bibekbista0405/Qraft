import { describe, expect, it } from "vitest";
import { payloadFor, validatePayload, normUrl, icalDate, escWifi, contrastRatio, decodeEmbeddedImage, type FormState } from "./payload";

const base:FormState={url:"https://example.com",text:"",email:"",subject:"",body:"",phone:"+977 ",smsBody:"",ssid:"",password:"",security:"WPA",firstName:"",lastName:"",organization:"",contactPhone:"",contactEmail:"",lat:"28.3949",lng:"84.1240",address:"Nepal",socialUrl:"",username:"",appUrl:"",fileUrl:"",eventName:"",eventStart:"",eventEnd:"",eventLocation:"",eventDescription:"",imageUrl:"https://",imageData:"",imageName:"",imageAlt:"",reviewUrl:"",paypal:"",bitcoin:"",twofaSecret:"",twofaIssuer:"",twofaAccount:""};
const f=(p:Partial<FormState>)=>({...base,...p});

describe("normUrl",()=>{
  it("adds https to bare domains",()=>{expect(normUrl("example.com")).toBe("https://example.com");expect(normUrl("www.a.io/x")).toBe("https://www.a.io/x")});
  it("keeps existing schemes",()=>{expect(normUrl("http://a.com")).toBe("http://a.com");expect(normUrl("mailto:a@b.co")).toBe("mailto:a@b.co")});
  it("treats the placeholder as empty",()=>{expect(normUrl("https://")).toBe("")});
});
describe("wifi",()=>{
  it("escapes special characters",()=>{expect(escWifi('a;b,c:d"e\\')).toBe('a\\;b\\,c\\:d\\"e\\\\')});
  it("omits the password for open networks",()=>{expect(payloadFor("wifi",f({ssid:"Cafe",security:"nopass",password:"x"}))).toBe("WIFI:T:nopass;S:Cafe;;")});
  it("builds a WPA payload",()=>{expect(payloadFor("wifi",f({ssid:"Home",password:"p:w"}))).toBe("WIFI:T:WPA;S:Home;P:p\\:w;;")});
});
describe("event",()=>{
  it("normalises dates",()=>{expect(icalDate("2026-09-28 18:00")).toBe("20260928T180000");expect(icalDate("2026-09-28")).toBe("20260928");expect(icalDate("20260928T180000")).toBe("20260928T180000")});
  it("rejects impossible calendar dates",()=>{expect(icalDate("2026-02-31 18:00")).toBe("");expect(icalDate("2026-13-01")).toBe("")});
  it("wraps in VCALENDAR",()=>{const p=payloadFor("event",f({eventName:"Meetup",eventStart:"2026-09-28 18:00"}));expect(p.startsWith("BEGIN:VCALENDAR")).toBe(true);expect(p).toContain("DTSTART:20260928T180000")});
});
describe("social + misc",()=>{
  it("youtube handles use /@",()=>{expect(payloadFor("youtube",f({username:"qraft"}))).toBe("https://youtube.com/@qraft")});
  it("whatsapp honours the URL field",()=>{expect(payloadFor("whatsapp",f({socialUrl:"https://wa.me/9779800000000"}))).toBe("https://wa.me/9779800000000")});
  it("whatsapp falls back to digits",()=>{expect(payloadFor("whatsapp",f({phone:"+977 98-000 00000"}))).toBe("https://wa.me/9779800000000")});
  it("location keeps coordinates authoritative",()=>{expect(payloadFor("location",f({}))).toBe("geo:28.3949,84.1240?q=28.3949,84.1240(Nepal)")});
  it("2fa normalises the secret",()=>{expect(payloadFor("twofa",f({twofaSecret:"jbsw y3dp",twofaIssuer:"Qraft",twofaAccount:"a@b.co"}))).toContain("secret=JBSWY3DP")});
  it("email omits empty query",()=>{expect(payloadFor("email",f({email:"a@b.co"}))).toBe("mailto:a@b.co")});
});
describe("validatePayload",()=>{
  it("rejects the untouched phone default",()=>{expect(validatePayload("phone",f({}))).not.toBeNull()});
  it("accepts a real phone number",()=>{expect(validatePayload("phone",f({phone:"+977 9800000000"}))).toBeNull()});
  it("rejects an empty wifi form",()=>{expect(validatePayload("wifi",f({}))).not.toBeNull()});
  it("accepts a bare domain for url",()=>{expect(validatePayload("url",f({url:"example.com"}))).toBeNull()});
  it("rejects non-base32 2fa secrets",()=>{expect(validatePayload("twofa",f({twofaSecret:"hello!",twofaAccount:"a"}))).not.toBeNull()});
});
describe("embedded image",()=>{
  it("passes data URLs through",()=>{const d="data:image/jpeg;base64,AAAA";expect(decodeEmbeddedImage(d)).toBe(d)});
  it("rejects garbage",()=>{expect(decodeEmbeddedImage("hello")).toBeNull()});
});
describe("contrast",()=>{it("black on white is 21",()=>{expect(Math.round(contrastRatio("#000000","#ffffff"))).toBe(21)})});
