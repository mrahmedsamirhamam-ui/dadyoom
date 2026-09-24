"use client";

import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef } from "react";

import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

const NATIVE_CALLBACK =
  "dadyoom://auth/callback";

const NATIVE_INTENT_KEY =
  "dadyoom_native_oauth_intent";

const destinations:
  Record<string, string> = {
    student: "/student",
  child: "/child",
    teacher: "/teacher",
    parent: "/parent",
    school: "/school",
    admin: "/admin",
  };

type NativeIntent = {
  fullName: string;
  role: string;
  country: string;
};

export default function MobileOAuthBridge() {
  const busyRef =
    useRef(false);
  const lastHandledUrlRef =
    useRef("");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let active = true;

    const handleUrl = (url?: string | null) => {
      if (
        !active ||
        !url ||
        !url.startsWith(
          NATIVE_CALLBACK,
        ) ||
        url ===
          lastHandledUrlRef.current ||
        busyRef.current
      ) {
        return;
      }

      lastHandledUrlRef.current = url;
      busyRef.current = true;

      void finishOAuth(url).finally(
        () => {
          busyRef.current = false;
        },
      );
    };

    const listenerPromise =
      App.addListener(
        "appUrlOpen",
        ({ url }) => {
          handleUrl(url);
        },
      );

    /*
     * appUrlOpen covers the normal background/resume path.
     * getLaunchUrl is required when Android launches Dadyoom from the
     * OAuth deep link while the app process was not already running.
     */
    void App.getLaunchUrl()
      .then((launch) => {
        handleUrl(launch?.url);
      })
      .catch((error) => {
        console.warn(
          "DADYOOM_OAUTH_LAUNCH_URL_WARNING",
          error,
        );
      });

    return () => {
      active = false;

      void listenerPromise.then(
        (listener) =>
          listener.remove(),
      );
    };
  }, []);

  return null;
}

async function finishOAuth(
  callbackUrl: string,
) {
  try {
    await Browser.close();
  } catch {
    // Android may already have closed the browser.
  }

  const parsed =
    new URL(callbackUrl);

  const authError =
    parsed.searchParams.get(
      "error_description",
    ) ||
    parsed.searchParams.get(
      "error",
    );

  if (authError) {
    window.location.replace(
      `/login?error=${encodeURIComponent(
        authError,
      )}`,
    );
    return;
  }

  const code =
    parsed.searchParams.get(
      "code",
    );

  if (!code) {
    window.location.replace(
      "/login?error=oauth_callback",
    );
    return;
  }

  const supabase =
    getSupabaseBrowserClient();

  const {
    error: exchangeError,
  } =
    await supabase.auth
      .exchangeCodeForSession(
        code,
      );

  if (exchangeError) {
    window.location.replace(
      `/login?error=${encodeURIComponent(
        exchangeError.message,
      )}`,
    );
    return;
  }

  const storedIntent =
    window.localStorage.getItem(
      NATIVE_INTENT_KEY,
    );

  if (storedIntent) {
    try {
      const intent =
        JSON.parse(
          storedIntent,
        ) as NativeIntent;

      const profileResponse =
        await fetch(
          "/api/auth/complete-profile",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                intent,
              ),
          },
        );

      const profileData =
        (await profileResponse.json()) as {
          error?: string;
          destination?: string;
        };

      if (!profileResponse.ok) {
        throw new Error(
          profileData.error ||
            "تعذر إكمال ملف الحساب.",
        );
      }

      window.localStorage.removeItem(
        NATIVE_INTENT_KEY,
      );

      window.location.replace(
        profileData.destination ||
          "/student",
      );
      return;
    } catch {
      window.localStorage.removeItem(
        NATIVE_INTENT_KEY,
      );
      window.location.replace(
        "/onboarding",
      );
      return;
    }
  }

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    window.location.replace(
      "/login?error=oauth_user",
    );
    return;
  }

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  const role =
    typeof profile?.role ===
    "string"
      ? profile.role
          .trim()
          .toLowerCase()
      : "";

  if (!role) {
    window.location.replace(
      "/onboarding",
    );
    return;
  }

  window.location.replace(
    destinations[role] ||
      "/student",
  );
}
