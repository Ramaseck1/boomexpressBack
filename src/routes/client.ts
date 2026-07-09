// routes/client.ts
// NOUVELLES ROUTES — dédiées au client. Fichier additif.

import { Router } from "express";
import {
  registerClient,
  loginClient,
  getProfilClient,
  updateProfilClient,
  updateLocalisationClient,
  savePushTokenClient,
  creerCommande,
  listerCommandesClient,
  suivreCommande,
  annulerCommandeClient,
} from "../controllers/clientController";
import { authenticate } from "../middleware/authMiddleware"; // middleware existant, réutilisé tel quel
/* import { authLimiter, commandeLimiter } from "../middleware/security";
 */
const router = Router();

// 🔐 AUTH (email optionnel à l'inscription)
router.post("/register" /* authLimiter */, registerClient);
router.post("/login", /* authLimiter */ loginClient);

// 🔑 Mot de passe oublié : réutilise les 3 routes déjà existantes dans /auth,
// elles fonctionnent nativement pour un client car elles cherchent l'utilisateur
// par téléphone OU email, indépendamment du rôle :
//   POST /auth/password-reset/request   { identifier }
//   POST /auth/password-reset/verify    { identifier, code }
//   POST /auth/password-reset/confirm   { identifier, newPassword, confirmPassword }

// 👤 PROFIL
router.get("/me", authenticate(["CLIENT"]), getProfilClient);
router.put("/me", authenticate(["CLIENT"]), updateProfilClient);
router.post("/me/localisation", authenticate(["CLIENT"]), updateLocalisationClient);
router.post("/me/push-token", authenticate(["CLIENT"]), savePushTokenClient);

// 📦 COMMANDES
router.post("/commandes", authenticate(["CLIENT"]), creerCommande);
router.get("/commandes", authenticate(["CLIENT"]), listerCommandesClient);
router.get("/commandes/:commandeId", authenticate(["CLIENT"]), suivreCommande);
router.post("/commandes/annuler", authenticate(["CLIENT"]), annulerCommandeClient);

export default router;
