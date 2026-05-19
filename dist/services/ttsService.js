"use strict";
// services/ttsService.ts
// 🔊 Google Cloud Text-to-Speech — Voix française fr-FR de qualité Studio
// ─────────────────────────────────────────────────────────────────────────────
// Setup :
//   1. Google Cloud Console → activer "Cloud Text-to-Speech API"
//   2. Créer une clé API ou compte de service → .env : GOOGLE_TTS_API_KEY=AIza...
//   3. npm install @google-cloud/text-to-speech (optionnel, on utilise l'API REST ici)
//
// Endpoint exposé :
//   POST /livreurs/navigation/tts
//   Body: { texte: string }
//   → retourne { audioBase64: string }   (mp3 encodé en base64)
// ─────────────────────────────────────────────────────────────────────────────
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genererInstructionVocale = exports.genererAudioNavigation = void 0;
const axios_1 = __importDefault(require("axios"));
const GOOGLE_TTS_KEY = process.env.GOOGLE_TTS_API_KEY;
const GOOGLE_TTS_BASE = "https://texttospeech.googleapis.com/v1/text:synthesize";
// Voix par défaut — Wavenet D (homme, claire pour navigation)
const VOIX_PAR_DEFAUT = "fr-FR-Wavenet-D";
// ─── Génération TTS ───────────────────────────────────────────────────────────
const genererAudioNavigation = async (options, voix = VOIX_PAR_DEFAUT) => {
    const { texte, vitesse = 0.9, tonalite = 0 } = options;
    if (!texte?.trim()) {
        throw new Error("Texte vide — impossible de générer l'audio");
    }
    if (!GOOGLE_TTS_KEY) {
        throw new Error("GOOGLE_TTS_API_KEY manquant dans .env");
    }
    const payload = {
        input: {
            text: texte,
        },
        voice: {
            languageCode: "fr-FR",
            name: voix,
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: vitesse,
            pitch: tonalite,
            effectsProfileId: ["handset-class-device"], // Optimisé pour haut-parleur téléphone
        },
    };
    try {
        const { data } = await axios_1.default.post(`${GOOGLE_TTS_BASE}?key=${GOOGLE_TTS_KEY}`, payload, { headers: { "Content-Type": "application/json" } });
        if (!data.audioContent) {
            throw new Error("Google TTS : réponse vide (audioContent manquant)");
        }
        // Estimation durée : ~150 mots/min → ~400ms par mot
        const nbMots = texte.split(" ").length;
        const dureeEstimeeMs = Math.round((nbMots / 150) * 60 * 1000 / vitesse);
        console.log(`🔊 TTS généré : "${texte.slice(0, 60)}…" | voix=${voix} | ~${dureeEstimeeMs}ms`);
        return {
            audioBase64: data.audioContent,
            dureeEstimeeMs,
        };
    }
    catch (err) {
        const errGoogle = err?.response?.data?.error;
        if (errGoogle) {
            console.error("❌ Google TTS API error:", errGoogle);
            throw new Error(`Google TTS : ${errGoogle.message} (code ${errGoogle.code})`);
        }
        throw err;
    }
};
exports.genererAudioNavigation = genererAudioNavigation;
// ─── Instructions navigation pré-formatées ───────────────────────────────────
// Génère l'instruction vocale complète avec la distance
const genererInstructionVocale = async (instruction, distanceMetres, voix = VOIX_PAR_DEFAUT) => {
    let texteVocal;
    if (!distanceMetres || distanceMetres < 50) {
        // Immédiat
        texteVocal = instruction;
    }
    else if (distanceMetres < 200) {
        texteVocal = `Dans ${Math.round(distanceMetres)} mètres, ${instruction.toLowerCase()}`;
    }
    else if (distanceMetres < 1000) {
        texteVocal = `Dans ${Math.round(distanceMetres)} mètres, ${instruction.toLowerCase()}`;
    }
    else {
        const km = (distanceMetres / 1000).toFixed(1);
        texteVocal = `Dans ${km} kilomètres, ${instruction.toLowerCase()}`;
    }
    return (0, exports.genererAudioNavigation)({ texte: texteVocal }, voix);
};
exports.genererInstructionVocale = genererInstructionVocale;
