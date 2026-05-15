import { prisma } from "../prisma/prisma.config";
import axios from "axios";

import cloudinary from "../config/cloudinary";
import { Readable } from "stream";
import { envoyerPushNotification } from "./pushService";





const uploadToCloudinary = (
  file: Express.Multer.File,
  folder: string,
  publicId: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(file.buffer).pipe(uploadStream);
  });
};
// ===== Tarifs =====
const TARIF_KM = 100;
const TARIF_BASE = 300;

// ===== CLIENTS =====
export const getClientsService = async () => prisma.client.findMany();

/* export const createOrGetClientService = async (data: any) => {
  let client = await prisma.client.findUnique({ where: { telephone: data.telephone } });
  if (!client) client = await prisma.client.create({ data });
  return client;
};
 */
export const updateClientService = async (clientId: number, data: any) =>
  prisma.client.update({ where: { id: clientId }, data });

export const getClientHistoriqueService = async (clientId: number) =>
  prisma.commande.findMany({ where: { clientId }, include: { client: true } });

export const getClientByIdService = async (clientId: number) =>
  prisma.client.findUnique({ where: { id: clientId } });

export const deleteClientService = async (clientId: number) =>
  prisma.client.delete({ where: { id: clientId } });


export const createClientEtCommandeService = async (data: any) => {
  const client = await prisma.client.create({
    data: {
      nom:                   data.nom,
      prenom:                data.prenom,
      telephone:             data.telephone,
      telephoneDestinataire: data.telephoneDestinataire,
 
      // ✅ Stocker le texte lisible en base (pas les coords brutes)
      adresse:          data.adresse,
      adresseLivraison: data.adresseLivraison,
    },
  });
 
  const commande = await createCommandeService({
    clientId:         client.id,
    adresseLivraison: data.adresseLivraison,
 
    // ✅ Passer les coords exactes si disponibles (court-circuite le géocodage)
    departCoords:      data.adresseCoords          ?? null,
    destinationCoords: data.adresseLivraisonCoords ?? null,
  });
 
  return { client, commande };
};


// ===== SUPPRIMER UNE COMMANDE =====
export const deleteCommandeService = async (commandeId: number) =>
  prisma.commande.delete({ where: { id: commandeId } });




// ===== DISTANCE À VOL D'OISEAU (Haversine) =====
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ===== NORMALISATION ADRESSE =====
function normalizeAdresse(adresse: string) {
  let cleaned = adresse.replace(/\+/g, " ").trim();

  // Ajouter Sénégal si absent
  if (
    !cleaned.toLowerCase().includes("senegal") &&
    !cleaned.toLowerCase().includes("sénégal")
  ) {
    cleaned += ", Senegal";
  }

  return cleaned;
}
function simplifierAdresse(adresse: string): string {
  const premiereMention = adresse.split(",")[0].trim();
  return premiereMention + ", Senegal";
}
function isCoord(obj: any): obj is { lat: number; lng: number } {
  return obj && typeof obj.lat === "number" && typeof obj.lng === "number";
}

