"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type PaddleConfig = {
  clientToken: string;
  environment: "sandbox" | "production";
  priceId: string;
  userId: string;
  email: string;
  successUrl: string;
};

type PaddleGlobal = {
  Environment?: {
    set: (environment: "sandbox") => void;
  };
  Initialize: (config: {
    token: string;
  }) => void;
  Checkout: {
    open: (config: {
      items: Array<{
        priceId: string;
        quantity: number;
      }>;
      customer?: {
        email?: string;
      };
      customData: Record<string, string>;
      settings: {
        displayMode: "overlay";
        variant: "one-page";
        theme: "light";
        locale: "ar";
        allowedPaymentMethods: ["card"];
        allowLogout: boolean;
        successUrl: string;
      };
    }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

export default function PaddleCheckout() {
  const [scriptReady, setScriptReady] = useState(false);
  const [config, setConfig] = useState<PaddleConfig | null>(null);
const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/payments/paddle/config", {
      method: "POST",
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json()) as PaddleConfig & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error ?? "تعذر تجهيز الدفع.",
          );
        }

        if (!cancelled) {
          setConfig(payload);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "تعذر تجهيز الدفع.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      !scriptReady ||
      !config ||
      !window.Paddle ||
      initializedRef.current
    ) {
      return;
    }

    if (config.environment === "sandbox") {
      window.Paddle.Environment?.set("sandbox");
    }

    window.Paddle.Initialize({
      token: config.clientToken,
    });

    initializedRef.current = true;
  }, [scriptReady, config]);

  function pay() {
    if (
      !config ||
      !initializedRef.current ||
      !window.Paddle ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      window.Paddle.Checkout.open({
        items: [
          {
            priceId: config.priceId,
            quantity: 1,
          },
        ],
        customer: config.email
          ? {
              email: config.email,
            }
          : undefined,
        customData: {
          dadyoom_user_id: config.userId,
          dadyoom_plan_id: "plus",
        },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          theme: "light",
          locale: "ar",
          allowedPaymentMethods: ["card"],
          allowLogout: false,
          successUrl: config.successUrl,
        },
      });

      setBusy(false);
    } catch (error) {
      setBusy(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر فتح صفحة الدفع.",
      );
    }
  }

  return (
    <div className="space-y-3">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() =>
          setMessage("تعذر تحميل بوابة الدفع الآمنة.")
        }
      />

      <button
        type="button"
        onClick={pay}
        disabled={!scriptReady || !config || busy}
        className="dadyoom-arabic-button w-full rounded-2xl px-5 py-3 font-black text-white disabled:opacity-50"
      >
        {busy
          ? "جارٍ فتح الدفع..."
          : "اشترك شهريًا بالبطاقة — 10 USD"}
      </button>

      <p className="text-xs leading-6 text-slate-500">
        الدفع بالبطاقة فقط عبر Paddle. ضاديوم لا يستقبل
        أو يخزن بيانات البطاقة.
      </p>

      {message ? (
        <div className="rounded-xl bg-[#fff6df] p-3 text-sm font-bold">
          {message}
        </div>
      ) : null}
    </div>
  );
}
