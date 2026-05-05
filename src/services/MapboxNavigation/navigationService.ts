// services/navigationService.ts
// 🗺️ Navigation Mapbox — Phase 1 (livreur → collecte) + Phase 2 (collecte → livraison)

import { prisma } from "../../prisma/prisma.config";
import {
  calculerRoute,
  geocoderAdresse,
  getProchaineInstruction,
  type Coordonnees,
} from "./mapboxService";

// ─── Phase 1 : Guider le livreur vers l'adresse de collecte ──────────────────
// Appelé dès que le livreur accepte la mission, depuis sa position GPS actuelle

export const guiderVersCollecteService = async (
  livraisonId: number,
  positionLivreur: Coordonnees
) => {
  // ✅ Garde : rejeter une position GPS invalide (0,0 = milieu de l'océan)
  if (
    !positionLivreur ||
    Math.abs(positionLivreur.lat) < 0.001 ||
    Math.abs(positionLivreur.lng) < 0.001
  ) {
    throw new Error(
      `Position livreur invalide reçue (lat=${positionLivreur?.lat}, lng=${positionLivreur?.lng}). GPS non prêt.`
    );
  }

  const livraison = await prisma.livraison.findUnique({
    where: { id: livraisonId },
    include: { commande: { include: { client: true } } },
  });

  if (!livraison) throw new Error("Livraison introuvable");

  const adresseCollecte = livraison.commande.client.adresse;
  if (!adresseCollecte) throw new Error("Adresse de collecte manquante");

  const collecteCoords = await geocoderAdresse(adresseCollecte);

  // ✅ Log pour confirmer les deux bornes de la route
  console.log(`[Phase 1] Calcul route :`);
  console.log(`  DÉPART   (livreur)  : lat=${positionLivreur.lat}, lng=${positionLivreur.lng}`);
  console.log(`  ARRIVÉE  (collecte) : lat=${collecteCoords.lat}, lng=${collecteCoords.lng} — "${adresseCollecte}"`);

  // ✅ livreur GPS → adresse collecte (jamais collecte → livraison)
  const route = await calculerRoute([positionLivreur, collecteCoords], "driving-traffic");

  await prisma.livraison.update({
    where: { id: livraisonId },
    data: {
      destinationLat: collecteCoords.lat,
      destinationLng: collecteCoords.lng,
    },
  });

  return {
    livraison,
    route,
    collecteCoords,
    phase: "collecte" as const,
    resume: {
      distanceKm: (route.distanceTotale / 1000).toFixed(1),
      dureeMinutes: Math.round(route.dureeTotale / 60),
      eta: route.eta,
      nombreEtapes: route.etapes.length,
      alerte: route.congestionsDetectees
        ? "⚠️ Trafic chargé vers le point de collecte"
        : null,
    },
  };
};

// ─── Phase 2 : Démarrer la livraison (collecte → adresse de livraison) ────────
// Appelé quand le livreur clique "Démarrer la livraison" une fois arrivé chez le client

export const demarrerNavigationService = async (
  livraisonId: number,
  positionActuelle?: Coordonnees  // position GPS du livreur au moment du déclenchement
) => {
  const livraison = await prisma.livraison.findUnique({
    where: { id: livraisonId },
    include: {
      commande: { include: { client: true } },
    },
  });

  if (!livraison) throw new Error("Livraison introuvable");

  const destinationAdresse = livraison.commande.client.adresseLivraison;
  if (!destinationAdresse) throw new Error("Adresse de livraison manquante");

  // Géocoder la destination finale
  const destination = await geocoderAdresse(destinationAdresse);

  // Départ = position GPS actuelle du livreur si fournie, sinon adresse de collecte
  let depart: Coordonnees;
  if (positionActuelle) {
    depart = positionActuelle;
  } else {
    // Fallback : on part de l'adresse de collecte du client
    const adresseCollecte = livraison.commande.client.adresse;
    if (!adresseCollecte) throw new Error("Adresse de collecte manquante");
    depart = await geocoderAdresse(adresseCollecte);
  }

  // Route : position actuelle du livreur → adresse de livraison finale
  const route = await calculerRoute([depart, destination], "driving-traffic");

  // Mettre à jour la destination en base (maintenant c'est l'adresse de livraison)
  await prisma.livraison.update({
    where: { id: livraisonId },
    data: {
      destinationLat: destination.lat,
      destinationLng: destination.lng,
    },
  });

  return {
    livraison,
    route,
    destination,
    phase: "livraison" as const,
    resume: {
      distanceKm: (route.distanceTotale / 1000).toFixed(1),
      dureeMinutes: Math.round(route.dureeTotale / 60),
      eta: route.eta,
      nombreEtapes: route.etapes.length,
      alerte: route.congestionsDetectees
        ? "⚠️ Trafic chargé sur votre itinéraire"
        : null,
    },
  };
};

// ─── Prochaine instruction vocale ─────────────────────────────────────────────

export const getInstructionService = async (
  livraisonId: number,
  positionActuelle: Coordonnees
) => {
  const livraison = await prisma.livraison.findUnique({
    where: { id: livraisonId },
  });

  if (!livraison) throw new Error("Livraison introuvable");
  if (!livraison.destinationLat || !livraison.destinationLng) {
    throw new Error("Navigation pas encore démarrée pour cette livraison");
  }

  const destination: Coordonnees = {
    lat: livraison.destinationLat,
    lng: livraison.destinationLng,
  };

  const route       = await calculerRoute([positionActuelle, destination]);
  const instruction = getProchaineInstruction(positionActuelle, route.etapes);

  return {
    instruction:            instruction?.instruction ?? "Vous êtes arrivé à destination",
    distanceProchainVirage: instruction?.distanceRestante ?? 0,
    eta:                    route.eta,
    instructionVocale:      instruction
      ? formaterInstructionVocale(instruction.distanceRestante, instruction.instruction)
      : "Vous êtes arrivé à destination",
  };
};

// ─── ETA temps réel ───────────────────────────────────────────────────────────

export const getETAService = async (
  livraisonId: number,
  positionActuelle: Coordonnees
) => {
  const livraison = await prisma.livraison.findUnique({
    where: { id: livraisonId },
  });

  if (!livraison?.destinationLat || !livraison?.destinationLng) {
    throw new Error("Destination non définie — démarrez d'abord la navigation");
  }

  const destination: Coordonnees = {
    lat: livraison.destinationLat,
    lng: livraison.destinationLng,
  };

  const route = await calculerRoute([positionActuelle, destination], "driving-traffic");

  return {
    eta:                    route.eta,
    distanceRestanteMetres: route.distanceTotale,
    dureeRestanteSecondes:  route.dureeTotale,
    congestionsDetectees:   route.congestionsDetectees,
  };
};

// ─── Formatage instruction vocale ─────────────────────────────────────────────

const formaterInstructionVocale = (distanceMetres: number, instruction: string): string => {
  if (distanceMetres < 50)  return instruction;
  if (distanceMetres < 200) return `Dans ${distanceMetres} mètres, ${instruction.toLowerCase()}`;
  return `Dans ${(distanceMetres / 1000).toFixed(1)} km, ${instruction.toLowerCase()}`;
};