// ===== GÉOCODAGE — Nominatim =====
async function getLatLngSmart(adresse: string): Promise<{ lat: number; lng: number }> {
 
  // ── PRIORITÉ 1 : coords brutes "lat,lng" envoyées par le frontend ─────────
  // Le frontend stocke désormais les coords exactes quand l'utilisateur
  // colle un lien Google Maps ou un Plus Code.
  // On détecte le format et on retourne immédiatement, sans aucun appel API.
  const rawCoord = adresse.trim().match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (rawCoord) {
    const lat = parseFloat(rawCoord[1]);
    const lng = parseFloat(rawCoord[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      console.log("📍 Coords directes (pas de géocodage) :", { lat, lng });
      return { lat, lng };
    }
  }
 
  // ── PRIORITÉ 2 : Nominatim adresse complète, restreint Sénégal ───────────
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: adresse,
        format: "json",
        limit: 1,
        countrycodes: "sn",
        viewbox: "-17.5,16.7,-11.3,12.3",
        bounded: 1,
      },
      headers: {
        "User-Agent": "BoomExpressApp/1.0 (seckrama098@gmail.com)",
        "Accept-Language": "fr-FR",
      },
    });
    if (res.data?.length > 0) {
      const lat = parseFloat(res.data[0].lat);
      const lng = parseFloat(res.data[0].lon);
      console.log("📍 Nominatim OK:", res.data[0].display_name, { lat, lng });
      return { lat, lng };
    }
  } catch (_) {}
 
  // ── PRIORITÉ 3 : Nominatim adresse simplifiée (plus permissif) ───────────
  try {
    const simplified = simplifierAdresse(adresse);
    console.log("⚠️ Fallback Nominatim simplifié:", simplified);
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: simplified, format: "json", limit: 1, countrycodes: "sn" },
      headers: {
        "User-Agent": "BoomExpressApp/1.0 (seckrama098@gmail.com)",
        "Accept-Language": "fr-FR",
      },
    });
    if (res.data?.length > 0) {
      const lat = parseFloat(res.data[0].lat);
      const lng = parseFloat(res.data[0].lon);
      console.log("📍 Nominatim simplifié OK:", res.data[0].display_name, { lat, lng });
      return { lat, lng };
    }
  } catch (_) {}
 
  // ── PRIORITÉ 4 : Mapbox (fallback final pour adresses texte) ─────────────
  console.log("⚠️ Fallback Mapbox:", adresse);
  return await getLatLngFromMapbox(adresse);
}
// ===== GÉOCODAGE — Mapbox =====
async function getLatLngFromMapbox(adresse: string): Promise<{ lat: number; lng: number }> {
  const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  const encoded = encodeURIComponent(adresse);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`;

  const res = await axios.get(url, {
    params: {
      access_token: ACCESS_TOKEN,
      limit: 1,
      language: "fr",
      proximity: "-16.4896,16.0178", // centre de Saint-Louis
      country: "SN",
    },
  });

  console.log("📍 Mapbox adresse:", adresse);
  console.log("📍 Mapbox résultat:", res.data.features?.[0]?.place_name);
  console.log("📍 Mapbox coords:", res.data.features?.[0]?.center);

  if (!res.data.features || res.data.features.length === 0)
    throw new Error(`Adresse "${adresse}" introuvable via Mapbox`);

  const [lng, lat] = res.data.features[0].center;
  return { lat, lng };
}

// ===== VALIDATION ZONE SAINT-LOUIS =====
async function validateAdresseSaintLouis(adresse: string) {
  const normalized = normalizeAdresse(adresse);
  const coords = await getLatLngSmart(normalized);

  // Bounding box élargie — couvre Saint-Louis + banlieue + périphérie
  const latMin = 15.7, latMax = 16.4;
  const lngMin = -16.8, lngMax = -15.9;

  if (
    coords.lat < latMin || coords.lat > latMax ||
    coords.lng < lngMin || coords.lng > lngMax
  ) {
    throw new Error("L'adresse est hors de la zone de Saint-Louis");
  }

  return coords;
}


// ===== VALIDATION ZONE SÉNÉGAL =====
async function validateAdresseSenegal(adresse: string) {
  const normalized = normalizeAdresse(adresse);
  const coords = await getLatLngSmart(normalized);

  // Bounding box du Sénégal entier
  const latMin = 12.3, latMax = 16.7;
  const lngMin = -17.5, lngMax = -11.3;

  if (
    coords.lat < latMin || coords.lat > latMax ||
    coords.lng < lngMin || coords.lng > lngMax
  ) {
    throw new Error("L'adresse est hors du Sénégal");
  }

  return coords;
}
// ===== DISTANCE ROUTE — Mapbox Directions =====
async function getDistanceRouteKmMapbox(
  depart: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<number> {
  const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  const coords = `${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`;

  const res = await axios.get(url, {
    params: { access_token: ACCESS_TOKEN, geometries: "geojson" },
  });

  if (!res.data.routes || res.data.routes.length === 0) {
    // Fallback : distance à vol d'oiseau × 1.3
    const distanceVol = getDistanceKm(depart.lat, depart.lng, dest.lat, dest.lng);
    return Math.max(1, Math.round(distanceVol * 1.3 * 100) / 100);
  }

  const distance = res.data.routes[0].distance / 1000; // m → km
  return Math.max(1, Math.round(distance * 100) / 100);
}

// ===== DISTANCE ROUTE — OSRM (fallback gratuit) =====
async function getDistanceRouteKmOSRM(
  depart: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<number> {
  const url = `http://router.project-osrm.org/route/v1/driving/${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
  const res = await axios.get(url, { params: { overview: "false" } });

  console.log("🛣️ OSRM status:", res.data.code);

  if (!res.data.routes || res.data.routes.length === 0) {
    const distanceVol = getDistanceKm(depart.lat, depart.lng, dest.lat, dest.lng);
    return Math.max(1, Math.round(distanceVol * 1.3 * 100) / 100);
  }

  const distance = res.data.routes[0].distance / 1000;
  return Math.max(1, Math.round(distance * 100) / 100);
}

// ===== CRÉER UNE COMMANDE =====
export const createCommandeService = async (data: any) => {
  const client = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!client) throw new Error("Client introuvable");
 
  const livraisonAdresse = data.adresseLivraison || client.adresseLivraison;
  if (!livraisonAdresse) throw new Error("Adresse de livraison introuvable");
 
  let depart:  { lat: number; lng: number };
  let dest:    { lat: number; lng: number };
 
  // ✅ Utiliser les coords directes si transmises (pas de géocodage = position exacte)
  if (data.departCoords) {
    const [lat, lng] = data.departCoords.split(",").map(Number);
    depart = { lat, lng };
    console.log("📍 Départ coords directes :", depart);
  } else {
    depart = await validateAdresseSenegal(client.adresse as string);
  }
 
  if (data.destinationCoords) {
    const [lat, lng] = data.destinationCoords.split(",").map(Number);
    dest = { lat, lng };
    console.log("📍 Destination coords directes :", dest);
  } else {
    dest = await validateAdresseSenegal(livraisonAdresse as string);
  }
 
  const distanceKm = await getDistanceRouteKmMapbox(depart, dest);
  console.log("📏 Distance (km):", distanceKm);
 
  const montant    = TARIF_BASE + Math.ceil(distanceKm) * TARIF_KM;
  const commission = montant * 0.1;
 
  const commande = await prisma.commande.create({
    data: {
      clientId:       client.id,
      montant,
      commission,
      statut:         "en_attente",
      commissionPaye: false,
    },
  });
 
  return commande;
};
 
