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
exports.revenusJour = exports.historiqueCommissions = exports.getHistoriquePaiements = exports.revenus = exports.historique = exports.annulerMission = exports.confirmerLivraison = exports.demarrerLivraison = exports.accepterMission = exports.getMissions = exports.toggleDisponibilite = exports.getProfil = exports.getLivreurs = void 0;
const service = __importStar(require("../services/livreurService"));
// ================= ADMIN =================
// Liste des livreurs
const getLivreurs = async (req, res) => {
    try {
        const livreurs = await service.getLivreursService();
        res.json(livreurs);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getLivreurs = getLivreurs;
// ================= LIVREUR =================
// Profil
const getProfil = async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = await service.getProfilLivreurService(userId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur profil" });
    }
};
exports.getProfil = getProfil;
// Disponibilité
const toggleDisponibilite = async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = await service.toggleDisponibiliteService(userId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur disponibilité" });
    }
};
exports.toggleDisponibilite = toggleDisponibilite;
// Missions disponibles
const getMissions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = await service.getMissionsService(userId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur missions" });
    }
};
exports.getMissions = getMissions;
const accepterMission = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { commandeId, lat, lng } = req.body;
        const positionLivreur = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
        const data = await service.accepterMissionService(userId, commandeId, positionLivreur // 📍 Transmis au service → déclenche Mapbox si présent
        );
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.accepterMission = accepterMission;
// 🚀 Démarrer la livraison (Phase 2)
const demarrerLivraison = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { livraisonId, lat, lng } = req.body;
        // ✅ Vérification
        if (!livraisonId) {
            return res.status(400).json({
                message: "livraisonId requis",
            });
        }
        // 📍 Position GPS optionnelle
        const positionActuelle = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
        // ✅ Appel service
        const data = await service.demarrerLivraisonService(userId, Number(livraisonId), positionActuelle);
        res.status(200).json({
            message: "Navigation livraison démarrée",
            data,
        });
    }
    catch (error) {
        console.error("❌ Erreur démarrage livraison :", error);
        res.status(500).json({
            message: "Erreur lors du démarrage de la livraison",
            error: error.message,
        });
    }
};
exports.demarrerLivraison = demarrerLivraison;
// Accepter mission
// Confirmer livraison
const confirmerLivraison = async (req, res) => {
    try {
        const { livraisonId } = req.body;
        // ✅ 1. Vérification
        if (!livraisonId) {
            return res.status(400).json({ message: "livraisonId requis" });
        }
        // ✅ 2. Service
        const data = await service.confirmerLivraisonService(Number(livraisonId));
        // ✅ 3. Réponse propre
        res.status(200).json({
            message: "Livraison confirmée",
            data,
        });
    }
    catch (error) {
        console.error("❌ Erreur livraison :", error);
        res.status(500).json({
            message: "Erreur lors de la confirmation de la livraison",
            error: error.message,
        });
    }
};
exports.confirmerLivraison = confirmerLivraison;
const annulerMission = async (req, res) => {
    try {
        const { livraisonId } = req.body;
        if (!livraisonId) {
            return res.status(400).json({
                message: "livraisonId requis"
            });
        }
        const data = await service.annulerMissionService(Number(livraisonId));
        res.status(200).json({
            message: "Mission annulée",
            data
        });
    }
    catch (error) {
        console.error("Erreur annulation :", error);
        res.status(500).json({
            message: "Erreur annulation mission",
            error: error.message
        });
    }
};
exports.annulerMission = annulerMission;
// Historique
const historique = async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = await service.historiqueService(userId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur historique" });
    }
};
exports.historique = historique;
// Revenus
const revenus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = await service.revenusService(userId);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur revenus" });
    }
};
exports.revenus = revenus;
const getHistoriquePaiements = async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = await service.getHistoriquePaiementsService(userId);
        res.json(data);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getHistoriquePaiements = getHistoriquePaiements;
const historiqueCommissions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = await service.getHistoriquePaiementsService(userId); // ✅ pointe vers le bon service
        res.json(data);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.historiqueCommissions = historiqueCommissions;
// Ajoute ce handler
// ✅ Après
const revenusJour = async (req, res) => {
    try {
        const userId = req.user.userId; // ← cohérent avec tous les autres
        const data = await service.revenusJourService(userId);
        res.json(data);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.revenusJour = revenusJour;
