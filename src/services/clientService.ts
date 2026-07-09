// services/clientService.ts
// ─────────────────────────────────────────────────────────────────────────────
// NOUVEAU SERVICE — dédié au client final (le "User" avec role CLIENT).
// N'importe/ne modifie aucun fichier existant (auth/admin/livreur inchangés).
//
// Fonctionnalités :
//   - Inscription / connexion (email optionnel)
//   - Profil (lecture, mise à jour, position GPS live, push token)
//   - Création de commande avec assignation automatique au livreur disponible
//     le plus proche (réutilise le même statut "en_attente" que le flux admin,
//     donc le livreur voit la mission apparaître dans son interface existante
//     via getMissionsService — aucune modification requise côté livreur)
//   - Suivi de commande (position du livreur en temps réel, statut)
//   - Annulation de commande
//   - Historique des commandes
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "../prisma/prisma.config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  getDistanceKm,
  getLatLngSmart,
  validateAdresseSenegal,
  getDistanceRouteKmMapbox,
  calculerTarif,
  autocompleteAdresseGoogle,   // + ajout
  getCoordsFromPlaceId,        // + ajout
  reverseGeocodeGoogle,   
} from "./geoService";
import {
  isValidTelephoneSN,
  isValidEmail,
  isStrongPassword,
  isNonEmptyString,
  isValidLat,
  isValidLng,
  sanitizeText,
} from "../utils/validators";

// Essaie de réutiliser le service de push existant s'il est présent dans le projet.
// (services/pushService.ts est déjà utilisé par adminService — même signature.)
let envoyerPushNotification: (
  token: string,
  title: string,
  body: string,
  data?: any
) => Promise<any>;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  envoyerPushNotification = require("./pushService").envoyerPushNotification;
} catch {
  envoyerPushNotification = async () => null; // no-op si le module n'existe pas encore
}

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const BUSINESS_ERRORS = new Set([
  "Ce numéro est déjà utilisé",
  "Cet email est déjà utilisé",
  "Client non trouvé",
  "Mot de passe incorrect",
  "Numéro de téléphone invalide",
  "Adresse email invalide",
  "Mot de passe trop court (6 caractères minimum)",
  "Nom et prénom requis",
  "Commande introuvable",
  "Vous n'êtes pas autorisé à accéder à cette commande",
  "Cette commande ne peut plus être annulée",
  "Adresse de livraison requise",
  "Aucun livreur disponible pour le moment, réessayez dans un instant",
  "Client introuvable",
]);

function wrapTechnicalError(context: string, error: any) {
  if (error instanceof Error && BUSINESS_ERRORS.has(error.message)) throw error;
  console.error(`[clientService:${context}]`, error);
  throw new Error("Service indisponible, réessayez plus tard");
}

const generateToken = (user: any) => {
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
  return {
    token,
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      email: user.email,
      role: user.role,
    },
  };
};

// ═══════════════════════ AUTHENTIFICATION ═══════════════════════

export const registerClientService = async (data: {
  nom: string;
  prenom: string;
  telephone: string;
  password: string;
  email?: string;
  adresse?: string;
}) => {
  try {
    if (!isNonEmptyString(data.nom, 80) || !isNonEmptyString(data.prenom, 80)) {
      throw new Error("Nom et prénom requis");
    }
    if (!isValidTelephoneSN(data.telephone)) {
      throw new Error("Numéro de téléphone invalide");
    }
    if (!isStrongPassword(data.password)) {
      throw new Error("Mot de passe trop court (6 caractères minimum)");
    }
    if (data.email && !isValidEmail(data.email)) {
      throw new Error("Adresse email invalide");
    }

    const telephone = data.telephone.trim();
    const existingTel = await prisma.user.findUnique({ where: { telephone } });
    if (existingTel) throw new Error("Ce numéro est déjà utilisé");

    if (data.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email.trim() } });
      if (existingEmail) throw new Error("Cet email est déjà utilisé");
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        nom: sanitizeText(data.nom, 80),
        prenom: sanitizeText(data.prenom, 80),
        telephone,
        email: data.email ? data.email.trim().toLowerCase() : null,
        password: hashed,
        role: "CLIENT",
        client: {
          create: {
            nom: sanitizeText(data.nom, 80),
            prenom: sanitizeText(data.prenom, 80),
            telephone,
            adresse: data.adresse ? sanitizeText(data.adresse, 255) : "",
            adresseLivraison: "",
            telephoneDestinataire: "",
          },
        },
      },
    });

    return generateToken(user);
  } catch (error) {
    wrapTechnicalError("registerClientService", error);
  }
};

