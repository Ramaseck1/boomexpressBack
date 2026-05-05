"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bloquerLivreurService = exports.marquerPaiementJourService = exports.marquerPaiementLivreurByLivreurService = exports.toggleCompteLivreurService = exports.getProfilLivreurService = exports.getLivreursService = exports.assignerCommandeService = exports.updateCommandeService = exports.getCommandesService = exports.createCommandeService = exports.deleteCommandeService = exports.createClientEtCommandeService = exports.deleteClientService = exports.getClientByIdService = exports.getClientHistoriqueService = exports.updateClientService = exports.getClientsService = void 0;
const prisma_config_1 = require("../prisma/prisma.config");
const axios_1 = __importDefault(require("axios"));
// ===== Tarifs =====
const TARIF_KM = 100;
const TARIF_BASE = 300;
// ===== CLIENTS =====
const getClientsService = async () => prisma_config_1.prisma.client.findMany();
exports.getClientsService = getClientsService;
/* export const createOrGetClientService = async (data: any) => {
  let client = await prisma.client.findUnique({ where: { telephone: data.telephone } });
  if (!client) client = await prisma.client.create({ data });
  return client;
};
 */
const updateClientService = async (clientId, data) => prisma_config_1.prisma.client.update({ where: { id: clientId }, data });
exports.updateClientService = updateClientService;
const getClientHistoriqueService = async (clientId) => prisma_config_1.prisma.commande.findMany({ where: { clientId }, include: { client: true } });
exports.getClientHistoriqueService = getClientHistoriqueService;
const getClientByIdService = async (clientId) => prisma_config_1.prisma.client.findUnique({ where: { id: clientId } });
exports.getClientByIdService = getClientByIdService;
const deleteClientService = async (clientId) => prisma_config_1.prisma.client.delete({ where: { id: clientId } });
exports.deleteClientService = deleteClientService;
const createClientEtCommandeService = async (data) => {
    const client = await prisma_config_1.prisma.client.create({
        data: {
            nom: data.nom,
            prenom: data.prenom,
            telephone: data.telephone,
            adresse: data.adresse,
            adresseLivraison: data.adresseLivraison,
            telephoneDestinataire: data.telephoneDestinataire,
        },
    });
    const commande = await (0, exports.createCommandeService)({
        clientId: client.id,
        adresseLivraison: data.adresseLivraison,
    });
    return { client, commande };
};
exports.createClientEtCommandeService = createClientEtCommandeService;
// ===== SUPPRIMER UNE COMMANDE =====
const deleteCommandeService = async (commandeId) => prisma_config_1.prisma.commande.delete({ where: { id: commandeId } });
exports.deleteCommandeService = deleteCommandeService;
// ===== DISTANCE À VOL D'OISEAU (Haversine) =====
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
// ===== NORMALISATION ADRESSE =====
function normalizeAdresse(adresse) {
    let cleaned = adresse.replace(/\+/g, " ").trim();
    if (!cleaned.toLowerCase().includes("saint-louis"))
        cleaned += ", Saint-Louis";
    if (!cleaned.toLowerCase().includes("senegal") &&
        !cleaned.toLowerCase().includes("sénégal")) {
        cleaned += ", Senegal";
    }
    return cleaned;
}
function simplifierAdresse(adresse) {
    const premiereMention = adresse.split(",")[0].trim();
    return premiereMention + ", Saint-Louis, Senegal";
}
function isCoord(obj) {
    return obj && typeof obj.lat === "number" && typeof obj.lng === "number";
}
// ===== GÉOCODAGE — Nominatim =====
async function getLatLngSmart(adresse) {
    // Essai 1 : Nominatim adresse complète — restreint au Sénégal + viewbox Saint-Louis
    try {
        const res = await axios_1.default.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: adresse,
                format: "json",
                limit: 1,
                countrycodes: "sn",
                viewbox: "-16.8,16.4,-15.9,15.7",
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
    }
    catch (_) { }
    // Essai 2 : Nominatim adresse simplifiée (sans viewbox — plus permissif)
    try {
        const simplified = simplifierAdresse(adresse);
        console.log("⚠️ Fallback Nominatim simplifié:", simplified);
        const res = await axios_1.default.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: simplified,
                format: "json",
                limit: 1,
                countrycodes: "sn",
            },
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
    }
    catch (_) { }
    // Essai 3 : Mapbox (plus robuste sur les quartiers sénégalais)
    console.log("⚠️ Fallback Mapbox:", adresse);
    return await getLatLngFromMapbox(adresse);
}
// ===== GÉOCODAGE — Mapbox =====
async function getLatLngFromMapbox(adresse) {
    const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
    const encoded = encodeURIComponent(adresse);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`;
    const res = await axios_1.default.get(url, {
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
async function validateAdresseSaintLouis(adresse) {
    const normalized = normalizeAdresse(adresse);
    const coords = await getLatLngSmart(normalized);
    // Bounding box élargie — couvre Saint-Louis + banlieue + périphérie
    const latMin = 15.7, latMax = 16.4;
    const lngMin = -16.8, lngMax = -15.9;
    if (coords.lat < latMin || coords.lat > latMax ||
        coords.lng < lngMin || coords.lng > lngMax) {
        throw new Error("L'adresse est hors de la zone de Saint-Louis");
    }
    return coords;
}
// ===== DISTANCE ROUTE — Mapbox Directions =====
async function getDistanceRouteKmMapbox(depart, dest) {
    const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
    const coords = `${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`;
    const res = await axios_1.default.get(url, {
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
async function getDistanceRouteKmOSRM(depart, dest) {
    const url = `http://router.project-osrm.org/route/v1/driving/${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
    const res = await axios_1.default.get(url, { params: { overview: "false" } });
    console.log("🛣️ OSRM status:", res.data.code);
    if (!res.data.routes || res.data.routes.length === 0) {
        const distanceVol = getDistanceKm(depart.lat, depart.lng, dest.lat, dest.lng);
        return Math.max(1, Math.round(distanceVol * 1.3 * 100) / 100);
    }
    const distance = res.data.routes[0].distance / 1000;
    return Math.max(1, Math.round(distance * 100) / 100);
}
// ===== CRÉER UNE COMMANDE =====
const createCommandeService = async (data) => {
    const client = await prisma_config_1.prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client)
        throw new Error("Client introuvable");
    // ✅ Utiliser livraisonAdresse (adresse du client si non fournie dans le body)
    const livraisonAdresse = data.adresseLivraison || client.adresseLivraison;
    if (!livraisonAdresse)
        throw new Error("Adresse de livraison introuvable");
    let depart;
    let dest;
    // ── Départ : adresse de collecte du client ──
    if (isCoord(client.adresse)) {
        depart = client.adresse;
    }
    else {
        depart = await validateAdresseSaintLouis(client.adresse);
    }
    // ── Destination : adresse de livraison ✅ livraisonAdresse utilisé partout ──
    if (isCoord(livraisonAdresse)) {
        dest = livraisonAdresse;
    }
    else {
        dest = await validateAdresseSaintLouis(livraisonAdresse);
    }
    const distanceKm = await getDistanceRouteKmMapbox(depart, dest);
    console.log("📏 Distance (km):", distanceKm);
    const montant = TARIF_BASE + Math.ceil(distanceKm) * TARIF_KM;
    const commission = montant * 0.1;
    const commande = await prisma_config_1.prisma.commande.create({
        data: {
            clientId: client.id,
            montant,
            commission,
            statut: "en_attente",
            commissionPaye: false,
        },
    });
    return commande;
};
exports.createCommandeService = createCommandeService;
// ===== LISTER LES COMMANDES =====
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
            livraisons: { include: { livreur: true } },
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
// ===== LIVREURS =====
const getLivreursService = async () => prisma_config_1.prisma.livreur.findMany({ include: { user: true } });
exports.getLivreursService = getLivreursService;
const getProfilLivreurService = async (livreurId) => prisma_config_1.prisma.livreur.findUnique({ where: { id: livreurId }, include: { user: true } });
exports.getProfilLivreurService = getProfilLivreurService;
const toggleCompteLivreurService = async (livreurId) => {
    const livreur = await prisma_config_1.prisma.livreur.findUnique({
        where: { id: livreurId },
        include: { user: true },
    });
    if (!livreur)
        throw new Error("Livreur introuvable");
    return prisma_config_1.prisma.user.update({
        where: { id: livreur.userId },
        data: { statut: livreur.user.statut === "actif" ? "inactif" : "actif" },
    });
};
exports.toggleCompteLivreurService = toggleCompteLivreurService;
// ===== PAIEMENTS — Payer toutes les commissions d'un livreur =====
const marquerPaiementLivreurByLivreurService = async (livreurId) => {
    const commandes = await prisma_config_1.prisma.commande.findMany({
        where: {
            commissionPaye: false,
            livraisons: { some: { livreurId, statut: "livree" } },
        },
    });
    if (commandes.length === 0)
        throw new Error("Aucune commission en attente pour ce livreur");
    const montantTotal = commandes.reduce((sum, cmd) => sum + (cmd.commission || 0), 0);
    await prisma_config_1.prisma.$transaction(async (tx) => {
        await tx.commande.updateMany({
            where: { id: { in: commandes.map(c => c.id) } },
            data: { commissionPaye: true },
        });
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
// ===== PAIEMENTS — Payer les commissions d'un jour précis =====
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
    const blocage = await prisma_config_1.prisma.blocage.create({
        data: { livreurId, raison, actif: true },
    });
    await prisma_config_1.prisma.user.update({
        where: { id: livreur.userId },
        data: { statut: "inactif" },
    });
    return blocage;
};
exports.bloquerLivreurService = bloquerLivreurService;
