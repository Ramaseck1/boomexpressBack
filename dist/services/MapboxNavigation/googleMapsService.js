"use strict";
// services/MapboxNavigation/googleMapsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Remplace mapboxService.ts pour le géocodage et le routage.
// On garde @rnmapbox/maps pour l'AFFICHAGE de la carte (gratuit).
// On utilise Google Maps API pour GÉOCODER et CALCULER LES ROUTES
// → même source de données que Google Maps → 0 décalage de localisation.
//
// 💰 Coût : $200 de crédit gratuit/mois chez Google
//    - Géocodage    : $5 / 1000 req → 40 000 gratuits/mois
//    - Directions   : $5 / 1000 req → 40 000 gratuits/mois
//    - Pour 100 livraisons/jour = 3000 routes/mois → ~$15 → dans le gratuit ✅
//
// Setup :
//   1. https://console.cloud.google.com → créer projet
//   2. Activer "Geocoding API" + "Directions API"
//   3. Créer une clé API → .env : GOOGLE_MAPS_API_KEY=AIza...
// ─────────────────────────────────────────────────────────────────────────────
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculerDistanceHaversine = exports.getProchaineInstruction = exports.recalculerRoute = exports.calculerRoute = exports.geocoderAdresse = void 0;
const axios_1 = __importDefault(require("axios"));
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_BASE = "https://maps.googleapis.com/maps/api";
// ─── Décodeur polyline Google (format encodé → tableau de coords) ─────────────
// Google Directions retourne des polylines encodées, pas du GeoJSON.
// Cette fonction les décode en tableau [lng, lat] pour Mapbox.
const decoderPolyline = (encoded) => {
    const coords = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dLat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dLng;
        // Google = [lat, lng], Mapbox/GeoJSON = [lng, lat]
        coords.push([lng / 1e5, lat / 1e5]);
    }
    return coords;
};
// ─── Géocodage : adresse texte → coords ──────────────────────────────────────
// Utilise Google Maps Geocoding API → même résultat que ce que l'utilisateur
// voit dans Google Maps quand il cherche une adresse.
const geocoderAdresse = async (adresse) => {
    // ✅ Si l'adresse est déjà des coords brutes "lat,lng" → retour direct
    const rawCoord = adresse.trim().match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
    if (rawCoord) {
        const lat = parseFloat(rawCoord[1]);
        const lng = parseFloat(rawCoord[2]);
        console.log("📍 Coords directes (pas de géocodage) :", { lat, lng });
        return { lat, lng };
    }
    // ✅ Géocodage Google Maps
    const { data } = await axios_1.default.get(`${GOOGLE_BASE}/geocode/json`, {
        params: {
            address: adresse,
            key: GOOGLE_KEY,
            region: "sn", // Biais vers le Sénégal
            language: "fr",
        },
    });
    if (data.status !== "OK" || !data.results?.length) {
        console.error("❌ Google Geocoding échec :", data.status, adresse);
        throw new Error(`Adresse introuvable via Google Maps : "${adresse}" (${data.status})`);
    }
    const { lat, lng } = data.results[0].geometry.location;
    console.log("📍 Google Geocoding OK :", data.results[0].formatted_address, { lat, lng });
    return { lat, lng };
};
exports.geocoderAdresse = geocoderAdresse;
// ─── Calcul de route : Google Directions API ──────────────────────────────────
// Retourne une RouteInfo compatible avec le reste du code (navigationService.ts).
const calculerRoute = async (points, _profil = "driving" // Google n'a pas "driving-traffic" séparé, trafic inclus par défaut
) => {
    if (points.length < 2)
        throw new Error("Au moins 2 points requis");
    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
    // Points intermédiaires si plus de 2 points
    const waypoints = points.length > 2
        ? points.slice(1, -1).map(p => `${p.lat},${p.lng}`).join("|")
        : undefined;
    const { data } = await axios_1.default.get(`${GOOGLE_BASE}/directions/json`, {
        params: {
            origin,
            destination,
            waypoints,
            mode: "driving",
            departure_time: "now", // Trafic en temps réel
            traffic_model: "best_guess", // Modèle de trafic
            language: "fr",
            key: GOOGLE_KEY,
        },
    });
    if (data.status !== "OK" || !data.routes?.length) {
        console.error("❌ Google Directions échec :", data.status);
        throw new Error(`Itinéraire introuvable (${data.status})`);
    }
    const route = data.routes[0];
    const leg = route.legs[0]; // On prend le premier tronçon
    // ── Décodage du tracé polyline → GeoJSON LineString ──
    const polylineEncoded = route.overview_polyline.points;
    const coordinates = decoderPolyline(polylineEncoded);
    // ── Extraction des étapes turn-by-turn ──
    const etapes = route.legs
        .flatMap((l) => l.steps)
        .map((step) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ""), // Supprimer les balises HTML
        distance: step.distance.value,
        duree: step.duration.value,
        coordonnees: {
            lat: step.start_location.lat,
            lng: step.start_location.lng,
        },
    }));
    // ── Distance et durée totales ──
    const distanceTotale = route.legs.reduce((sum, l) => sum + l.distance.value, 0);
    const dureeTotale = route.legs.reduce((sum, l) => {
        // Utiliser duration_in_traffic si disponible (trafic réel)
        return sum + (l.duration_in_traffic?.value ?? l.duration.value);
    }, 0);
    // ── ETA ──
    const eta = new Date(Date.now() + dureeTotale * 1000);
    // ── Détection de congestion (Google n'expose pas ça directement) ──
    // On compare durée avec trafic vs sans trafic
    const dureeSansTrafic = route.legs.reduce((sum, l) => sum + l.duration.value, 0);
    const congestionsDetectees = dureeTotale > dureeSansTrafic * 1.2; // +20% = trafic chargé
    console.log(`🗺️ Route Google Maps : ${(distanceTotale / 1000).toFixed(1)}km, ${Math.round(dureeTotale / 60)}min`);
    return {
        geometry: {
            type: "LineString",
            coordinates,
        },
        etapes,
        distanceTotale,
        dureeTotale,
        eta,
        congestionsDetectees,
    };
};
exports.calculerRoute = calculerRoute;
// ─── Recalcul de route (même interface que mapboxService) ─────────────────────
const recalculerRoute = async (positionActuelle, destination, seuilDeviationMetres = 50) => {
    const dist = (0, exports.calculerDistanceHaversine)(positionActuelle, destination);
    if (dist < seuilDeviationMetres)
        return { recalcule: false };
    console.log(`🔄 Recalcul Google Maps — déviation ${dist}m`);
    const route = await (0, exports.calculerRoute)([positionActuelle, destination]);
    return { recalcule: true, route };
};
exports.recalculerRoute = recalculerRoute;
// ─── Prochaine instruction (identique à mapboxService) ────────────────────────
const getProchaineInstruction = (positionActuelle, etapes) => {
    if (!etapes.length)
        return null;
    let etapeLaPlusProche = etapes[0];
    let distanceMin = (0, exports.calculerDistanceHaversine)(positionActuelle, etapes[0].coordonnees);
    for (const etape of etapes) {
        const dist = (0, exports.calculerDistanceHaversine)(positionActuelle, etape.coordonnees);
        if (dist < distanceMin) {
            distanceMin = dist;
            etapeLaPlusProche = etape;
        }
    }
    const idx = etapes.indexOf(etapeLaPlusProche);
    const prochaineEtape = etapes[idx + 1] || etapeLaPlusProche;
    return {
        instruction: prochaineEtape.instruction,
        distanceRestante: Math.round(distanceMin),
    };
};
exports.getProchaineInstruction = getProchaineInstruction;
// ─── Distance Haversine ───────────────────────────────────────────────────────
const calculerDistanceHaversine = (point1, point2) => {
    const R = 6371000;
    const dLat = toRad(point2.lat - point1.lat);
    const dLng = toRad(point2.lng - point1.lng);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
exports.calculerDistanceHaversine = calculerDistanceHaversine;
const toRad = (deg) => (deg * Math.PI) / 180;