// ===== LISTER LES COMMANDES =====
export const getCommandesService = async (query: any) => {
  const { statut, dateDebut, dateFin } = query;

  const filter: any = {
    deletedAt: null, // 👈 IMPORTANT : cache les supprimées
  };

  if (statut) filter.statut = statut;

  if (dateDebut || dateFin) filter.createdAt = {};
  if (dateDebut) filter.createdAt.gte = new Date(dateDebut);
  if (dateFin) filter.createdAt.lte = new Date(dateFin);

  return prisma.commande.findMany({
    where: filter,
    include: {
      client: true,
      livraisons: {
        include: {
          livreur: {
            include: {
              user: true, // ✔ OK
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc", // bonus utile
    },
  });
};

export const updateCommandeService = async (commandeId: number, data: any) =>
  prisma.commande.update({ where: { id: commandeId }, data });

export const assignerCommandeService = async (commandeId: number, livreurId: number) => {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { client: true },
  });
  if (!commande) throw new Error("Commande introuvable");

const livreur = await prisma.livreur.findUnique({
  where: { id: livreurId },
});

const livraison = await prisma.livraison.create({
  data: { commandeId, livreurId, statut: "en_attente" },
});

if (livreur?.pushToken) {
  await envoyerPushNotification(
    livreur.pushToken,
    "🚀 Nouvelle mission disponible !",
    `Une nouvelle commande vous a été assignée. Ouvrez l'app pour accepter.`,
    { screen: "home", commandeId }
  );
}

  return livraison;
};
export const assignerCommandeAuPlusProche = async (commandeId: number) => {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { client: true },
  });
  if (!commande) throw new Error("Commande introuvable");

  const dixMinutesAvant = new Date(Date.now() - 10 * 60 * 1000);

  const livreurs = await prisma.livreur.findMany({
    where: {
      disponible:      true,
      estBloque:       false,
      profilValide:    true,
      latActuelle:     { not: null },  // ✅ vrai nom
      lngActuelle:     { not: null },  // ✅ vrai nom
      derniereActivite: { gte: dixMinutesAvant },
      user:            { statut: "actif" },
    },
    include: { user: true },
  });

  if (livreurs.length === 0)
    throw new Error("Aucun livreur disponible avec une position récente");

  const departCoords = await getLatLngSmart(commande.client?.adresse as string);
  if (!departCoords) throw new Error("Impossible de géocoder l'adresse de départ");

  let plusProche = livreurs[0];
  let distanceMin = Infinity;

  for (const livreur of livreurs) {
    const dist = getDistanceKm(
      departCoords.lat, departCoords.lng,
      livreur.latActuelle!,  // ✅ vrai nom
      livreur.lngActuelle!   // ✅ vrai nom
    );
    if (dist < distanceMin) {
      distanceMin = dist;
      plusProche  = livreur;
    }
  }

const livraison = await prisma.livraison.create({
  data: { commandeId, livreurId: plusProche.id, statut: "en_attente" },
});

if (plusProche.pushToken) {
  await envoyerPushNotification(
    plusProche.pushToken,
    "🚀 Nouvelle mission disponible !",
    `Une nouvelle commande vous a été assignée. Ouvrez l'app pour accepter.`,
    { screen: "home", commandeId }
  );
}
  return {
    livraison,
    livreur:    plusProche,
    distanceKm: Math.round(distanceMin * 100) / 100,
  };
};

