// Read-only country/grade queue. Never infer official lesson completeness from record counts.
export function buildGrade123Queue(snapshot) {
  if (snapshot?.summary?.countries !== 22 || !Array.isArray(snapshot.rows))
    throw new Error("G123_SNAPSHOT_REQUIRES_22_COUNTRIES");
  const codeSet=new Set(snapshot.rows.map(r=>r.country));
  if (codeSet.size!==22) throw new Error("G123_SCOPE_MISSING_COUNTRIES");
  const byScope=new Map();
  for(const r of snapshot.rows){
    if(!codeSet.has(r.country) || ![1,2,3].includes(r.grade) || ![0,1,2].includes(r.semester))
      throw new Error("INVALID_G123_SCOPE");
    const key=r.country+":"+r.grade;
    if(!byScope.has(key))byScope.set(key,{country:r.country,countryName:r.country_name,grade:r.grade,
      published:0,drafts:0,unassignedPublished:0,semester1Published:0,semester2Published:0,
      planLinks:0,partialPackLinks:0,shortBodyReview:0,officialComplete:false});
    const s=byScope.get(key);
    s.published+=Number(r.published);
    s.drafts+=Number(r.drafts);
    s.planLinks+=Number(r.plan_not_textbook_links);
    s.partialPackLinks+=Number(r.partial_pack_links);
    s.shortBodyReview+=Number(r.bodies_under120)+Number(r.bodies_120_399);
    if(r.semester===0)s.unassignedPublished+=Number(r.published);
    if(r.semester===1)s.semester1Published+=Number(r.published);
    if(r.semester===2)s.semester2Published+=Number(r.published);
  }
  if(byScope.size!==66)throw new Error("G123_REQUIRES_66_COUNTRY_GRADE_CELLS");
  for(const c of codeSet)for(const g of [1,2,3])if(!byScope.has(c+":"+g))
    throw new Error("COUNTRY_GRADE_IS_MISSING:"+c+":"+g);
  const jobs=[...byScope.values()].sort((a,b)=>
    a.grade-b.grade ||
    (a.country==="BH"?-1:b.country==="BH"?1:a.country==="PS"?-1:b.country==="PS"?1:a.country.localeCompare(b.country))
  ).map((row,index)=>({...row,sequence:index+1,
    requiredAction:"Obtain and visually approve complete current-year official student-book TOC for both semesters, then verify each real lesson subject.",
    nextChecks:[
      ...(row.unassignedPublished?["CLASSIFY_UNASSIGNED_SHARED_SKILLS_NOT_OFFICIAL_TOC"]:[]),
      ...(row.planLinks?["REPLACE_SCHEDULE_ONLY_CITATIONS_WITH_REVIEWED_TEXTBOOK_EVIDENCE"]:[]),
      ...(row.partialPackLinks?["SEPARATE_PARTIAL_EDUCATIONAL_PACK_FROM_COMPLETE_STUDENT_BOOK"]:[]),
      ...(row.shortBodyReview?["REVIEW_SHORT_SUBJECT_EXPLANATIONS_MANUALLY"]:[]),
      "RECONCILE_COMPLETE_OFFICIAL_LESSON_TOPICS_AND_PUBLIC_PAGE"
    ]}));
  return {schemaVersion:1,asOf:snapshot.asOf,scope:"22-country grades 1-3 priority queue, not ministry coverage",
    officialFullYearCertified:false,reviewedBookTocs:0,
    warning:"No source-manifest evidence was verified from this production record-count snapshot. 0 approved TOCs here is not 0 existing books.",
    countries:22,gradeCells:66,jobs};
}
