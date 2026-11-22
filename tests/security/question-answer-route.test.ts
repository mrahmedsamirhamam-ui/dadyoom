import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/questions/answer/route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
const id = "11111111-1111-4111-8111-111111111111";
const question = {id,lesson_id:"lesson",question_type:"multiple_choice",options:[{id:"a",text:"أ"},{id:"b",text:"ب"}],correct_answer:"a",explanation:"شرح مكتسب بعد الصواب"};
let readQuestion: ReturnType<typeof vi.fn>;
let readLesson: ReturnType<typeof vi.fn>;
let upsert: ReturnType<typeof vi.fn>;
let getUser: ReturnType<typeof vi.fn>;
function readChain(single: ReturnType<typeof vi.fn>) {
  const chain={select:vi.fn(()=>chain),eq:vi.fn(()=>chain),maybeSingle:single};return chain;
}
const request = (body: unknown) => new Request("http://localhost/api/questions/answer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
beforeEach(()=>{
  vi.clearAllMocks();
  getUser=vi.fn(async()=>({data:{user:{id:"actual-student"}},error:null}));
  readQuestion=vi.fn(async()=>({data:question,error:null}));
  readLesson=vi.fn(async()=>({data:{id:"lesson",status:"published"},error:null}));
  upsert=vi.fn(async()=>({error:null}));
  vi.mocked(createClient).mockResolvedValue({auth:{getUser},from:vi.fn(()=>readChain(readLesson))} as unknown as Awaited<ReturnType<typeof createClient>>);
  vi.mocked(createAdminClient).mockReturnValue({from:vi.fn((table:string)=>table==="questions"?readChain(readQuestion):{upsert})} as unknown as ReturnType<typeof createAdminClient>);
});
describe("actual question-answer route trust boundary",()=>{
  it("does not disclose a key or solution after a wrong answer",async()=>{
    const response=await POST(request({questionId:id,selectedAnswer:"b",is_correct:true,user_id:"victim",score:100}));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({success:true,isCorrect:false,correctAnswer:null,explanation:null});
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({user_id:"actual-student",is_correct:false,selected_answer:"b"}),{onConflict:"user_id,question_id"});
  });
  it("releases positive feedback only after a server-verified correct answer",async()=>{
    const response=await POST(request({questionId:id,selectedAnswer:"a"}));
    expect(await response.json()).toEqual({success:true,isCorrect:true,correctAnswer:"a",explanation:question.explanation});
  });
  it("blocks anonymous callers before administrative reads or writes",async()=>{
    getUser.mockResolvedValue({data:{user:null},error:null});
    expect((await POST(request({questionId:id,selectedAnswer:"a"}))).status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();expect(upsert).not.toHaveBeenCalled();
  });
  it("does not grade an inaccessible or unpublished lesson",async()=>{
    readLesson.mockResolvedValue({data:null,error:null});
    expect((await POST(request({questionId:id,selectedAnswer:"a"}))).status).toBe(404);
    expect(upsert).not.toHaveBeenCalled();
  });
  it("rejects an invalid selection without saving a fabricated result",async()=>{
    expect((await POST(request({questionId:id,selectedAnswer:"invented"}))).status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
  it("rejects simple cross-origin form content types before key lookup",async()=>{
    const response=await POST(new Request("http://localhost/api/questions/answer",{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({questionId:id,selectedAnswer:"a"})}));
    expect(response.status).toBe(415);expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(createAdminClient).not.toHaveBeenCalled();expect(upsert).not.toHaveBeenCalled();
  });
  it("rejects malformed question identifiers before key lookup",async()=>{
    expect((await POST(request({questionId:"bad",selectedAnswer:"a"}))).status).toBe(400);
    expect(createAdminClient).not.toHaveBeenCalled();expect(upsert).not.toHaveBeenCalled();
  });
  it("fails closed on a failed persistence, without exposing internal error details",async()=>{
    const log=vi.spyOn(console,"error").mockImplementation(()=>undefined);
    try{
      upsert.mockResolvedValue({error:new Error("PRIVATE_DATABASE_DETAIL")});
      const response=await POST(request({questionId:id,selectedAnswer:"a"}));
      expect(response.status).toBe(500);expect(await response.text()).not.toContain("PRIVATE_DATABASE_DETAIL");
    }finally{log.mockRestore();}
  });
});
