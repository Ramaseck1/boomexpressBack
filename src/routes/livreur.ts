// routes/livreurRoutes.ts
import { Router } from "express";
import * as controller from "../controllers/livreurController";
import * as navController from "../controllers/navigationController"; // 🗺️ Navigation
import { authenticate } from "../middleware/authMiddleware";
import { authorizeLivreur } from "../middleware/authorizeLivreur";
import * as services from "../services/livreurService";

const router = Router();

// ✅ Middleware global
router.use(authenticate(["LIVREUR"]));
router.use(authorizeLivreur);

// ──────────────────────────────────────────────
// 👤 Profil
// ──────────────────────────────────────────────
router.get("/profil", controller.getProfil);

// ──────────────────────────────────────────────
// 🟢 Disponibilité
// ──────────────────────────────────────────────
router.put("/disponibilite", controller.toggleDisponibilite);

router.patch("/position", controller.updatePosition);

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



// livreurRouter.ts



// ──────────────────────────────────────────────
// 🔐 Admin
// ──────────────────────────────────────────────
router.get("/", controller.getLivreurs);

export default router;