"use client";

import {
  useEffect,
  useState,
} from "react";

type Props = {
  challengeId: string;
  skill:
    | "reading"
    | "writing"
    | "listening"
    | "speaking";
  title: string;
  targetScore: number;
  href: string;
};

type ChallengeStatus =
  | "idle"
  | "accepted"
  | "completed";

export default function DailyChallengeActionButton({
  challengeId,
  skill,
  title,
  targetScore,
  href,
}: Props) {

  const [
    status,
    setStatus,
  ] =
    useState<ChallengeStatus>(
      "idle"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    bonusXp,
    setBonusXp,
  ] =
    useState(0);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response =
          await fetch(
            "/api/journey/daily/challenge",
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !active ||
          !response.ok ||
          !data.ok ||
          !data.challenge
        ) {
          return;
        }

        if (
          data.challenge.status ===
          "completed"
        ) {
          setStatus(
            "completed"
          );

          setBonusXp(
            Number(
              data.challenge
                .bonus_xp ??
              0
            )
          );
        }
        else {
          setStatus(
            "accepted"
          );
        }
      }
      catch {
        // UI remains usable.
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  async function acceptChallenge() {

    if (
      status ===
      "completed"
    ) {
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/journey/daily/challenge",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                challengeId,
                skill,
                title,
                targetScore,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
          "تعذر قبول التحدي."
        );
      }

      setStatus(
        "accepted"
      );

      window.location.href =
        href;
    }
    catch (error) {
      console.error(
        "DAILY_CHALLENGE_ACCEPT_CLIENT_FAILED:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "تعذر قبول التحدي."
      );
    }
    finally {
      setLoading(false);
    }
  }

  if (
    status ===
    "completed"
  ) {
    return (
      <div className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-center">
        <p className="font-black text-emerald-800">
          🏆 اكتمل تحدي اليوم
        </p>

        <p className="mt-1 text-sm font-bold text-emerald-700">
          +{bonusXp || 15} XP
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={
        acceptChallenge
      }
      className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 px-7 font-black text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "جارٍ قبول التحدي..."
        : status === "accepted"
          ? "واصل التحدي 🔥"
          : "اقبل التحدي 🔥"}
    </button>
  );
}
