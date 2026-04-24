"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// routes/livreurRoutes.ts
const express_1 = require("express");
const controller = __importStar(require("../controllers/livreurController"));
const navController = __importStar(require("../controllers/navigationController")); // 🗺️ Navigation
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorizeLivreur_1 = require("../middleware/authorizeLivreur");
const router = (0, express_1.Router)();
// ✅ Middleware global
router.use((0, authMiddleware_1.authenticate)(["LIVREUR"]));
router.use(authorizeLivreur_1.authorizeLivreur);
// ──────────────────────────────────────────────
// 👤 Profil
// ──────────────────────────────────────────────
router.get("/profil", controller.getProfil);
// ──────────────────────────────────────────────
// 🟢 Disponibilité
// ──────────────────────────────────────────────
router.put("/disponibilite", controller.toggleDisponibilite);
// ──────────────────────────────────────────────
// 📦 Missions
// ──────────────────────────────────────────────
router.get("/missions", controller.getMissions);
router.post("/missions/accepter", controller.accepterMission);
// ──────────────────────────────────────────────
// 🗺️ Navigation Mapbox (lié aux livraisons)
// ──────────────────────────────────────────────
// 1️⃣ Démarre la navigation après avoir accepté une mission
//    POST /livreurs/navigation/demarrer
//    Body: { livraisonId: number, lat: number, lng: number }
//    → Géocode l'adresse, calcule la route + ETA, retourne le tracé GeoJSON
router.post("/navigation/demarrer", navController.demarrerNavigation);
router.post("/livraison/demarrer", controller.demarrerLivraison);
// 2️⃣ Prochaine instruction turn-by-turn (appelé en continu par l'app mobile)
//    GET /livreurs/navigation/:livraisonId/instruction?lat=14.69&lng=-17.44
//    → "Dans 200 mètres, tournez à gauche" + instructionVocale
router.get("/navigation/:livraisonId/instruction", navController.getInstruction);
// 3️⃣ ETA mis à jour avec le trafic en temps réel
//    GET /livreurs/navigation/:livraisonId/eta?lat=14.69&lng=-17.44
//    → { eta, distanceRestanteMetres, congestionsDetectees }
router.get("/navigation/:livraisonId/eta", navController.getETA);
// 4️⃣ Géocodage d'une adresse → coordonnées GPS
//    GET /livreurs/navigation/geocode?adresse=12 Rue Moussa, Dakar
router.get("/navigation/geocode", navController.geocoder);
// ──────────────────────────────────────────────
// 🚚 Livraison
// ──────────────────────────────────────────────
router.post("/livraison/confirmer", controller.confirmerLivraison);
router.post("/missions/annuler", controller.annulerMission);
// ──────────────────────────────────────────────
// 📊 Historique & 💰 Revenus
// ──────────────────────────────────────────────
router.get("/historique", controller.historique);
router.get("/revenus", controller.revenus);
router.get("/revenus/jour", controller.revenusJour);
router.get("/paiements/historique", controller.getHistoriquePaiements);
router.get("/revenus/jour", controller.revenusJour);
router.get("/paiements/historique", controller.getHistoriquePaiements); // ✅
router.get("/commissions/historique", controller.historiqueCommissions); // ✅ manquait
// ──────────────────────────────────────────────
// 🔐 Admin
// ──────────────────────────────────────────────
router.get("/", controller.getLivreurs);
exports.default = router;
