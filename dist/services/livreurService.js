"use strict";
// services/livreurService.ts
// 🔗 Lien avec navigationService : la navigation démarre automatiquement
//    dès que le livreur accepte une mission (si sa position est fournie)
Object.defineProperty(exports, "__esModule", { value: true });
exports.revenusJourService = exports.revenusService = exports.getHistoriquePaiementsService = exports.historiqueService = exports.confirmerLivraisonService = exports.annulerMissionService = exports.accepterMissionService = exports.getMissionsService = exports.getProfilLivreurService = exports.toggleDisponibiliteService = exports.getLivreursService = void 0;
const prisma_config_1 = require("../prisma/prisma.config");
const navigationService_1 = require("./MapboxNavigation/navigationService"); // 🗺️ Import navigation
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
    return prisma_config_1.prisma.livreur.update({
        where: { id: livreur.id },
        data: {
            disponible: !livreur.disponible,
            derniereActivite: new Date(),
        },
    });
};
exports.toggleDisponibiliteService = toggleDisponibiliteService;
const getProfilLivreurService = async (userId) => {
    return prisma_config_1.prisma.user.findUnique({
        where: { id: userId },
        include: { livreur: true },
    });
};
exports.getProfilLivreurService = getProfilLivreurService;
const getMissionsService = async (userId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({
        where: { userId },
    });
    if (!livreur)
        throw new Error("Livreur introuvable");
    return prisma_config_1.prisma.livraison.findMany({
        where: {
            livreurId: livreur.id,
            statut: {
                in: ["en_attente", "en_cours", "livree"],
            },
        },
        distinct: ["commandeId"], // 🔥 SUPER IMPORTANT
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
// ─── Accepter mission — avec démarrage automatique de la navigation ────────────
const accepterMissionService = async (userId, commandeId, positionLivreur // 📍 Optionnel : position GPS actuelle
) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur || livreur.estBloque) {
        throw new Error("Livreur bloqué ou introuvable");
    }
    // 1️⃣ Créer la livraison en base (transaction atomique)
    const livraison = await prisma_config_1.prisma.$transaction(async (tx) => {
        const existing = await tx.livraison.findFirst({
            where: {
                commandeId,
                livreurId: livreur.id,
            },
        });
        if (!existing) {
            throw new Error("Mission introuvable");
        }
        // ✅ UPDATE au lieu de CREATE
        const updated = await tx.livraison.update({
            where: { id: existing.id },
            data: {
                statut: "en_cours",
            },
            include: {
                commande: {
                    include: {
                        client: true,
                    },
                },
            },
        });
        // ✅ update commande aussi
        await tx.commande.update({
            where: { id: commandeId },
            data: { statut: "en_cours" },
        });
        return updated;
    });
    // 2️⃣ 🗺️ Démarrer la navigation automatiquement si la position est fournie
    let navigation = null;
    if (positionLivreur) {
        try {
            navigation = await (0, navigationService_1.demarrerNavigationService)(livraison.id);
        }
        catch (err) {
            // La navigation est non-bloquante : si Mapbox échoue, la mission
            // est quand même acceptée. Le livreur peut relancer la navigation manuellement.
            console.error("⚠️ Navigation non démarrée automatiquement :", err);
        }
    }
    return {
        livraison,
        // Retourné seulement si la position était fournie et Mapbox a répondu
        navigation: navigation
            ? {
                route: navigation.route.geometry, // Tracé GeoJSON pour la carte
                etapes: navigation.route.etapes, // Turn-by-turn
                eta: navigation.route.eta, // Heure d'arrivée
                resume: navigation.resume, // Distance, durée, alerte trafic
                destination: navigation.destination, // Coordonnées destination
            }
            : null,
    };
};
exports.accepterMissionService = accepterMissionService;
const annulerMissionService = async (livraisonId) => {
    return prisma_config_1.prisma.$transaction(async (tx) => {
        const livraison = await tx.livraison.findUnique({
            where: {
                id: livraisonId
            }
        });
        if (!livraison) {
            throw new Error("Livraison introuvable");
        }
        // Annuler la livraison
        const updatedLivraison = await tx.livraison.update({
            where: {
                id: livraisonId
            },
            data: {
                statut: "annulee"
            }
        });
        // Remettre la commande en attente
        await tx.commande.update({
            where: {
                id: livraison.commandeId
            },
            data: {
                statut: "en_attente"
            }
        });
        return updatedLivraison;
    });
};
exports.annulerMissionService = annulerMissionService;
const confirmerLivraisonService = async (livraisonId) => {
    return prisma_config_1.prisma.$transaction(async (tx) => {
        const livraison = await tx.livraison.findUnique({
            where: { id: livraisonId },
            include: { commande: true }, // ✅ pour avoir le montant
        });
        if (!livraison)
            throw new Error("Livraison introuvable");
        // 1️⃣ Update livraison
        const updatedLivraison = await tx.livraison.update({
            where: { id: livraisonId },
            data: { statut: "livree", dateLivraison: new Date() },
        });
        // 2️⃣ Update commande
        await tx.commande.update({
            where: { id: livraison.commandeId },
            data: { statut: "livree" },
        });
        // 3️⃣ ✅ Enregistrer la commission comme "en_attente" dans PaiementCommission
        const commission = (livraison.commande?.montant || 0) * 0.10;
        await tx.paiementCommission.create({
            data: {
                livreurId: livraison.livreurId,
                montant: parseFloat(commission.toFixed(2)),
                statut: "en_attente", // ✅ non payée par défaut
            },
        });
        return updatedLivraison;
    });
};
exports.confirmerLivraisonService = confirmerLivraisonService;
const historiqueService = async (userId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({
        where: { userId }
    });
    if (!livreur) {
        throw new Error("Livreur introuvable");
    }
    return prisma_config_1.prisma.livraison.findMany({
        where: {
            livreurId: livreur.id,
            statut: {
                not: "EN_ATTENTE",
            },
        },
        include: {
            commande: {
                include: {
                    client: true,
                },
            },
        },
        orderBy: {
            dateLivraison: "desc",
        },
    });
};
exports.historiqueService = historiqueService;
const getHistoriquePaiementsService = async (userId) => {
    if (!userId || isNaN(userId))
        throw new Error("userId invalide");
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    // ✅ Lire depuis PaiementCommission directement
    const paiements = await prisma_config_1.prisma.paiementCommission.findMany({
        where: { livreurId: livreur.id },
        orderBy: { createdAt: "desc" },
    });
    // ─── GROUP BY DATE ─────────────────────────────
    const groupes = {};
    for (const p of paiements) {
        const date = p.createdAt
            ? new Date(p.createdAt).toISOString().split("T")[0]
            : "unknown";
        if (!groupes[date]) {
            groupes[date] = {
                date,
                paiements: [],
            };
        }
        groupes[date].paiements.push(p);
    }
    // ─── TRANSFORMATION FINALE ─────────────────────
    return Object.values(groupes)
        .map((g) => {
        const pays = g.paiements;
        const totalCommission = pays.reduce((sum, p) => sum + (p.montant || 0), 0);
        // ✅ Plus de bug [].every() — on filtre directement par statut
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
const revenusService = async (userId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { userId } });
    const livraisons = await prisma_config_1.prisma.livraison.findMany({
        where: {
            livreurId: livreur?.id,
            statut: "livree", // 🔥 TRÈS IMPORTANT
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
    return {
        totalBrut,
        totalCommission,
        net,
    };
};
exports.revenusService = revenusService;
// ─── Revenus + Commission du jour (cumul sur 24h glissantes) ────────────────
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
            // ✅ seulement sur dateLivraison, pas de OR avec updatedAt
            dateLivraison: { gte: debut, lte: fin },
        },
        include: { commande: true }, // ✅
        orderBy: { dateLivraison: "desc" }, // ✅
    });
    const COMMISSION_RATE = 0.10;
    const totalBrutJour = livraisons.reduce((sum, l) => sum + (l.commande?.montant ?? 0), 0);
    const totalCommissionJour = parseFloat((totalBrutJour * COMMISSION_RATE).toFixed(2));
    const netJour = parseFloat((totalBrutJour - totalCommissionJour).toFixed(2));
    // Dans le map des detailCommissions :
    const detailCommissions = livraisons.map((l) => {
        const montant = l.commande?.montant ?? 0;
        return {
            livraisonId: l.id,
            commandeId: l.commandeId,
            montant,
            commission: parseFloat((montant * COMMISSION_RATE).toFixed(2)),
            dateLivraison: l.dateLivraison,
            commissionPayee: l.commande?.commissionPaye ?? false, // ✅ depuis DB
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
