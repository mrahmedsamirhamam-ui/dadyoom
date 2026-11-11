import { describe, expect, it } from "vitest";
import {
  isPilotAuditRow, pilotLane, type PilotAuditRow,
} from "@/lib/curriculum-review/primary-pilot";

const base: PilotAuditRow = {
  id:"d2f640d8-e9ca-4e16-b3aa-ac03de771412",
  title:"درس تجريبي",country:"BH",grade:1,status:"published",content_kind:"official_candidate",
  OFFICIAL_SYLLABUS_MATCH:"NOT_VERIFIED",
  eligible_for_independent_human_decision:true,
  evidence:{official_source:true,complete_explanation:true,tested_interactions:true,independent_review:true},
  issues:[],editorial_flags:[],
};

describe("primary curriculum review routing (never automatic accreditation)",()=>{
  it("makes qualified report only GREEN as a candidate for human action",()=>{
    expect(pilotLane(base,true)).toBe("green");
    expect(base.OFFICIAL_SYLLABUS_MATCH).toBe("NOT_VERIFIED");
  });
  it("editorial contradictions always override green even with all evidence",()=>{
    expect(pilotLane({...base,editorial_flags:["EDITORIAL_OFFICIAL_CLAIM_CONFLICT"]},true)).toBe("yellow");
  });
  it("keeps incomplete explanations and activities RED",()=>{
    expect(pilotLane({...base,evidence:{...base.evidence,tested_interactions:false}},true)).toBe("red");
    expect(pilotLane({...base,issues:["EXPLANATION_INCOMPLETE_OR_UNPROVEN"]},true)).toBe("red");
  });
  it("never makes a partial or missing snapshot green",()=>{
    expect(pilotLane(base,false)).toBe("red");
  });
  it("isolates BH grades 1-3, and never treats enrichment as official",()=>{
    expect(pilotLane({...base,country:"PS"},true)).toBe("red");
    expect(pilotLane({...base,grade:4},true)).toBe("red");
    expect(pilotLane({...base,content_kind:"original_enrichment"},true)).toBe("red");
  });
  it("validates required schema for local report, rejects ungrounded rows",()=>{
    expect(isPilotAuditRow(base)).toBe(true);
    expect(isPilotAuditRow({...base,evidence:{official_source:true}})).toBe(false);
    expect(isPilotAuditRow({...base,id:"fake"})).toBe(false);
  });
});
