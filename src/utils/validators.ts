// utils/validators.ts
// Validation stricte des entrées utilisateur — défense en profondeur contre
// injections, abus de formulaire, et données corrompues, en complément du
// fait que Prisma paramètre déjà toutes les requêtes (protection SQLi de base).

export const isValidTelephoneSN = (t: unknown): t is string =>
  typeof t === "string" && /^(\+221)?7[05-8]\d{7}$/.test(t.trim());

export const isValidEmail = (e: unknown): e is string =>
  typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) && e.length <= 254;

export const isStrongPassword = (p: unknown): p is string =>
  typeof p === "string" && p.length >= 6 && p.length <= 72;

export const isNonEmptyString = (s: unknown, maxLen = 255): s is string =>
  typeof s === "string" && s.trim().length > 0 && s.trim().length <= maxLen;

export const isValidLat = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= -90 && v <= 90;

export const isValidLng = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= -180 && v <= 180;

export const isValidId = (v: unknown): v is number =>
  (typeof v === "number" && Number.isInteger(v) && v > 0) ||
  (typeof v === "string" && /^\d+$/.test(v));

// Nettoie une chaîne libre saisie par l'utilisateur (nom, adresse...) :
// retire les caractères de contrôle et limite la longueur, sans casser les accents.
export const sanitizeText = (s: string, maxLen = 255): string =>
  s
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