export const annulerCommandeService = async (commandeId: number) => {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { livraisons: true },
  });

  if (!commande) throw new Error("Commande introuvable");

  // annuler commande
  await prisma.commande.update({
    where: { id: commandeId },
    data: { statut: "annulee" },
  });

  // annuler toutes les livraisons liées
  await prisma.livraison.updateMany({
    where: { commandeId },
    data: { statut: "annulee" },
  });

  return { message: "Commande annulée avec succès" };
};

// admin.service.ts

export const supprimerCommandeService = async (commandeId: number) => {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
  });

  if (!commande) throw new Error("Commande introuvable");

  return prisma.commande.update({
    where: { id: commandeId },
    data: {
      statut: "supprimé",
      deletedAt: new Date(),
    },
  });
};

// ===== POSITIONS EN TEMPS RÉEL DES LIVREURS =====
export const getLivreursPositionsService = async () => {
  const livreurs = await prisma.livreur.findMany({
    include: { user: true },
  });

  return livreurs.map((l) => ({
    id:               l.id,
    nom:              l.user.nom,
    prenom:           l.user.prenom,
    telephone:        l.user.telephone,
    disponible:       l.disponible,
    estBloque:        l.estBloque,
    profilValide:     l.profilValide,
    statut:           l.user.statut,
    lat:              l.latActuelle,
    lng:              l.lngActuelle,
    derniereActivite: l.derniereActivite,
  }));
};
// ===== LIVREURS =====
export const getLivreursService = async () =>
  prisma.livreur.findMany({ include: { user: true } });

export const getProfilLivreurService = async (livreurId: number) =>
  prisma.livreur.findUnique({ where: { id: livreurId }, include: { user: true } });

export const toggleCompteLivreurService = async (livreurId: number) => {
  const livreur = await prisma.livreur.findUnique({
    where: { id: livreurId },
    include: { user: true },
  });
  if (!livreur) throw new Error("Livreur introuvable");

  return prisma.user.update({
    where: { id: livreur.userId },
    data: { statut: livreur.user.statut === "actif" ? "inactif" : "actif" },
  });
};

