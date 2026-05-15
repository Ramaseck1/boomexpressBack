import axios from "axios";

export const envoyerPushNotification = async (
  pushToken: string,
  titre: string,
  corps: string,
  data?: Record<string, any>
) => {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;

  try {
    await axios.post("https://exp.host/--/api/v2/push/send", {
      to:       pushToken,
      title:    titre,
      body:     corps,
      sound:    "default",
      priority: "high",
      data:     data ?? {},
      badge:    1,
    }, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("✅ Push envoyé à:", pushToken);
  } catch (e: any) {
    console.error("❌ Push failed:", e.message);
  }
};