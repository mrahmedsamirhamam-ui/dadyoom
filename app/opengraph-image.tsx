import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ضاديوم — بيت العربية الرقمي، تعلم العربية عبر القراءة والكتابة والاستماع والتحدث";

/** 1200×630 brand sharing fallback.
 * Next OG's current Satori font fallback failed Arabic GSUB at prerender:
 * lookupType: 5 - substFormat: 3 is not yet supported.
 * The accessible Arabic alt and on-page Arabic metadata remain unchanged.
 * Re-enable Arabic letterforms with a tested and properly licensed embedded font.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        width: "100%", height: "100%", padding: 78,
        background: "linear-gradient(135deg, #123f39 0%, #174f47 65%, #266c5d 100%)",
        color: "#ffffff", fontFamily: "sans-serif",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"center",
              width:88,height:88,borderRadius:24,background:"#f4d58a",color:"#123f39",fontSize:58,fontWeight:800
            }}>D</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{fontWeight:800,fontSize:43}}>DADYOOM</div>
              <div style={{fontWeight:600,fontSize:24,color:"#d9eee5"}}>DIGITAL HOME OF ARABIC</div>
            </div>
          </div>
          <div style={{fontSize:24,color:"#f4d58a"}}>dadyoom.com</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div style={{fontSize:59,fontWeight:800,lineHeight:1.2}}>LEARN ARABIC YOUR WAY</div>
          <div style={{fontSize:31,color:"#d9eee5"}}>Read, Write, Listen and Speak</div>
        </div>
        <div style={{display:"flex",gap:18,fontSize:24,color:"#f4d58a"}}>
          <div>For Arabic-speaking learners</div>
          <div>•</div>
          <div>For new Arabic learners</div>
        </div>
      </div>
    ),
    size,
  );
}
