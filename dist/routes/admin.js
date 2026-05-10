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
const express_1 = require("express");
const controller = __importStar(require("../controllers/adminController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const uploadDocuments_1 = require("../middleware/uploadDocuments");
const router = (0, express_1.Router)();
router.use((0, authMiddleware_1.authenticate)(["ADMIN", "SUPERADMIN"]));
router.use(adminMiddleware_1.authorizeAdmin);
// Clients
router.get("/clients", controller.getClients);
router.put("/clients/:clientId", controller.updateClient);
router.delete("/clients/:clientId", controller.deleteClient);
router.get("/clients/:clientId/historique", controller.getClientHistorique);
router.post("/clients-commandes", controller.createClientEtCommande);
// Commandes
router.get("/commandes", controller.getCommandes);
router.post("/commandes", controller.createCommande);
router.put("/commandes/:commandeId", controller.updateCommande);
router.delete("/commandes/:commandeId", controller.deleteCommande);
router.post("/commandes/assigner", controller.assignerCommande);
// Livreurs
router.get("/livreurs", controller.getLivreurs);
router.get("/livreurs/:livreurId", controller.getProfilLivreur);
router.patch("/livreurs/:livreurId/toggle", controller.toggleCompteLivreur);
router.post("/livreurs/bloquer", controller.bloquerLivreur);
// ✅ Documents livreur
router.post("/livreurs/:livreurId/documents", uploadDocuments_1.uploadDocuments.fields([
    { name: "cni_recto", maxCount: 1 },
    { name: "cni_verso", maxCount: 1 },
    { name: "permis", maxCount: 1 },
    { name: "assurance", maxCount: 1 },
    { name: "recepisse_moto", maxCount: 1 },
]), controller.uploadDocumentsLivreur);
router.get("/livreurs/:livreurId/documents", controller.getDocumentsLivreur);
router.post("/livreurs/:livreurId/valider", controller.validerProfilLivreur);
router.delete("/livreurs/:livreurId/documents", controller.supprimerDocument);
// Paiements
/* router.post("/paiements/payer", controller.marquerPaiementJour);
 */
// Commissions
router.get("/commissions/jour", controller.getCommissionsJour);
router.post("/commissions/payer", controller.payerCommissionsJour);
router.get("/commissions/stats", controller.getStatsCommissionsGlobales);
router.get("/livreurs/statut-commissions", controller.getLivreursStatutCommissions);
router.post("/livreurs/bloquer-commission", controller.bloquerLivreurCommissionImpayee);
exports.default = router;
