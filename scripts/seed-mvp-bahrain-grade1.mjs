import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.resolve(process.cwd(), ".env.local"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Supabase service credentials are missing.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const ARAB_COUNTRIES = [
  ["BH","البحرين","Bahrain"],["SA","السعودية","Saudi Arabia"],["AE","الإمارات العربية المتحدة","United Arab Emirates"],["QA","قطر","Qatar"],["KW","الكويت","Kuwait"],["OM","عُمان","Oman"],
  ["EG","مصر","Egypt"],["JO","الأردن","Jordan"],["LB","لبنان","Lebanon"],["SY","سوريا","Syria"],["IQ","العراق","Iraq"],["PS","فلسطين","Palestine"],["YE","اليمن","Yemen"],
  ["MA","المغرب","Morocco"],["DZ","الجزائر","Algeria"],["TN","تونس","Tunisia"],["LY","ليبيا","Libya"],["SD","السودان","Sudan"],["SO","الصومال","Somalia"],["DJ","جيبوتي","Djibouti"],["KM","جزر القمر","Comoros"],["MR","موريتانيا","Mauritania"]
];

const letterSeeds = [
  {n:1,u:1,title:"الدرس الأول: حرف (ب) (1)",letter:"ب",words:[["باب","مدخل المكان"],["بطة","طائر يعيش قرب الماء"],["بيت","مكان السكن"]],sentence:"بابُ البيتِ كبيرٌ.",pages:[8,21],other:["م","د"]},
  {n:2,u:1,title:"الدرس الثاني: حرف (ب) (2)",letter:"ب",words:[["بحر","ماء واسع"],["حليب","شراب أبيض"],["كتاب","مجموعة أوراق للقراءة"]],sentence:"كتبَ باسمٌ كلمةَ باب.",pages:[22,34],other:["ت","ن"],forms:true},
  {n:3,u:1,title:"الدرس الثالث: حرف (م)",letter:"م",words:[["ماء","شراب نحتاج إليه"],["موز","فاكهة صفراء"],["مدرسة","مكان التعلّم"]],sentence:"مها تشربُ الماءَ.",pages:[35,48],other:["ب","س"]},
  {n:4,u:1,title:"الدرس الرابع: حرف (د)",letter:"د",words:[["دار","بيت"],["دب","حيوان كبير"],["دلو","وعاء لحمل الماء"]],sentence:"دخلَ داني إلى الدار.",pages:[49,61],other:["ر","ب"]},
  {n:7,u:2,title:"الدرس السادس: حرف (ح)",letter:"ح",words:[["حليب","شراب مفيد"],["حوت","حيوان بحري كبير"],["حديقة","مكان فيه نباتات وأشجار"]],sentence:"حسنٌ يحبُّ الحديقةَ.",pages:[68,81],other:["ج","خ"]},
  {n:8,u:2,title:"الدرس السابع: حرف (ر)",letter:"ر",words:[["رمان","فاكهة حمراء"],["ريشة","جزء يغطي جسم الطائر"],["رجل","إنسان بالغ"]],sentence:"رأى رامي ريشةً.",pages:[82,96],other:["د","ز"]},
  {n:9,u:2,title:"الدرس الثامن: حرف (س)",letter:"س",words:[["سمك","حيوان يعيش في الماء"],["سيارة","وسيلة نقل"],["سرير","مكان للنوم"]],sentence:"سارَ سامي إلى المدرسة.",pages:[97,109],other:["ش","ص"]},
  {n:10,u:2,title:"الدرس التاسع: حرف (ل)",letter:"ل",words:[["ليمون","فاكهة صفراء حامضة"],["لعبة","شيء نلعب به"],["ليل","وقت الظلام"]],sentence:"لعبَ ليثٌ باللعبة.",pages:[110,123],other:["ك","م"]},
  {n:13,u:3,title:"الدرس الحادي عشر: حرف (ج)",letter:"ج",words:[["جمل","حيوان يعيش في الصحراء"],["جرس","أداة تصدر صوتًا"],["جبل","مكان مرتفع"]],sentence:"جلسَ جميلٌ قربَ الجبل.",pages:[132,144],other:["ح","خ"]},
  {n:14,u:3,title:"الدرس الثاني عشر: حرف (ن)",letter:"ن",words:[["نجم","جرم نراه في السماء ليلًا"],["نهر","مجرى ماء"],["نحلة","حشرة تصنع العسل"]],sentence:"نظرتْ نورةُ إلى النجم.",pages:[145,156],other:["ت","ب"]},
  {n:15,u:3,title:"الدرس الثالث عشر: حرف (ع)",letter:"ع",words:[["عين","عضو الإبصار"],["عسل","طعام حلو تصنعه النحل"],["علم","راية ترمز إلى الوطن"]],sentence:"عليٌّ يحبُّ العسلَ.",pages:[157,168],other:["غ","ف"]},
  {n:16,u:3,title:"الدرس الرابع عشر: حرف (ت)",letter:"ت",words:[["تفاح","فاكهة"],["تمر","ثمر النخيل"],["تاج","ما يوضع على الرأس"]],sentence:"تناولَ تامرٌ تمرةً.",pages:[169,181],other:["ب","ث"]},
];

function letterLesson(seed) {
  const [first, second, third] = seed.words;
  const forms = seed.forms ? `\nأشكال الحرف في الكلمة: ب ـ بـ ـ ـبـ ـ ـب. اقرأ: بَ، بِ، بُ.` : "";
  return {
    ...seed,
    type:"reading",
    summary:`أتعرف حرف ${seed.letter} صوتًا وشكلًا، وأقرأ كلمات بسيطة تحتوي عليه.`,
    objectives:[`أن يميّز المتعلم حرف ${seed.letter} بصريًا.`,`أن ينطق صوت حرف ${seed.letter} نطقًا واضحًا.`,`أن يقرأ كلمات قصيرة تحتوي حرف ${seed.letter}.`],
    vocabulary:seed.words.map(([word,meaning],i)=>({word,meaning,example:i===0?seed.sentence:null})),
    content:`حرف اليوم هو: ${seed.letter}\n\nانظر إلى شكل الحرف، ثم انطق صوته ببطء. كرر: ${seed.letter}. ${forms}\n\nكلمات نتدرّب عليها:\n• ${first[0]}\n• ${second[0]}\n• ${third[0]}\n\nاقرأ الجملة: ${seed.sentence}\n\nتحدّث: قل كلمة أخرى تعرفها فيها حرف ${seed.letter}.\nاكتب: تتبّع الحرف في الهواء، ثم اكتبه ثلاث مرات على ورقة.`,
    questions:[
      {q:`ما الحرف الذي نتعلمه في هذا الدرس؟`,opts:[["a",seed.letter],["b",seed.other[0]],["c",seed.other[1]]],correct:"a",why:`الحرف المستهدف في الدرس هو ${seed.letter}.`},
      {q:`أي كلمة من الآتية نتدرّب عليها في الدرس؟`,opts:[["a",first[0]],["b","قلم"],["c","ورد"]],correct:"a",why:`كلمة «${first[0]}» من كلمات الدرس.`},
      {q:`اختر الجملة التي قرأناها.`,opts:[["a",seed.sentence],["b","ذهبَ خالدٌ إلى السوق."],["c","السماءُ واسعةٌ."]],correct:"a",why:"هذه هي الجملة القصيرة المستخدمة للتدريب على القراءة."}
    ]
  };
}

const specials = [
  {n:5,u:1,title:"الدرس الخامس: أعزز مكتسباتي",type:"reading",pages:[62,65],summary:"مراجعة حروف ب وم ود وتثبيت القراءة والتمييز بينها.",objectives:["أن يميّز المتعلم بين الحروف ب وم ود.","أن يقرأ كلمات قصيرة بالحروف المدروسة.","أن يختار الحرف المناسب لبداية الكلمة."],vocabulary:[{word:"باب",meaning:"مدخل المكان"},{word:"ماء",meaning:"شراب نحتاج إليه"},{word:"دار",meaning:"بيت"}],content:"مراجعة الوحدة الأولى\n\nراجع الحروف: ب — م — د.\nاقرأ: باب، ماء، دار.\nصنّف الكلمات بحسب الحرف الذي تبدأ به.\nثم قل كلمة من عندك لكل حرف.\n\nتحدي صغير: اكتب الحروف ب، م، د مرة واحدة بخط واضح.",questions:[{q:"أي كلمة تبدأ بحرف م؟",opts:[["a","ماء"],["b","باب"],["c","دار"]],correct:"a",why:"كلمة ماء تبدأ بحرف م."},{q:"أي حرف تبدأ به كلمة باب؟",opts:[["a","ب"],["b","م"],["c","د"]],correct:"a",why:"باب تبدأ بحرف ب."},{q:"اختر الحروف التي راجعناها.",opts:[["a","ب، م، د"],["b","س، ل، ر"],["c","ج، ن، ع"]],correct:"a",why:"هذه حروف الوحدة الأولى."}]},
  {n:6,u:1,title:"أنشودة الوحدة: أسرتي",type:"listening",pages:[66,67],summary:"أنشودة أصلية قصيرة تعزز مفردات الأسرة والقراءة الإيقاعية.",objectives:["أن يردد المتعلم كلمات عربية بإيقاع واضح.","أن يستخدم مفردات الأسرة في سياق بسيط.","أن يستمع ويحدد كلمة مكررة."],vocabulary:[{word:"أسرتي",meaning:"عائلتي"},{word:"بيتي",meaning:"المكان الذي أسكن فيه"},{word:"محبة",meaning:"مودة واهتمام"}],content:"أنشودة ضاديوم الأصلية — أسرتي\n\nأسرتي حولي أمانْ\nفي بيتي حبٌّ وحنانْ\nأقرأُ حرفي باهتمامْ\nوأقولُ شكرًا كلَّ آنْ\n\nردد الأنشودة مرتين، ثم اختر كلمة أعجبتك وقل معناها.",questions:[{q:"عن ماذا تتحدث الأنشودة؟",opts:[["a","الأسرة والبيت"],["b","البحر"],["c","السفر"]],correct:"a",why:"الأنشودة تتحدث عن الأسرة والبيت."},{q:"أي كلمة تعني عائلتي؟",opts:[["a","أسرتي"],["b","حرفي"],["c","آن"]],correct:"a",why:"أسرتي تعني عائلتي."},{q:"ماذا نفعل بالحرف في الأنشودة؟",opts:[["a","نقرأه باهتمام"],["b","نمزقه"],["c","نخفيه"]],correct:"a",why:"ورد في الأنشودة: أقرأ حرفي باهتمام."}]},
  {n:11,u:2,title:"الدرس العاشر: أعزز مكتسباتي",type:"reading",pages:[124,129],summary:"مراجعة حروف ح ور وس ول وتثبيت التمييز السمعي والبصري.",objectives:["أن يميّز المتعلم بين ح ور وس ول.","أن يقرأ كلمات تبدأ بالحروف المدروسة.","أن يربط الحرف بالكلمة المناسبة."],vocabulary:[{word:"حديقة",meaning:"مكان فيه نباتات"},{word:"رمان",meaning:"فاكهة"},{word:"سمك",meaning:"حيوان مائي"},{word:"ليمون",meaning:"فاكهة حامضة"}],content:"مراجعة الوحدة الثانية\n\nالحروف: ح — ر — س — ل.\nاقرأ: حديقة، رمان، سمك، ليمون.\nقل صوت كل حرف، ثم اختر كلمة أخرى تبدأ به.\n\nاكتب الحروف الأربعة بترتيب مختلف، واقرأها بصوت واضح.",questions:[{q:"أي كلمة تبدأ بحرف س؟",opts:[["a","سمك"],["b","ليمون"],["c","رمان"]],correct:"a",why:"سمك تبدأ بحرف س."},{q:"أي كلمة تبدأ بحرف ل؟",opts:[["a","ليمون"],["b","حديقة"],["c","سمك"]],correct:"a",why:"ليمون تبدأ بحرف ل."},{q:"ما مجموعة حروف هذه الوحدة؟",opts:[["a","ح، ر، س، ل"],["b","ب، م، د"],["c","ج، ن، ع، ت"]],correct:"a",why:"هذه الحروف هي المستهدفة في الوحدة الثانية."}]},
  {n:12,u:2,title:"أنشودة الوحدة: مدرستي",type:"listening",pages:[130,131],summary:"أنشودة أصلية قصيرة عن المدرسة والتعلّم والتعاون.",objectives:["أن يردد المتعلم عبارات عربية قصيرة.","أن يذكر قيمة إيجابية في المدرسة.","أن يلتقط كلمة محددة من الاستماع."],vocabulary:[{word:"مدرستي",meaning:"مكان تعلّمي"},{word:"صديقي",meaning:"من تربطني به صداقة"},{word:"تعاون",meaning:"أن نساعد بعضنا"}],content:"أنشودة ضاديوم الأصلية — مدرستي\n\nمدرستي بيتُ العلومْ\nفيها كتابي والرسومْ\nمع صديقي نتعاونْ\nوبأدبٍ نحيا كلَّ يومْ\n\nردد الأبيات، ثم تحدث عن شيء تحبه في مدرستك.",questions:[{q:"مدرستي بيت ماذا؟",opts:[["a","العلوم"],["b","الألعاب فقط"],["c","السفر"]],correct:"a",why:"ورد في الأنشودة: مدرستي بيت العلوم."},{q:"ماذا نفعل مع الصديق؟",opts:[["a","نتعاون"],["b","نتخاصم"],["c","نبتعد دائمًا"]],correct:"a",why:"الأنشودة تشجع على التعاون."},{q:"أي كلمة وردت في الأنشودة؟",opts:[["a","كتابي"],["b","طائرة"],["c","مزرعة"]],correct:"a",why:"وردت كلمة كتابي في الأنشودة."}]},
  {n:17,u:3,title:"الدرس الخامس عشر: أعزز مكتسباتي",type:"reading",pages:[182,186],summary:"مراجعة حروف ج ون وع وت وتثبيت القراءة والكتابة البسيطة.",objectives:["أن يميّز المتعلم بين ج ون وع وت.","أن يقرأ كلمات قصيرة بالحروف المدروسة.","أن يختار الحرف الصحيح لبداية الكلمة."],vocabulary:[{word:"جمل",meaning:"حيوان صحراوي"},{word:"نجم",meaning:"نراه في السماء"},{word:"عسل",meaning:"طعام حلو"},{word:"تمر",meaning:"ثمر النخيل"}],content:"مراجعة الوحدة الثالثة\n\nالحروف: ج — ن — ع — ت.\nاقرأ: جمل، نجم، عسل، تمر.\nقل صوت كل حرف، ثم اذكر كلمة جديدة تبدأ به.\n\nاكتب كلمة قصيرة تختارها من كلمات المراجعة.",questions:[{q:"أي كلمة تبدأ بحرف ن؟",opts:[["a","نجم"],["b","عسل"],["c","تمر"]],correct:"a",why:"نجم تبدأ بحرف ن."},{q:"أي كلمة تبدأ بحرف ت؟",opts:[["a","تمر"],["b","جمل"],["c","عسل"]],correct:"a",why:"تمر تبدأ بحرف ت."},{q:"ما حروف الوحدة الثالثة؟",opts:[["a","ج، ن، ع، ت"],["b","ح، ر، س، ل"],["c","ب، م، د"]],correct:"a",why:"هذه الحروف هي المستهدفة في الوحدة الثالثة."}]},
  {n:18,u:3,title:"أنشودة الوحدة: جاري",type:"listening",pages:[187,190],summary:"أنشودة أصلية قصيرة عن حسن الجوار والاحترام والتعاون.",objectives:["أن يردد المتعلم نصًا عربيًا قصيرًا.","أن يفهم معنى الجار وحسن الجوار.","أن يذكر سلوكًا حسنًا مع الجيران."],vocabulary:[{word:"جاري",meaning:"من يسكن قريبًا مني"},{word:"سلام",meaning:"تحية وأمان"},{word:"تعاون",meaning:"مساعدة متبادلة"}],content:"أنشودة ضاديوم الأصلية — جاري\n\nجاري قريبٌ في الديارْ\nألقاه دومًا باحترامْ\nنتعاونُ في كلِّ خيرْ\nونقولُ للكلِّ: السلامْ\n\nردد الأنشودة، ثم اذكر سلوكًا جميلًا مع الجار.",questions:[{q:"كيف نلقى الجار؟",opts:[["a","باحترام"],["b","بغضب"],["c","بإهمال"]],correct:"a",why:"الأنشودة تدعو إلى احترام الجار."},{q:"في ماذا نتعاون؟",opts:[["a","في الخير"],["b","في الأذى"],["c","في الخصام"]],correct:"a",why:"ورد: نتعاون في كل خير."},{q:"ما التحية المذكورة؟",opts:[["a","السلام"],["b","الوداع فقط"],["c","لا توجد تحية"]],correct:"a",why:"ذكرت الأنشودة كلمة السلام."}]},
];

const lessons = [...letterSeeds.map(letterLesson), ...specials].sort((a,b)=>a.n-b.n);

const CANONICAL_LESSON_TYPES = new Set([
  "reading",
  "writing",
  "listening",
  "speaking",
  "grammar",
  "vocabulary",
]);

for (const lesson of lessons) {
  if (!CANONICAL_LESSON_TYPES.has(lesson.type)) {
    throw new Error(`MVP_LESSON_TYPE_PREFLIGHT_FAILED:${lesson.title}:${lesson.type}`);
  }
}

console.log("MVP_LESSON_TYPE_PREFLIGHT=PASS");
const units = [
  {number:1,title:"الوحدة الأولى: عائلتنا"},
  {number:2,title:"الوحدة الثانية: مدرستنا"},
  {number:3,title:"الوحدة الثالثة: حينا"},
];

function tempLike(title, content) {
  const combined = `${title || ""} ${content || ""}`.toLowerCase();
  return /(?:تجريبي|مؤقت|placeholder|temporary|test lesson|درس\s*\d+$)/i.test(combined) || String(content || "").trim().length < 120;
}

async function first(table, build) {
  const query = build(supabase.from(table).select("*"));
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

const schemaChecks = [
  ["countries", "id,code,name_ar,name_en,is_active"],
  ["curricula", "id,country_id,name_ar,name_en,academic_year,is_active"],
  ["grades", "id,curriculum_id,grade_number,name_ar,name_en,sort_order,is_active"],
  ["units", "id,grade_id,title,unit_number,sort_order,description"],
  ["lessons", "id,unit_id,title,slug,lesson_number,sort_order,lesson_type,content,summary,learning_objectives,instructions,vocabulary,source_page_start,source_page_end,status,is_free"],
  ["questions", "id,lesson_id,question_order,question,question_type,options,correct_answer,explanation,points"],
  ["lesson_vocabulary", "id,lesson_id,word,meaning,example,display_order"],
  ["profiles", "id,email,full_name,role,country"],
];

for (const [table, columns] of schemaChecks) {
  const { error } = await supabase.from(table).select(columns).limit(1);
  if (error) throw new Error(`MVP_SCHEMA_PREFLIGHT_FAILED:${table}:${error.message}`);
}
console.log("MVP_SCHEMA_PREFLIGHT=PASS");

const stamp = new Date().toISOString().replace(/[:.]/g,"-");
fs.mkdirSync(path.resolve(process.cwd(), "_backups"), { recursive: true });
const backupFile = path.resolve(process.cwd(), "_backups", `mvp-content-before-${stamp}.json`);
const snapshot = {};
for (const table of ["countries","curricula","grades","units","lessons","questions","lesson_vocabulary"]) {
  const { data, error } = await supabase.from(table).select("*");
  snapshot[table] = error ? { error: error.message } : data;
}
fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), "utf8");
console.log(`DB_BACKUP=${backupFile}`);