// ===== PAIEMENTS — Payer toutes les commissions d'un livreur =====
export const marquerPaiementLivreurByLivreurService = async (livreurId: number) => {
  const commandes = await prisma.commande.findMany({
    where: {
      commissionPaye: false,
      livraisons: { some: { livreurId, statut: "livree" } },
    },
  });

  if (commandes.length === 0)
    throw new Error("Aucune commission en attente pour ce livreur");

  const montantTotal = commandes.reduce((sum, cmd) => sum + (cmd.commission || 0), 0);

  await prisma.$transaction(async (tx) => {
    await tx.commande.updateMany({
      where: { id: { in: commandes.map(c => c.id) } },
      data: { commissionPaye: true },
    });
    await tx.paiementCommission.create({
      data: {
        livreurId,
        montant: parseFloat(montantTotal.toFixed(2)),
        statut:  "payee",
      },
    });
  });

  return { livreurId, montantTotal, commandesPayees: commandes.length };
};
// ===== PAIEMENTS — Payer les commissions d'un jour précis =====
export const marquerPaiementJourService = async (livreurId: number, date: string) => {
  const debut = new Date(date); debut.setHours(0, 0, 0, 0);
  const fin   = new Date(date); fin.setHours(23, 59, 59, 999);

  const commandes = await prisma.commande.findMany({
    where: {
      commissionPaye: false,
      livraisons: {
        some: { livreurId, statut: "livree", dateLivraison: { gte: debut, lte: fin } },
      },
    },
  });

  if (commandes.length === 0)
    throw new Error("Aucune commission non payée pour ce jour");

  const montantTotal = commandes.reduce((sum, cmd) => sum + (cmd.commission || 0), 0);

  await prisma.$transaction(async (tx) => {
    await tx.commande.updateMany({
      where: { id: { in: commandes.map(c => c.id) } },
      data: { commissionPaye: true },
    });
    await tx.paiementCommission.updateMany({
      where: { livreurId, statut: "en_attente" },
      data: { statut: "payee" },
    });
  });

  return {
    livreurId,
    date,
    montantTotal:    parseFloat(montantTotal.toFixed(2)),
    commandesPayees: commandes.length,
  };
};

// ===== BLOCAGE =====
export const bloquerLivreurService = async ({ livreurId, raison }: any) => {
  const livreur = await prisma.livreur.findUnique({ where: { id: livreurId } });
  if (!livreur) throw new Error("Livreur introuvable");

  const blocage = await prisma.blocage.create({
    data: { livreurId, raison, actif: true },
  });

  await prisma.user.update({
    where: { id: livreur.userId },
    data: { statut: "inactif" },
  });

  return blocage;
};


// ===== COMMISSIONS DU JOUR — Vue admin par livreur =====
export const getCommissionsJourAdminService = async (date?: string) => {
  const jour = date ? new Date(date) : new Date();

  const debut = new Date(jour); debut.setHours(0, 0, 0, 0);
  const fin   = new Date(jour); fin.setHours(23, 59, 59, 999);

  // Toutes les livraisons livrées ce jour-là, groupées par livreur
  const livraisons = await prisma.livraison.findMany({
    where: {
      statut:        "livree",
      dateLivraison: { gte: debut, lte: fin },
    },
    include: {
      commande: true,
      livreur:  { include: { user: true } },
    },
    orderBy: { dateLivraison: "asc" },
  });

  // Grouper par livreurId
  const grouped: Record<number, {
    livreur:     any;
    livraisons:  any[];
    total:       number;
    commission:  number;
    statut:      "payee" | "en_attente" | "partielle";
  }> = {};

  for (const liv of livraisons) {
    const lid = liv.livreurId;

    if (!grouped[lid]) {
      grouped[lid] = {
        livreur:    liv.livreur,
        livraisons: [],
        total:      0,
        commission: 0,
        statut:     "en_attente",
      };
    }

    const montant    = liv.commande?.montant    ?? 0;
    const commission = liv.commande?.commission ?? montant * 0.10;

    grouped[lid].livraisons.push({
      livraisonId:     liv.id,
      commandeId:      liv.commandeId,
      montant,
      commission:      parseFloat(commission.toFixed(2)),
      dateLivraison:   liv.dateLivraison,
      commissionPayee: liv.commande?.commissionPaye ?? false,
    });

    grouped[lid].total      += montant;
    grouped[lid].commission += commission;
  }

  // Calculer le statut de paiement global par livreur
  return Object.values(grouped).map((g) => {
    const toutes  = g.livraisons.every((l) => l.commissionPayee);
    const aucune  = g.livraisons.every((l) => !l.commissionPayee);

    return {
      livreurId:        g.livreur.id,
      nom:              g.livreur.user.nom,
      prenom:           g.livreur.user.prenom,
      telephone:        g.livreur.user.telephone,
      nombreLivraisons: g.livraisons.length,
      totalBrut:        parseFloat(g.total.toFixed(2)),
      totalCommission:  parseFloat(g.commission.toFixed(2)),
      statut:           toutes ? "payee" : aucune ? "en_attente" : "partielle",
      livraisons:       g.livraisons,
    };
  });
};


