// services/geoService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires de géocodage / distance / tarification, réutilisés par
// adminService (existant, inchangé) ET clientService (nouveau).
// Fichier 100% additif : n'importe/ne modifie aucun fichier existant.
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";

export const TARIF_KM = 100;
export const TARIF_BASE = 300;

export interface Coords {
  lat: number;
  lng: number;
}

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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

export function normalizeAdresse(adresse: string) {
  let cleaned = adresse.replace(/\+/g, " ").trim();
  if (!cleaned.toLowerCase().includes("senegal") && !cleaned.toLowerCase().includes("sénégal")) {
    cleaned += ", Senegal";
  }
  return cleaned;
}

function simplifierAdresse(adresse: string): string {
  const premiereMention = adresse.split(",")[0].trim();
  return premiereMention + ", Senegal";
}

// ===== GÉOCODAGE — priorité coords brutes, puis Nominatim, puis Mapbox =====
export async function getLatLngSmart(adresse: string): Promise<Coords> {
  const rawCoord = adresse.trim().match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (rawCoord) {
    const lat = parseFloat(rawCoord[1]);
    const lng = parseFloat(rawCoord[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

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
        "User-Agent": "BoomExpressApp/1.0 (contact@bamexpress.sn)",
        "Accept-Language": "fr-FR",
      },
    });
    if (res.data?.length > 0) {
      return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
    }
  } catch (_) {}

  try {
    const simplified = simplifierAdresse(adresse);
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: simplified, format: "json", limit: 1, countrycodes: "sn" },
      headers: {
        "User-Agent": "BoomExpressApp/1.0 (contact@bamexpress.sn)",
        "Accept-Language": "fr-FR",
      },
    });
    if (res.data?.length > 0) {
      return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
    }
  } catch (_) {}

  return await getLatLngFromMapbox(adresse);
}

async function getLatLngFromMapbox(adresse: string): Promise<Coords> {
  const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  const encoded = encodeURIComponent(adresse);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`;

  const res = await axios.get(url, {
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

export async function validateAdresseSenegal(adresse: string): Promise<Coords> {
  const normalized = normalizeAdresse(adresse);
  const coords = await getLatLngSmart(normalized);

  const latMin = 12.3, latMax = 16.7;
  const lngMin = -17.5, lngMax = -11.3;

  if (coords.lat < latMin || coords.lat > latMax || coords.lng < lngMin || coords.lng > lngMax) {
    throw new Error("L'adresse est hors du Sénégal");
  }

  return coords;
}

export async function getDistanceRouteKmMapbox(depart: Coords, dest: Coords): Promise<number> {
  const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  const coords = `${depart.lng},${depart.lat};${dest.lng},${dest.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`;

  try {
    const res = await axios.get(url, { params: { access_token: ACCESS_TOKEN, geometries: "geojson" } });
    if (!res.data.routes || res.data.routes.length === 0) throw new Error("no route");
    const distance = res.data.routes[0].distance / 1000;
    return Math.max(1, Math.round(distance * 100) / 100);
  } catch {
    const distanceVol = getDistanceKm(depart.lat, depart.lng, dest.lat, dest.lng);
    return Math.max(1, Math.round(distanceVol * 1.3 * 100) / 100);
  }
}

export function calculerTarif(distanceKm: number) {
  const montant = TARIF_BASE + Math.ceil(distanceKm) * TARIF_KM;
  const commission = montant * 0.1;
  return { montant, commission: parseFloat(commission.toFixed(2)) };
}

export async function reverseGeocodeNominatim(lat: number, lng: number): Promise<string> {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { lat, lon: lng, format: "json", "accept-language": "fr" },
      headers: { "User-Agent": "BoomExpressApp/1.0 (contact@bamexpress.sn)" },
    });
    return res.data?.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
