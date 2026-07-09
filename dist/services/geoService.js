"use strict";
// services/geoService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires de géocodage / distance / tarification, réutilisés par
// adminService (existant, inchangé) ET clientService (nouveau).
// Fichier 100% additif : n'importe/ne modifie aucun fichier existant.
// ─────────────────────────────────────────────────────────────────────────────
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TARIF_BASE = exports.TARIF_KM = void 0;
exports.autocompleteAdresseGoogle = autocompleteAdresseGoogle;
exports.getCoordsFromPlaceId = getCoordsFromPlaceId;
exports.reverseGeocodeGoogle = reverseGeocodeGoogle;
exports.getDistanceKm = getDistanceKm;
exports.normalizeAdresse = normalizeAdresse;
exports.getLatLngSmart = getLatLngSmart;
exports.validateAdresseSenegal = validateAdresseSenegal;
exports.getDistanceRouteKmMapbox = getDistanceRouteKmMapbox;
exports.calculerTarif = calculerTarif;
exports.reverseGeocodeNominatim = reverseGeocodeNominatim;
const axios_1 = __importDefault(require("axios"));
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
exports.TARIF_KM = 100;
exports.TARIF_BASE = 300;
async function autocompleteAdresseGoogle(query) {
    if (!query || query.trim().length < 3)
        return [];
    if (!GOOGLE_API_KEY) {
        console.error("[geoService] GOOGLE_MAPS_API_KEY manquante");
        return [];
    }
    try {
        const res = await axios_1.default.get("https://maps.googleapis.com/maps/api/place/autocomplete/json", {
            params: {
                input: query,
                key: GOOGLE_API_KEY,
                components: "country:sn",
                location: "14.6928,-17.4467", // Dakar
                radius: 50000,
                language: "fr",
            },
        });
        if (res.data.status !== "OK" && res.data.status !== "ZERO_RESULTS") {
            console.error("[Google Autocomplete]", res.data.status, res.data.error_message);
            return [];
        }
        return (res.data.predictions || []).map((p) => ({
            placeId: p.place_id,
            description: p.description,
        }));
    }
    catch (err) {
        console.error("[geoService:autocompleteAdresseGoogle]", err);
        return [];
    }
}
async function getCoordsFromPlaceId(placeId) {
    if (!GOOGLE_API_KEY)
        throw new Error("Service de géolocalisation indisponible");
    const res = await axios_1.default.get("https://maps.googleapis.com/maps/api/place/details/json", {
        params: {
            place_id: placeId,
            key: GOOGLE_API_KEY,
            fields: "geometry,formatted_address",
            language: "fr",
        },
    });
    if (res.data.status !== "OK") {
        throw new Error("Adresse introuvable");
    }
    const loc = res.data.result.geometry.location;
    return {
        lat: loc.lat,
        lng: loc.lng,
        adresse: res.data.result.formatted_address,
    };
}
/**
 * Reverse geocoding Google — convertit lat/lng en adresse texte lisible.
 * Retourne null en cas d'échec (best-effort, ne doit jamais bloquer le flux appelant).
 */
async function reverseGeocodeGoogle(lat, lng) {
    if (!GOOGLE_API_KEY)
        return null;
    try {
        const res = await axios_1.default.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: { latlng: `${lat},${lng}`, key: GOOGLE_API_KEY, language: "fr" },
        });
        if (res.data.status !== "OK" || !res.data.results.length)
            return null;
        return res.data.results[0].formatted_address;
    }
    catch (err) {
        console.error("[geoService:reverseGeocodeGoogle]", err);
        return null;
    }
}
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
function normalizeAdresse(adresse) {
    let cleaned = adresse.replace(/\+/g, " ").trim();
    if (!cleaned.toLowerCase().includes("senegal") && !cleaned.toLowerCase().includes("sénégal")) {
        cleaned += ", Senegal";
    }
    return cleaned;
}
function simplifierAdresse(adresse) {
    const premiereMention = adresse.split(",")[0].trim();
    return premiereMention + ", Senegal";
}
// ===== GÉOCODAGE — priorité coords brutes, puis Nominatim, puis Mapbox =====
async function getLatLngSmart(adresse) {
    const rawCoord = adresse.trim().match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
    if (rawCoord) {
        const lat = parseFloat(rawCoord[1]);
        const lng = parseFloat(rawCoord[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
        }
    }
    try {
        const res = await axios_1.default.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: adresse,
                format: "json",
                limit: 1,
                countrycodes: "sn",
                viewbox: "-17.5,16.7,-11.3,12.3",
                bounded: 1,
            },
            headers: {
                "User-Agent": "BoomExpressApp/1.0 (contact@bamexpress.sn)",
                "Accept-Language": "fr-FR",
            },
        });
        if (res.data?.length > 0) {
            return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
        }
    }
    catch (_) { }
    try {
        const simplified = simplifierAdresse(adresse);
        const res = await axios_1.default.get("https://nominatim.openstreetmap.org/search", {
            params: { q: simplified, format: "json", limit: 1, countrycodes: "sn" },
            headers: {
                "User-Agent": "BoomExpressApp/1.0 (contact@bamexpress.sn)",
                "Accept-Language": "fr-FR",
            },
        });
        if (res.data?.length > 0) {
            return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
        }
    }
    catch (_) { }
    return await getLatLngFromMapbox(adresse);
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
            proximity: "-16.4896,16.0178",
            country: "SN",
        },
    });
    if (!res.data.features || res.data.features.length === 0)
        throw new Error(`Adresse "${adresse}" introuvable`);
    const [lng, lat] = res.data.features[0].center;
    return { lat, lng };
}
async function validateAdresseSenegal(adresse) {
    const normalized = normalizeAdresse(adresse);
    const coords = await getLatLngSmart(normalized);
    const latMin = 12.3, latMax = 16.7;
    const lngMin = -17.5, lngMax = -11.3;
    if (coords.lat < latMin || coords.lat > latMax || coords.lng < lngMin || coords.lng > lngMax) {
        throw new Error("L'adresse est hors du Sénégal");
    }
    return coords;
}
async function getDistanceRouteKmMapbox(depart, dest) {
    const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
    const coords = `${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`;
    try {
        const res = await axios_1.default.get(url, { params: { access_token: ACCESS_TOKEN, geometries: "geojson" } });
        if (!res.data.routes || res.data.routes.length === 0)
            throw new Error("no route");
        const distance = res.data.routes[0].distance / 1000;
        return Math.max(1, Math.round(distance * 100) / 100);
    }
    catch {
        const distanceVol = getDistanceKm(depart.lat, depart.lng, dest.lat, dest.lng);
        return Math.max(1, Math.round(distanceVol * 1.3 * 100) / 100);
    }
}
function calculerTarif(distanceKm) {
    const montant = exports.TARIF_BASE + Math.ceil(distanceKm) * exports.TARIF_KM;
    const commission = montant * 0.1;
    return { montant, commission: parseFloat(commission.toFixed(2)) };
}
async function reverseGeocodeNominatim(lat, lng) {
    try {
        const res = await axios_1.default.get("https://nominatim.openstreetmap.org/reverse", {
            params: { lat, lon: lng, format: "json", "accept-language": "fr" },
            headers: { "User-Agent": "BoomExpressApp/1.0 (contact@bamexpress.sn)" },
        });
        return res.data?.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    catch {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}
