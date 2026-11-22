import {describe,it,expect} from "vitest";
import {takeDistinctRounds} from "@/lib/lesson-games/meaningful-rounds";

const a={prompt:"ما معنى كلمة قلم؟",options:["أداة للكتابة","لعبة"],answer:"أداة للكتابة"};

describe("meaningful rounds with no fabricated repetition",()=>{
  it("never clones one question to make five",()=>{
    expect(takeDistinctRounds([a])).toHaveLength(1);
    expect(takeDistinctRounds([a,a,{...a}])).toHaveLength(1);
  });
  it("rejects unclear correct options or fake binary choices",()=>{
    expect(takeDistinctRounds([{prompt:"سؤال",options:["نعم","لا"],answer:"إجابة غير موجودة"}])).toEqual([]);
    expect(takeDistinctRounds([{prompt:"معنى",options:["تعريف واحد"],answer:"تعريف واحد"}])).toEqual([]);
  });
  it("preserves multiple different valid questions",()=>{
    const b={prompt:"أي جملة فعلية؟",options:["قرأ التلميذ","السماء صافية"],answer:"قرأ التلميذ"};
    expect(takeDistinctRounds([a,b])).toEqual([a,b]);
  });
  it("supports true/false rounds derived from real statements",()=>{
    expect(takeDistinctRounds([{prompt:"التعلم مفيد",answer:true},{prompt:"الجو حار",answer:false}])).toHaveLength(2);
  });
});