// ===== STATS GLOBALES COMMISSIONS =====
export const getStatsCommissionsGlobalesService = async () => {
  // Toutes les commandes livrées
  const commandes = await prisma.commande.findMany({
    where: {
      livraisons: {
        some: {
          statut: "livree",
        },
      },
    },
    include: {
      livraisons: true,
    },
  });

  const totalCommission = commandes.reduce(
    (sum, cmd) => sum + (cmd.commission || 0),
    0
  );

  const totalPayees = commandes
    .filter(cmd => cmd.commissionPaye)
    .reduce((sum, cmd) => sum + (cmd.commission || 0), 0);

  const totalImpayees = commandes
    .filter(cmd => !cmd.commissionPaye)
    .reduce((sum, cmd) => sum + (cmd.commission || 0), 0);

  const totalLivraisons = commandes.reduce(
    (sum, cmd) => sum + cmd.livraisons.length,
    0
  );

  return {
    totalCommission: parseFloat(totalCommission.toFixed(2)),
    totalPayees: parseFloat(totalPayees.toFixed(2)),
    totalImpayees: parseFloat(totalImpayees.toFixed(2)),
    totalLivraisons,
  };
};


// ===== LIVREURS AVEC STATUT COMMISSIONS =====
export const getLivreursStatutCommissionsService = async () => {
  const livreurs = await prisma.livreur.findMany({
    include: { user: true },
  });

  return Promise.all(
    livreurs.map(async (livreur) => {
      const [count, agg] = await Promise.all([
        prisma.commande.count({
          where: {
            commissionPaye: false,
            livraisons: { some: { livreurId: livreur.id, statut: "livree" } },
          },
        }),
        prisma.commande.aggregate({
          where: {
            commissionPaye: false,
            livraisons: { some: { livreurId: livreur.id, statut: "livree" } },
          },
          _sum: { commission: true },
        }),
      ]);

      return {
        livreurId:           livreur.id,
        nom:                 livreur.user.nom,
        prenom:              livreur.user.prenom,
        telephone:           livreur.user.telephone,
        statutCompte:        livreur.user.statut,
        estBloque:           livreur.estBloque,          // ✅ inclus
        commissionsImpayees: count,
        montantImpaye:       parseFloat((agg._sum.commission ?? 0).toFixed(2)),
      };
    })
  );
};

