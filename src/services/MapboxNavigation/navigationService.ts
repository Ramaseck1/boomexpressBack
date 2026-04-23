// services/navigationService.ts
import { prisma } from "../../prisma/prisma.config";
import {
  calculerRoute,
  geocoderAdresse,
  getProchaineInstruction,
  type Coordonnees,
} from "./mapboxService";

// ─── Démarrer la navigation ───────────────────────────────────────────────────

export const demarrerNavigationService = async (livraisonId: number) => {
  const livraison = await prisma.livraison.findUnique({
    where: { id: livraisonId },
    include: {
      commande: { include: { client: true } },
    },
  });

  if (!livraison) throw new Error("Livraison introuvable");

  const departAdresse = livraison.commande.client.adresse;
  const destinationAdresse = livraison.commande.client.adresseLivraison;

  if (!departAdresse || !destinationAdresse) {
    throw new Error("Adresses manquantes");
  }

  const depart = await geocoderAdresse(departAdresse);
  const destination = await geocoderAdresse(destinationAdresse);

  const route = await calculerRoute(
    [depart, destination],
    "driving-traffic"
  );

  await prisma.livraison.update({
    where: { id: livraisonId },
    data: {
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      // (optionnel mais recommandé)
      // departureLat: depart.lat,
      // departureLng: depart.lng,
    },
  });

  return {
    livraison,
    route,
    destination,
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
  // ✅ Fix : on lit destinationLat/Lng depuis Livraison (champs ajoutés au schema)
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
    instruction:          instruction?.instruction ?? "Vous êtes arrivé à destination",
    distanceProchainVirage: instruction?.distanceRestante ?? 0,
    eta:                  route.eta,
    instructionVocale:    instruction
      ? formaterInstructionVocale(instruction.distanceRestante, instruction.instruction)
      : "Vous êtes arrivé à destination",
  };
};

// ─── ETA temps réel ───────────────────────────────────────────────────────────

export const getETAService = async (
  livraisonId: number,
  positionActuelle: Coordonnees
) => {
  // ✅ Fix : lecture depuis Livraison directement
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