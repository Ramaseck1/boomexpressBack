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
exports.supprimerLivreurController = exports.supprimerDocument = exports.getDocumentsLivreur = exports.validerProfilLivreur = exports.uploadDocumentsLivreur = exports.debloquerLivreur = exports.bloquerLivreurCommissionImpayee = exports.getLivreursStatutCommissions = exports.payerCommissionsJour = exports.getStatsCommissionsGlobales = exports.getCommissionsJour = exports.bloquerLivreur = exports.marquerPaiementJour = exports.marquerPaiementLivreur = exports.toggleCompteLivreur = exports.getProfilLivreur = exports.getLivreurs = exports.getLivreursPositions = exports.assignerCommandeAuPlusProche = exports.assignerCommande = exports.updateCommande = exports.createCommande = exports.deleteCommande = exports.createClientEtCommande = exports.deleteClient = exports.supprimerCommande = exports.annulerCommande = exports.getCommandes = exports.getClientHistorique = exports.updateClient = exports.getClients = void 0;
const service = __importStar(require("../services/adminService"));
// ===== CLIENTS =====
const getClients = async (req, res) => {
    try {
        res.json(await service.getClientsService());
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.getClients = getClients;
/* export const createOrGetClient = async (req: Request, res: Response) => {
  try { res.json(await service.createOrGetClientService(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}; */
const updateClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        res.json(await service.updateClientService(Number(clientId), req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.updateClient = updateClient;
const getClientHistorique = async (req, res) => {
    try {
        const { clientId } = req.params;
        res.json(await service.getClientHistoriqueService(Number(clientId)));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.getClientHistorique = getClientHistorique;
// ===== COMMANDES =====
const getCommandes = async (req, res) => {
    try {
        res.json(await service.getCommandesService(req.query));
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.getCommandes = getCommandes;
const annulerCommande = async (req, res) => {
    try {
        const { commandeId } = req.body;
        if (!commandeId)
            return res.status(400).json({ error: "commandeId requis" });
        const result = await service.annulerCommandeService(Number(commandeId));
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.annulerCommande = annulerCommande;
const supprimerCommande = async (req, res) => {
    try {
        const { commandeId } = req.body;
        if (!commandeId) {
            return res.status(400).json({ error: "commandeId requis" });
        }
        const result = await service.supprimerCommandeService(Number(commandeId));
        return res.json({
            message: "Commande supprimée avec succès",
            data: result,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Erreur lors de la suppression de la commande",
        });
    }
};
exports.supprimerCommande = supprimerCommande;
const deleteClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        await service.deleteClientService(Number(clientId));
        res.json({ message: "Client supprimé avec succès" });
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.deleteClient = deleteClient;
// ===== CRÉER CLIENT + COMMANDE =====
const createClientEtCommande = async (req, res) => {
    try {
        const { nom, prenom, telephone, adresse, adresseLivraison, telephoneDestinataire } = req.body;
        if (!nom || !prenom || !telephone || !adresse || !adresseLivraison || !telephoneDestinataire) {
            return res.status(400).json({
                error: "nom, prenom, telephone, adresse, adresseLivraison et telephoneDestinataire sont requis",
            });
        }
        const result = await service.createClientEtCommandeService({
            nom,
            prenom,
            telephone,
            adresse,
            adresseLivraison,
            telephoneDestinataire,
        });
        res.status(201).json({
            message: "Client et commande créés avec succès",
            ...result,
        });
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.createClientEtCommande = createClientEtCommande;
// ===== SUPPRIMER UNE COMMANDE =====
const deleteCommande = async (req, res) => {
    try {
        const { commandeId } = req.params;
        await service.deleteCommandeService(Number(commandeId));
        res.json({ message: "Commande supprimée avec succès" });
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.deleteCommande = deleteCommande;
// ===== COMMANDES =====
const createCommande = async (req, res) => {
    try {
        const { clientId, adresseLivraison } = req.body;
        if (!clientId) {
            return res.status(400).json({ error: "clientId requis" });
        }
        // Récupérer le client
        const client = await service.getClientByIdService(clientId);
        if (!client)
            return res.status(404).json({ error: "Client introuvable" });
        // Si une nouvelle adresseLivraison est fournie, mettre à jour le client
        if (adresseLivraison && adresseLivraison.trim() !== "") {
            await service.updateClientService(clientId, { adresseLivraison });
        }
        // Créer la commande en utilisant l'adresse de livraison du client si pas fournie
        const commande = await service.createCommandeService({
            clientId,
            adresseLivraison: adresseLivraison || client.adresseLivraison
        });
        res.json({ message: "Commande créée avec succès", commande });
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.createCommande = createCommande;
const updateCommande = async (req, res) => {
    try {
        const { commandeId } = req.params;
        res.json(await service.updateCommandeService(Number(commandeId), req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.updateCommande = updateCommande;
// Assigner manuellement (avec choix du livreur)
const assignerCommande = async (req, res) => {
    try {
        const { commandeId, livreurId } = req.body;
        if (!commandeId || !livreurId)
            return res.status(400).json({ error: "commandeId et livreurId requis" });
        const livraison = await service.assignerCommandeService(Number(commandeId), Number(livreurId));
        res.json({ message: "Commande assignée avec succès", livraison });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.assignerCommande = assignerCommande;
// Assigner automatiquement au plus proche
const assignerCommandeAuPlusProche = async (req, res) => {
    try {
        const { commandeId } = req.body;
        if (!commandeId)
            return res.status(400).json({ error: "commandeId requis" });
        const result = await service.assignerCommandeAuPlusProche(Number(commandeId));
        res.json({
            message: `Commande assignée au livreur le plus proche (${result.distanceKm} km)`,
            ...result,
        });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.assignerCommandeAuPlusProche = assignerCommandeAuPlusProche;
const getLivreursPositions = async (req, res) => {
    try {
        res.json(await service.getLivreursPositionsService());
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Service indisponible" });
    }
};
exports.getLivreursPositions = getLivreursPositions;
// ===== LIVREURS =====
const getLivreurs = async (req, res) => {
    try {
        res.json(await service.getLivreursService());
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.getLivreurs = getLivreurs;
const getProfilLivreur = async (req, res) => {
    try {
        const { livreurId } = req.params;
        res.json(await service.getProfilLivreurService(Number(livreurId)));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.getProfilLivreur = getProfilLivreur;
const toggleCompteLivreur = async (req, res) => {
    try {
        const { livreurId } = req.params;
        res.json(await service.toggleCompteLivreurService(Number(livreurId)));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.toggleCompteLivreur = toggleCompteLivreur;
// ===== PAIEMENTS =====
/* export const getPaiements = async (req: Request, res: Response) => {
  try { res.json(await service.getPaiementsService()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};
 */
const marquerPaiementLivreur = async (req, res) => {
    try {
        const { livreurId } = req.body;
        if (!livreurId)
            return res.status(400).json({ error: "livreurId requis" });
        const paiement = await service.marquerPaiementLivreurByLivreurService(Number(livreurId));
        res.json({ message: "Commission marquée comme payée", paiement });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.marquerPaiementLivreur = marquerPaiementLivreur;
const marquerPaiementJour = async (req, res) => {
    try {
        const { livreurId, date } = req.body;
        if (!livreurId || !date) {
            return res.status(400).json({ error: "livreurId et date requis" });
        }
        // Valider le format date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: "Format date invalide. Attendu: YYYY-MM-DD" });
        }
        const data = await service.marquerPaiementJourService(Number(livreurId), date);
        res.json({
            message: `Commissions du ${date} marquées comme payées`,
            data,
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.marquerPaiementJour = marquerPaiementJour;
// ===== BLOCAGE =====
const bloquerLivreur = async (req, res) => {
    try {
        res.json(await service.bloquerLivreurService(req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.bloquerLivreur = bloquerLivreur;
// ─── Commissions du jour ──────────────────────────────────────────────────────
const getCommissionsJour = async (req, res) => {
    try {
        // ?date=2025-07-14  (optionnel — défaut = aujourd'hui)
        const date = req.query.date;
        const data = await service.getCommissionsJourAdminService(date);
        res.json(data);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
exports.getCommissionsJour = getCommissionsJour;
const getStatsCommissionsGlobales = async (req, res) => {
    try {
        const stats = await service.getStatsCommissionsGlobalesService();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Erreur stats commissions",
        });
    }
};
exports.getStatsCommissionsGlobales = getStatsCommissionsGlobales;
const payerCommissionsJour = async (req, res) => {
    try {
        const { livreurId, date } = req.body;
        if (!livreurId || !date)
            return res.status(400).json({ message: "livreurId et date sont requis" });
        const result = await service.marquerPaiementJourService(livreurId, date);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
exports.payerCommissionsJour = payerCommissionsJour;
const getLivreursStatutCommissions = async (req, res) => {
    try {
        res.json(await service.getLivreursStatutCommissionsService());
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.getLivreursStatutCommissions = getLivreursStatutCommissions;
const bloquerLivreurCommissionImpayee = async (req, res) => {
    try {
        const { livreurId } = req.body;
        if (!livreurId)
            return res.status(400).json({ error: "livreurId requis" });
        const result = await service.bloquerLivreurCommissionImpayeeService(Number(livreurId));
        res.json({ message: "Livreur bloqué pour commission impayée", ...result });
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.bloquerLivreurCommissionImpayee = bloquerLivreurCommissionImpayee;
const debloquerLivreur = async (req, res) => {
    try {
        const { livreurId } = req.body;
        if (!livreurId)
            return res.status(400).json({ error: "livreurId requis" });
        const result = await service.debloquerLivreurService(Number(livreurId));
        res.json(result);
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.debloquerLivreur = debloquerLivreur;
const uploadDocumentsLivreur = async (req, res) => {
    try {
        const { livreurId } = req.params;
        // ✅ Correct cast pour uploadDocuments.fields([...])
        const files = req.files;
        if (!files || Object.keys(files).length === 0)
            return res.status(400).json({ error: "Aucun fichier reçu" });
        const docs = await service.uploadDocumentsLivreurService(Number(livreurId), files);
        res.json({ message: "Documents uploadés avec succès", documents: docs });
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
};
exports.uploadDocumentsLivreur = uploadDocumentsLivreur;
const validerProfilLivreur = async (req, res) => {
    try {
        const { livreurId } = req.params;
        const livreur = await service.validerProfilLivreurService(Number(livreurId));
        res.json({ message: "Profil validé avec succès", livreur });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.validerProfilLivreur = validerProfilLivreur;
const getDocumentsLivreur = async (req, res) => {
    try {
        const { livreurId } = req.params;
        const docs = await service.getDocumentsLivreurService(Number(livreurId));
        res.json(docs);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.getDocumentsLivreur = getDocumentsLivreur;
const supprimerDocument = async (req, res) => {
    try {
        const { livreurId } = req.params;
        const { type } = req.body; // "cni_recto" | "permis" | etc.
        if (!type)
            return res.status(400).json({ error: "type requis" });
        const result = await service.supprimerDocumentService(Number(livreurId), type);
        res.json({ message: "Document supprimé", document: result });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.supprimerDocument = supprimerDocument;
const supprimerLivreurController = async (req, res) => {
    try {
        const livreurId = Number(req.params.id);
        if (!livreurId) {
            return res.status(400).json({
                success: false,
                message: "ID livreur invalide",
            });
        }
        const result = await service.supprimerLivreurService(livreurId);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Erreur suppression livreur:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Erreur serveur lors de la suppression du livreur",
        });
    }
};
exports.supprimerLivreurController = supprimerLivreurController;
