// services/mapboxService.ts
// 🗺️ Service Mapbox — Calcul de route, recalcul et trafic en temps réel

import axios from "axios";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN!;
const MAPBOX_BASE = "https://api.mapbox.com";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coordonnees {
  lng: number;
  lat: number;
}

export interface EtapeNavigation {
  instruction: string;       // "Tournez à gauche sur Rue Moussa"
  distance: number;          // en mètres
  duree: number;             // en secondes
  coordonnees: Coordonnees;
}
export interface LineStringGeometry { type: "LineString"; coordinates: [number, number][]; }


export interface RouteInfo {
  geometry: LineStringGeometry // Tracé du trajet (pour affichage Mapbox)
  etapes: EtapeNavigation[];      // Turn-by-turn
  distanceTotale: number;         // en mètres
  dureeTotale: number;            // en secondes
  eta: Date;                      // Heure d'arrivée estimée
  congestionsDetectees: boolean;  // 🚦 Trafic chargé ?
}

// ─── Calcul de route principale ───────────────────────────────────────────────

/**
 * Calcule un itinéraire entre plusieurs points avec prise en compte du trafic.
 * @param points - Tableau de coordonnées [départ, ...étapes, destination]
 * @param profil - "driving-traffic" | "driving" | "cycling" | "walking"
 */
export const calculerRoute = async (
  points: Coordonnees[],
  profil: "driving-traffic" | "driving" | "cycling" | "walking" = "driving-traffic"
): Promise<RouteInfo> => {
  if (points.length < 2) {
    throw new Error("Au moins 2 points sont nécessaires pour calculer une route");
  }

  // Format Mapbox : "lng,lat;lng,lat;..."
  const coordStr = points.map((p) => `${p.lng},${p.lat}`).join(";");

  const { data } = await axios.get(
    `${MAPBOX_BASE}/directions/v5/mapbox/${profil}/${coordStr}`,
    {
      params: {
        access_token: MAPBOX_TOKEN,
        steps: true,            // Nécessaire pour turn-by-turn
        geometries: "geojson",  // Format GeoJSON pour l'affichage
        language: "fr",         // 🇫🇷 Instructions en français
        voice_instructions: true,           // 🔊 Instructions vocales
        banner_instructions: true,          // Bannières de navigation
        voice_units: "metric",              // Kilomètres/mètres
        annotations: "congestion,duration", // 🚦 Info trafic par segment
        overview: "full",                   // Géométrie complète du trajet
      },
    }
  );

  if (!data.routes || data.routes.length === 0) {
    throw new Error("Aucun itinéraire trouvé entre ces points");
  }

  const route = data.routes[0];

  // ── Extraction des étapes turn-by-turn ──
  const etapes: EtapeNavigation[] = route.legs
    .flatMap((leg: any) => leg.steps)
    .map((step: any) => ({
      instruction: step.maneuver.instruction,
      distance: Math.round(step.distance),
      duree: Math.round(step.duration),
      coordonnees: {
        lng: step.maneuver.location[0],
        lat: step.maneuver.location[1],
      },
    }));

  // ── Détection de congestion 🚦 ──
  const congestionsDetectees = route.legs.some((leg: any) =>
    leg.annotation?.congestion?.some(
      (c: string) => c === "heavy" || c === "severe"
    )
  );

  // ── ETA ──
  const maintenant = new Date();
  const eta = new Date(maintenant.getTime() + route.duration * 1000);

  return {
    geometry: route.geometry,
    etapes,
    distanceTotale: Math.round(route.distance),
    dureeTotale: Math.round(route.duration),
    eta,
    congestionsDetectees,
  };
};

// ─── Recalcul de route (si livreur dévie) ─────────────────────────────────────

/**
 * Recalcule automatiquement la route si le livreur s'est écarté.
 * Vérifie d'abord si le recalcul est vraiment nécessaire (déviation > seuil).
 */
export const recalculerRoute = async (
  positionActuelle: Coordonnees,
  destination: Coordonnees,
  seuilDeviationMetres: number = 50  // Recalcul si déviation > 50m
): Promise<{ recalcule: boolean; route?: RouteInfo }> => {
  const distanceDeviation = await calculerDistanceVersRoute(
    positionActuelle,
    destination
  );

  if (distanceDeviation < seuilDeviationMetres) {
    return { recalcule: false }; // Pas besoin de recalculer
  }

  console.log(`🔄 Recalcul déclenché — déviation de ${distanceDeviation}m`);
  const route = await calculerRoute([positionActuelle, destination]);
  return { recalcule: true, route };
};

// ─── Prochaine instruction (turn-by-turn) ────────────────────────────────────

/**
 * Retourne la prochaine instruction de navigation selon la position actuelle.
 */
export const getProchaineInstruction = (
  positionActuelle: Coordonnees,
  etapes: EtapeNavigation[]
): { instruction: string; distanceRestante: number } | null => {
  if (etapes.length === 0) return null;

  // Trouve l'étape la plus proche
  let etapeLaPlusProche = etapes[0];
  let distanceMin = calculerDistanceHaversine(positionActuelle, etapes[0].coordonnees);

  for (const etape of etapes) {
    const dist = calculerDistanceHaversine(positionActuelle, etape.coordonnees);
    if (dist < distanceMin) {
      distanceMin = dist;
      etapeLaPlusProche = etape;
    }
  }

  const indexEtape = etapes.indexOf(etapeLaPlusProche);
  const prochaineEtape = etapes[indexEtape + 1] || etapeLaPlusProche;

  return {
    instruction: prochaineEtape.instruction,
    distanceRestante: Math.round(distanceMin),
  };
};

// ─── Géocodage ────────────────────────────────────────────────────────────────

/**
 * Convertit une adresse texte en coordonnées GPS.
 * Exemple : "12 Rue Moussa, Dakar" → { lng: -17.44, lat: 14.69 }
 */
export const geocoderAdresse = async (adresse: string): Promise<Coordonnees> => {
  const { data } = await axios.get(
    `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(adresse)}.json`,
    {
      params: {
        access_token: MAPBOX_TOKEN,
        limit: 1,
        language: "fr",
      },
    }
  );

  if (!data.features || data.features.length === 0) {
    throw new Error(`Adresse introuvable : "${adresse}"`);
  }

  const [lng, lat] = data.features[0].center;
  return { lng, lat };
};

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/**
 * Distance en mètres entre deux points GPS (formule Haversine).
 * Utilisée pour détecter la déviation de route.
 */
export const calculerDistanceHaversine = (
  point1: Coordonnees,
  point2: Coordonnees
): number => {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

// Approximation de la distance à la route (pour déclencher le recalcul)
const calculerDistanceVersRoute = async (
  position: Coordonnees,
  destination: Coordonnees
): Promise<number> => {
  return calculerDistanceHaversine(position, destination);
};