let countriesAdded = 0;
for (const [code,name_ar,name_en] of ARAB_COUNTRIES) {
  const existing = await first("countries", q => q.eq("code", code));
  if (!existing) {
    const { error } = await supabase.from("countries").insert({ code, name_ar, name_en, is_active:true });
    if (error) throw error;
    countriesAdded++;
  }
}
const bh = await first("countries", q => q.eq("code","BH"));
if (!bh) throw new Error("Failed to resolve Bahrain country row.");

let curriculum = await first("curricula", q => q.eq("country_id",bh.id).ilike("name_ar","%اللغة العربية%"));
if (!curriculum) {
  const { data, error } = await supabase.from("curricula").insert({ country_id:bh.id, name_ar:"اللغة العربية — الفصل الأول", name_en:"Arabic Language — Semester 1", academic_year:"2026", description:"مسار ضاديوم الأصلي المتوافق مع أهداف منهج الصف الأول في مملكة البحرين.", is_active:true }).select("*").single();
  if (error) throw error; curriculum = data;
}

let grade = await first("grades", q => q.eq("curriculum_id",curriculum.id).eq("grade_number",1));
if (!grade) {
  const { data, error } = await supabase.from("grades").insert({ curriculum_id:curriculum.id, grade_number:1, name_ar:"الصف الأول", name_en:"Grade 1", sort_order:1, is_active:true }).select("*").single();
  if (error) throw error; grade = data;
}

