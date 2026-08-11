"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Point = {
  x: number;
  y: number;
};

type HandwritingCanvasProps = {
  letter?: string;
};

export default function HandwritingCanvas({
  letter = "ب",
}: HandwritingCanvasProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] =
    useState(false);

  const [hasWriting, setHasWriting] =
    useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 6;
    context.strokeStyle = "#0f172a";
  }, []);

  function getPoint(
    event:
      | React.PointerEvent<HTMLCanvasElement>,
  ): Point {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: 0,
        y: 0,
      };
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rect.left) *
        (canvas.width / rect.width),
      y:
        (event.clientY - rect.top) *
        (canvas.height / rect.height),
    };
  }

  function startDrawing(
    event:
      React.PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(
      event.pointerId
    );

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    const point = getPoint(event);

    context.beginPath();
    context.moveTo(
      point.x,
      point.y
    );

    setIsDrawing(true);
  }

  function draw(
    event:
      React.PointerEvent<HTMLCanvasElement>,
  ) {
    if (!isDrawing) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    const point = getPoint(event);

    context.lineTo(
      point.x,
      point.y
    );

    context.stroke();

    setHasWriting(true);
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    setHasWriting(false);
  }

  return (
    <div
      dir="rtl"
      className="space-y-4"
    >
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="font-bold text-emerald-900">
          ✍️ أتدرب على الكتابة
        </p>

        <p className="mt-2 text-sm text-emerald-800">
          تتبع الحرف ثم اكتبه بنفسك
          باستخدام إصبعك أو القلم أو
          الفأرة.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-5xl font-bold text-red-600">
        <span>{letter}َ</span>
        <span>{letter}ُ</span>
        <span>{letter}ِ</span>
        <span>{letter}ا</span>
        <span>{letter}و</span>
        <span>{letter}ي</span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border-2 border-sky-200 bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[180px] font-bold text-slate-100"
        >
          {letter}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 54px, rgba(14,165,233,0.16) 55px, rgba(14,165,233,0.16) 57px)",
          }}
        />

        <canvas
          ref={canvasRef}
          width={900}
          height={420}
          className="relative z-10 block h-[320px] w-full touch-none cursor-crosshair"
          onPointerDown={
            startDrawing
          }
          onPointerMove={draw}
          onPointerUp={
            stopDrawing
          }
          onPointerCancel={
            stopDrawing
          }
          onPointerLeave={
            stopDrawing
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
        >
          🗑️ امسح وأعد المحاولة
        </button>

        <div
          className={
            hasWriting
              ? "rounded-xl bg-emerald-100 px-4 py-2 font-bold text-emerald-800"
              : "rounded-xl bg-slate-100 px-4 py-2 text-slate-500"
          }
        >
          {hasWriting
            ? "✓ بدأت الكتابة"
            : "اكتب داخل المساحة"}
        </div>
      </div>
    </div>
  );
}
