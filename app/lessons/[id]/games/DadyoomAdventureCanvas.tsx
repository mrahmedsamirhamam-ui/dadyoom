"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { GameItem, GameMode } from "@/lib/games/lesson-game-pack";

type Adventure = Exclude<GameMode, "maze">;
type Outcome = { won: boolean; score: number };
type Pos = { x: number; y: number };
type Unit = Pos & { answer: string; alive: boolean };
type Shot = Pos;
type State = {
  running: boolean; finished: boolean; level: number; score: number; lives: number;
  x: number; y: number; vx: number; vy: number; aimX: number; aimY: number;
  up: boolean; down: boolean; left: boolean; right: boolean;
  fire: boolean; cooldown: number; last: number; elapsed: number;
  units: Unit[]; shots: Shot[]; distance: number; lane: number; hasTapDestination: boolean;
};
const WIDTH = 840, HEIGHT = 480;
const TITLES: Record<Adventure, { name: string; hint: string; action: string }> = {
  defender: { name: "حماة القلعة", hint: "حرّك المدفع للأعلى والأسفل، واصطد الروبوت الصحيح قبل عبور الأسوار.", action: "⚡ إطلاق" },
  catcher: { name: "سباق سيارات العربية", hint: "وجّه السيارة إلى الحارة التي تحمل الإجابة الصحيحة قبل الوصول إلى خط النهاية.", action: "🏎️ سباق" },
  runner: { name: "عدّاء الكلمات", hint: "اجعل العداء في مستوى الكلمة الصحيحة ليلتقطها أثناء الركض، وتجنب بقية الأهداف.", action: "🏃 جري" },
  guardian: { name: "مهمة إنقاذ الكنز", hint: "تحرك في الساحة لتجمع صندوق الإجابة الصحيحة دون لمس صندوق آخر.", action: "💎 استكشاف" },
};
function newState(): State {
  return { running: false, finished: false, level: 0, score: 0, lives: 3,
    x: 420, y: 380, vx: 0, vy: 0, aimX: 420, aimY: 380,
    up: false, down: false, left: false, right: false,
    fire: false, cooldown: 0, last: 0, elapsed: 0, units: [], shots: [],
    distance: 0, lane: 0, hasTapDestination: false };
}
function layout(mode: Adventure, options: string[]): Unit[] {
  const slots: Record<Adventure, Pos[]> = {
    defender: [{ x: 690, y: 110 }, { x: 690, y: 200 }, { x: 690, y: 290 }, { x: 690, y: 380 }, { x: 690, y: 440 }],
    catcher: [{ x: 145, y: 40 }, { x: 325, y: 40 }, { x: 510, y: 40 }, { x: 695, y: 40 }, { x: 775, y: 40 }],
    runner: [{ x: 725, y: 115 }, { x: 725, y: 205 }, { x: 725, y: 295 }, { x: 725, y: 385 }, { x: 725, y: 440 }],
    guardian: [{ x: 130, y: 135 }, { x: 700, y: 135 }, { x: 130, y: 330 }, { x: 700, y: 330 }, { x: 430, y: 140 }],
  };
  return options.map((answer, index) => {
    const ranged = options.length < 2 ? 0 : index / (options.length - 1);
    const slot = mode === "defender" ? { x: 690, y: 115 + ranged * 270 } :
      mode === "runner" ? { x: 725, y: 115 + ranged * 270 } : slots[mode][index];
    return { ...slot, answer, alive: true };
  });
}