const resolvedUnits = new Map();
for (const unit of units) {
  let row = await first("units", q => q.eq("grade_id",grade.id).eq("unit_number",unit.number));
  if (!row) {
    const { data, error } = await supabase.from("units").insert({ grade_id:grade.id, title:unit.title, unit_number:unit.number, sort_order:unit.number, description:"وحدة تعليمية أصلية في ضاديوم متوافقة مع ترتيب المنهج." }).select("*").single();
    if (error) throw error; row = data;
  }
  resolvedUnits.set(unit.number,row);
}

const { data: adminProfiles } = await supabase.from("profiles").select("id").eq("role","admin").limit(1);
const ownerId = adminProfiles?.[0]?.id ?? null;
let inserted=0, refreshed=0, preserved=0, questionsAdded=0, vocabularyAdded=0;
const seededLessonIds = [];

for (const seed of lessons) {
  const unit = resolvedUnits.get(seed.u);
  const { data: candidates, error: candidateError } = await supabase.from("lessons").select("*").eq("unit_id",unit.id);
  if (candidateError) throw candidateError;
  let row = (candidates || []).find(x => x.title === seed.title || Number(x.lesson_number) === seed.n || Number(x.source_page_start) === seed.pages[0]);
  const payload = {
    title:seed.title,
    slug:`bh-g1-s1-${String(seed.n).padStart(2,"0")}`,
    unit_id:unit.id,
    lesson_number:seed.n,
    sort_order:seed.n,
    lesson_type:seed.type,
    estimated_minutes:seed.type === "listening" ? 12 : /أعزز مكتسباتي/.test(seed.title) ? 18 : 20,
    summary:seed.summary,
    content:seed.content,
    learning_objectives:seed.objectives,
    instructions:["اقرأ أو استمع أولًا.","نفّذ التدريب خطوة بخطوة.","أجب عن الأسئلة ثم راجع تفسير الإجابة."],
    vocabulary:seed.vocabulary,
    source_page_start:seed.pages[0],
    source_page_end:seed.pages[1],
    source_pdf_url:null,
    is_free:true,
    status:"published",
  };

  if (!row) {
    const insertPayload = ownerId ? { ...payload, created_by: ownerId } : payload;
    let result = await supabase.from("lessons").insert(insertPayload).select("*").single();
    if (result.error && /created_by/i.test(result.error.message) && ownerId) result = await supabase.from("lessons").insert(payload).select("*").single();
    if (result.error) throw result.error;
    row = result.data; inserted++;
  } else if (tempLike(row.title,row.content) || row.status !== "published") {
    const { data, error } = await supabase.from("lessons").update(payload).eq("id",row.id).select("*").single();
    if (error) throw error; row=data; refreshed++;
  } else {
    preserved++;
  }

  seededLessonIds.push(row.id);

  const { data: qExisting, error: qError } = await supabase
    .from("questions")
    .select("id,question,question_order")
    .eq("lesson_id", row.id)
    .order("question_order", { ascending:true });
  if (qError) throw qError;

  const existingQuestions = qExisting || [];
  if (existingQuestions.length < 3) {
    const existingTexts = new Set(existingQuestions.map((item) => String(item.question || "").trim()));
    let nextOrder = existingQuestions.reduce((max, item) => Math.max(max, Number(item.question_order) || 0), 0) + 1;
    const needed = 3 - existingQuestions.length;
    const sourceQuestions = seed.questions.filter((item) => !existingTexts.has(item.q)).slice(0, needed);
    const rows = sourceQuestions.map((item) => ({
      lesson_id:row.id,
      question_order:nextOrder++,
      question:item.q,
      question_type:"multiple_choice",
      options:item.opts.map(([id,text])=>({id,text})),
      correct_answer:item.correct,
      explanation:item.why,
      points:1,
    }));
    if (rows.length) {
      const { error } = await supabase.from("questions").insert(rows);
      if (error) throw error;
      questionsAdded += rows.length;
    }
  }

  const { data: vExisting, error: vError } = await supabase.from("lesson_vocabulary").select("id").eq("lesson_id",row.id).limit(1);
  if (!vError && !vExisting?.length) {
    const rows = seed.vocabulary.map((v,index)=>({ lesson_id:row.id, word:v.word, meaning:v.meaning, example:v.example || null, display_order:index+1 }));
    const { error } = await supabase.from("lesson_vocabulary").insert(rows); if (error) throw error; vocabularyAdded += rows.length;
  }
}

