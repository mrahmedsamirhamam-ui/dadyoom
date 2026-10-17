"use client";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { GameItem } from "@/lib/games/lesson-game-pack";

type Outcome = { won: boolean; score: number };
type Pod = { x: number; y: number; text: string; active: boolean; drift: number };
type Beam = { x: number; y: number };
type Model = {
  active: boolean;
  wave: number;
  score: number;
  shields: number;
  ship: number;
  left: boolean;
  right: boolean;
  joystick: number;
  fire: boolean;
  cooldown: number;
  beams: Beam[];
  pods: Pod[];
  last: number;
  finished: boolean;
};

const W = 840;
const H = 500;
const DEFENSE = 435;
function makePods(item: GameItem): Pod[] {
  const step = W / (item.options.length + 1);
  return item.options.map((text, i) => ({
    x: step * (i + 1),
    y: 92 + (i % 2) * 8,
    text,
    active: true,
    drift: i * 1.65,
  }));
}

export default function DadyoomAnswerShooter({
  items, onFinish,
}: {
  items: GameItem[];
  onFinish: (result: Outcome) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onFinish);
  doneRef.current = onFinish;
  const modelRef = useRef<Model>({
    active: false, wave: 0, score: 0, shields: 3, ship: W / 2,
    left: false, right: false, joystick: 0, fire: false,
    cooldown: 0, beams: [], pods: [], last: 0, finished: false,
  });
  const [started, setStarted] = useState(false);
  const [wave, setWave] = useState(0);
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [hint, setHint] = useState("التحرك بالمقود أو الأسهم • زر إطلاق أو مسافة");
  const [isLost, setIsLost] = useState(false);

  function begin() {
    const m = modelRef.current;
    m.active = true; m.wave = 0; m.score = 0; m.shields = 3;
    m.ship = W / 2; m.cooldown = 0; m.beams = [];
    m.pods = makePods(items[0]); m.finished = false; m.last = 0;
    setStarted(true); setWave(0); setScore(0); setShields(3);
    setIsLost(false); setHint("المهمة الأولى: استهدف الإجابة الصحيحة فقط.");
  }
  function complete(won: boolean) {
    const m = modelRef.current;
    if (m.finished) return;
    m.finished = true; m.active = false; m.fire = false;
    setIsLost(!won);
    doneRef.current({ won, score: m.score });
  }
  function shoot() {
    const m = modelRef.current;
    if (!m.active || m.cooldown > 0) return;
    m.cooldown = 0.25;
    m.beams.push({ x: m.ship, y: 397 });
  }
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;
    let frame = 0;
    function box(x: number, y: number, w: number, h: number, color: string, radius = 12) {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
      ctx.fillStyle = color; ctx.fill();
    }
    function fit(text: string, x: number, y: number, width: number) {
      let size = 18;
      ctx.font = "800 " + size + "px Tahoma, sans-serif";
      while (size > 11 && ctx.measureText(text).width > width) {
        size--;
        ctx.font = "800 " + size + "px Tahoma, sans-serif";
      }
      ctx.textAlign = "center";
      ctx.fillText(text, x, y);
    }
    function render(now: number) {
      const m = modelRef.current;
      const dt = Math.min(0.045, m.last ? (now - m.last) / 1000 : 0);
      m.last = now;
      if (m.active) {
        let dx = (m.right ? 1 : 0) - (m.left ? 1 : 0) + m.joystick;
        dx = Math.min(1, Math.max(-1, dx));
        m.ship = Math.min(W - 25, Math.max(25, m.ship + dx * dt * 405));
        m.cooldown = Math.max(0, m.cooldown - dt);
        if (m.fire) shoot();
        m.beams.forEach(beam => {
          beam.y -= dt * 820;
          const width = Math.min(146, (W - 70) / items[m.wave].options.length - 10);
          for (let i = 0; i < m.pods.length; i++) {
            const pod = m.pods[i];
            if (!pod.active || beam.y > pod.y + 36 || beam.y < pod.y - 36 ||
              Math.abs(beam.x - pod.x) > width / 2) continue;
            beam.y = -100; pod.active = false;
            if (pod.text === items[m.wave].answer) {
              m.score++;
              setScore(m.score);
              setHint("✅ أصبت الروبوت الصحيح! " + (items[m.wave].explanation ?? ""));
              if (m.wave >= items.length - 1) {
                complete(true);
              } else {
                m.wave++;
                m.pods = makePods(items[m.wave]);
                m.beams = [];
                setWave(m.wave);
              }
            } else {
              setHint("🚫 إصابة مركبة صديقة! الإجابة الصحيحة هي: " + items[m.wave].answer);
              complete(false);
            }
            break;
          }
        });
        m.beams = m.beams.filter(beam => beam.y > -20);
        if (m.active) m.pods.forEach(pod => {
          if (!pod.active || !m.active) return;
          pod.y += (12 + m.wave * 3) * dt;
          if (pod.y + 38 >= DEFENSE) {
            m.shields--;
            setShields(m.shields);
            m.pods = makePods(items[m.wave]);
            m.beams = [];
            if (m.shields <= 0) {
              setHint("انتهت دروع المركبة قبل إنقاذ الإجابة الصحيحة.");
              complete(false);
            } else {
              setHint("خسرت درعًا. تحرك أسرع وحدد الإجابة الصحيحة.");
            }
          }
        });
      }
      // Canvas scene with real sprite coordinates and laser/target collision.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#081b35");
      bg.addColorStop(0.78, "#124558");
      bg.addColorStop(1, "#082b39");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 58; i++) {
        const x = (i * 163.71) % W, y = (i * 67.8) % H;
        ctx.fillStyle = i % 5 === 0 ? "#d9f8f1" : "#5c9da8";
        ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
      }
      ctx.strokeStyle = "#6bdac733";
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + (i * 84 - W / 2) * .4, 175);
        ctx.lineTo(i * 84, H); ctx.stroke();
      }
      ctx.fillStyle = "#09dec21c"; ctx.fillRect(0, DEFENSE, W, H - DEFENSE);
      ctx.strokeStyle = "#37efbd"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, DEFENSE); ctx.lineTo(W, DEFENSE); ctx.stroke();
      ctx.font = "800 13px Tahoma, sans-serif"; ctx.fillStyle = "#ccfff4";
      ctx.textAlign = "right"; ctx.fillText("خط الدفاع", W - 18, DEFENSE + 25);
      const podWidth = m.wave < items.length
        ? Math.min(146, (W - 70) / items[m.wave].options.length - 10) : 140;
      m.pods.forEach((pod, i) => {
        if (!pod.active) return;
        const x = pod.x - podWidth / 2, y = pod.y - 36;
        ctx.shadowBlur = 12; ctx.shadowColor = "#16dbce66";
        box(x, y, podWidth, 72, "#174a61");
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#85c1c6"; ctx.lineWidth = 2;
        ctx.stroke();
        box(x + 5, y + 5, podWidth - 10, 15, "#f3ce83", 4);
        ctx.fillStyle = "#233e4d"; ctx.font = "800 10px Tahoma";
        ctx.textAlign = "center"; ctx.fillText("مركبة " + (i + 1), pod.x, y + 17);
        ctx.fillStyle = "#fffaf0";
        fit(pod.text, pod.x, y + 50, podWidth - 10);
      });
      m.beams.forEach(beam => box(beam.x - 3, beam.y - 18, 6, 26, "#ffda7c", 3));
      // Player ship
      ctx.save(); ctx.translate(m.ship, 414);
      ctx.shadowColor = "#12d4bd"; ctx.shadowBlur = 15;
      ctx.fillStyle = "#13dbbe"; ctx.beginPath();
      ctx.moveTo(0, -30); ctx.lineTo(25, 18); ctx.lineTo(8, 14);
      ctx.lineTo(0, 26); ctx.lineTo(-8, 14); ctx.lineTo(-25, 18);
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "#f5fff9"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#f7ca77"; ctx.beginPath(); ctx.moveTo(-7, 21);
      ctx.lineTo(0, 34); ctx.lineTo(7, 21); ctx.fill();
      ctx.restore();
      frame = requestAnimationFrame(render);
    }
    const down = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D", " "].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") modelRef.current.left = true;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") modelRef.current.right = true;
      if (e.key === " ") { modelRef.current.fire = true; shoot(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") modelRef.current.left = false;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") modelRef.current.right = false;
      if (e.key === " ") modelRef.current.fire = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // This is one self-owned canvas/animation loop. It does not rerun per wave.
  }, [items]);

  function stickMove(e: ReactPointerEvent<HTMLDivElement>) {
    const target = padRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const vx = Math.max(-1, Math.min(1, x / (rect.width * 0.33)));
    modelRef.current.joystick = vx;
    if (knobRef.current) knobRef.current.style.transform =
      "translateX(" + (vx * rect.width * 0.33) + "px)";
  }
  function stickEnd() {
    modelRef.current.joystick = 0;
    if (knobRef.current) knobRef.current.style.transform = "translateX(0px)";
  }
  function tapCanvas(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !modelRef.current.active) return;
    const rect = canvas.getBoundingClientRect();
    modelRef.current.ship = Math.max(25,
      Math.min(W - 25, ((e.clientX - rect.left) / rect.width) * W));
    shoot();
  }
  const question = items[wave]?.prompt ?? "";
  return <section dir="rtl" aria-label="حارس العربية — لعبة حركة وتصويب"
    className="overflow-hidden rounded-[2rem] border border-[#2b948b] bg-[#092739] text-white shadow-2xl">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ffffff26] bg-[#123c49] p-4">
      <h2 className="font-black text-[#f5d080]">🚀 حارس العربية</h2>
      <p className="text-sm font-bold">🎯 {wave + 1}/{items.length} | ⭐ {score} | 🛡️ {shields}</p>
    </div>
    <div className="border-b border-[#236b67] p-4">
      <p className="text-xs font-bold text-[#85d9cb]">صوّب نحو الإجابة الصحيحة؛ إصابة مركبة أخرى تنهي اللعبة</p>
      <h3 className="mt-2 text-lg font-black leading-8">{question}</h3>
    </div>
    <div className="relative">
      <canvas ref={canvasRef} width={W} height={H}
        onPointerDown={tapCanvas}
        aria-label="الساحة التفاعلية: حرك مركبتك وصوّب على جواب الدرس الصحيح"
        className="aspect-[840/500] w-full touch-none bg-[#08273b]" />
      {!started && <div className="absolute inset-0 flex items-center justify-center bg-[#071a2de8] p-5 text-center">
        <div className="max-w-sm space-y-4">
          <p className="text-6xl">🚀</p>
          <p className="text-xl font-black text-[#f3d18a]">المهمة: خمس موجات تعليمية</p>
          <p className="text-sm leading-7">تحرك بالسهم أو المقود وصوّب. إصابة الجواب الخاطئ تعني خسارة الجولة.</p>
          <button type="button" onClick={begin}
            className="min-h-12 rounded-2xl bg-[#efc571] px-8 py-3 font-black text-[#123f39]">
            ابدأ المهمة ▶
          </button>
        </div>
      </div>}
    </div>
    <div className="flex items-center justify-between gap-3 bg-[#123c49] p-3">
      <div ref={padRef} tabIndex={0} role="group" aria-label="مقود حركة المركبة"
        onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId); stickMove(e);}}
        onPointerMove={e => {if (e.currentTarget.hasPointerCapture(e.pointerId)) stickMove(e);}}
        onPointerUp={stickEnd} onPointerCancel={stickEnd}
        onKeyDown={e => {if (e.key === "ArrowLeft" || e.key === "ArrowRight"){
          e.preventDefault();modelRef.current.joystick = e.key === "ArrowLeft" ? -1 : 1;
        }}}
        onKeyUp={stickEnd}
        className="relative h-20 w-20 shrink-0 touch-none rounded-full border-2 border-[#65b6ac] bg-[#0c2d40] sm:h-24 sm:w-24">
        <div ref={knobRef} style={{ marginLeft: "-20px", marginTop: "-20px" }}
          className="absolute left-1/2 top-1/2 h-10 w-10 rounded-full bg-[#9fe2d2]" />
      </div>
      <div className="text-center text-xs leading-6 text-[#b9dacf]">
        <p className="font-black text-[#f5d080]">🕹️ حرّك ثم أطلق</p>
        <p>← → والمسافة بالكمبيوتر</p>
      </div>
      <button type="button"
        onPointerDown={e => {e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);modelRef.current.fire = true;shoot();}}
        onPointerUp={() => {modelRef.current.fire = false;}}
        onPointerCancel={() => {modelRef.current.fire = false;}}
        onClick={shoot}
        className="h-20 w-20 shrink-0 touch-none rounded-full border-2 border-[#ffcd83] bg-[#bb3b41] text-sm font-black shadow-lg active:bg-[#912b35] sm:h-24 sm:w-24">
        ⚡ إطلاق
      </button>
    </div>
    <p role="status" aria-live="polite" className="bg-[#092739] px-4 py-3 text-center text-xs leading-6 text-[#f4d790]">
      {hint}{isLost ? " — خسرت الجولة" : ""}
    </p>
  </section>;
}
