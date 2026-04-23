"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getETAService = exports.getInstructionService = exports.demarrerNavigationService = void 0;
// services/navigationService.ts
const prisma_config_1 = require("../../prisma/prisma.config");
const mapboxService_1 = require("./mapboxService");
// ─── Démarrer la navigation ───────────────────────────────────────────────────
const demarrerNavigationService = async (livraisonId) => {
    const livraison = await prisma_config_1.prisma.livraison.findUnique({
        where: { id: livraisonId },
        include: {
            commande: { include: { client: true } },
        },
    });
    if (!livraison)
        throw new Error("Livraison introuvable");
    const departAdresse = livraison.commande.client.adresse;
    const destinationAdresse = livraison.commande.client.adresseLivraison;
    if (!departAdresse || !destinationAdresse) {
        throw new Error("Adresses manquantes");
    }
    const depart = await (0, mapboxService_1.geocoderAdresse)(departAdresse);
    const destination = await (0, mapboxService_1.geocoderAdresse)(destinationAdresse);
    const route = await (0, mapboxService_1.calculerRoute)([depart, destination], "driving-traffic");
    await prisma_config_1.prisma.livraison.update({
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
exports.demarrerNavigationService = demarrerNavigationService;
// ─── Prochaine instruction vocale ─────────────────────────────────────────────
const getInstructionService = async (livraisonId, positionActuelle) => {
    // ✅ Fix : on lit destinationLat/Lng depuis Livraison (champs ajoutés au schema)
    const livraison = await prisma_config_1.prisma.livraison.findUnique({
        where: { id: livraisonId },
    });
    if (!livraison)
        throw new Error("Livraison introuvable");
    if (!livraison.destinationLat || !livraison.destinationLng) {
        throw new Error("Navigation pas encore démarrée pour cette livraison");
    }
    const destination = {
        lat: livraison.destinationLat,
        lng: livraison.destinationLng,
    };
    const route = await (0, mapboxService_1.calculerRoute)([positionActuelle, destination]);
    const instruction = (0, mapboxService_1.getProchaineInstruction)(positionActuelle, route.etapes);
    return {
        instruction: instruction?.instruction ?? "Vous êtes arrivé à destination",
        distanceProchainVirage: instruction?.distanceRestante ?? 0,
        eta: route.eta,
        instructionVocale: instruction
            ? formaterInstructionVocale(instruction.distanceRestante, instruction.instruction)
            : "Vous êtes arrivé à destination",
    };
};
exports.getInstructionService = getInstructionService;
// ─── ETA temps réel ───────────────────────────────────────────────────────────
const getETAService = async (livraisonId, positionActuelle) => {
    // ✅ Fix : lecture depuis Livraison directement
    const livraison = await prisma_config_1.prisma.livraison.findUnique({
        where: { id: livraisonId },
    });
    if (!livraison?.destinationLat || !livraison?.destinationLng) {
        throw new Error("Destination non définie — démarrez d'abord la navigation");
    }
    const destination = {
        lat: livraison.destinationLat,
        lng: livraison.destinationLng,
    };
    const route = await (0, mapboxService_1.calculerRoute)([positionActuelle, destination], "driving-traffic");
    return {
        eta: route.eta,
        distanceRestanteMetres: route.distanceTotale,
        dureeRestanteSecondes: route.dureeTotale,
        congestionsDetectees: route.congestionsDetectees,
    };
};
exports.getETAService = getETAService;
// ─── Formatage instruction vocale ─────────────────────────────────────────────
const formaterInstructionVocale = (distanceMetres, instruction) => {
    if (distanceMetres < 50)
        return instruction;
    if (distanceMetres < 200)
        return `Dans ${distanceMetres} mètres, ${instruction.toLowerCase()}`;
    return `Dans ${(distanceMetres / 1000).toFixed(1)} km, ${instruction.toLowerCase()}`;
};
