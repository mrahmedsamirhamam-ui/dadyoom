"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type TapToken = {
  id?: string;
  card?: {
    brand?: string;
  };
};

type CardSdk = {
  renderTapCard: (
    elementId: string,
    config: Record<
      string,
      unknown
    >,
  ) => {
    unmount?: () => void;
  };
  tokenize: () => void;
  Theme: Record<
    string,
    string
  >;
  Currencies: Record<
    string,
    string
  >;
  Direction: Record<
    string,
    string
  >;
  Edges: Record<
    string,
    string
  >;
  Locale: Record<
    string,
    string
  >;
};

declare global {
  interface Window {
    CardSDK?: CardSdk;
  }
}

type Config = {
  publicKey: string;
  merchantId: string;
  amount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
  };
};

export default function TapCardCheckout({
  kind,
  courseId,
}: {
  kind: "plus" | "course";
  courseId?: string;
}) {
  const [
    scriptReady,
    setScriptReady,
  ] =
    useState(false);

  const [
    config,
    setConfig,
  ] =
    useState<Config | null>(
      null,
    );

  const [
    ready,
    setReady,
  ] =
    useState(false);

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const unmountRef =
    useRef<
      (() => void) | null
    >(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const response =
          await fetch(
            "/api/payments/tap/config",
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  kind,
                  courseId,
                }),
            },
          );

        const payload =
          (await response.json()) as
            Config & {
              error?: string;
            };

        if (!response.ok) {
          throw new Error(
            payload.error ||
              "تعذر تجهيز الدفع.",
          );
        }

        if (!cancelled) {
          setConfig(
            payload,
          );
        }
      }
      catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof
              Error
              ? error.message
              : "تعذر تجهيز الدفع.",
          );
        }
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [
    kind,
    courseId,
  ]);

  const submitToken =
    useCallback(
      async (
        token: TapToken,
      ) => {
        try {
          const tokenId =
            String(
              token.id ?? "",
            ).trim();

          const brand =
            String(
              token.card
                ?.brand ??
                "",
            )
              .trim()
              .toUpperCase();

          if (
            !tokenId.startsWith(
              "tok_",
            )
          ) {
            throw new Error(
              "لم يتم إنشاء رمز دفع صالح.",
            );
          }

          if (
            brand &&
            brand !== "VISA" &&
            brand !==
              "MASTERCARD"
          ) {
            throw new Error(
              "ضاديوم يقبل Visa وMastercard فقط.",
            );
          }

          const response =
            await fetch(
              "/api/payments/tap/create",
              {
                method:
                  "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    kind,
                    courseId,
                    tokenId,
                  }),
              },
            );

          const payload =
            (await response.json()) as {
              paymentUrl?: string;
              error?: string;
            };

          if (
            !response.ok ||
            !payload.paymentUrl
          ) {
            throw new Error(
              payload.error ||
                "تعذر بدء عملية الدفع.",
            );
          }

          window.location.href =
            payload.paymentUrl;
        }
        catch (error) {
          setBusy(false);

          setMessage(
            error instanceof
              Error
              ? error.message
              : "تعذر بدء عملية الدفع.",
          );
        }
      },
      [
        kind,
        courseId,
      ],
    );

  useEffect(() => {
    if (
      !scriptReady ||
      !config ||
      !window.CardSDK
    ) {
      return;
    }

    const sdk =
      window.CardSDK;

    const names =
      config.customer.name
        .trim()
        .split(/\s+/u)
        .filter(Boolean);

    const first =
      names[0] ||
      "Dadyoom";

    const last =
      names
        .slice(1)
        .join(" ") ||
      "Customer";

    const mounted =
      sdk.renderTapCard(
        "dadyoom-card-sdk",
        {
          publicKey:
            config.publicKey,
          merchant: {
            id:
              config.merchantId,
          },
          transaction: {
            amount:
              config.amount,
            currency:
              sdk.Currencies?.[
                config.currency
              ] ??
              config.currency,
          },
          customer: {
            name: [
              {
                lang:
                  sdk.Locale
                    ?.EN ??
                  "EN",
                first,
                last,
                middle: "",
              },
            ],
            nameOnCard:
              config.customer
                .name ||
              `${first} ${last}`,
            editable: true,
            contact: {
              email:
                config.customer
                  .email ||
                undefined,
            },
          },
          acceptance: {
            supportedBrands: [
              "VISA",
              "MASTERCARD",
            ],
            supportedCards:
              "ALL",
          },
          fields: {
            cardHolder: true,
          },
          addons: {
            displayPaymentBrands:
              true,
            loader: true,
            saveCard: false,
          },
          interface: {
            locale:
              sdk.Locale
                ?.EN ??
              "EN",
            theme:
              sdk.Theme
                ?.LIGHT ??
              "LIGHT",
            edges:
              sdk.Edges
                ?.CURVED ??
              "CURVED",
            direction:
              sdk.Direction
                ?.LTR ??
              "LTR",
          },
          onReady:
            () =>
              setReady(
                true,
              ),
          onError:
            () => {
              setBusy(
                false,
              );

              setMessage(
                "تعذر قراءة بيانات البطاقة. حاول مرة أخرى.",
              );
            },
          onSuccess:
            (
              token:
                unknown,
            ) => {
              void submitToken(
                token as TapToken,
              );
            },
        },
      );

    unmountRef.current =
      mounted?.unmount ??
      null;

    return () => {
      unmountRef.current?.();
      unmountRef.current =
        null;
    };
  }, [
    scriptReady,
    config,
    submitToken,
  ]);

  function pay() {
    if (
      !ready ||
      !window.CardSDK ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setMessage("");
    window.CardSDK.tokenize();
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://tap-sdks.b-cdn.net/card/1.0.2/index.js"
        strategy="afterInteractive"
        onReady={() =>
          setScriptReady(
            true,
          )
        }
        onError={() =>
          setMessage(
            "تعذر تحميل بوابة البطاقة الآمنة.",
          )
        }
      />

      <div className="rounded-2xl border bg-white p-3">
        <div id="dadyoom-card-sdk" />
      </div>

      <button
        type="button"
        onClick={pay}
        disabled={
          !ready ||
          busy
        }
        className="dadyoom-arabic-button w-full touch-manipulation rounded-2xl px-5 py-3 font-black text-white disabled:opacity-50"
      >
        {busy
          ? "جارٍ تأمين العملية..."
          : "الدفع بـ Visa أو Mastercard"}
      </button>

      <p className="text-xs leading-6 text-slate-500">
        بيانات البطاقة تُرمّز
        داخل Tap ولا تُحفظ في
        ضاديوم. لا PayPal ولا
        تحويل بنكي مباشر.
      </p>

      {message ? (
        <div className="rounded-xl bg-[#fff6df] p-3 text-sm font-bold">
          {message}
        </div>
      ) : null}
    </div>
  );
}
