"use strict";
// utils/validators.ts
// Validation stricte des entrées utilisateur — défense en profondeur contre
// injections, abus de formulaire, et données corrompues, en complément du
// fait que Prisma paramètre déjà toutes les requêtes (protection SQLi de base).
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeText = exports.isValidId = exports.isValidLng = exports.isValidLat = exports.isNonEmptyString = exports.isStrongPassword = exports.isValidEmail = exports.isValidTelephoneSN = void 0;
const isValidTelephoneSN = (t) => typeof t === "string" && /^(\+221)?7[05-8]\d{7}$/.test(t.trim());
exports.isValidTelephoneSN = isValidTelephoneSN;
const isValidEmail = (e) => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) && e.length <= 254;
exports.isValidEmail = isValidEmail;
const isStrongPassword = (p) => typeof p === "string" && p.length >= 6 && p.length <= 72;
exports.isStrongPassword = isStrongPassword;
const isNonEmptyString = (s, maxLen = 255) => typeof s === "string" && s.trim().length > 0 && s.trim().length <= maxLen;
exports.isNonEmptyString = isNonEmptyString;
const isValidLat = (v) => typeof v === "number" && Number.isFinite(v) && v >= -90 && v <= 90;
exports.isValidLat = isValidLat;
const isValidLng = (v) => typeof v === "number" && Number.isFinite(v) && v >= -180 && v <= 180;
exports.isValidLng = isValidLng;
const isValidId = (v) => (typeof v === "number" && Number.isInteger(v) && v > 0) ||
    (typeof v === "string" && /^\d+$/.test(v));
exports.isValidId = isValidId;
// Nettoie une chaîne libre saisie par l'utilisateur (nom, adresse...) :
// retire les caractères de contrôle et limite la longueur, sans casser les accents.
const sanitizeText = (s, maxLen = 255) => s
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
exports.sanitizeText = sanitizeText;