// ===== BLOQUER UN LIVREUR POUR COMMISSION IMPAYÉE =====
export const bloquerLivreurCommissionImpayeeService = async (livreurId: number) => {
  const livreur = await prisma.livreur.findUnique({
    where: { id: livreurId },
    include: { user: true },
  });
  if (!livreur) throw new Error("Livreur introuvable");

  const commissionsImpayees = await prisma.commande.findMany({
    where: {
      commissionPaye: false,
      livraisons: { some: { livreurId, statut: "livree" } },
    },
  });

  if (commissionsImpayees.length === 0)
    throw new Error("Ce livreur n'a aucune commission impayée");

  const montantDu = commissionsImpayees.reduce(
    (sum, cmd) => sum + (cmd.commission || 0),
    0
  );

  const raison = `Commission impayée : ${commissionsImpayees.length} livraison(s) — montant dû : ${montantDu.toFixed(2)} FCFA`;

  const [blocage] = await prisma.$transaction([
    prisma.blocage.create({
      data: { livreurId, raison, actif: true },
    }),
    prisma.livreur.update({
      where: { id: livreurId },
      data:  { estBloque: true },           // ✅ marque bloqué
    }),
    prisma.user.update({
      where: { id: livreur.userId },
      data:  { statut: "inactif" },
    }),
  ]);

  return {
    blocage,
    livreurId,
    nombreCommissionsImpayees: commissionsImpayees.length,
    montantDu: parseFloat(montantDu.toFixed(2)),
  };
};

// ===== DÉBLOQUER UN LIVREUR =====
export const debloquerLivreurService = async (livreurId: number) => {
  const livreur = await prisma.livreur.findUnique({
    where: { id: livreurId },
    include: { user: true },
  });
  if (!livreur) throw new Error("Livreur introuvable");
  if (!livreur.estBloque) throw new Error("Ce livreur n'est pas bloqué");

  await prisma.$transaction([
    // Désactiver tous les blocages actifs
    prisma.blocage.updateMany({
      where: { livreurId, actif: true },
      data:  { actif: false },
    }),
    // Marquer comme débloqué
    prisma.livreur.update({
      where: { id: livreurId },
      data:  { estBloque: false },
    }),
    // Réactiver le compte
    prisma.user.update({
      where: { id: livreur.userId },
      data:  { statut: "actif" },
    }),
  ]);

  return { livreurId, message: "Livreur débloqué avec succès" };
};

//document
export const uploadDocumentsLivreurService = async (
  livreurId: number,
  files: { [fieldname: string]: Express.Multer.File[] }
) => {
  const livreur = await prisma.livreur.findUnique({ where: { id: livreurId } });
  if (!livreur) throw new Error("Livreur introuvable");

  const get = (field: string) => files[field]?.[0];
  const folder = `boom-express/livreurs/${livreurId}`;

  const existing = await prisma.documentLivreur.findUnique({ where: { livreurId } });

  if (!existing && (!get("cni_recto") || !get("cni_verso")))
    throw new Error("CNI recto et verso sont obligatoires");

  const data: any = { updatedAt: new Date() };

  // Upload chaque fichier présent vers Cloudinary
  const fields = [
    { field: "cni_recto",      urlKey: "cniRectoUrl",       pidKey: "cniRectoPublicId" },
    { field: "cni_verso",      urlKey: "cniVersoUrl",        pidKey: "cniVersoPublicId" },
    { field: "permis",         urlKey: "permisUrl",          pidKey: "permisPublicId" },
    { field: "assurance",      urlKey: "assuranceUrl",       pidKey: "assurancePublicId" },
    { field: "recepisse_moto", urlKey: "recepisseUrl",       pidKey: "recepissePublicId" },
  ];

  for (const { field, urlKey, pidKey } of fields) {
    const file = get(field);
    if (file) {
      const result = await uploadToCloudinary(file, folder, field);
      data[urlKey] = result.url;
      data[pidKey] = result.publicId;
    }
  }

  return prisma.documentLivreur.upsert({
    where:  { livreurId },
    create: {
      livreurId,
      cniRectoUrl:       data.cniRectoUrl,
      cniRectoPublicId:  data.cniRectoPublicId,
      cniVersoUrl:       data.cniVersoUrl,
      cniVersoPublicId:  data.cniVersoPublicId,
      permisUrl:         data.permisUrl         ?? null,
      permisPublicId:    data.permisPublicId     ?? null,
      assuranceUrl:      data.assuranceUrl       ?? null,
      assurancePublicId: data.assurancePublicId  ?? null,
      recepisseUrl:      data.recepisseUrl       ?? null,
      recepissePublicId: data.recepissePublicId  ?? null,
    },
    update: data,
  });
};


