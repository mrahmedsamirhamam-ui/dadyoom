import { logger } from "@/lib/logger";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  mkdir,
  readFile,
  stat,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DadVoiceMood =
  | "normal"
  | "thinking"
  | "correct"
  | "encouraging"
  | "celebrating";

type DadVoiceRequest = {
  text?: unknown;
  mood?: DadVoiceMood;
};

type VoiceSettings = {
  rate: string;
  pitch: string;
};

const VOICE =
  process.env.EDGE_TTS_VOICE?.trim() ||
  "ar-SA-ZariyahNeural";

const CACHE_DIRECTORY = path.join(
  os.tmpdir(),
  "dadyoom",
  "dad-voice"
);

function normalizeArabicText(value: string): string {
  return value
    .replace(/\b10\b/g, "عشرة")
    .replace(/\b9\b/g, "تسعة")
    .replace(/\b8\b/g, "ثمانية")
    .replace(/\b7\b/g, "سبعة")
    .replace(/\b6\b/g, "ستة")
    .replace(/\b5\b/g, "خمسة")
    .replace(/\b4\b/g, "أربعة")
    .replace(/\b3\b/g, "ثلاثة")
    .replace(/\b2\b/g, "اثنان")
    .replace(/\b1\b/g, "واحد")
    .replace(/[٠۰]/g, "صفر")
    .replace(/[١۱]/g, "واحد")
    .replace(/[٢۲]/g, "اثنان")
    .replace(/[٣۳]/g, "ثلاثة")
    .replace(/[٤۴]/g, "أربعة")
    .replace(/[٥۵]/g, "خمسة")
    .replace(/[٦۶]/g, "ستة")
    .replace(/[٧۷]/g, "سبعة")
    .replace(/[٨۸]/g, "ثمانية")
    .replace(/[٩۹]/g, "تسعة")
    .replace(/->|→/g, "ثم")
    .replace(/[•*_#`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getVoiceSettings(
  mood: DadVoiceMood
): VoiceSettings {
  switch (mood) {
    case "thinking":
      return {
        rate: "-3%",
        pitch: "+28Hz",
      };

    case "correct":
      return {
        rate: "+8%",
        pitch: "+35Hz",
      };

    case "encouraging":
      return {
        rate: "+2%",
        pitch: "+30Hz",
      };

    case "celebrating":
      return {
        rate: "+12%",
        pitch: "+40Hz",
      };

    default:
      return {
        rate:
          process.env.EDGE_TTS_RATE?.trim() ||
          "+5%",
        pitch:
          process.env.EDGE_TTS_PITCH?.trim() ||
          "+35Hz",
      };
  }
}

function createCacheKey(params: {
  text: string;
  mood: DadVoiceMood;
  rate: string;
  pitch: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        ...params,
        voice: VOICE,
      })
    )
    .digest("hex");
}

async function fileExists(
  filePath: string
): Promise<boolean> {
  try {
    const info = await stat(filePath);

    return (
      info.isFile() &&
      info.size > 0
    );
  } catch {
    return false;
  }
}

function runEdgeTts(params: {
  text: string;
  outputPath: string;
  rate: string;
  pitch: string;
}): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      const args = [
        "-m",
        "edge_tts",
        "--voice",
        VOICE,
        `--rate=${params.rate}`,
        `--pitch=${params.pitch}`,
        "--text",
        params.text,
        "--write-media",
        params.outputPath,
      ];

      /*
       * py هو Python Launcher على Windows.
       * لا نستخدم shell حتى يظل النص آرمنًا
       * ولا يُفسر كأوامر PowerShell.
       */
      const pythonExecutable =

        process.env.EDGE_TTS_PYTHON?.trim() ||

        "python";


      logger.info(

        "EDGE_TTS_PYTHON_EXECUTABLE:",

        pythonExecutable

      );


      const processHandle = spawn(

        pythonExecutable,

        args,

        {
          windowsHide: true,
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
        }
      );

      let stdout = "";
      let stderr = "";

      processHandle.stdout.on(
        "data",
        (chunk: Buffer) => {
          stdout += chunk.toString();
        }
      );

      processHandle.stderr.on(
        "data",
        (chunk: Buffer) => {
          stderr += chunk.toString();
        }
      );

      const timeout = setTimeout(() => {
        processHandle.kill();

        reject(
          new Error(
            "انتهت مهلة إنشاء صوت ضاد."
          )
        );
      }, 30_000);

      processHandle.on(
        "error",
        (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      );

      processHandle.on(
        "close",
        (code) => {
          clearTimeout(timeout);

          if (code === 0) {
            resolve();
            return;
          }

          console.error(
            "EDGE_TTS_PROCESS_FAILED:",
            {
              code,
              stdout,
              stderr,
            }
          );

          reject(
            new Error(
              stderr.trim() ||
                `تعذر تشغيل Edge TTS. Code: ${code}`
            )
          );
        }
      );
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as DadVoiceRequest;

    const mood: DadVoiceMood =
      body.mood === "thinking" ||
      body.mood === "correct" ||
      body.mood === "encouraging" ||
      body.mood === "celebrating"
        ? body.mood
        : "normal";

    const text = normalizeArabicText(
      String(body.text ?? "")
        .trim()
        .slice(0, 2500)
    );

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لا يوجد نص ليقرأه ضاد.",
        },
        { status: 400 }
      );
    }

    const { rate, pitch } =
      getVoiceSettings(mood);

    await mkdir(CACHE_DIRECTORY, {
      recursive: true,
    });

    const cacheKey = createCacheKey({
      text,
      mood,
      rate,
      pitch,
    });

    const outputPath = path.join(
      CACHE_DIRECTORY,
      `${cacheKey}.mp3`
    );

    const cached =
      await fileExists(outputPath);

    if (!cached) {
      logger.info(
        "EDGE_TTS_GENERATING:",
        {
          voice: VOICE,
          mood,
          rate,
          pitch,
          characters: text.length,
        }
      );

      await runEdgeTts({
        text,
        outputPath,
        rate,
        pitch,
      });
    }

    const audioBuffer =
      await readFile(outputPath);

    if (audioBuffer.length === 0) {
      throw new Error(
        "تم إنشاء ملف صوتي فارغ."
      );
    }

    logger.info(
      "DAD_TTS_SUCCESS:",
      {
        provider: "edge-tts",
        voice: VOICE,
        cached,
        bytes: audioBuffer.length,
      }
    );

    return new NextResponse(
      new Uint8Array(audioBuffer),
      {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(
            audioBuffer.length
          ),
          "Cache-Control":
            "private, max-age=86400",
          "X-Dad-Voice-Provider":
            "edge-tts",
          "X-Dad-Voice-Cache":
            cached ? "HIT" : "MISS",
        },
      }
    );
  } catch (error) {
    console.error(
      "DAD_VOICE_ROUTE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر إنشاء صوت ضاد.",
      },
      { status: 500 }
    );
  }
}
