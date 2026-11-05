#!/usr/bin/env node
// Text extraction is an untrusted CANDIDATE, never a ministerial TOC verification.
// Visual inspection of textbook pages and edition remains mandatory.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
const args=process.argv.slice(2);
function arg(name){const i=args.indexOf(name);return i>=0?args[i+1]:null;}
const pdf=arg("--pdf"), out=arg("--out")||"_audits/ministerial/pdf-candidates.json";
if(!pdf)throw new Error("Usage: node scripts/ministerial-extract-pdf.mjs --pdf /absolute/file.pdf --out /private/dir/candidates.json [--source-url https://ministry.example/book.pdf]");
const bytes=fs.readFileSync(path.resolve(pdf));
if(bytes.length>100_000_000||bytes.length<100||bytes.toString("latin1",0,5)!=="%PDF-")throw new Error("INVALID_OR_TOO_LARGE_PDF");
const sha256=crypto.createHash("sha256").update(bytes).digest("hex");
const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true,disableFontFace:true,stopAtErrors:true});
const doc=await task.promise;
if(doc.numPages>900)throw new Error("PDF_TOO_MANY_PAGES");
const pages=[];
for(let i=1;i<=doc.numPages;i++){
 const page=await doc.getPage(i);
 const content=await page.getTextContent();
 const lines=[];let current=[];
 for(const t of content.items){if(typeof t.str!=="string")continue;
  current.push(t.str);if(t.hasEOL){lines.push(current.join(" "));current=[];}}
 if(current.length)lines.push(current.join(" "));
 const raw=lines.join("\n").normalize("NFC").replace(/\u0000/g,"");
 const arabicCount=(raw.match(/[\u0621-\u064a]/g)||[]).length;
 const hints=lines.filter(l=>/(الدرس|الوحدة|الفصل|المحتويات|الفهرس|حرف\s+ال)/.test(l)).slice(0,35);
 const warnings=[];
 if(raw.trim().length<120)warnings.push("SCANNED_OR_EMPTY_OR_UNREADABLE_PAGE");
 if(arabicCount<40)warnings.push("LOW_ARABIC_TEXT_DENSITY");
 if(/\ufffd/.test(raw))warnings.push("REPLACEMENT_CHARACTERS");
 if(/\bundefined\b|[\\]{2,}/.test(raw))warnings.push("EXTRACTION_ARTIFACTS");
 pages.push({pdfPage:i,pageText:raw,extractionChars:raw.length,arabicCount,
  candidateIndexLines:hints,warnings,requiresVisualReview:true});
 if(i%100===0)console.log("EXTRACTED_PAGES="+i);
}
const result={schemaVersion:1,sourceUrl:arg("--source-url")??null,bytes:bytes.length,
 sha256,pages:pages.length,generatedAt:new Date().toISOString(),
 verificationStatus:"CANDIDATE_ONLY_NOT_APPROVED",
 warning:"PDF extraction cannot verify page reading order, pictures, vowel marks, correct spelling, current edition or lesson outcomes. Mandatory visual review and ministerial TOC comparison.",
 data:pages};
fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
fs.writeFileSync(path.resolve(out),JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({sha256,pages:pages.length,unreadablePages:pages.filter(p=>p.warnings.length).length,
 resultFile:path.resolve(out),status:"CANDIDATE_ONLY_NOT_APPROVED"}));
await doc.destroy();
