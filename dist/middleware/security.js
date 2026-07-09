"use strict";
// middleware/security.ts
// Rate limiting ciblé — protège /register, /login et le reset de mot de passe
// contre le brute-force et le spam, et /commandes contre les commandes en rafale.
//
// npm i express-rate-limit helmet
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandeLimiter = exports.resetCodeLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10, // 10 tentatives / IP / 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de tentatives. Réessayez dans quelques minutes." },
});
exports.resetCodeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5, // limite la génération/vérification de codes à 5 essais / 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de demandes de code. Réessayez dans quelques minutes." },
});
exports.commandeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 min
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de commandes en peu de temps. Patientez un instant." },
});
// À ajouter dans votre fichier serveur principal (app.ts / server.ts) :
//
//   import helmet from "helmet";
//   import cors from "cors";
//   app.use(helmet());
//   app.use(cors({
//     origin: (process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
//     credentials: true,
//   }));
//   app.use(express.json({ limit: "1mb" })); // évite les payloads géants
