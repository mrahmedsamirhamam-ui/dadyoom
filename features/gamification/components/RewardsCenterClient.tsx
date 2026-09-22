"use client";

import { PDFDocument } from "pdf-lib";
import { useMemo, useState } from "react";

import type {
  CertificateDefinition,
  RewardDefinition,
} from "@/features/gamification/reward-engine";
import type { ManualAward } from "@/features/gamification/learner-reward-snapshot";

type Summary = {
  totalXP: number;
  completedLessons: number;
  masteredLessons: number;
  currentStreak: number;
  longestStreak: number;
  levelName: string;
  levelNumber: number;
};

type Props = {
  displayName: string;
  role: string;
  summary?: Summary | null;
  rewards: RewardDefinition[];
  subscriptionRewards: RewardDefinition[];
  certificates: CertificateDefinition[];
  manualAwards: ManualAward[];
  claimedRewardKeys: string[];
};

function safeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

async function certificatePdf(
  name: string,
  certificate: CertificateDefinition,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1131;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر إنشاء الشهادة.");

  const gradient = ctx.createLinearGradient(0, 0, 1600, 1131);
  gradient.addColorStop(0, "#fffaf0");
  gradient.addColorStop(1, "#f1e4c3");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1600, 1131);

  ctx.strokeStyle = "#174f47";
  ctx.lineWidth = 18;
  ctx.strokeRect(42, 42, 1516, 1047);

  ctx.strokeStyle = "#c69a45";
  ctx.lineWidth = 5;
  ctx.strokeRect(74, 74, 1452, 983);

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  ctx.fillStyle = "#174f47";
  ctx.font = '900 50px "Noto Kufi Arabic", Tahoma, Arial, sans-serif';
  ctx.fillText("ضاديوم · بيت العربية الرقمي", 800, 180);

  ctx.fillStyle = "#9b7128";
  ctx.font = '900 62px "Noto Kufi Arabic", Tahoma, Arial, sans-serif';
  ctx.fillText(certificate.title, 800, 310);

  ctx.fillStyle = "#4d4438";
  ctx.font = '700 34px "Noto Kufi Arabic", Tahoma, Arial, sans-serif';
  ctx.fillText("تُمنح هذه الشهادة إلى", 800, 415);

  ctx.fillStyle = "#123f39";
  ctx.font = '900 72px "Noto Kufi Arabic", Tahoma, Arial, sans-serif';
  ctx.fillText(name, 800, 545);

  ctx.fillStyle = "#5d5244";
  ctx.font = '700 32px "Noto Naskh Arabic", Tahoma, Arial, sans-serif';
  ctx.fillText(certificate.subtitle, 800, 650);

  ctx.font = '700 28px "Noto Kufi Arabic", Tahoma, Arial, sans-serif';
  ctx.fillText(certificate.detail, 800, 720);

  const date = new Intl.DateTimeFormat("ar-BH", { dateStyle: "long" }).format(
    new Date(),
  );

  ctx.fillStyle = "#7d6b4f";
  ctx.font = '700 25px "Noto Kufi Arabic", Tahoma, Arial, sans-serif';
  ctx.fillText(date, 800, 850);

  ctx.fillStyle = "#174f47";
  ctx.font = '900 92px "Noto Naskh Arabic", Tahoma, Arial, sans-serif';
  ctx.fillText("ض", 800, 975);

  const pngBytes = await fetch(canvas.toDataURL("image/png", 1)).then((r) =>
    r.arrayBuffer(),
  );

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const png = await pdf.embedPng(pngBytes);
  page.drawImage(png, { x: 0, y: 0, width: 842, height: 595 });

  return pdf.save();
}

