import { log } from "console";
import { prisma } from "../prisma/prisma.config";
import axios from "axios";

// ===== Carte / Calcul de distance =====


const TARIF_KM = 100;
const TARIF_BASE = 300;

// ===== CLIENTS =====
export const getClientsService = async () => prisma.client.findMany();

export const createOrGetClientService = async (data: any) => {
  let client = await prisma.client.findUnique({ where: { telephone: data.telephone } });
  if (!client) client = await prisma.client.create({ data });
  return client;
};

export const updateClientService = async (clientId: number, data: any) =>
  prisma.client.update({ where: { id: clientId }, data });

export const getClientHistoriqueService = async (clientId: number) =>
  prisma.commande.findMany({ where: { clientId }, include: { client: true } });

// ===== COMMANDE =====
 
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


async function getLatLngFromAdresseMaps(adresse: string) {
  const url = `https://nominatim.openstreetmap.org/search`;
  const res = await axios.get(url, {
    params: { q: adresse, format: "json", limit: 1 },
    headers: {
      'User-Agent': 'BoomExpressApp/1.0 (seckrama098@gmail.com)',
      'Accept-Language': 'fr-FR',
    },
  });

  if (!res.data || res.data.length === 0)
    throw new Error(`Adresse "${adresse}" introuvable via Maps`);

  return {
    lat: parseFloat(res.data[0].lat),
    lng: parseFloat(res.data[0].lon),
  };
}
// ===== CLIENTS =====
export const getClientByIdService = async (clientId: number) => {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  return client;
};
 
function snapToRoad(coord: { lat: number; lng: number }) {
  return {
    lat: parseFloat(coord.lat.toFixed(5)),
    lng: parseFloat(coord.lng.toFixed(5)),
  };
}
// ===== Helper pour récupérer lat/lng depuis l'adresse =====
 


