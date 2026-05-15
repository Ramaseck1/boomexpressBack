// services/pushService.ts (backend) — REMPLACER la fonction envoyerPushNotification
interface ExpoPushResponse {
  data?: {
    status:  "ok" | "error";
    message?: string;
    details?: object;
  };
  errors?: { code: string; message: string }[];
}

export const envoyerPushNotification = async (
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
) => {
  if (!pushToken?.startsWith("ExponentPushToken")) {
    console.warn("⚠️ Token invalide:", pushToken);
    return;
  }

  const message = {
    to:         pushToken,
    title,
    body,
    data,
    sound:      "alarm",
    priority:   "high",
    channelId:  "missions",
    badge:      1,
    ttl:        300,
    expiration: Math.floor(Date.now() / 1000) + 300,
  };

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method:  "POST",
      headers: {
        "Accept":       "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await res.json() as ExpoPushResponse;

    if (result.errors?.length) {
      console.error("❌ Expo Push errors:", result.errors);
      return;
    }

    if (result.data?.status === "error") {
      console.error("❌ Expo Push error:", result.data.message);
    } else {
      console.log("✅ Push envoyé:", result.data?.status);
    }
  } catch (err) {
    console.error("❌ Erreur envoi push:", err);
  }
};