export const loginClientService = async (telephone: string, password: string) => {
  try {
    if (!isValidTelephoneSN(telephone) || !isNonEmptyString(password, 72)) {
      throw new Error("Client non trouvé");
    }

    const user = await prisma.user.findUnique({ where: { telephone: telephone.trim() } });
    if (!user || user.role !== "CLIENT") throw new Error("Client non trouvé");
    if (user.statut !== "actif") throw new Error("Compte désactivé, contactez le support");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Mot de passe incorrect");

    return generateToken(user);
  } catch (error) {
    wrapTechnicalError("loginClientService", error);
  }
};

// ═══════════════════════ PROFIL ═══════════════════════

export const getProfilClientService = async (userId: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });
    if (!user || user.role !== "CLIENT") throw new Error("Client introuvable");
    return user;
  } catch (error) {
    wrapTechnicalError("getProfilClientService", error);
  }
};

export const updateProfilClientService = async (
  userId: number,
  data: { nom?: string; prenom?: string; email?: string; adresse?: string }
) => {
  try {
    if (data.email && !isValidEmail(data.email)) throw new Error("Adresse email invalide");

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user || user.role !== "CLIENT") throw new Error("Client introuvable");

    if (data.email && data.email.trim().toLowerCase() !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
      if (existing) throw new Error("Cet email est déjà utilisé");
    }

    const userUpdate: any = {};
    if (data.nom) userUpdate.nom = sanitizeText(data.nom, 80);
    if (data.prenom) userUpdate.prenom = sanitizeText(data.prenom, 80);
    if (data.email) userUpdate.email = data.email.trim().toLowerCase();

    const updatedUser = await prisma.user.update({ where: { id: userId }, data: userUpdate });

    if (user.client) {
      const clientUpdate: any = {};
      if (data.nom) clientUpdate.nom = sanitizeText(data.nom, 80);
      if (data.prenom) clientUpdate.prenom = sanitizeText(data.prenom, 80);
      if (data.adresse !== undefined) clientUpdate.adresse = sanitizeText(data.adresse, 255);
      if (Object.keys(clientUpdate).length) {
        await prisma.client.update({ where: { id: user.client.id }, data: clientUpdate });
      }
    }

    return updatedUser;
  } catch (error) {
    wrapTechnicalError("updateProfilClientService", error);
  }
};

export const updateLocalisationClientService = async (userId: number, lat: number, lng: number) => {
  try {
    if (!isValidLat(lat) || !isValidLng(lng)) throw new Error("Position GPS invalide");

    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) throw new Error("Client introuvable");

    const adresseTexte = await reverseGeocodeGoogle(lat, lng);

    return await prisma.client.update({
      where: { id: client.id },
      data: {
        latActuelle: lat,
        lngActuelle: lng,
        ...(adresseTexte ? { adresse: adresseTexte } : {}),
      },
    });
  } catch (error) {
    wrapTechnicalError("updateLocalisationClientService", error);
  }
};

export const rechercherAdressesService = async (query: string) => {
  try {
    return await autocompleteAdresseGoogle(query);
  } catch (error) {
    wrapTechnicalError("rechercherAdressesService", error);
  }
};

export const resoudreAdresseService = async (placeId: string) => {
  try {
    if (!isNonEmptyString(placeId, 300)) throw new Error("Adresse invalide");
    return await getCoordsFromPlaceId(placeId);
  } catch (error) {
    wrapTechnicalError("resoudreAdresseService", error);
  }
};

export const savePushTokenClientService = async (userId: number, token: string) => {
  try {
    if (!isNonEmptyString(token, 500)) throw new Error("Token invalide");
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) throw new Error("Client introuvable");
    return await prisma.client.update({ where: { id: client.id }, data: { pushToken: token } });
  } catch (error) {
    wrapTechnicalError("savePushTokenClientService", error);
  }
};

// ═══════════════════════ COMMANDES ═══════════════════════

