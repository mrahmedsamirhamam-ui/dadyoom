import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const root = process.cwd();
const apply = process.argv.includes("--apply");
const registry = JSON.parse(fs.readFileSync(
  path.resolve(root, "data/curriculum-packs/arab-countries.json"), "utf8"
));
const core = JSON.parse(fs.readFileSync(
  path.resolve(root, "data/core-curriculum/dadyoom-core-templates-2026-2027.json"), "utf8"
));
const countries = Array.isArray(registry.countries) ? registry.countries : [];
const templates = Array.isArray(core.templates) ? core.templates : [];

if (countries.length !== 22) throw new Error(`CORE_SEED_EXPECTED_22_COUNTRIES_GOT_${countries.length}`);
if (templates.length !== 72) throw new Error(`CORE_SEED_EXPECTED_72_TEMPLATES_GOT_${templates.length}`);
for (const band of [1,2,3,4]) {
  const count = templates.filter((t) => Number(t.band) === band).length;
  if (count !== 18) throw new Error(`CORE_SEED_BAND_${band}_EXPECTED_18_GOT_${count}`);
}

console.log("CORE_SEED_COUNTRIES=22");
console.log("CORE_SEED_TEMPLATES=72");
console.log("CORE_SEED_EXPECTED_LESSONS=4752");

if (!apply) {
  console.log("CORE_SEED_MODE=DRY_RUN");
  console.log("CORE_SEED_DATABASE_WRITES=NONE");
  process.exit(0);
}

