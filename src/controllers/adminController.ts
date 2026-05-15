import { Request, Response } from "express";
import * as service from "../services/adminService";

// ===== CLIENTS =====
export const getClients = async (req: Request, res: Response) => {
  try { res.json(await service.getClientsService()); } 
catch (e: any) {
  console.error(e);
  res.status(400).json({ error: e.message });
}};

/* export const createOrGetClient = async (req: Request, res: Response) => {
  try { res.json(await service.createOrGetClientService(req.body)); } 
  catch (e: any) { res.status(400).json({ error: e.message }); }
}; */

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    res.json(await service.updateClientService(Number(clientId), req.body));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const getClientHistorique = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    res.json(await service.getClientHistoriqueService(Number(clientId)));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

// ===== COMMANDES =====
export const getCommandes = async (req: Request, res: Response) => {
  try { res.json(await service.getCommandesService(req.query)); } 
catch (e: any) {
  console.error(e);
  res.status(400).json({ error: e.message });
}};

export const annulerCommande = async (req: Request, res: Response) => {
  try {
    const { commandeId } = req.body;

    if (!commandeId)
      return res.status(400).json({ error: "commandeId requis" });

    const result = await service.annulerCommandeService(Number(commandeId));
    res.json(result);

  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    await service.deleteClientService(Number(clientId));
    res.json({ message: "Client supprimé avec succès" });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// ===== CRÉER CLIENT + COMMANDE =====
export const createClientEtCommande = async (req: Request, res: Response) => {
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
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// ===== SUPPRIMER UNE COMMANDE =====
export const deleteCommande = async (req: Request, res: Response) => {
  try {
    const { commandeId } = req.params;
    await service.deleteCommandeService(Number(commandeId));
    res.json({ message: "Commande supprimée avec succès" });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};
 
// ===== COMMANDES =====
export const createCommande = async (req: Request, res: Response) => {
  try {
    const { clientId, adresseLivraison } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: "clientId requis" });
    }

    // Récupérer le client
    const client = await service.getClientByIdService(clientId);
    if (!client) return res.status(404).json({ error: "Client introuvable" });

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
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

export const updateCommande = async (req: Request, res: Response) => {
  try {
    const { commandeId } = req.params;
    res.json(await service.updateCommandeService(Number(commandeId), req.body));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

// Assigner manuellement (avec choix du livreur)
export const assignerCommande = async (req: Request, res: Response) => {
  try {
    const { commandeId, livreurId } = req.body;
    if (!commandeId || !livreurId)
      return res.status(400).json({ error: "commandeId et livreurId requis" });

    const livraison = await service.assignerCommandeService(Number(commandeId), Number(livreurId));
    res.json({ message: "Commande assignée avec succès", livraison });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

// Assigner automatiquement au plus proche
export const assignerCommandeAuPlusProche = async (req: Request, res: Response) => {
  try {
    const { commandeId } = req.body;
    if (!commandeId)
      return res.status(400).json({ error: "commandeId requis" });

    const result = await service.assignerCommandeAuPlusProche(Number(commandeId));
    res.json({
      message:    `Commande assignée au livreur le plus proche (${result.distanceKm} km)`,
      ...result,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const getLivreursPositions = async (req: Request, res: Response) => {
  try {
    res.json(await service.getLivreursPositionsService());
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Service indisponible" });
  }
};
// ===== LIVREURS =====
export const getLivreurs = async (req: Request, res: Response) => {
  try { res.json(await service.getLivreursService()); } 
catch (e: any) {
  console.error(e);
  res.status(400).json({ error: e.message });
}};

export const getProfilLivreur = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.params;
    res.json(await service.getProfilLivreurService(Number(livreurId)));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const toggleCompteLivreur = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.params;
    res.json(await service.toggleCompteLivreurService(Number(livreurId)));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

// ===== PAIEMENTS =====
/* export const getPaiements = async (req: Request, res: Response) => {
  try { res.json(await service.getPaiementsService()); } 
  catch (e: any) { res.status(500).json({ error: e.message }); }
};
 */
export const marquerPaiementLivreur = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.body;
    if (!livreurId) return res.status(400).json({ error: "livreurId requis" });

    const paiement = await service.marquerPaiementLivreurByLivreurService(Number(livreurId));
    res.json({ message: "Commission marquée comme payée", paiement });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const marquerPaiementJour = async (req: Request, res: Response) => {
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
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// ===== BLOCAGE =====
export const bloquerLivreur = async (req: Request, res: Response) => {
  try { res.json(await service.bloquerLivreurService(req.body)); } 
  catch (e: any) { res.status(400).json({ error: e.message }); }
};



// ─── Commissions du jour ──────────────────────────────────────────────────────

export const getCommissionsJour = async (req: Request, res: Response) => {
  try {
    // ?date=2025-07-14  (optionnel — défaut = aujourd'hui)
    const date = req.query.date as string | undefined;
    const data = await service.getCommissionsJourAdminService(date);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};


export const getStatsCommissionsGlobales = async (req: Request, res: Response) => {
  try {
    const stats = await service.getStatsCommissionsGlobalesService();

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Erreur stats commissions",
    });
  }
};
export const payerCommissionsJour = async (req: Request, res: Response) => {
  try {
    const { livreurId, date } = req.body;

    if (!livreurId || !date)
      return res.status(400).json({ message: "livreurId et date sont requis" });

    const result = await service.marquerPaiementJourService (livreurId, date);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getLivreursStatutCommissions = async (req: Request, res: Response) => {
  try {
    res.json(await service.getLivreursStatutCommissionsService());
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const bloquerLivreurCommissionImpayee = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.body;
    if (!livreurId) return res.status(400).json({ error: "livreurId requis" });
    const result = await service.bloquerLivreurCommissionImpayeeService(Number(livreurId));
    res.json({ message: "Livreur bloqué pour commission impayée", ...result });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

export const debloquerLivreur = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.body;
    if (!livreurId) return res.status(400).json({ error: "livreurId requis" });
    const result = await service.debloquerLivreurService(Number(livreurId));
    res.json(result);
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

export const uploadDocumentsLivreur = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.params;

    // ✅ Correct cast pour uploadDocuments.fields([...])
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || Object.keys(files).length === 0)
      return res.status(400).json({ error: "Aucun fichier reçu" });

    const docs = await service.uploadDocumentsLivreurService(Number(livreurId), files);
    res.json({ message: "Documents uploadés avec succès", documents: docs });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};
export const validerProfilLivreur = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.params;
    const livreur = await service.validerProfilLivreurService(Number(livreurId));
    res.json({ message: "Profil validé avec succès", livreur });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const getDocumentsLivreur = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.params;
    const docs = await service.getDocumentsLivreurService(Number(livreurId));
    res.json(docs);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const supprimerDocument = async (req: Request, res: Response) => {
  try {
    const { livreurId } = req.params;
    const { type } = req.body; // "cni_recto" | "permis" | etc.

    if (!type) return res.status(400).json({ error: "type requis" });

    const result = await service.supprimerDocumentService(Number(livreurId), type);
    res.json({ message: "Document supprimé", document: result });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};