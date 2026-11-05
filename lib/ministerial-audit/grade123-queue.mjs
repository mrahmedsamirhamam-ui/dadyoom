// Read-only country/grade queue. Never infer official lesson completeness from record counts.
export function buildGrade123Queue(snapshot, editorial = null) {
  // Optional verified read-only extraction from the same production checkpoint.
  // These are review tasks only; never mutate lessons or infer Ministry approval.
  const editorialCounts = new Map();
  if (editorial !== null) {
    if (!Array.isArray(editorial.shorts) || !Array.isArray(editorial.unknownYear) ||
        editorial.summary.shortBodies !== editorial.shorts.length ||
        editorial.summary.unknownYearPublished !== editorial.unknownYear.length ||
        editorial.asOf !== snapshot?.asOf)
      throw new Error("INVALID_EDITORIAL_EVIDENCE_OR_SNAPSHOT_DATE");
    for (const [kind, entries] of [["short",editorial.shorts],["yearless",editorial.unknownYear]]) {
      const ids = new Set();
      for (const item of entries) {
        if (!item.lesson_id || ids.has(item.lesson_id) || ![1,2,3].includes(item.grade) ||
            typeof item.country !== "string" || item.country.length !== 2)
          throw new Error("DUPLICATE_OR_INVALID_EDITORIAL_LESSON");
        ids.add(item.lesson_id);
        const key=item.country+":"+item.grade;
        if(!editorialCounts.has(key))editorialCounts.set(key,{short:[],yearless:[]});
        editorialCounts.get(key)[kind].push(item.lesson_id);
      }
    }
  }
  if (snapshot?.summary?.countries !== 22 || !Array.isArray(snapshot.rows))
    throw new Error("G123_SNAPSHOT_REQUIRES_22_COUNTRIES");
  const codeSet=new Set(snapshot.rows.map(r=>r.country));
  if (codeSet.size!==22) throw new Error("G123_SCOPE_MISSING_COUNTRIES");
  const byScope=new Map();
  const seenCountryGradeTerms=new Set();
  let publishedTotal=0;
  let draftTotal=0;
  for(const r of snapshot.rows){
    if(!codeSet.has(r.country) || ![1,2,3].includes(r.grade) || ![0,1,2].includes(r.semester))
      throw new Error("INVALID_G123_SCOPE");
    const rowKey=r.country+":"+r.grade+":"+r.semester;
    if (seenCountryGradeTerms.has(rowKey)) throw new Error("DUPLICATE_G123_COUNTRY_GRADE_TERM");
    seenCountryGradeTerms.add(rowKey);
    for (const amount of ["published","drafts","plan_not_textbook_links","partial_pack_links",
                           "bodies_under120","bodies_120_399"]) {
      if (!Number.isSafeInteger(Number(r[amount])) || Number(r[amount])<0)
        throw new Error("INVALID_G123_COUNT_FIELD:"+amount);
    }
    publishedTotal+=Number(r.published);
    draftTotal+=Number(r.drafts);
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
  if (publishedTotal!==Number(snapshot.summary.published) ||
      draftTotal!==Number(snapshot.summary.drafts))
    throw new Error("G123_SNAPSHOT_AGGREGATE_MISMATCH");
  for(const key of editorialCounts.keys())if(!byScope.has(key))
    throw new Error("EDITORIAL_SCOPE_NOT_IN_PRODUCTION_SNAPSHOT:"+key);
  const jobs=[...byScope.values()].sort((a,b)=>
    a.grade-b.grade ||
    (a.country==="BH"?-1:b.country==="BH"?1:a.country==="PS"?-1:b.country==="PS"?1:a.country.localeCompare(b.country))
  ).map((row,index)=>{
    const checks = editorialCounts.get(row.country+":"+row.grade) ?? {short:[],yearless:[]};
    return {...row,sequence:index+1,
    shortLessonReviewIds:checks.short,
    unknownCurriculumYearLessonIds:checks.yearless,
    requiredAction:"Obtain and visually approve complete current-year official student-book TOC for both semesters, then verify each real lesson subject.",
    nextChecks:[
      ...(row.unassignedPublished?["CLASSIFY_UNASSIGNED_SHARED_SKILLS_NOT_OFFICIAL_TOC"]:[]),
      ...(row.planLinks?["REPLACE_SCHEDULE_ONLY_CITATIONS_WITH_REVIEWED_TEXTBOOK_EVIDENCE"]:[]),
      ...(row.partialPackLinks?["SEPARATE_PARTIAL_EDUCATIONAL_PACK_FROM_COMPLETE_STUDENT_BOOK"]:[]),
      ...(row.shortBodyReview?["REVIEW_SHORT_SUBJECT_EXPLANATIONS_MANUALLY"]:[]),
      ...(checks.yearless.length?["VERIFY_CURRICULUM_YEAR_AND_ORIGINAL_NATURE_BEFORE_REASSIGNING"]:[]),
      "RECONCILE_COMPLETE_OFFICIAL_LESSON_TOPICS_AND_PUBLIC_PAGE"
    ]};});
  return {schemaVersion:1,asOf:snapshot.asOf,scope:"22-country grades 1-3 priority queue, not ministry coverage",
    officialFullYearCertified:false,reviewedBookTocs:0,
    warning:"No source-manifest evidence was verified from this production record-count snapshot. 0 approved TOCs here is not 0 existing books.",
    countries:22,gradeCells:66,jobs};
}