export default function RewardsCenterClient({
  displayName,
  role,
  summary,
  rewards,
  subscriptionRewards,
  certificates,
  manualAwards,
  claimedRewardKeys,
}: Props) {
  const [certificateName, setCertificateName] = useState(displayName);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState("");
  const claimed = useMemo(() => new Set(claimedRewardKeys), [claimedRewardKeys]);

  async function downloadCertificate(certificate: CertificateDefinition) {
    const name = certificateName.trim();

    if (!name) {
      alert("اكتب الاسم الحقيقي الذي تريد ظهوره على الشهادة.");
      return;
    }

    const bytes = await certificatePdf(name, certificate);
    const pdfBuffer = Uint8Array.from(bytes).buffer;
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName(certificate.title)}-${safeFileName(name)}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function claim(reward: RewardDefinition) {
    if (!reward.unlocked || claiming) return;

    setClaiming(reward.key);
    setClaimMessage("");

    try {
      const response = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardKey: reward.key }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "تعذر استلام الجائزة.");
      }

      setClaimMessage(data.message || "تم استلام الجائزة.");
      window.location.reload();
    } catch (error) {
      setClaimMessage(
        error instanceof Error ? error.message : "تعذر استلام الجائزة.",
      );
    } finally {
      setClaiming(null);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf6ea] px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="rounded-[2.2rem] bg-[#123f39] p-7 text-white shadow-xl">
          <p className="text-sm font-black text-[#f5cf7a]">مركز الإنجاز</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            الجوائز والشهادات
          </h1>
          <p className="mt-3 max-w-3xl leading-8 text-[#e7f0ec]">
            XP موحد، مستويات، شارات، ألقاب، شهادات، وجوائز Plus حقيقية.
          </p>
          <div className="mt-4 text-sm font-bold text-[#f4d58a]">
            {displayName} · {role}
          </div>
        </section>

        {summary ? (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Stat label="XP الموحد" value={summary.totalXP} />
            <Stat label="الدروس المكتملة" value={summary.completedLessons} />
            <Stat label="الدروس المتقنة" value={summary.masteredLessons} />
            <Stat label="حماس اليوم" value={`${summary.currentStreak} 🔥`} />
            <Stat label="أطول سلسلة" value={`${summary.longestStreak} يوم`} />
            <Stat
              label="المستوى"
              value={`${summary.levelNumber} · ${summary.levelName}`}
            />
          </section>
        ) : null}

        {manualAwards.length > 0 ? (
          <section className="rounded-[2rem] border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[#123f39]">
              جوائز المعلم والمدرسة
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {manualAwards.map((award) => (
                <article
                  key={award.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
                >
                  <div className="text-4xl">{award.icon}</div>
                  <h3 className="mt-3 text-lg font-black">{award.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {award.description || "جائزة من فريقك التعليمي."}
                  </p>
                  <div className="mt-3 font-black text-amber-800">
                    +{award.points} XP
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {rewards.length > 0 ? (
          <section className="rounded-[2rem] border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-[#123f39]">
              الشارات والألقاب
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <article
                  key={reward.key}
                  className={`rounded-2xl border p-5 ${
                    reward.unlocked
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 opacity-70"
                  }`}
                >
                  <div className="text-4xl">{reward.icon}</div>
                  <h3 className="mt-3 font-black">{reward.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {reward.description}
                  </p>
                  <div className="mt-3 text-xs font-black text-slate-500">
                    {reward.unlocked
                      ? "✓ تم فتحها"
                      : `${Math.round(reward.current)}/${reward.target} ${reward.unit}`}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {subscriptionRewards.length > 0 ? (
          <section className="rounded-[2rem] border border-[#c69a45] bg-[#fff8e7] p-6">
            <h2 className="text-2xl font-black text-[#123f39]">
              🎁 جوائز Plus المجانية
            </h2>
            <p className="mt-2 text-sm font-bold text-[#6e5a36]">
              كل هدية تُستلم مرة واحدة ولا تغيّر صلاحية الحساب أو دوره.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {subscriptionRewards.map((reward) => {
                const wasClaimed = claimed.has(reward.key);

                return (
                  <article
                    key={reward.key}
                    className="rounded-2xl border border-[#d8bd80] bg-white p-5"
                  >
                    <div className="text-4xl">{reward.icon}</div>
                    <h3 className="mt-3 text-xl font-black text-[#123f39]">
                      {reward.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {reward.description}
                    </p>
                    <button
                      type="button"
                      disabled={!reward.unlocked || wasClaimed || Boolean(claiming)}
                      onClick={() => void claim(reward)}
                      className="mt-5 w-full rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white disabled:opacity-40"
                    >
                      {wasClaimed
                        ? "تم استلام الجائزة ✓"
                        : reward.unlocked
                          ? claiming === reward.key
                            ? "جارٍ إضافة الهدية..."
                            : "استلم الجائزة"
                          : "لم تُفتح بعد"}
                    </button>
                  </article>
                );
              })}
            </div>

            {claimMessage ? (
              <div className="mt-4 rounded-xl bg-white p-3 font-bold text-[#123f39]">
                {claimMessage}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-[2rem] border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[#123f39]">الشهادات</h2>
          <p className="mt-2 leading-7 text-slate-600">
            الاسم مأخوذ من حسابك افتراضيًا. اكتب اسمك الحقيقي كما تريد ظهوره
            على الشهادة؛ هذا لا يغيّر اسم الحساب.
          </p>

          <label className="mt-5 block max-w-xl">
            <span className="mb-2 block text-sm font-black text-[#123f39]">
              الاسم الحقيقي على الشهادة
            </span>
            <input
              aria-label="الاسم الحقيقي على الشهادة"
              value={certificateName}
              onChange={(event) => setCertificateName(event.target.value)}
              className="w-full rounded-2xl border border-[#d7c59f] px-4 py-3 text-lg font-bold"
            />
          </label>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <article
                key={certificate.key}
                className={`rounded-2xl border p-5 ${
                  certificate.unlocked
                    ? "border-[#c69a45] bg-[#fffaf0]"
                    : "border-slate-200 bg-slate-50 opacity-60"
                }`}
              >
                <div className="text-4xl">🎓</div>
                <h3 className="mt-3 text-xl font-black text-[#123f39]">
                  {certificate.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {certificate.subtitle}
                </p>
                <p className="mt-2 text-xs font-bold text-[#9b7128]">
                  {certificate.detail}
                </p>
                <button
                  type="button"
                  disabled={!certificate.unlocked}
                  onClick={() => void downloadCertificate(certificate)}
                  className="mt-4 w-full rounded-xl bg-[#b9822d] px-4 py-3 font-black text-white disabled:opacity-35"
                >
                  {certificate.unlocked
                    ? "تنزيل الشهادة PDF"
                    : "أكمل الشرط لفتح الشهادة"}
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 text-center shadow-sm">
      <div className="text-xs font-black text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-[#123f39]">{value}</div>
    </div>
  );
}
