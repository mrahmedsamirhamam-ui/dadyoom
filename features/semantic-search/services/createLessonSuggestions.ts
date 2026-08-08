import {
  GoogleGenAI,
} from "@google/genai";

type Params = {
  query: string;
  answer: string;
  context: string;
};

export type LessonSuggestions = {
  followUpQuestions: string[];
  quizQuestion: string;
  nextActivity: string;
};

export async function createLessonSuggestions({
  query,
  answer,
  context,
}: Params): Promise<LessonSuggestions> {

  const apiKey =
    process.env.GEMINI_API_KEY_BACKUP ||
    process.env.GEMINI_API_KEY;

  const model =
    process.env.GEMINI_MODEL_BACKUP ||
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite";

  if (!apiKey) {
    return {
      followUpQuestions: [],
      quizQuestion: "",
      nextActivity: "",
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const prompt = `
أنت معلم لغة عربية.

اعتمد فقط على النص التالي.

السؤال:
${query}

الإجابة:
${answer}

النص:
${context}

أرجع JSON فقط بالشكل التالي:

{
 "followUpQuestions":[
   "...",
   "...",
   "..."
 ],
 "quizQuestion":"...",
 "nextActivity":"..."
}

بدون أي شرح إضافي.
`;

  const response =
    await ai.models.generateContent({
      model,
      contents: prompt,
      config:{
        temperature:0.2,
        responseMimeType:
          "application/json"
      }
    });

  try{

    const parsed =
      JSON.parse(
        response.text ?? "{}"
      );

    return{
      followUpQuestions:
        parsed.followUpQuestions ?? [],
      quizQuestion:
        parsed.quizQuestion ?? "",
      nextActivity:
        parsed.nextActivity ?? ""
    };

  }catch{

    return{
      followUpQuestions:[],
      quizQuestion:"",
      nextActivity:""
    };

  }

}
