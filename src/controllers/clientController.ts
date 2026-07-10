// controllers/clientController.ts
// NOUVEAU CONTROLLER — dédié au client. N'importe/ne modifie aucun fichier existant.

import { Request, Response } from "express";
import * as service from "../services/clientService";

// ═══════════════════════ AUTH ═══════════════════════

export const registerClient = async (req: Request, res: Response) => {
  try {
    const { nom, prenom, telephone, password, email, adresse } = req.body;
    const result = await service.registerClientService({ nom, prenom, telephone, password, email, adresse });
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const loginClient = async (req: Request, res: Response) => {
  try {
    const { telephone, password } = req.body;
    const result = await service.loginClientService(telephone, password);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};


export const rechercherAdresses = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || "");
    const result = await service.rechercherAdressesService(query);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const resoudreAdresse = async (req: Request, res: Response) => {
  try {
    const placeId = String(req.query.placeId ?? req.params.placeId ?? "");
    if (!placeId) return res.status(400).json({ message: "placeId requis" });
    const result = await service.resoudreAdresseService(placeId);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

// ═══════════════════════ PROFIL ═══════════════════════


// clientController.ts
export const estimerCommande = async (req: Request, res: Response) => {
  try {
        const userId = (req as any).user.userId;

    const result = await service.estimerCommandeService(userId, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


export const getProfilClient = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    res.json(await service.getProfilClientService(userId));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const updateProfilClient = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    res.json(await service.updateProfilClientService(userId, req.body));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const updateLocalisationClient = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { lat, lng } = req.body;
    res.json(await service.updateLocalisationClientService(userId, Number(lat), Number(lng)));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const savePushTokenClient = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { token } = req.body;
    res.json(await service.savePushTokenClientService(userId, token));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

// ═══════════════════════ COMMANDES ═══════════════════════

export const creerCommande = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await service.creerCommandeService(userId, req.body);
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const listerCommandesClient = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    res.json(await service.listerCommandesClientService(userId));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const suivreCommande = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { commandeId } = req.params;
    res.json(await service.suivreCommandeService(userId, Number(commandeId)));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const annulerCommandeClient = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { commandeId } = req.body;
    if (!commandeId) return res.status(400).json({ message: "commandeId requis" });
    res.json(await service.annulerCommandeClientService(userId, Number(commandeId)));
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
