"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCNI = exports.validateCNIFromText = exports.isAdult = exports.extractCNIData = void 0;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const CNI_REQUIRED_KEYWORDS = [
    "SENEGAL",
    "REPUBLIQUE",
    "NATIONALITE",
    "NOM",
    "PRENOM",
    "NAISSANCE",
];
const CNI_BONUS_KEYWORDS = [
    "CARTE",
    "IDENTITE",
    "NATIONALE",
    "LIEU",
    "SEXE",
    "TAILLE",
    "SIGNATURE",
    "VALABLE",
    "DELIVREE",
];
// 🔥 un peu plus tolérant (important)
const MIN_REQUIRED_SCORE = 2;
const MIN_BONUS_SCORE = 0;
// ─────────────────────────────────────────────
// 🔥 OCR BASE64
// ─────────────────────────────────────────────
const extractTextFromBase64 = async (base64) => {
    try {
        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        const result = await tesseract_js_1.default.recognize(buffer, "fra", {
            logger: () => { },
        });
        return result.data.text || "";
    }
    catch (e) {
        console.log("❌ OCR ERROR:", e);
        throw new Error("Erreur OCR lors de la lecture de l'image");
    }
};
// ─────────────────────────────────────────────
// NORMALIZE
// ─────────────────────────────────────────────
const normalize = (s) => s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
// ─────────────────────────────────────────────
// EXTRACTION DATA
// ─────────────────────────────────────────────
const extractCNIData = (text) => {
    const clean = text.toUpperCase();
    const nomMatch = clean.match(/NOM[:\s]+([A-ZÀÂÇÉÈÊËÎÏÔÙÛÜŸ\-]+)/);
    const prenomMatch = clean.match(/PR[EÉ]NOM[:\s]+([A-ZÀÂÇÉÈÊËÎÏÔÙÛÜŸ\-\s]+)/);
    const dateMatch = clean.match(/(\d{2}[\/\-\s]\d{2}[\/\-\s]\d{4})/);
    return {
        nom: nomMatch ? nomMatch[1].trim() : null,
        prenom: prenomMatch ? prenomMatch[1].trim().split("\n")[0] : null,
        dateNaissance: dateMatch
            ? dateMatch[1].replace(/\s/g, "/")
            : null,
    };
};
exports.extractCNIData = extractCNIData;
// ─────────────────────────────────────────────
// AGE CHECK
// ─────────────────────────────────────────────
const isAdult = (dateStr) => {
    const [day, month, year] = dateStr.split(/[\/\-]/);
    const birth = new Date(`${year}-${month}-${day}`);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age >= 18;
};
exports.isAdult = isAdult;
// ─────────────────────────────────────────────
// VALIDATION CNI
// ─────────────────────────────────────────────
const validateCNIFromText = (rectoText, versoText) => {
    const fullText = (rectoText + " " + versoText).toUpperCase();
    const normalizedText = normalize(fullText);
    const foundKeywords = [];
    const missingKeywords = [];
    for (const kw of CNI_REQUIRED_KEYWORDS) {
        if (normalizedText.includes(normalize(kw))) {
            foundKeywords.push(kw);
        }
        else {
            missingKeywords.push(kw);
        }
    }
    const foundBonus = CNI_BONUS_KEYWORDS.filter((kw) => normalizedText.includes(normalize(kw)));
    const score = foundKeywords.length;
    const bonusScore = foundBonus.length;
    const isValid = score >= MIN_REQUIRED_SCORE && bonusScore >= MIN_BONUS_SCORE;
    return {
        isValid,
        score,
        bonusScore,
        foundKeywords,
        missingKeywords,
        extractedData: (0, exports.extractCNIData)(fullText),
        rawText: fullText,
    };
};
exports.validateCNIFromText = validateCNIFromText;
// ─────────────────────────────────────────────
// 🔥 PROCESS GLOBAL
// ─────────────────────────────────────────────
const processCNI = async (cniRectoBase64, cniVersoBase64) => {
    let rectoText = "";
    let versoText = "";
    try {
        rectoText = await extractTextFromBase64(cniRectoBase64);
    }
    catch {
        throw new Error("Impossible de lire le recto de la CNI");
    }
    try {
        versoText = await extractTextFromBase64(cniVersoBase64);
    }
    catch {
        throw new Error("Impossible de lire le verso de la CNI");
    }
    console.log("📄 RECTO TEXT:", rectoText);
    console.log("📄 VERSO TEXT:", versoText);
    const validation = (0, exports.validateCNIFromText)(rectoText, versoText);
    console.log("🔍 VALIDATION:", validation);
    if (!validation.isValid) {
        throw new Error(`CNI non valide (${validation.score}/6 mots détectés)`);
    }
    const { nom, prenom, dateNaissance } = validation.extractedData;
    if (!dateNaissance) {
        throw new Error("Date de naissance introuvable sur la CNI");
    }
    return {
        nom,
        prenom,
        dateNaissance,
        isAdult: (0, exports.isAdult)(dateNaissance),
    };
};
exports.processCNI = processCNI;
