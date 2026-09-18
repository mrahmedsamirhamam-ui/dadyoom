"use client";

import {
  Capacitor,
} from "@capacitor/core";
import {
  LocalNotifications,
} from "@capacitor/local-notifications";

const REMINDER_ID = 7011;

export function isNativeDadyoomApp() {
  return Capacitor.isNativePlatform();
}

export async function scheduleDailyLearningReminder(
  hour: number,
  minute: number,
) {
  const value =
    `${String(hour).padStart(2, "0")}:${String(
      minute,
    ).padStart(2, "0")}`;

  window.localStorage.setItem(
    "dadyoom-reminder-time",
    value,
  );

  if (
    !Capacitor.isNativePlatform()
  ) {
    return {
      native: false,
      scheduled: false,
      message:
        "تم حفظ الوقت للويب. الإشعار اليومي الحقيقي يعمل داخل تطبيق ضاديوم على Android وiPhone.",
    };
  }

  const current =
    await LocalNotifications.checkPermissions();

  if (
    current.display !==
    "granted"
  ) {
    const requested =
      await LocalNotifications.requestPermissions();

    if (
      requested.display !==
      "granted"
    ) {
      return {
        native: true,
        scheduled: false,
        message:
          "لم يتم منح إذن الإشعارات.",
      };
    }
  }

  await LocalNotifications.cancel({
    notifications: [
      {
        id: REMINDER_ID,
      },
    ],
  });

  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title:
          "ضاديوم مستنيك",
        body:
          "دقائق قليلة اليوم تكمل رحلتك في العربية.",
        schedule: {
          on: {
            hour,
            minute,
          },
          repeats: true,
          allowWhileIdle:
            true,
        },
        extra: {
          path:
            "/student",
        },
      },
    ],
  });

  return {
    native: true,
    scheduled: true,
    message:
      "تم تفعيل تذكير التعلم اليومي.",
  };
}

export async function cancelDailyLearningReminder() {
  if (
    Capacitor.isNativePlatform()
  ) {
    await LocalNotifications.cancel({
      notifications: [
        {
          id: REMINDER_ID,
        },
      ],
    });
  }

  window.localStorage.removeItem(
    "dadyoom-reminder-time",
  );
}

export async function installReminderActionListener() {
  if (
    !Capacitor.isNativePlatform()
  ) {
    return () => undefined;
  }

  const handle =
    await LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        const path =
          String(
            event.notification.extra
              ?.path ??
              "/student",
          );

        window.location.assign(
          path,
        );
      },
    );

  return () => {
    void handle.remove();
  };
}
