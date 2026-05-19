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

import axios from "axios";

const GOOGLE_TTS_KEY  = process.env.GOOGLE_TTS_API_KEY!;
const GOOGLE_TTS_BASE = "https://texttospeech.googleapis.com/v1/text:synthesize";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TTSOptions {
  texte: string;
  vitesse?: number;   // 0.25 – 4.0  (défaut 0.9 pour navigation)
  tonalite?: number;  // -20 – 20 demi-tons (défaut 0)
}

export interface TTSResult {
  audioBase64: string;   // mp3 en base64 → expo-av peut jouer directement
  dureeEstimeeMs: number;
}

// ─── Voix disponibles (fr-FR) ─────────────────────────────────────────────────
// Studio = qualité humaine (facturation plus élevée)
// Wavenet = qualité pro (recommandé pour navigation)
// Standard = basique mais gratuit
//
// Recommandation : Wavenet D (voix masculine) ou C (féminine)

export type VoixFR =
  | "fr-FR-Studio-A"      // Studio — femme (meilleure qualité)
  | "fr-FR-Studio-D"      // Studio — homme
  | "fr-FR-Wavenet-A"     // Wavenet — femme
  | "fr-FR-Wavenet-B"     // Wavenet — homme
  | "fr-FR-Wavenet-C"     // Wavenet — femme
  | "fr-FR-Wavenet-D"     // Wavenet — homme (recommandé navigation)
  | "fr-FR-Wavenet-E"     // Wavenet — femme
  | "fr-FR-Standard-A"    // Standard — femme (gratuit)
  | "fr-FR-Standard-B"    // Standard — homme (gratuit)
  | "fr-FR-Standard-C";   // Standard — femme (gratuit)

// Voix par défaut — Wavenet D (homme, claire pour navigation)
const VOIX_PAR_DEFAUT: VoixFR = "fr-FR-Wavenet-D";

// ─── Génération TTS ───────────────────────────────────────────────────────────

export const genererAudioNavigation = async (
  options: TTSOptions,
  voix: VoixFR = VOIX_PAR_DEFAUT
): Promise<TTSResult> => {
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
      effectsProfileId: ["handset-class-device"],  // Optimisé pour haut-parleur téléphone
    },
  };

  try {
    const { data } = await axios.post(
      `${GOOGLE_TTS_BASE}?key=${GOOGLE_TTS_KEY}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

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

  } catch (err: any) {
    const errGoogle = err?.response?.data?.error;
    if (errGoogle) {
      console.error("❌ Google TTS API error:", errGoogle);
      throw new Error(`Google TTS : ${errGoogle.message} (code ${errGoogle.code})`);
    }
    throw err;
  }
};

// ─── Instructions navigation pré-formatées ───────────────────────────────────
// Génère l'instruction vocale complète avec la distance

export const genererInstructionVocale = async (
  instruction: string,
  distanceMetres?: number,
  voix: VoixFR = VOIX_PAR_DEFAUT
): Promise<TTSResult> => {
  let texteVocal: string;

  if (!distanceMetres || distanceMetres < 50) {
    // Immédiat
    texteVocal = instruction;
  } else if (distanceMetres < 200) {
    texteVocal = `Dans ${Math.round(distanceMetres)} mètres, ${instruction.toLowerCase()}`;
  } else if (distanceMetres < 1000) {
    texteVocal = `Dans ${Math.round(distanceMetres)} mètres, ${instruction.toLowerCase()}`;
  } else {
    const km = (distanceMetres / 1000).toFixed(1);
    texteVocal = `Dans ${km} kilomètres, ${instruction.toLowerCase()}`;
  }

  return genererAudioNavigation({ texte: texteVocal }, voix);
};