/**
 * Trouve, parmi les livreurs disponibles/actifs/non-bloqués/validés, celui qui
 * est géographiquement le plus proche du point de départ donné.
 * (Logique volontairement autonome — n'importe pas adminService pour rester
 * un module 100% nouveau et indépendant.)
 */
async function trouverLivreurLePlusProche(depart: { lat: number; lng: number }) {
  const deuxHeuresAvant = new Date(Date.now() - 2 * 60 * 60 * 1000);

  let livreurs = await prisma.livreur.findMany({
    where: {
      disponible: true,
      estBloque: false,
      profilValide: true,
      latActuelle: { not: null },
      lngActuelle: { not: null },
      derniereActivite: { gte: deuxHeuresAvant },
      user: { statut: "actif" },
    },
  });

  if (livreurs.length === 0) {
    livreurs = await prisma.livreur.findMany({
      where: {
        disponible: true,
        estBloque: false,
        profilValide: true,
        latActuelle: { not: null },
        lngActuelle: { not: null },
        user: { statut: "actif" },
      },
    });
  }

  if (livreurs.length === 0) return null;

  let plusProche = livreurs[0];
  let distanceMin = Infinity;

  for (const l of livreurs) {
    const dist = getDistanceKm(depart.lat, depart.lng, l.latActuelle!, l.lngActuelle!);
    if (dist < distanceMin) {
      distanceMin = dist;
      plusProche = l;
    }
  }

  return { livreur: plusProche, distanceKm: Math.round(distanceMin * 100) / 100 };
}

export const creerCommandeService = async (
  userId: number,
  data: {
    adresseDepart?: string;      // texte libre, optionnel si departCoords fourni
    departCoords?: { lat: number; lng: number }; // ex: position GPS live du client
    adresseLivraison: string;
    adresseLivraisonCoords?: { lat: number; lng: number };
    telephoneDestinataire: string;
    nomExpediteur?: string;
    nomDestinataire?: string;
  }
) => {
  try {
    if (!isNonEmptyString(data.adresseLivraison, 255)) throw new Error("Adresse de livraison requise");
    if (!isValidTelephoneSN(data.telephoneDestinataire)) throw new Error("Numéro de téléphone invalide");

    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) throw new Error("Client introuvable");

    // ── Point de départ : coords GPS fournies en priorité, sinon position live
    //    enregistrée du client, sinon géocodage de l'adresse texte ──────────
    let depart: { lat: number; lng: number };
    if (data.departCoords && isValidLat(data.departCoords.lat) && isValidLng(data.departCoords.lng)) {
      depart = data.departCoords;
    } else if (client.latActuelle != null && client.lngActuelle != null) {
      depart = { lat: client.latActuelle, lng: client.lngActuelle };
    } else if (data.adresseDepart) {
      depart = await validateAdresseSenegal(data.adresseDepart);
    } else {
      throw new Error("Position de départ introuvable, activez votre localisation");
    }

    // ── Destination ─────────────────────────────────────────────────────────
    let dest: { lat: number; lng: number };
    if (
      data.adresseLivraisonCoords &&
      isValidLat(data.adresseLivraisonCoords.lat) &&
      isValidLng(data.adresseLivraisonCoords.lng)
    ) {
      dest = data.adresseLivraisonCoords;
    } else {
      dest = await validateAdresseSenegal(data.adresseLivraison);
    }

    const distanceKm = await getDistanceRouteKmMapbox(depart, dest);
    const { montant, commission } = calculerTarif(distanceKm);

    // Met à jour l'adresse par défaut du client (pratique pour "livraisons fréquentes")
    await prisma.client.update({
      where: { id: client.id },
      data: {
        adresseLivraison: sanitizeText(data.adresseLivraison, 255),
        telephoneDestinataire: data.telephoneDestinataire.trim(),
        ...(data.adresseDepart ? { adresse: sanitizeText(data.adresseDepart, 255) } : {}),
      },
    });

    const commande = await prisma.commande.create({
      data: {
        clientId: client.id,
        montant,
        commission,
        statut: "en_attente",
        adresseDepart: data.adresseDepart ? sanitizeText(data.adresseDepart, 255) : null,
        adresseLivraison: sanitizeText(data.adresseLivraison, 255),
        telephoneDestinataire: data.telephoneDestinataire.trim(),
        departLat: depart.lat,
        departLng: depart.lng,
        destLat: dest.lat,
        destLng: dest.lng,
      },
    });

    // ── Assignation automatique au livreur disponible le plus proche ────────
    const match = await trouverLivreurLePlusProche(depart);

    if (!match) {
      // La commande reste "en_attente" sans livreur : un admin pourra
      // l'assigner manuellement dès qu'un livreur redevient disponible.
      return {
        commande,
        livraison: null,
        livreur: null,
        message: "Commande créée. Recherche d'un livreur disponible en cours...",
      };
    }

    const livraison = await prisma.livraison.create({
      data: {
        commandeId: commande.id,
        livreurId: match.livreur.id,
        statut: "en_attente",
        destinationLat: dest.lat,
        destinationLng: dest.lng,
      },
    });

    if (match.livreur.pushToken) {
      await envoyerPushNotification(
        match.livreur.pushToken,
        "🚀 Nouvelle mission disponible !",
        `Une nouvelle commande vous a été assignée (${match.distanceKm} km). Ouvrez l'app pour accepter.`,
        { screen: "home", commandeId: commande.id }
      );
    }

    return {
      commande,
      livraison,
      livreur: {
        id: match.livreur.id,
        distanceKm: match.distanceKm,
      },
      message: "Commande créée, un livreur a été notifié",
    };
  } catch (error) {
    wrapTechnicalError("creerCommandeService", error);
  }
};

