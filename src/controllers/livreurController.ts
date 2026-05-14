import type { Request, Response } from "express";
import * as service from "../services/livreurService";

// ================= ADMIN =================

// Liste des livreurs
export const getLivreurs = async (req: Request, res: Response) => {
  try {
    const livreurs = await service.getLivreursService();
    res.json(livreurs);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ================= LIVREUR =================

// Profil
export const getProfil = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const data = await service.getProfilLivreurService(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur profil" });
  }
};

// Disponibilité
export const toggleDisponibilite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const data = await service.toggleDisponibiliteService(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur disponibilité" });
  }
};

// Missions disponibles
export const getMissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const data = await service.getMissionsService(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur missions" });
  }
};
export const accepterMission = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { commandeId, lat, lng } = req.body;

    const positionLivreur =
      lat !== undefined && lng !== undefined ? { lat, lng } : undefined;

    const data = await service.accepterMissionService(
      userId,
      commandeId,
      positionLivreur // 📍 Transmis au service → déclenche Mapbox si présent
    );

    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};


// 🚀 Démarrer la livraison (Phase 2)
export const demarrerLivraison = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { livraisonId, lat, lng } = req.body;

    // ✅ Vérification
    if (!livraisonId) {
      return res.status(400).json({
        message: "livraisonId requis",
      });
    }

    // 📍 Position GPS optionnelle
    const positionActuelle =
      lat !== undefined && lng !== undefined ? { lat, lng } : undefined;

    // ✅ Appel service
    const data = await service.demarrerLivraisonService(
      userId,
      Number(livraisonId),
      positionActuelle
    );

    res.status(200).json(data);

  } catch (error: any) {
    console.error("❌ Erreur démarrage livraison :", error);

    res.status(500).json({
      message: "Erreur lors du démarrage de la livraison",
      error: error.message,
    });
  }
};




// Confirmer livraison
export const confirmerLivraison = async (req: Request, res: Response) => {
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

  } catch (error: any) {
    console.error("❌ Erreur livraison :", error);

    res.status(500).json({
      message: "Erreur lors de la confirmation de la livraison",
      error: error.message,
    });
  }
};

export const annulerMission = async (
  req: Request,
  res: Response
) => {

  try {

    const { livraisonId } = req.body;

    if (!livraisonId) {
      return res.status(400).json({
        message: "livraisonId requis"
      });
    }

    const data = await service.annulerMissionService(
      Number(livraisonId)
    );

    res.status(200).json({
      message: "Mission annulée",
      data
    });

  }
  catch (error: any) {

    console.error("Erreur annulation :", error);

    res.status(500).json({
      message: "Erreur annulation mission",
      error: error.message
    });

  }

};

// Historique
export const historique = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const data = await service.historiqueService(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur historique" });
  }
};

export const updatePosition = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined)
      return res.status(400).json({ error: "lat et lng requis" });

    const data = await service.updatePositionService(userId, Number(lat), Number(lng));
    res.json({ message: "Position mise à jour", data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


// Revenus
export const revenus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const data = await service.revenusService(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur revenus" });
  }
};

export const getHistoriquePaiements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const data = await service.getHistoriquePaiementsService(userId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
export const historiqueCommissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const data = await service.getHistoriquePaiementsService(userId); // ✅ pointe vers le bon service
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
// Ajoute ce handler
// ✅ Après
export const revenusJour = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId; // ← cohérent avec tous les autres
    const data = await service.revenusJourService(userId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};