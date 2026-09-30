// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { renderQR, qrSvg, verifyQR, type DesignState, type Pattern } from "./render";

const design:DesignState={title:"t",subtitle:"s",fg:"#15343a",bg:"#fffdf8",bodyShape:"square",finder:"square",ec:"H",size:600,margin:4,transparent:false,logo:null,logoName:"",logoSize:12,frame:true,frameStyle:"badge",cta:"SCAN",radius:28,gradient:false,accent:"#0f8b8d"};
const decode=(c:HTMLCanvasElement)=>{const x=c.getContext("2d")!;const d=x.getImageData(0,0,c.width,c.height);return jsQR(d.data,d.width,d.height)?.data};

describe("renderQR round trip",()=>{
  const shapes:Pattern[]=["square","rounded","dots","diamond","bars"];
  for(const shape of shapes)for(const finder of ["square","rounded"] as const){
    it(`decodes ${shape} body / ${finder} finder`,async()=>{
      const p="https://example.com/a?b=1";
      const c=await renderQR(p,{...design,bodyShape:shape,finder},700);
      expect(decode(c)).toBe(p);
    }, 15000);
  }
  it("keeps dots/diamond scannable on larger versions (solid alignment patterns)",async()=>{
    const p="https://example.com/a/very/long/path/that/needs/a/bigger/qr/code?x=1&y=2&z=3";
    for(const shape of ["dots","diamond"] as const){
      expect(decode(await renderQR(p,{...design,bodyShape:shape},900))).toBe(p);
    }
  });
  it("decodes multi-line payloads (vCard / event)",async()=>{
    const p="BEGIN:VCARD\nVERSION:3.0\nFN:Test User\nTEL:+9779800000000\nEND:VCARD";
    expect(decode(await renderQR(p,design,700))).toBe(p);
  });
});

describe("transparent background",()=>{
  it("keeps the finder ring hollow and the background transparent",async()=>{
    const size=700,c=await renderQR("hi",{...design,transparent:true},size); // "hi" -> version 1 (21 modules)
    const x=c.getContext("2d")!;
    const alpha=(px:number,py:number)=>x.getImageData(Math.round(px),Math.round(py),1,1).data[3];
    // modules: v1 = 21 modules, margin 4 -> cell = size/29. Finder ring hole is module (1..5,1..5) offset by margin.
    const cell=size/(21+8);
    expect(alpha(1,1)).toBe(0);                                  // quiet zone is transparent
    expect(alpha((4+0.5)*cell,(4+0.5)*cell)).toBe(255);          // finder outer ring is solid
    expect(alpha((4+1.5)*cell,(4+1.5)*cell)).toBe(0);            // finder ring gap is transparent (was solid before the fix)
    expect(alpha((4+3.5)*cell,(4+3.5)*cell)).toBe(255);          // finder centre is solid
  });
  it("still decodes once composited on white",async()=>{
    const c=await renderQR("https://example.com",{...design,transparent:true},700);
    const out=document.createElement("canvas");out.width=out.height=700;
    const x=out.getContext("2d")!;x.fillStyle="#fff";x.fillRect(0,0,700,700);x.drawImage(c,0,0);
    expect(decode(out)).toBe("https://example.com");
  });
});

describe("verifyQR",()=>{
  it("passes a normal QR without warnings",async()=>{expect(await verifyQR("https://example.com",design)).toBeNull()});
  it("rejects low contrast",async()=>{await expect(verifyQR("https://example.com",{...design,fg:"#dddddd",bg:"#ffffff"})).rejects.toThrow(/contrast/i)});
  it("warns about light-on-dark",async()=>{const w=await verifyQR("https://example.com",{...design,fg:"#ffffff",bg:"#101521"});expect(w).toMatch(/dark background/i)});
  it("warns about transparent output",async()=>{expect(await verifyQR("https://example.com",{...design,transparent:true})).toMatch(/transparent/i)});
  it("explains over-long content",async()=>{await expect(verifyQR("x".repeat(5000),design)).rejects.toThrow(/too long/i)});
});

describe("qrSvg",()=>{
  it("is real vector output with hollow finders",async()=>{
    const svg=await qrSvg("https://example.com",{...design,transparent:true});
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).not.toContain("<image");
    expect(svg).not.toMatch(/<rect width="1000" height="1000"/); // no background rect when transparent
  });
  it("includes a background rect when opaque",async()=>{expect(await qrSvg("hi",design)).toMatch(/<rect width="1000" height="1000" fill="#fffdf8"/)})
  it("applies the ink gradient to the vector modules",async()=>{const svg=await qrSvg("hi",{...design,inkGradient:true,gradientEnd:"#2563eb"});expect(svg).toContain('id="qraftInkGradient"');expect(svg).toContain('fill="url(#qraftInkGradient)"')});
  it("keeps transparent finder holes transparent in SVG",async()=>{const svg=await qrSvg("hi",{...design,transparent:true});expect(svg).not.toContain('fill="#fffdf8"');expect(svg).toContain('fill-rule="evenodd"')});
});