export const listerCommandesClientService = async (userId: number) => {
  try {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) throw new Error("Client introuvable");

    return await prisma.commande.findMany({
      where: { clientId: client.id, deletedAt: null },
      include: {
        livraisons: {
          include: { livreur: { include: { user: true } } },
          orderBy: { id: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    wrapTechnicalError("listerCommandesClientService", error);
  }
};

export const suivreCommandeService = async (userId: number, commandeId: number) => {
  try {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) throw new Error("Client introuvable");

    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        livraisons: {
          include: { livreur: { include: { user: true } } },
          orderBy: { id: "desc" },
        },
      },
    });

    if (!commande) throw new Error("Commande introuvable");
    if (commande.clientId !== client.id) throw new Error("Vous n'êtes pas autorisé à accéder à cette commande");

    const livraisonActive = commande.livraisons[0] ?? null;

    return {
      commande: {
        id: commande.id,
        statut: commande.statut,
        montant: commande.montant,
        adresseDepart: commande.adresseDepart,
        adresseLivraison: commande.adresseLivraison,
        telephoneDestinataire: commande.telephoneDestinataire,
        departLat: commande.departLat,
        departLng: commande.departLng,
        destLat: commande.destLat,
        destLng: commande.destLng,
        createdAt: commande.createdAt,
      },
      livreur: livraisonActive
        ? {
            id: livraisonActive.livreur.id,
            nom: livraisonActive.livreur.user.nom,
            prenom: livraisonActive.livreur.user.prenom,
            telephone: livraisonActive.livreur.user.telephone,
            lat: livraisonActive.livreur.latActuelle,
            lng: livraisonActive.livreur.lngActuelle,
            statutLivraison: livraisonActive.statut,
          }
        : null,
    };
  } catch (error) {
    wrapTechnicalError("suivreCommandeService", error);
  }
};

export const annulerCommandeClientService = async (userId: number, commandeId: number) => {
  try {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) throw new Error("Client introuvable");

    const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
    if (!commande) throw new Error("Commande introuvable");
    if (commande.clientId !== client.id) throw new Error("Vous n'êtes pas autorisé à accéder à cette commande");
    if (["livree", "annulee", "supprimé"].includes(commande.statut)) {
      throw new Error("Cette commande ne peut plus être annulée");
    }

    await prisma.$transaction([
      prisma.commande.update({
        where: { id: commandeId },
        data: { statut: "annulee", annulePar: "client" },
      }),
      prisma.livraison.updateMany({
        where: { commandeId },
        data: { statut: "annulee" },
      }),
    ]);

    return { message: "Commande annulée avec succès" };
  } catch (error) {
    wrapTechnicalError("annulerCommandeClientService", error);
  }
};
