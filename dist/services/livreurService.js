"use strict";
// services/livreurService.ts
// 🚗 Service livreur — missions, navigation, revenus, commissions
Object.defineProperty(exports, "__esModule", { value: true });
exports.revenusJourService = exports.revenusService = exports.getHistoriquePaiementsService = exports.historiqueService = exports.confirmerLivraisonService = exports.annulerMissionService = exports.demarrerLivraisonService = exports.accepterMissionService = exports.getMissionsService = exports.getProfilLivreurService = exports.savePushTokenService = exports.updatePositionService = exports.toggleDisponibiliteService = exports.getLivreursService = void 0;
const prisma_config_1 = require("../prisma/prisma.config");
const navigationService_1 = require("./MapboxNavigation/navigationService");
// ─── Livreurs ────────────────────────────────────────────────────────────────
const getLivreursService = async () => {
    return await prisma_config_1.prisma.livreur.findMany({
        include: { user: true },
    });
};
exports.getLivreursService = getLivreursService;
const toggleDisponibiliteService = async (userId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    // ✅ Bloquer si profil non validé
    if (!livreur.profilValide) {
        throw new Error("Votre profil n'est pas encore validé par l'admin");
    }
    return prisma_config_1.prisma.livreur.update({
        where: { id: livreur.id },
        data: {
            disponible: !livreur.disponible,
            derniereActivite: new Date(),
        },
    });
};
exports.toggleDisponibiliteService = toggleDisponibiliteService;
const updatePositionService = async (userId, lat, lng) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    return prisma_config_1.prisma.livreur.update({
        where: { id: livreur.id },
        data: {
            latActuelle: lat, // ✅ vrai nom
            lngActuelle: lng, // ✅ vrai nom
            derniereActivite: new Date(),
        },
    });
};
exports.updatePositionService = updatePositionService;
const savePushTokenService = async (livreurId, token) => {
    return prisma_config_1.prisma.livreur.update({
        where: { id: livreurId },
        data: { pushToken: token },
    });
};
exports.savePushTokenService = savePushTokenService;
const getProfilLivreurService = async (userId) => {
    return prisma_config_1.prisma.user.findUnique({
        where: { id: userId },
        include: { livreur: true },
    });
};
exports.getProfilLivreurService = getProfilLivreurService;
// ─── Missions ────────────────────────────────────────────────────────────────
const getMissionsService = async (userId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    return prisma_config_1.prisma.livraison.findMany({
        where: {
            livreurId: livreur.id,
            statut: { in: ["en_attente", "en_cours", "livree"] },
            commande: {
                deletedAt: null, // 👈 IMPORTANT
                statut: { not: "supprimé" } // 👈 double sécurité
            },
        },
        distinct: ["commandeId"],
        include: {
            commande: {
                include: {
                    client: true,
                },
            },
        },
        orderBy: { id: "desc" },
    });
};
exports.getMissionsService = getMissionsService;
// ─── Accepter une mission ─────────────────────────────────────────────────────
// Phase 1 : on guide le livreur depuis sa position GPS vers l'adresse de collecte.
// Phase 2 : déclenchée plus tard quand le livreur clique "Démarrer la livraison".
const accepterMissionService = async (userId, commandeId, positionLivreur // 📍 Position GPS actuelle du livreur (optionnelle)
) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur || livreur.estBloque) {
        throw new Error("Livreur bloqué ou introuvable");
    }
    // 1️⃣ Mise à jour de la livraison en base (transaction atomique)
    const livraison = await prisma_config_1.prisma.$transaction(async (tx) => {
        const existing = await tx.livraison.findFirst({
            where: { commandeId, livreurId: livreur.id },
        });
        if (!existing)
            throw new Error("Mission introuvable");
        const updated = await tx.livraison.update({
            where: { id: existing.id },
            data: { statut: "en_cours" },
            include: {
                commande: { include: { client: true } },
            },
        });
        await tx.commande.update({
            where: { id: commandeId },
            data: { statut: "en_cours" },
        });
        return updated;
    });
    // 2️⃣ 🗺️ Phase 1 — Guider le livreur vers l'adresse de collecte
    // Si la position GPS est fournie par l'app mobile, on calcule la route immédiatement.
    let navigationPhase1 = null;
    if (positionLivreur) {
        try {
            navigationPhase1 = await (0, navigationService_1.guiderVersCollecteService)(livraison.id, positionLivreur);
        }
        catch (err) {
            // Non-bloquant : la mission est acceptée même si Mapbox échoue.
            // Le livreur peut relancer la navigation manuellement.
            console.error("⚠️ Phase 1 navigation non démarrée :", err);
        }
    }
    return {
        livraison,
        // Navigation Phase 1 : livreur → adresse de collecte
        navigationCollecte: navigationPhase1
            ? {
                phase: "collecte",
                route: navigationPhase1.route.geometry, // Tracé GeoJSON pour la carte
                etapes: navigationPhase1.route.etapes, // Turn-by-turn
                eta: navigationPhase1.route.eta, // Heure d'arrivée au point de collecte
                resume: navigationPhase1.resume, // Distance, durée, alerte trafic
                destination: navigationPhase1.collecteCoords, // Coordonnées du point de collecte
            }
            : null,
    };
};
exports.accepterMissionService = accepterMissionService;
// ─── Démarrer la livraison (Phase 2) ─────────────────────────────────────────
// Appelé quand le livreur appuie sur "Démarrer la livraison" après avoir collecté.
// Calcule la route depuis sa position GPS actuelle vers l'adresse de livraison finale.
const demarrerLivraisonService = async (userId, livraisonId, positionActuelle // 📍 Position GPS du livreur au moment de la collecte
) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    const livraison = await prisma_config_1.prisma.livraison.findUnique({
        where: { id: livraisonId },
        include: { commande: { include: { client: true } } },
    });
    if (!livraison)
        throw new Error("Livraison introuvable");
    if (livraison.livreurId !== livreur.id)
        throw new Error("Livraison non assignée à ce livreur");
    // 🗺️ Phase 2 — Route depuis la position du livreur vers l'adresse de livraison finale
    let navigationPhase2 = null;
    try {
        navigationPhase2 = await (0, navigationService_1.demarrerNavigationService)(livraisonId, positionActuelle);
    }
    catch (err) {
        console.error("⚠️ Phase 2 navigation non démarrée :", err);
        throw new Error("Impossible de calculer l'itinéraire de livraison");
    }
    return {
        livraison,
        // Navigation Phase 2 : position livreur → adresse de livraison finale
        navigationLivraison: {
            phase: "livraison",
            route: navigationPhase2.route.geometry, // Tracé GeoJSON pour la carte
            etapes: navigationPhase2.route.etapes, // Turn-by-turn
            eta: navigationPhase2.route.eta, // Heure d'arrivée finale
            resume: navigationPhase2.resume, // Distance, durée, alerte trafic
            destination: navigationPhase2.destination, // Coordonnées de livraison finale
        },
    };
};
exports.demarrerLivraisonService = demarrerLivraisonService;
// ─── Annuler une mission ──────────────────────────────────────────────────────
const annulerMissionService = async (livraisonId) => {
    return prisma_config_1.prisma.$transaction(async (tx) => {
        const livraison = await tx.livraison.findUnique({ where: { id: livraisonId } });
        if (!livraison)
            throw new Error("Livraison introuvable");
        const updatedLivraison = await tx.livraison.update({
            where: { id: livraisonId },
            data: { statut: "annulee" },
        });
        await tx.commande.update({
            where: { id: livraison.commandeId },
            data: { statut: "en_attente" },
        });
        return updatedLivraison;
    });
};
exports.annulerMissionService = annulerMissionService;
// ─── Confirmer la livraison ───────────────────────────────────────────────────
const confirmerLivraisonService = async (livraisonId) => {
    return prisma_config_1.prisma.$transaction(async (tx) => {
        const livraison = await tx.livraison.findUnique({
            where: { id: livraisonId },
            include: { commande: true },
        });
        if (!livraison)
            throw new Error("Livraison introuvable");
        const updatedLivraison = await tx.livraison.update({
            where: { id: livraisonId },
            data: { statut: "livree", dateLivraison: new Date() },
        });
        await tx.commande.update({
            where: { id: livraison.commandeId },
            data: { statut: "livree" },
        });
        // Enregistrer la commission (10%) comme "en_attente" dans PaiementCommission
        const commission = (livraison.commande?.montant || 0) * 0.10;
        await tx.paiementCommission.create({
            data: {
                livreurId: livraison.livreurId,
                montant: parseFloat(commission.toFixed(2)),
                statut: "en_attente",
            },
        });
        return updatedLivraison;
    });
};
exports.confirmerLivraisonService = confirmerLivraisonService;
// ─── Historique des livraisons ────────────────────────────────────────────────
const historiqueService = async (userId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    return prisma_config_1.prisma.livraison.findMany({
        where: {
            livreurId: livreur.id,
            statut: { not: "EN_ATTENTE" },
        },
        include: {
            commande: { include: { client: true } },
        },
        orderBy: { dateLivraison: "desc" },
    });
};
exports.historiqueService = historiqueService;
// ─── Historique des paiements ─────────────────────────────────────────────────
const getHistoriquePaiementsService = async (userId) => {
    if (!userId || isNaN(userId))
        throw new Error("userId invalide");
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    const paiements = await prisma_config_1.prisma.paiementCommission.findMany({
        where: { livreurId: livreur.id },
        orderBy: { createdAt: "desc" },
    });
    // GROUP BY DATE
    const groupes = {};
    for (const p of paiements) {
        const date = p.createdAt
            ? new Date(p.createdAt).toISOString().split("T")[0]
            : "unknown";
        if (!groupes[date])
            groupes[date] = { date, paiements: [] };
        groupes[date].paiements.push(p);
    }
    return Object.values(groupes)
        .map((g) => {
        const pays = g.paiements;
        const totalCommission = pays.reduce((sum, p) => sum + (p.montant || 0), 0);
        const toutesPayees = pays.length > 0 && pays.every((p) => p.statut === "payee");
        const auMoinsUnePayee = pays.length > 0 && pays.some((p) => p.statut === "payee");
        return {
            date: g.date,
            nombreLivraisons: pays.length,
            totalCommission: parseFloat(totalCommission.toFixed(2)),
            commissionPayee: toutesPayees,
            commissionPartielle: auMoinsUnePayee && !toutesPayees,
        };
    })
        .sort((a, b) => b.date.localeCompare(a.date));
};
exports.getHistoriquePaiementsService = getHistoriquePaiementsService;
// ─── Revenus globaux ──────────────────────────────────────────────────────────
const revenusService = async (userId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    const livraisons = await prisma_config_1.prisma.livraison.findMany({
        where: {
            livreurId: livreur?.id,
            statut: "livree",
        },
        include: { commande: true },
    });
    const COMMISSION_RATE = 0.10;
    const totalBrut = livraisons.reduce((sum, l) => sum + (l.commande?.montant || 0), 0);
    const totalCommission = livraisons.reduce((sum, l) => {
        const montant = l.commande?.montant || 0;
        return sum + montant * COMMISSION_RATE;
    }, 0);
    const net = totalBrut - totalCommission;
    return { totalBrut, totalCommission, net };
};
exports.revenusService = revenusService;
// ─── Revenus du jour ──────────────────────────────────────────────────────────
const revenusJourService = async (userId) => {
    if (!userId || isNaN(userId))
        throw new Error("userId invalide");
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);
    const livraisons = await prisma_config_1.prisma.livraison.findMany({
        where: {
            livreurId: livreur.id,
            statut: "livree",
            dateLivraison: { gte: debut, lte: fin },
        },
        include: { commande: true },
        orderBy: { dateLivraison: "desc" },
    });
    const COMMISSION_RATE = 0.10;
    const totalBrutJour = livraisons.reduce((sum, l) => sum + (l.commande?.montant ?? 0), 0);
    const totalCommissionJour = parseFloat((totalBrutJour * COMMISSION_RATE).toFixed(2));
    const netJour = parseFloat((totalBrutJour - totalCommissionJour).toFixed(2));
    const detailCommissions = livraisons.map((l) => {
        const montant = l.commande?.montant ?? 0;
        return {
            livraisonId: l.id,
            commandeId: l.commandeId,
            montant,
            commission: parseFloat((montant * COMMISSION_RATE).toFixed(2)),
            dateLivraison: l.dateLivraison,
            commissionPayee: l.commande?.commissionPaye ?? false,
        };
    });
    return {
        totalBrutJour,
        totalCommissionJour,
        netJour,
        nombreLivraisons: livraisons.length,
        detailCommissions,
    };
};
exports.revenusJourService = revenusJourService;
