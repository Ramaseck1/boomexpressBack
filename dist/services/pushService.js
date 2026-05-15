"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerPushNotification = void 0;
const envoyerPushNotification = async (pushToken, title, body, data = {}) => {
    if (!pushToken?.startsWith("ExponentPushToken")) {
        console.warn("⚠️ Token invalide:", pushToken);
        return;
    }
    const message = {
        to: pushToken,
        title,
        body,
        data,
        sound: "alarm",
        priority: "high",
        channelId: "missions",
        badge: 1,
        ttl: 300,
        expiration: Math.floor(Date.now() / 1000) + 300,
    };
    try {
        const res = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });
        const result = await res.json();
        if (result.errors?.length) {
            console.error("❌ Expo Push errors:", result.errors);
            return;
        }
        if (result.data?.status === "error") {
            console.error("❌ Expo Push error:", result.data.message);
        }
        else {
            console.log("✅ Push envoyé:", result.data?.status);
        }
    }
    catch (err) {
        console.error("❌ Erreur envoi push:", err);
    }
};
exports.envoyerPushNotification = envoyerPushNotification;