loadEnv(path.resolve(root, ".env.local"));
loadEnv(path.resolve(root, ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) throw new Error("CORE_SEED_SUPABASE_SERVICE_CREDENTIALS_MISSING");

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const gradeNames = {
  1:"الصف الأول",2:"الصف الثاني",3:"الصف الثالث",4:"الصف الرابع",
  5:"الصف الخامس",6:"الصف السادس",7:"الصف السابع",8:"الصف الثامن",
  9:"الصف التاسع",10:"الصف العاشر",11:"الصف الحادي عشر",12:"الصف الثاني عشر"
};

function bandForGrade(g) {
  return g <= 3 ? 1 : g <= 6 ? 2 : g <= 9 ? 3 : 4;
}

function unitTitle(g, u) {
  const groups = g <= 3
    ? ["","الوحدة الأولى: أصوات وحروف","الوحدة الثانية: الكلمة والجملة","الوحدة الثالثة: القراءة والتعبير"]
    : g <= 6
      ? ["","الوحدة الأولى: القراءة والفهم","الوحدة الثانية: القواعد والإملاء","الوحدة الثالثة: الكتابة والتواصل"]
      : g <= 9
        ? ["","الوحدة الأولى: قراءة وتحليل","الوحدة الثانية: نحو وإملاء","الوحدة الثالثة: بلاغة وتعبير"]
        : ["","الوحدة الأولى: أدب وقراءة نقدية","الوحدة الثانية: نحو وبلاغة","الوحدة الثالثة: كتابة وبحث وتواصل"];
  return groups[u];
}

function lessonContent(t, grade, country) {
  return [
    `درس ضاديوم الأصلي: ${t.title}`,
    "",
    `الهدف: ${t.concept}.`,
    `هذا الدرس جزء من المسار العربي الأساسي لضاديوم للصف ${grade} في ${country}.`,
    `نبدأ بمثال تطبيقي: ${t.example}`,
    "بعد قراءة المثال، يحدد المتعلم الفكرة أو القاعدة، ثم يطبقها في نشاط قصير من إنشائه.",
    "نشاط 1: اقرأ المثال بتركيز وحدد الكلمات أو التراكيب المهمة.",
    "نشاط 2: اكتب أو قل مثالًا جديدًا من بيئتك ومدرستك، ثم راجعه مستخدمًا معيارًا واضحًا.",
    "نشاط 3: ناقش إجابتك مع ضاد أو مع المعلم، وصحح ما يحتاج إلى تحسين.",
    "في نهاية الدرس لخص ما تعلمته في جملة واحدة، ثم أجب عن أسئلة التحقق.",
  ].join("\n");
}

function assertResult(result, label) {
  if (result.error) throw new Error(`${label}:${result.error.message}`);
  return result.data ?? [];
}

for (const countryInfo of countries) {
  const countryRows = assertResult(
    await db.from("countries").select("id,code,name_ar").eq("code", countryInfo.code).limit(1),
    `COUNTRY_${countryInfo.code}`
  );
  const country = countryRows[0];
  if (!country) throw new Error(`CORE_SEED_COUNTRY_NOT_FOUND:${countryInfo.code}`);

  const curriculumRows = assertResult(
    await db.from("curricula").upsert({
      country_id: country.id,
      name_ar: "المسار العربي الأساسي لضاديوم",
      name_en: "Dadyoom Core Arabic Path",
      academic_year: "2026-2027",
      description: "مسار تعليمي أصلي من ضاديوم للغة العربية، يغطي الصفوف 1–12. لا يدّعي أنه نسخة حرفية من كتاب وزاري.",
      is_active: true,
    }, { onConflict: "country_id,name_ar,academic_year" }).select("id"),
    `CURRICULUM_${countryInfo.code}`
  );
  const curriculumId = curriculumRows[0]?.id;
  if (!curriculumId) throw new Error(`CORE_SEED_CURRICULUM_ID_MISSING:${countryInfo.code}`);

  const gradeRows = assertResult(
    await db.from("grades").upsert(
      Array.from({length:12}, (_,i) => {
        const grade=i+1;
        return {
          curriculum_id: curriculumId,
          grade_number: grade,
          name_ar: `${gradeNames[grade]} — مسار ضاديوم`,
          name_en: `Grade ${grade} — Dadyoom Core`,
          sort_order: grade,
          is_active: true,
        };
      }),
      { onConflict: "curriculum_id,name_ar" }
    ).select("id,grade_number"),
    `GRADES_${countryInfo.code}`
  );

  for (const gradeRow of gradeRows) {
    const grade=Number(gradeRow.grade_number);
    const unitRows=assertResult(
      await db.from("units").upsert(
        [1,2,3].map((u)=>({
          grade_id:gradeRow.id,
          title:unitTitle(grade,u),
          description:"وحدة أصلية ضمن المسار العربي الأساسي لضاديوم 2026-2027.",
          unit_number:u,
          sort_order:u,
        })),
        {onConflict:"grade_id,unit_number"}
      ).select("id,unit_number"),
      `UNITS_${countryInfo.code}_G${grade}`
    );

    for (const unitRow of unitRows) {
      const unitNumber=Number(unitRow.unit_number);
      const selected=templates.filter((t)=>
        Number(t.band)===bandForGrade(grade) &&
        Number(t.unitNo)===unitNumber
      ).sort((a,b)=>Number(a.globalNo)-Number(b.globalNo));

      const lessonRows=assertResult(
        await db.from("lessons").upsert(
          selected.map((t,index)=>({
            unit_id:unitRow.id,
            title:t.title,
            slug:`${countryInfo.code.toLowerCase()}-dadyoom-core-g${grade}-l${String(t.globalNo).padStart(2,"0")}`,
            lesson_number:index+1,
            sort_order:index+1,
            lesson_type:t.lessonType,
            estimated_minutes:grade<=3?20:grade<=6?25:30,
            summary:`يتدرب المتعلم في هذا الدرس على ${t.concept} ضمن مستوى الصف ${grade}.`,
            content:lessonContent(t,grade,country.name_ar),
            learning_objectives:[
              `أن يفهم المتعلم ${t.concept}.`,
              `أن يطبق المتعلم المهارة على مثال جديد مناسب للصف ${grade}.`,
              "أن يراجع المتعلم أداءه ويصحح الخطأ اعتمادًا على دليل أو قاعدة."
            ],
            vocabulary:t.vocabulary,
            instructions:[
              "اقرأ أو استمع إلى المثال أولًا.",
              "نفذ النشاط بنفسك قبل طلب المساعدة.",
              "استخدم ضاد للتلميح والفهم ثم راجع إجابتك."
            ],
            status:"published",
            is_free:true,
          })),
          {onConflict:"unit_id,lesson_number"}
        ).select("id,lesson_number,title"),
        `LESSONS_${countryInfo.code}_G${grade}_U${unitNumber}`
      );

      const questions=[];
      const vocab=[];
      for (const lesson of lessonRows) {
        const t=selected[Number(lesson.lesson_number)-1];
        if (!t) throw new Error(`CORE_SEED_TEMPLATE_RESOLUTION_FAILED:${countryInfo.code}:${grade}:${unitNumber}`);
        questions.push(
          {
            lesson_id:lesson.id,question_order:1,question:"ما المهارة الرئيسة التي يتدرب عليها هذا الدرس؟",
            question_type:"multiple_choice",
            options:[{id:"a",text:t.concept},{id:"b",text:"حفظ كلمات دون فهم أو تطبيق"},{id:"c",text:"تجاوز المثال والتدريبات"}],
            correct_answer:"a",explanation:`الدرس يركز على ${t.concept}.`,points:1
          },
          {
            lesson_id:lesson.id,question_order:2,question:`أي تطبيق يساعدك على إتقان درس «${lesson.title}»؟`,
            question_type:"multiple_choice",
            options:[{id:"a",text:t.example},{id:"b",text:"أترك النشاط دون محاولة"},{id:"c",text:"أنسخ إجابة جاهزة دون أن أراجعها"}],
            correct_answer:"a",explanation:"التطبيق العملي المرتبط بالدرس هو الاختيار الأنسب.",points:1
          },
          {
            lesson_id:lesson.id,question_order:3,question:`ما معنى «${t.vocabulary[0].word}» في سياق هذا الدرس؟`,
            question_type:"multiple_choice",
            options:t.vocabulary.map((x,i)=>({id:["a","b","c"][i],text:x.meaning})),
            correct_answer:"a",explanation:`المعنى الصحيح هو: ${t.vocabulary[0].meaning}.`,points:1
          },
          {
            lesson_id:lesson.id,question_order:4,question:`ما الخطوة الأفضل بعد فهم مثال درس «${lesson.title}»؟`,
            question_type:"multiple_choice",
            options:[
              {id:"a",text:"أطبّق المهارة في مثال جديد من إنشائي"},
              {id:"b",text:"أحفظ المثال فقط دون تطبيق"},
              {id:"c",text:"أتجاوز المراجعة والتدريب"}
            ],
            correct_answer:"a",
            explanation:"إنتاج مثال جديد يثبت أن المتعلم يستطيع نقل المهارة من المثال إلى تطبيق مستقل.",
            points:1
          },
          {
            lesson_id:lesson.id,question_order:5,question:"كيف تتحقق من إتقان المهارة الأساسية في هذا الدرس؟",
            question_type:"multiple_choice",
            options:[
              {id:"a",text:"أطبّق المهارة ثم أراجع النتيجة وأصحح الخطأ"},
              {id:"b",text:"أقرأ عنوان الدرس فقط"},
              {id:"c",text:"أنسخ إجابة جاهزة دون فهم"}
            ],
            correct_answer:"a",
            explanation:"الإتقان يظهر في التطبيق المستقل ثم المراجعة والتصحيح، وليس في الحفظ أو النسخ.",
            points:1
          }
        );
        t.vocabulary.forEach((x,i)=>vocab.push({
          lesson_id:lesson.id,word:x.word,meaning:x.meaning,example:null,display_order:i+1
        }));
      }

      assertResult(
        await db.from("questions").upsert(questions,{onConflict:"lesson_id,question_order"}),
        `QUESTIONS_${countryInfo.code}_G${grade}_U${unitNumber}`
      );
      assertResult(
        await db.from("lesson_vocabulary").upsert(vocab,{onConflict:"lesson_id,word"}),
        `VOCAB_${countryInfo.code}_G${grade}_U${unitNumber}`
      );
    }
  }
  console.log(`CORE_SEED_COUNTRY_PASS=${countryInfo.code}`);
}

console.log("CORE_SEED_MODE=APPLY");
console.log("CORE_SEED_22_GATE=PASS");
