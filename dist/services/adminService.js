"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bloquerLivreurService = exports.marquerPaiementJourService = exports.marquerPaiementLivreurByLivreurService = exports.toggleCompteLivreurService = exports.getProfilLivreurService = exports.getLivreursService = exports.assignerCommandeService = exports.updateCommandeService = exports.getCommandesService = exports.createCommandeService = exports.getClientByIdService = exports.getClientHistoriqueService = exports.updateClientService = exports.createOrGetClientService = exports.getClientsService = void 0;
const prisma_config_1 = require("../prisma/prisma.config");
const axios_1 = __importDefault(require("axios"));
// ===== Carte / Calcul de distance =====
const TARIF_KM = 100;
const TARIF_BASE = 300;
// ===== CLIENTS =====
const getClientsService = async () => prisma_config_1.prisma.client.findMany();
exports.getClientsService = getClientsService;
const createOrGetClientService = async (data) => {
    let client = await prisma_config_1.prisma.client.findUnique({ where: { telephone: data.telephone } });
    if (!client)
        client = await prisma_config_1.prisma.client.create({ data });
    return client;
};
exports.createOrGetClientService = createOrGetClientService;
const updateClientService = async (clientId, data) => prisma_config_1.prisma.client.update({ where: { id: clientId }, data });
exports.updateClientService = updateClientService;
const getClientHistoriqueService = async (clientId) => prisma_config_1.prisma.commande.findMany({ where: { clientId }, include: { client: true } });
exports.getClientHistoriqueService = getClientHistoriqueService;
// ===== COMMANDE =====
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
async function getLatLngFromAdresseMaps(adresse) {
    const url = `https://nominatim.openstreetmap.org/search`;
    const res = await axios_1.default.get(url, {
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
const getClientByIdService = async (clientId) => {
    const client = await prisma_config_1.prisma.client.findUnique({ where: { id: clientId } });
    return client;
};
exports.getClientByIdService = getClientByIdService;
function snapToRoad(coord) {
    return {
        lat: parseFloat(coord.lat.toFixed(5)),
        lng: parseFloat(coord.lng.toFixed(5)),
    };
}
// ===== Helper pour récupérer lat/lng depuis l'adresse =====
function normalizeAdresse(adresse) {
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
async function validateAdresseSaintLouis(adresse) {
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
async function getDistanceRouteKmOSRM(depart, dest) {
    const url = `http://router.project-osrm.org/route/v1/driving/${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
    const res = await axios_1.default.get(url, {
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
function simplifierAdresse(adresse) {
    // Garder seulement la première partie avant la virgule
    const premiereMention = adresse.split(",")[0].trim();
    return premiereMention + ", Saint-Louis, Senegal";
}
async function getLatLngSmart(adresse) {
    // Essai 1 : adresse complète
    let res = await axios_1.default.get("https://nominatim.openstreetmap.org/search", {
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
        res = await axios_1.default.get("https://nominatim.openstreetmap.org/search", {
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
async function getLatLngFromMapbox(adresse) {
    const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
    const encoded = encodeURIComponent(adresse);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`;
    const res = await axios_1.default.get(url, {
        params: {
            access_token: ACCESS_TOKEN,
            limit: 1,
            language: "fr",
            proximity: "-16.4896,16.0178", // ← centre de Saint-Louis
            country: "SN", // ← restreindre au Sénégal
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
async function getDistanceRouteKmMapbox(depart, dest) {
    const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
    const coords = `${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`;
    const res = await axios_1.default.get(url, {
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
const createCommandeService = async (data) => {
    const client = await prisma_config_1.prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client)
        throw new Error("Client introuvable");
    const livraisonAdresse = data.adresseLivraison || client.adresseLivraison;
    if (!livraisonAdresse)
        throw new Error("Adresse de livraison introuvable");
    function isCoord(obj) {
        return obj && typeof obj.lat === "number" && typeof obj.lng === "number";
    }
    let depart;
    let dest;
    // ===== DEPART =====
    if (isCoord(client.adresse)) {
        depart = client.adresse;
    }
    else {
        depart = await validateAdresseSaintLouis(client.adresse);
    }
    // ===== DEST =====
    if (isCoord(data.adresseLivraison)) {
        dest = data.adresseLivraison;
    }
    else {
        dest = await validateAdresseSaintLouis(data.adresseLivraison);
    }
    const distanceKm = await getDistanceRouteKmMapbox(depart, dest); // ← Mapbox
    console.log("📏 Distance (km):", distanceKm);
    const montant = TARIF_BASE + Math.ceil(distanceKm) * TARIF_KM;
    const commission = montant * 0.1;
    const commande = await prisma_config_1.prisma.commande.create({
        data: {
            clientId: client.id,
            montant,
            commission,
            statut: "en_attente",
            commissionPaye: false, // ✅ Toujours explicite, ne jamais se fier au default
        },
    });
    return commande;
};
exports.createCommandeService = createCommandeService;
const getCommandesService = async (query) => {
    const { statut, dateDebut, dateFin } = query;
    const filter = {};
    if (statut)
        filter.statut = statut;
    if (dateDebut || dateFin)
        filter.createdAt = {};
    if (dateDebut)
        filter.createdAt.gte = new Date(dateDebut);
    if (dateFin)
        filter.createdAt.lte = new Date(dateFin);
    return prisma_config_1.prisma.commande.findMany({
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
exports.getCommandesService = getCommandesService;
const updateCommandeService = async (commandeId, data) => prisma_config_1.prisma.commande.update({ where: { id: commandeId }, data });
exports.updateCommandeService = updateCommandeService;
const assignerCommandeService = async (commandeId, livreurId) => {
    const commande = await prisma_config_1.prisma.commande.findUnique({
        where: { id: commandeId },
        include: { client: true },
    });
    if (!commande)
        throw new Error("Commande introuvable");
    const livraison = await prisma_config_1.prisma.livraison.create({
        data: { commandeId, livreurId, statut: "en_attente" },
    });
    return livraison;
};
exports.assignerCommandeService = assignerCommandeService;
// ===== LIVREUR =====
const getLivreursService = async () => prisma_config_1.prisma.livreur.findMany({ include: { user: true } });
exports.getLivreursService = getLivreursService;
const getProfilLivreurService = async (livreurId) => prisma_config_1.prisma.livreur.findUnique({ where: { id: livreurId }, include: { user: true } });
exports.getProfilLivreurService = getProfilLivreurService;
const toggleCompteLivreurService = async (livreurId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { id: livreurId }, include: { user: true } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    const user = await prisma_config_1.prisma.user.update({
        where: { id: livreur.userId },
        data: { statut: livreur.user.statut === "actif" ? "inactif" : "actif" },
    });
    return user;
};
exports.toggleCompteLivreurService = toggleCompteLivreurService;
// ===== PAIEMENTS =====
// ─── Payer toutes les commissions d'un livreur ────────────────────────────────
const marquerPaiementLivreurByLivreurService = async (livreurId) => {
    const commandes = await prisma_config_1.prisma.commande.findMany({
        where: {
            commissionPaye: false,
            livraisons: {
                some: { livreurId, statut: "livree" },
            },
        },
    });
    if (commandes.length === 0)
        throw new Error("Aucune commission en attente pour ce livreur");
    const montantTotal = commandes.reduce((sum, cmd) => sum + (cmd.commission || 0), 0);
    // ✅ Transaction atomique : update commandes + insert PaiementCommission
    await prisma_config_1.prisma.$transaction(async (tx) => {
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
exports.marquerPaiementLivreurByLivreurService = marquerPaiementLivreurByLivreurService;
// ─── Payer les commissions d'un jour précis ───────────────────────────────────
const marquerPaiementJourService = async (livreurId, date) => {
    const debut = new Date(date);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(date);
    fin.setHours(23, 59, 59, 999);
    const commandes = await prisma_config_1.prisma.commande.findMany({
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
    await prisma_config_1.prisma.$transaction(async (tx) => {
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
exports.marquerPaiementJourService = marquerPaiementJourService;
// ===== BLOCAGE =====
const bloquerLivreurService = async ({ livreurId, raison }) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({ where: { id: livreurId } });
    if (!livreur)
        throw new Error("Livreur introuvable");
    const blocage = await prisma_config_1.prisma.blocage.create({ data: { livreurId, raison, actif: true } });
    await prisma_config_1.prisma.user.update({ where: { id: livreur.userId }, data: { statut: "inactif" } });
    return blocage;
};
exports.bloquerLivreurService = bloquerLivreurService;