export default function DadyoomAdventureCanvas({
  mode, items, onFinish,
}: {
  mode: Adventure;
  items: GameItem[];
  onFinish: (result: Outcome) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onFinish);
  const stateRef = useRef<State>(newState());
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [notice, setNotice] = useState("");
  useEffect(() => { doneRef.current = onFinish; }, [onFinish]);

  function start() {
    const state = newState();
    state.running = true;
    if (mode === "defender") { state.x = 95; state.y = 245; }
    if (mode === "catcher") { state.lane = 1; state.x = 325; state.y = 385; }
    if (mode === "runner") { state.x = 135; state.y = 385; }
    if (mode === "guardian") { state.x = 415; state.y = 405; }
    state.units = layout(mode, items[0].options);
    stateRef.current = state;
    setLevel(0); setLives(3); setScore(0); setStarted(true);
    setNotice("المهمة الأولى: فكر في الإجابة ثم تحرك نحو هدفها الصحيح.");
  }
  function end(won: boolean) {
    const m = stateRef.current;
    if (m.finished) return;
    m.finished = true; m.running = false; m.fire = false;
    setNotice(won ? "🏆 أتممت خمس موجات!" : "🛑 انتهت المحاولة. أعد التدريب وحاول من جديد.");
    doneRef.current({ won, score: m.score });
  }
  function wavePassed() {
    const m = stateRef.current;
    m.score++;
    setScore(m.score);
    if (m.level >= items.length - 1) { end(true); return; }
    m.level++;
    m.units = layout(mode, items[m.level].options);
    m.shots = [];
    m.elapsed = 0; m.distance = 0; m.hasTapDestination = false;
    m.vx = 0; m.vy = 0;
    m.left = false; m.right = false; m.up = false; m.down = false;
    if (mode === "guardian") { m.x = 415; m.y = 405; }
    if (mode === "runner") m.y = 385;
    setLevel(m.level);
    setNotice("✅ ممتاز! انتقلت إلى المرحلة " + (m.level + 1) + ".");
  }
  function hit(answer: string) {
    const m = stateRef.current;
    if (!m.running) return;
    if (answer === items[m.level].answer) wavePassed();
    else {
      setNotice("🛑 هذا هدف خاطئ! الحل الصحيح: " + items[m.level].answer);
      end(false);
    }
  }
  function fire() {
    const m = stateRef.current;
    if (!m.running || mode !== "defender" || m.cooldown > 0) return;
    m.cooldown = .34;
    m.shots.push({ x: m.x + 20, y: m.y });
  }
  function chooseLane(direction: number) {
    const m = stateRef.current;
    if (!m.running) return;
    const count = items[m.level].options.length;
    m.lane = Math.max(0, Math.min(count - 1, m.lane + direction));
  }
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = ctx;
    let frame = 0;
    function text(txt: string, x: number, y: number, maxW: number, color = "#fff") {
      g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
      let size = 19;
      do { g.font = "800 " + size + "px Tahoma, sans-serif"; size--; }
      while (size > 11 && g.measureText(txt).width > maxW);
      g.fillText(txt, x, y, maxW);
    }
    function rect(x: number, y: number, w: number, h: number, fill: string, radius = 12) {
      g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, radius); g.fill();
    }
    function resetAfterMiss() {
      const m = stateRef.current;
      m.lives--; setLives(m.lives);
      if (m.lives <= 0) { end(false); return; }
      m.units = layout(mode, items[m.level].options);
      m.elapsed = 0; m.shots = []; m.distance = 0;
      setNotice("🛡️ خسرت درعًا، لكن أمامك فرصة أخرى لهذه المرحلة.");
    }
    function update(dt: number) {
      const m = stateRef.current;
      if (!m.running) return;
      m.elapsed += dt; m.cooldown = Math.max(0, m.cooldown - dt);
      const dx = Number(m.right) - Number(m.left) + m.vx;
      const dy = Number(m.down) - Number(m.up) + m.vy;
      if (mode === "defender") {
        m.y = Math.max(105, Math.min(395, m.y + dy * 340 * dt));
        if (m.fire) fire();
        for (const shot of m.shots) {
          shot.x += 900 * dt;
          for (const bot of m.units) {
            if (bot.alive && Math.abs(shot.x - bot.x) < 53 && Math.abs(shot.y - bot.y) < 36) {
              bot.alive = false; shot.x = 9999; hit(bot.answer); break;
            }
          }
        }
        m.shots = m.shots.filter(s => s.x < WIDTH);
        if (!m.running) return;
        for (const bot of m.units) bot.x -= (40 + m.level * 7) * dt;
        if (m.units.some(bot => bot.alive && bot.x < 145)) resetAfterMiss();
      } else if (mode === "catcher") {
        // Steering + automatic road motion: no quiz buttons or laser mechanics.
        const count = items[m.level].options.length;
        if (Math.abs(dx) > .15 && m.cooldown <= 0) {
          chooseLane(dx > 0 ? 1 : -1); m.cooldown = .22;
        }
        const roadX = (n: number) => WIDTH * (n + 1) / (count + 1);
        m.x += (roadX(m.lane) - m.x) * Math.min(1, dt * 13);
        m.units.forEach(bot => { bot.y += (88 + 10 * m.level) * dt; });
        if (m.units[0]?.y >= 348) {
          const actual = m.units[m.lane];
          if (actual) hit(actual.answer);
        }
      } else if (mode === "runner") {
        // Continuous side-running: vertical jump tracks incoming answer orbs.
        m.y = Math.max(115, Math.min(385, m.y + dy * 385 * dt));
        m.distance += 120 * dt;
        for (const bot of m.units) {
          bot.x -= (105 + m.level * 7) * dt;
          if (bot.x <= m.x + 32 && bot.x >= m.x - 36 &&
            Math.abs(bot.y - m.y) < 43) { hit(bot.answer); break; }
        }
        if (m.running && m.units.every(bot => bot.x < m.x - 45)) resetAfterMiss();
      } else {
        // Treasure rescue: full X/Y navigation, each answer a world object.
        let moveX = dx, moveY = dy;
        if (m.hasTapDestination && Math.abs(dx) < .01 && Math.abs(dy) < .01) {
          moveX = (m.aimX - m.x) / 65;
          moveY = (m.aimY - m.y) / 65;
        }
        const remain = Math.hypot(m.aimX - m.x, m.aimY - m.y);
        if (m.hasTapDestination && remain < 10) m.hasTapDestination = false;
        const factor = Math.max(1, Math.hypot(moveX, moveY));
        m.x = Math.max(35, Math.min(805, m.x + moveX * 240 * dt / factor));
        m.y = Math.max(95, Math.min(405, m.y + moveY * 240 * dt / factor));
        for (const box of m.units) {
          if (Math.hypot(box.x - m.x, box.y - m.y) < 47) {
            hit(box.answer); break;
          }
        }
      }
    }
    function draw() {
      const m = stateRef.current;
      const bg = g.createLinearGradient(0, 0, 0, HEIGHT);
      const colors: Record<Adventure, string[]> = {
        defender: ["#09233b", "#1f4965"], catcher: ["#172b38", "#436776"],
        runner: ["#113b46", "#37938d"], guardian: ["#1a293b", "#36515c"],
      };
      bg.addColorStop(0, colors[mode][0]); bg.addColorStop(1, colors[mode][1]);
      g.fillStyle = bg; g.fillRect(0, 0, WIDTH, HEIGHT);
      if (mode === "catcher") {
        for (let lane = 0; lane <= 5; lane++) {
          const x = lane * WIDTH / 5;
          g.strokeStyle = "#dfebdf44"; g.lineWidth = 3;
          g.setLineDash([22, 22]); g.beginPath(); g.moveTo(x, 55); g.lineTo(x, 470); g.stroke();
        } g.setLineDash([]);
        text("خط النهاية", 425, 454, 250, "#e9d49b");
      } else if (mode === "runner") {
        for (let row = 0; row < 4; row++) {
          rect(0, 97 + row * 90, WIDTH, 3, "#8ad6c744", 0);
        }
        text("🌳 طريق المغامرة", 405, 448, 260, "#d4efdf");
      } else if (mode === "guardian") {
        rect(0, 77, WIDTH, 6, "#48b4a3", 0);
        rect(0, 439, WIDTH, 6, "#48b4a3", 0);
        // Walls leave multiple navigable corridors.
        for (const w of [{ x: 260, y: 180, w: 100 }, { x: 470, y: 280, w: 100 }]) {
          rect(w.x, w.y, w.w, 17, "#70999a");
        }
      } else {
        rect(20, 80, 28, 350, "#ceb374");
        rect(43, 80, 5, 350, "#fff0bf");
        text("🏰 الحصن", 100, 449, 180, "#f5d396");
      }
      const maxWidth = Math.min(176, 800 / (items[m.level]?.options.length ?? 4));
      m.units.forEach((u, index) => {
        if (!u.alive) return;
        if (mode === "catcher") {
          rect(u.x - maxWidth / 2, u.y - 34, maxWidth, 74, "#e9bd6d");
          rect(u.x - maxWidth / 2 + 4, u.y - 29, maxWidth - 8, 65, "#27546a");
          text(u.answer, u.x, u.y + 5, maxWidth - 10);
        } else if (mode === "runner") {
          g.beginPath(); g.arc(u.x, u.y, 37, 0, Math.PI * 2);
          g.fillStyle = "#dbb66e"; g.fill();
          g.strokeStyle = "#f8e7b8"; g.lineWidth = 3; g.stroke();
          text(u.answer, u.x, u.y, 66, "#132e39");
        } else if (mode === "guardian") {
          rect(u.x - 63, u.y - 35, 126, 70, "#ac7b39");
          rect(u.x - 58, u.y - 28, 116, 61, "#edc977");
          text("💎", u.x, u.y - 12, 90, "#183442");
          text(u.answer, u.x, u.y + 18, 104, "#1c3242");
        } else {
          rect(u.x - maxWidth / 2, u.y - 35, maxWidth, 70, "#23536b");
          rect(u.x - maxWidth / 2 + 6, u.y - 31, maxWidth - 12, 14, "#e2bc78");
          text("روبوت " + (index + 1), u.x, u.y - 23, maxWidth - 10, "#223c4b");
          text(u.answer, u.x, u.y + 9, maxWidth - 10);
        }
      });
      m.shots.forEach(s => rect(s.x, s.y - 3, 27, 6, "#f2d37b", 3));
      if (mode === "guardian") {
        g.font = "44px Tahoma"; g.fillText("🧑‍🚀", m.x, m.y + 12);
      } else if (mode === "runner") {
        g.font = "44px Tahoma"; g.fillText("🏃", m.x, m.y + 12);
      } else if (mode === "catcher") {
        rect(m.x - 31, m.y - 39, 62, 77, "#f4b757");
        rect(m.x - 24, m.y - 16, 48, 34, "#194057");
        rect(m.x - 35, m.y - 23, 7, 18, "#111820", 2);
        rect(m.x + 28, m.y - 23, 7, 18, "#111820", 2);
        text("🚗", m.x, m.y + 15, 55);
      } else {
        rect(m.x - 25, m.y - 22, 53, 43, "#e9a951");
        rect(m.x - 17, m.y - 13, 35, 26, "#113848");
        rect(m.x + 12, m.y - 4, 32, 8, "#efcf80");
      }
    }
    function loop(now: number) {
      const m = stateRef.current, dt = Math.min(.04, m.last ? (now - m.last) / 1000 : 0);
      m.last = now; update(dt); draw();
      frame = requestAnimationFrame(loop);
    }
    function keydown(e: KeyboardEvent) {
      if (!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","a","d","w","s"].includes(e.key)) return;
      if (document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA") return;
      e.preventDefault();
      const m = stateRef.current;
      if (e.key === "ArrowUp" || e.key === "w") m.up = true;
      if (e.key === "ArrowDown" || e.key === "s") m.down = true;
      if (e.key === "ArrowLeft" || e.key === "a") m.left = true;
      if (e.key === "ArrowRight" || e.key === "d") m.right = true;
      if (e.key === " ") { m.fire = true; fire(); }
    }
    function keyup(e: KeyboardEvent) {
      const m = stateRef.current;
      if (e.key === "ArrowUp" || e.key === "w") m.up = false;
      if (e.key === "ArrowDown" || e.key === "s") m.down = false;
      if (e.key === "ArrowLeft" || e.key === "a") m.left = false;
      if (e.key === "ArrowRight" || e.key === "d") m.right = false;
      if (e.key === " ") m.fire = false;
    }
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup);
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame);
      window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup);
    };
  }, [items, mode]);

  function joystick(e: ReactPointerEvent<HTMLDivElement>) {
    const el = joystickRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = (e.clientX - box.left - box.width / 2) / (box.width * .32);
    const y = (e.clientY - box.top - box.height / 2) / (box.height * .32);
    const m = stateRef.current;
    m.vx = Math.max(-1, Math.min(1, x));
    m.vy = Math.max(-1, Math.min(1, y));
    if (knobRef.current) knobRef.current.style.transform =
      "translate(" + m.vx * 27 + "px," + m.vy * 27 + "px)";
  }
  function release() {
    stateRef.current.vx = 0; stateRef.current.vy = 0;
    if (knobRef.current) knobRef.current.style.transform = "translate(0px,0px)";
  }
  function tap(e: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const m = stateRef.current;
    if (!rect || !m.running) return;
    const x = (e.clientX - rect.left) / rect.width * WIDTH;
    const y = (e.clientY - rect.top) / rect.height * HEIGHT;
    if (mode === "catcher") {
      const count = items[m.level].options.length;
      m.lane = Math.max(0, Math.min(count - 1, Math.round(x / WIDTH * (count + 1) - 1)));
    } else if (mode === "runner") {
      m.y = Math.max(115, Math.min(385, y));
    } else if (mode === "defender") {
      m.y = Math.max(105, Math.min(395, y)); fire();
    } else {
      // Touch travel moves toward location, rather than teleporting through boxes.
      m.aimX = x; m.aimY = y;
      m.hasTapDestination = true;
      m.vx = 0; m.vy = 0;
    }
  }
  return <section dir="rtl" aria-label={TITLES[mode].name}
    className="overflow-hidden rounded-[2rem] border border-[#388f89] bg-[#0b2939] text-white shadow-xl">
    <header className="flex flex-wrap items-center justify-between gap-2 bg-[#123b49] p-4">
      <h2 className="font-black text-[#ffdb8b]">{TITLES[mode].name}</h2>
      <span className="text-sm font-black">⭐ {score} | 🛡️ {lives} | 🎯 {level + 1}/{items.length}</span>
    </header>
    <div className="border-b border-white/20 p-4">
      <p className="text-xs leading-6 text-[#a9ded3]">{TITLES[mode].hint}</p>
      <h3 className="mt-2 text-lg font-black leading-8">{items[level]?.prompt}</h3>
    </div>
    <div className="relative">
      <canvas ref={canvasRef} onPointerDown={tap}
        width={WIDTH} height={HEIGHT} className="aspect-[840/480] w-full touch-none"
        aria-label={"ساحة اللعب الحركي: " + TITLES[mode].name}/>
      {!started && <div className="absolute inset-0 flex items-center justify-center bg-[#0b2034ee] p-5 text-center">
        <div className="space-y-3">
          <p className="text-6xl">{mode === "catcher" ? "🏎️" : mode === "runner" ? "🏃" : mode === "defender" ? "🏰" : "💎"}</p>
          <p className="text-xl font-black text-[#f0d18f]">5 مراحل • 5 أسئلة من الدرس</p>
          <button type="button" onClick={start}
            className="min-h-12 rounded-xl bg-[#f0d18f] px-8 py-3 font-black text-[#123f39]">
            ابدأ المغامرة ▶
          </button>
        </div>
      </div>}
    </div>
    <div className="flex items-center justify-between gap-3 bg-[#123b49] p-3">
      <div ref={joystickRef} role="group" aria-label="عصا تحكم اللعبة"
        onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joystick(e);}}
        onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))joystick(e);}}
        onPointerUp={release} onPointerCancel={release}
        className="relative h-24 w-24 touch-none rounded-full border-2 border-[#8acbb8] bg-[#08263b]">
        <div ref={knobRef} style={{left:"calc(50% - 20px)",top:"calc(50% - 20px)"}}
          className="absolute h-10 w-10 rounded-full bg-[#b2e6d8]"/>
      </div>
      <p className="text-center text-xs leading-6 text-[#d5e9dc]">اسحب المقود باللمس<br/>أو استخدم الأسهم في الكيبورد</p>
      {mode === "defender" ?
        <button type="button" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);stateRef.current.fire=true;fire();}}
          onPointerUp={()=>{stateRef.current.fire=false;}}
          onPointerCancel={()=>{stateRef.current.fire=false;}}
          className="h-20 w-20 touch-none rounded-full border-2 border-amber-300 bg-[#b23c48] font-black">
          ⚡ إطلاق
        </button> :
        <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full border border-[#b9d0ba] bg-[#2e695d] text-3xl">
          {mode === "catcher" ? "🚗" : mode === "runner" ? "🏃" : "🗺️"}
        </div>}
    </div>
    <p role="status" aria-live="polite" className="bg-[#0b2939] px-4 py-3 text-center text-sm text-[#f3d18d]">{notice}</p>
  </section>;
}