// ===== VALIDER LE PROFIL LIVREUR =====
export const validerProfilLivreurService = async (livreurId: number) => {
  const docs = await prisma.documentLivreur.findUnique({ where: { livreurId } });

  if (!docs || !docs.cniRectoUrl || !docs.cniVersoUrl)
    throw new Error("CNI recto et verso obligatoires avant validation");

  return prisma.livreur.update({
    where:   { id: livreurId },
    data:    { profilValide: true, estVerifie: true },
    include: { user: true, documents: true },
  });
};

// ===== RÉCUPÉRER LES DOCUMENTS D'UN LIVREUR =====
export const getDocumentsLivreurService = async (livreurId: number) => {
  return prisma.documentLivreur.findMany({
    where:   { livreurId },
    orderBy: { createdAt: "desc" },
  });
};

// ===== SUPPRIMER UN DOCUMENT =====
export const supprimerDocumentService = async (
  livreurId: number,
  type: "cni_recto" | "cni_verso" | "permis" | "assurance" | "recepisse_moto"
) => {
  const doc = await prisma.documentLivreur.findUnique({ where: { livreurId } });
  if (!doc) throw new Error("Document introuvable");

  const pidMap: Record<string, string | null> = {
    cni_recto:      doc.cniRectoPublicId,
    cni_verso:      doc.cniVersoPublicId,
    permis:         doc.permisPublicId,
    assurance:      doc.assurancePublicId,
    recepisse_moto: doc.recepissePublicId,
  };

  const publicId = pidMap[type];
  if (publicId) await cloudinary.uploader.destroy(publicId);

  // Mettre le champ à null dans la DB
  const nullMap: Record<string, any> = {
    cni_recto:      { cniRectoUrl: null, cniRectoPublicId: null },
    cni_verso:      { cniVersoUrl: null, cniVersoPublicId: null },
    permis:         { permisUrl: null, permisPublicId: null },
    assurance:      { assuranceUrl: null, assurancePublicId: null },
    recepisse_moto: { recepisseUrl: null, recepissePublicId: null },
  };

  return prisma.documentLivreur.update({
    where: { livreurId },
    data:  nullMap[type],
  });
};




// ===== SUPPRIMER UN LIVREUR =====
export const supprimerLivreurService = async (livreurId: number) => {
  // 1. Récupérer le livreur avec ses relations
  const livreur = await prisma.livreur.findUnique({
    where: { id: livreurId },
    include: {
      user: true,
      livraisons: true,
      documents: true,
      blocages: true,
      commissions: true,
    },
  });

  if (!livreur) {
    throw new Error("Livreur introuvable");
  }

  await prisma.$transaction(async (tx) => {
    // 2. Supprimer les livraisons liées
    await tx.livraison.deleteMany({
      where: { livreurId },
    });

    // 3. Supprimer les commissions
    await tx.paiementCommission.deleteMany({
      where: { livreurId },
    });

    // 4. Supprimer les blocages
    await tx.blocage.deleteMany({
      where: { livreurId },
    });

    // 5. Supprimer les documents + Cloudinary
    if (livreur.documents) {
      const doc = livreur.documents;

      const publicIds = [
        doc.cniRectoPublicId,
        doc.cniVersoPublicId,
        doc.permisPublicId,
        doc.assurancePublicId,
        doc.recepissePublicId,
      ].filter(Boolean);

      for (const id of publicIds) {
        await cloudinary.uploader.destroy(id as string);
      }

      await tx.documentLivreur.delete({
        where: { livreurId },
      });
    }

    // 6. ⚠️ IMPORTANT : supprimer d'abord le LIVREUR
    await tx.livreur.delete({
      where: { id: livreurId },
    });

    // 7. ensuite supprimer le USER lié
    await tx.user.delete({
      where: { id: livreur.userId },
    });
  });

  return {
    success: true,
    message: "Livreur supprimé avec succès",
  };
};