if (seededLessonIds.length !== 18) {
  throw new Error(`MVP_CONTENT_GATE_FAILED: resolved seed rows=${seededLessonIds.length}, expected=18`);
}

const { data: finalLessons, error: finalError } = await supabase
  .from("lessons")
  .select("id,title,lesson_number,status,content,learning_objectives")
  .in("id", seededLessonIds)
  .eq("status","published");

if (finalError) throw finalError;

const mvpLessons = finalLessons || [];

if (mvpLessons.length !== 18) {
  throw new Error(`MVP_CONTENT_GATE_FAILED: published MVP lessons=${mvpLessons.length}, expected=18`);
}
for (const lesson of mvpLessons) {
  if (String(lesson.content || "").trim().length < 120) throw new Error(`MVP_CONTENT_GATE_FAILED: short content: ${lesson.title}`);
  const { count, error } = await supabase.from("questions").select("id", { count:"exact", head:true }).eq("lesson_id",lesson.id);
  if (error) throw error;
  if ((count || 0) < 3) throw new Error(`MVP_CONTENT_GATE_FAILED: fewer than 3 questions: ${lesson.title}`);
}

console.log(`ARAB_COUNTRIES_ADDED=${countriesAdded}`);
console.log(`MVP_LESSONS_INSERTED=${inserted}`);
console.log(`MVP_LESSONS_REFRESHED=${refreshed}`);
console.log(`RICH_LESSONS_PRESERVED=${preserved}`);
console.log(`QUESTIONS_ADDED=${questionsAdded}`);
console.log(`VOCABULARY_ROWS_ADDED=${vocabularyAdded}`);
console.log(`PUBLISHED_MVP_LESSONS=${mvpLessons.length}`);
console.log("MVP_CONTENT_GATE=PASS");
