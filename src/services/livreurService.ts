// services/livreurService.ts
// 🔗 Lien avec navigationService : la navigation démarre automatiquement
//    dès que le livreur accepte une mission (si sa position est fournie)

import { prisma } from "../prisma/prisma.config";
import { demarrerNavigationService } from "./MapboxNavigation/navigationService"; // 🗺️ Import navigation
import type { Coordonnees } from "./MapboxNavigation/mapboxService";

export const getLivreursService = async () => {
  return await prisma.livreur.findMany({
    include: { user: true },
  });
};

export const toggleDisponibiliteService = async (userId: number) => {
  const livreur = await prisma.livreur.findUnique({ where: { userId } });
  if (!livreur) throw new Error("Livreur introuvable");

  return prisma.livreur.update({
    where: { id: livreur.id },
    data: {
      disponible: !livreur.disponible,
      derniereActivite: new Date(),
    },
  });
};

export const getProfilLivreurService = async (userId: number) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { livreur: true },
  });
};

export const getMissionsService = async (userId: number) => {
  const livreur = await prisma.livreur.findUnique({
    where: { userId },
  });

  if (!livreur) throw new Error("Livreur introuvable");

  return prisma.livraison.findMany({
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
// ─── Accepter mission — avec démarrage automatique de la navigation ────────────

export const accepterMissionService = async (
  userId: number,
  commandeId: number,
  positionLivreur?: Coordonnees // 📍 Optionnel : position GPS actuelle
) => {
  const livreur = await prisma.livreur.findUnique({ where: { userId } });

  if (!livreur || livreur.estBloque) {
    throw new Error("Livreur bloqué ou introuvable");
  }

  // 1️⃣ Créer la livraison en base (transaction atomique)
  const livraison = await prisma.$transaction(async (tx) => {

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
      navigation = await demarrerNavigationService(livraison.id);
    } catch (err) {
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
        route: navigation.route.geometry,      // Tracé GeoJSON pour la carte
        etapes: navigation.route.etapes,        // Turn-by-turn
        eta: navigation.route.eta,              // Heure d'arrivée
        resume: navigation.resume,              // Distance, durée, alerte trafic
        destination: navigation.destination,    // Coordonnées destination
      }
      : null,
  };
};

export const annulerMissionService = async (
  livraisonId: number
) => {

  return prisma.$transaction(async (tx) => {

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

export const confirmerLivraisonService = async (livraisonId: number) => {
  return prisma.$transaction(async (tx) => {

    const livraison = await tx.livraison.findUnique({
      where: { id: livraisonId },
      include: { commande: true }, // ✅ pour avoir le montant
    });
    if (!livraison) throw new Error("Livraison introuvable");

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

export const historiqueService = async (
  userId: number
) => {

  const livreur = await prisma.livreur.findUnique({
    where: { userId }
  });

  if (!livreur) {
    throw new Error("Livreur introuvable");
  }

return prisma.livraison.findMany({
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

 
export const getHistoriquePaiementsService = async (userId: number) => {
  if (!userId || isNaN(userId)) throw new Error("userId invalide");

  const livreur = await prisma.livreur.findUnique({ where: { userId } });
  if (!livreur) throw new Error("Livreur introuvable");

  // ✅ Lire depuis PaiementCommission directement
  const paiements = await prisma.paiementCommission.findMany({
    where: { livreurId: livreur.id },
    orderBy: { createdAt: "desc" },
  });

  // ─── GROUP BY DATE ─────────────────────────────
  const groupes: Record<string, any> = {};

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
    .map((g: any) => {
      const pays = g.paiements;

      const totalCommission = pays.reduce(
        (sum: number, p: any) => sum + (p.montant || 0), 0
      );

      // ✅ Plus de bug [].every() — on filtre directement par statut
      const toutesPayees =
        pays.length > 0 && pays.every(
          (p: any) => p.statut === "payee"
        );

      const auMoinsUnePayee =
        pays.length > 0 && pays.some(
          (p: any) => p.statut === "payee"
        );

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

export const revenusService = async (userId: number) => {
  const livreur = await prisma.livreur.findUnique({ where: { userId } });

  const livraisons = await prisma.livraison.findMany({
    where: {
      livreurId: livreur?.id,
      statut: "livree", // 🔥 TRÈS IMPORTANT
    },
    include: { commande: true },
  });

  const COMMISSION_RATE = 0.10;

  const totalBrut = livraisons.reduce(
    (sum, l) => sum + (l.commande?.montant || 0),
    0
  );

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

// ─── Revenus + Commission du jour (cumul sur 24h glissantes) ────────────────
export const revenusJourService = async (userId: number) => {
  if (!userId || isNaN(userId)) throw new Error("userId invalide");

  const livreur = await prisma.livreur.findUnique({ where: { userId } });
  if (!livreur) throw new Error("Livreur introuvable");

  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);

  const livraisons = await prisma.livraison.findMany({
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

  const totalBrutJour = livraisons.reduce(
    (sum, l) => sum + (l.commande?.montant ?? 0), 0
  );
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