function normalizeAdresse(adresse: string) {
  let cleaned = adresse.replace(/\+/g, " ").trim();

  // Toujours ajouter Saint-Louis + Senegal
  if (!cleaned.toLowerCase().includes("saint-louis")) {
    cleaned += ", Saint-Louis";
  }
  if (!cleaned.toLowerCase().includes("senegal") && !cleaned.toLowerCase().includes("sénégal")) {
    cleaned += ", Senegal";
  }

  return cleaned;
}
async function validateAdresseSaintLouis(adresse: string) {
  const normalized = normalizeAdresse(adresse);
  const coords = await getLatLngSmart(normalized); // ← ici

  const latMin = 15.8, latMax = 16.2;
  const lngMin = -16.7, lngMax = -16.2;

  if (coords.lat < latMin || coords.lat > latMax ||
      coords.lng < lngMin || coords.lng > lngMax) {
    throw new Error("L'adresse est hors de la zone de Saint-Louis");
  }

  return coords;
}
async function getDistanceRouteKmOSRM(
  depart: { lat: number; lng: number },
  dest: { lat: number; lng: number }
) {
  const url = `http://router.project-osrm.org/route/v1/driving/${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;

  const res = await axios.get(url, {
    params: { overview: "false" },
  });

  console.log("🛣️ OSRM status:", res.data.code);

  if (!res.data.routes || res.data.routes.length === 0) {
    const distanceVol = getDistanceKm(depart.lat, depart.lng, dest.lat, dest.lng);
    return Math.max(1, Math.round(distanceVol * 1.3 * 100) / 100);
  }

  const distance = res.data.routes[0].distance / 1000; // m → km
  return Math.max(1, Math.round(distance * 100) / 100);
}

function simplifierAdresse(adresse: string): string {
  // Garder seulement la première partie avant la virgule
  const premiereMention = adresse.split(",")[0].trim();
  return premiereMention + ", Saint-Louis, Senegal";
}

async function getLatLngSmart(adresse: string) {
  // Essai 1 : adresse complète
  let res = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: { q: adresse, format: "json", limit: 1 },
    headers: {
      "User-Agent": "BoomExpressApp/1.0 (seckrama098@gmail.com)",
      "Accept-Language": "fr-FR",
    },
  });

  // Essai 2 : adresse simplifiée si pas de résultat
  if (!res.data || res.data.length === 0) {
    const simplified = simplifierAdresse(adresse);
    console.log("⚠️ Fallback adresse simplifiée:", simplified);

    res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: simplified, format: "json", limit: 1 },
      headers: {
        "User-Agent": "BoomExpressApp/1.0 (seckrama098@gmail.com)",
        "Accept-Language": "fr-FR",
      },
    });
  }

  if (!res.data || res.data.length === 0)
    throw new Error(`Adresse "${adresse}" introuvable`);

  const lat = parseFloat(res.data[0].lat);
  const lng = parseFloat(res.data[0].lon);
  console.log("📍 Nominatim:", res.data[0].display_name, { lat, lng });
  return { lat, lng };
}

async function getLatLngFromMapbox(adresse: string) {
  const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  const encoded = encodeURIComponent(adresse);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`;

  const res = await axios.get(url, {
    params: {
      access_token: ACCESS_TOKEN,
      limit: 1,
      language: "fr",
      proximity: "-16.4896,16.0178", // ← centre de Saint-Louis
      country: "SN",                 // ← restreindre au Sénégal
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

async function getDistanceRouteKmMapbox(
  depart: { lat: number; lng: number },
  dest: { lat: number; lng: number }
) {
  const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  const coords = `${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`;

  const res = await axios.get(url, {
    params: { access_token: ACCESS_TOKEN, geometries: "geojson" },
  });

  if (!res.data.routes || res.data.routes.length === 0) {
    const distanceVol = getDistanceKm(depart.lat, depart.lng, dest.lat, dest.lng);
    return Math.max(1, Math.round(distanceVol * 1.3 * 100) / 100);
  }

  const distance = res.data.routes[0].distance / 1000; // m → km
  return Math.max(1, Math.round(distance * 100) / 100);
}
// ===== Fonction createCommandeService =====
export const createCommandeService = async (data: any) => {
  const client = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!client) throw new Error("Client introuvable");

  const livraisonAdresse = data.adresseLivraison || client.adresseLivraison;
  if (!livraisonAdresse) throw new Error("Adresse de livraison introuvable");

 function isCoord(obj: any): obj is { lat: number; lng: number } {
  return obj && typeof obj.lat === "number" && typeof obj.lng === "number";
}

 let depart: { lat: number; lng: number };
let dest: { lat: number; lng: number };

// ===== DEPART =====
if (isCoord(client.adresse)) {
  depart = client.adresse;
} else {
  depart = await validateAdresseSaintLouis(client.adresse);
}

// ===== DEST =====
if (isCoord(data.adresseLivraison)) {
  dest = data.adresseLivraison;
} else {
  dest = await validateAdresseSaintLouis(data.adresseLivraison);
}
const distanceKm = await getDistanceRouteKmMapbox(depart, dest); // ← Mapbox
  console.log("📏 Distance (km):", distanceKm);

  const montant = TARIF_BASE + Math.ceil(distanceKm) * TARIF_KM;
  const commission = montant * 0.1;

 const commande = await prisma.commande.create({
  data: {
    clientId: client.id,
    montant,
    commission,
    statut: "en_attente",
    commissionPaye: false, // ✅ Toujours explicite, ne jamais se fier au default
  },
});

  return commande;
};export const getCommandesService = async (query: any) => {
  const { statut, dateDebut, dateFin } = query;

  const filter: any = {};

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
        livreur: true,
      },
    },
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

  const livraison = await prisma.livraison.create({
    data: { commandeId, livreurId, statut: "en_attente" },
  });

  return livraison;
};

// ===== LIVREUR =====
export const getLivreursService = async () => prisma.livreur.findMany({ include: { user: true } });
export const getProfilLivreurService = async (livreurId: number) =>
  prisma.livreur.findUnique({ where: { id: livreurId }, include: { user: true } });

export const toggleCompteLivreurService = async (livreurId: number) => {
  const livreur = await prisma.livreur.findUnique({ where: { id: livreurId }, include: { user: true } });
  if (!livreur) throw new Error("Livreur introuvable");

  const user = await prisma.user.update({
    where: { id: livreur.userId },
    data: { statut: livreur.user.statut === "actif" ? "inactif" : "actif" },
  });

  return user;
};

// ===== PAIEMENTS =====
// ─── Payer toutes les commissions d'un livreur ────────────────────────────────
export const marquerPaiementLivreurByLivreurService = async (livreurId: number) => {
  const commandes = await prisma.commande.findMany({
    where: {
      commissionPaye: false,
      livraisons: {
        some: { livreurId, statut: "livree" },
      },
    },
  });

  if (commandes.length === 0)
    throw new Error("Aucune commission en attente pour ce livreur");

  const montantTotal = commandes.reduce(
    (sum, cmd) => sum + (cmd.commission || 0), 0
  );

  // ✅ Transaction atomique : update commandes + insert PaiementCommission
  await prisma.$transaction(async (tx) => {
    // 1️⃣ Marquer les commandes comme payées
    await tx.commande.updateMany({
      where: { id: { in: commandes.map(c => c.id) } },
      data: { commissionPaye: true },
    });

    // 2️⃣ Enregistrer le paiement dans PaiementCommission
    await tx.paiementCommission.create({
      data: {
        livreurId,
        montant: parseFloat(montantTotal.toFixed(2)),
        statut: "payee",
      },
    });
  });

  return { livreurId, montantTotal, commandesPayees: commandes.length };
};

// ─── Payer les commissions d'un jour précis ───────────────────────────────────
export const marquerPaiementJourService = async (livreurId: number, date: string) => {
  const debut = new Date(date); debut.setHours(0, 0, 0, 0);
  const fin = new Date(date);   fin.setHours(23, 59, 59, 999);

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

    // 1️⃣ Marquer les commandes comme payées
    await tx.commande.updateMany({
      where: { id: { in: commandes.map(c => c.id) } },
      data: { commissionPaye: true },
    });

    // 2️⃣ ✅ Mettre à jour les PaiementCommission de "en_attente" → "payee"
    await tx.paiementCommission.updateMany({
      where: {
        livreurId,
        statut: "en_attente",
        // Cibler uniquement ceux du jour
      },
      data: { statut: "payee" },
    });
  });

  return {
    livreurId,
    date,
    montantTotal: parseFloat(montantTotal.toFixed(2)),
    commandesPayees: commandes.length,
  };
};
// ===== BLOCAGE =====
export const bloquerLivreurService = async ({ livreurId, raison }: any) => {
  const livreur = await prisma.livreur.findUnique({ where: { id: livreurId } });
  if (!livreur) throw new Error("Livreur introuvable");

  const blocage = await prisma.blocage.create({ data: { livreurId, raison, actif: true } });
  await prisma.user.update({ where: { id: livreur.userId }, data: { statut: "inactif" } });

  return blocage;
};