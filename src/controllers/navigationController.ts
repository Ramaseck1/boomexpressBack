// controllers/navigationController.ts
// 🎮 Contrôleur Navigation — Endpoints REST pour la navigation Mapbox

import type { Request, Response } from "express";
import * as navService from "../services/MapboxNavigation/navigationService";
import { calculerRoute, geocoderAdresse } from "../services/MapboxNavigation/mapboxService";

// ─── POST /navigation/demarrer ────────────────────────────────────────────────
// Appelé quand le livreur est prêt à partir (après avoir accepté la mission)
// Body: { livraisonId, lat, lng }
export const demarrerNavigation = async (req: Request, res: Response) => {
  try {
    const { livraisonId, lat, lng } = req.body;

    if (!livraisonId ) {
      return res.status(400).json({ error: "livraisonId est requis" });
    }

    const data = await navService.demarrerNavigationService(livraisonId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /navigation/:livraisonId/instruction ─────────────────────────────────
// Retourne la prochaine instruction turn-by-turn
// Query: ?lat=14.69&lng=-17.44
export const getInstruction = async (req: Request, res: Response) => {
  try {
    const livraisonId = Number(req.params.livraisonId);
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    const data = await navService.getInstructionService(livraisonId, { lat, lng });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /navigation/:livraisonId/eta ─────────────────────────────────────────
// ETA mis à jour avec trafic temps réel
// Query: ?lat=14.69&lng=-17.44
export const getETA = async (req: Request, res: Response) => {
  try {
    const livraisonId = Number(req.params.livraisonId);
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    const data = await navService.getETAService(livraisonId, { lat, lng });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /navigation/route ────────────────────────────────────────────────────
// Calcule une route ad hoc entre deux points (sans livraison)
// Body: { depart: { lat, lng }, destination: { lat, lng } }
export const calculerRouteAdHoc = async (req: Request, res: Response) => {
  try {
    const { depart, destination } = req.body;

    const route = await calculerRoute([depart, destination], "driving-traffic");
    res.json(route);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /navigation/geocode ──────────────────────────────────────────────────
// Convertit une adresse en coordonnées GPS
// Query: ?adresse=12 Rue Moussa, Dakar
export const geocoder = async (req: Request, res: Response) => {
  try {
    const adresse = req.query.adresse as string;
    if (!adresse) return res.status(400).json({ error: "adresse requise" });

    const coords = await geocoderAdresse(adresse);
    res.json(coords);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
