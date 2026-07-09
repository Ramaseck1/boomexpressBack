"use strict";
// routes/client.ts
// NOUVELLES ROUTES — dédiées au client. Fichier additif.
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientController_1 = require("../controllers/clientController");
const authMiddleware_1 = require("../middleware/authMiddleware"); // middleware existant, réutilisé tel quel
const router = (0, express_1.Router)();
// 🔐 AUTH (email optionnel à l'inscription)
router.post("/register" /* authLimiter */, clientController_1.registerClient);
router.post("/login", /* authLimiter */ clientController_1.loginClient);
// 🔑 Mot de passe oublié : réutilise les 3 routes déjà existantes dans /auth,
// elles fonctionnent nativement pour un client car elles cherchent l'utilisateur
// par téléphone OU email, indépendamment du rôle :
//   POST /auth/password-reset/request   { identifier }
//   POST /auth/password-reset/verify    { identifier, code }
//   POST /auth/password-reset/confirm   { identifier, newPassword, confirmPassword }
// 👤 PROFIL
router.get("/me", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.getProfilClient);
router.put("/me", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.updateProfilClient);
router.post("/me/localisation", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.updateLocalisationClient);
router.post("/me/push-token", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.savePushTokenClient);
router.get("/adresses/recherche", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.rechercherAdresses);
router.get("/adresses/resoudre/:placeId", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.resoudreAdresse);
// 📦 COMMANDES
router.post("/commandes", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.creerCommande);
router.get("/commandes", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.listerCommandesClient);
router.get("/commandes/:commandeId", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.suivreCommande);
router.post("/commandes/annuler", (0, authMiddleware_1.authenticate)(["CLIENT"]), clientController_1.annulerCommandeClient);
exports.default = router;
