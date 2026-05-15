"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerPushNotification = void 0;
const axios_1 = __importDefault(require("axios"));
const envoyerPushNotification = async (pushToken, titre, corps, data) => {
    if (!pushToken || !pushToken.startsWith("ExponentPushToken"))
        return;
    try {
        await axios_1.default.post("https://exp.host/--/api/v2/push/send", {
            to: pushToken,
            title: titre,
            body: corps,
            sound: "default",
            priority: "high",
            data: data ?? {},
            badge: 1,
        }, {
            headers: { "Content-Type": "application/json" },
        });
        console.log("✅ Push envoyé à:", pushToken);
    }
    catch (e) {
        console.error("❌ Push failed:", e.message);
    }
};
exports.envoyerPushNotification = envoyerPushNotification;
