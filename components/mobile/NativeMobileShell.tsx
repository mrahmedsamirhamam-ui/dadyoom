"use client";

import { Capacitor } from "@capacitor/core";
import Link from "next/link";
import {
  useEffect,
  useSyncExternalStore,
} from "react";

const items = [
  ["/", "⌂", "الرئيسية"],
  ["/courses", "▤", "الدروس"],
  ["/skills", "✦", "المهارات"],
  ["/ask", "◉", "ضاد"],
  ["/login", "♙", "الحساب"],
] as const;

function subscribe() {
  return () => {};
}

function getNativeSnapshot() {
  return Capacitor.isNativePlatform();
}

function getServerSnapshot() {
  return false;
}

export default function NativeMobileShell() {
  const native =
    useSyncExternalStore(
      subscribe,
      getNativeSnapshot,
      getServerSnapshot,
    );

  useEffect(() => {
    if (!native) {
      return;
    }

    const html =
      document.documentElement;
    const body =
      document.body;

    html.classList.add(
      "dadyoom-native-app",
    );
    body.classList.add(
      "dadyoom-native-body",
    );

    return () => {
      html.classList.remove(
        "dadyoom-native-app",
      );
      body.classList.remove(
        "dadyoom-native-body",
      );
    };
  }, [native]);

  if (!native) {
    return null;
  }

  return (
    <nav
      className="dadyoom-native-bottom-nav"
      aria-label="التنقل في تطبيق ضاديوم"
    >
      {items.map(
        ([href, icon, label]) => (
          <Link
            key={href}
            href={href}
            className="dadyoom-native-nav-item"
          >
            <span
              aria-hidden="true"
              className="text-xl"
            >
              {icon}
            </span>
            <span>{label}</span>
          </Link>
        ),
      )}
    </nav>
  );
}
