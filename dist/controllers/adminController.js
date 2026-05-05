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
exports.bloquerLivreur = exports.marquerPaiementJour = exports.marquerPaiementLivreur = exports.toggleCompteLivreur = exports.getProfilLivreur = exports.getLivreurs = exports.assignerCommande = exports.updateCommande = exports.createCommande = exports.deleteCommande = exports.createClientEtCommande = exports.deleteClient = exports.getCommandes = exports.getClientHistorique = exports.updateClient = exports.getClients = void 0;
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
