"use strict";
// controllers/navigationController.ts
// 🎮 Contrôleur Navigation — Endpoints REST pour la navigation Mapbox
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocoder = exports.calculerRouteAdHoc = exports.getETA = exports.getInstruction = exports.demarrerNavigation = void 0;
const navService = __importStar(require("../services/MapboxNavigation/navigationService"));
const mapboxService_1 = require("../services/MapboxNavigation/mapboxService");
// ─── POST /navigation/demarrer ────────────────────────────────────────────────
// Appelé quand le livreur est prêt à partir (après avoir accepté la mission)
// Body: { livraisonId, lat, lng }
const demarrerNavigation = async (req, res) => {
    try {
        const { livraisonId, lat, lng } = req.body;
        if (!livraisonId || lat === undefined || lng === undefined) {
            return res.status(400).json({
                error: "livraisonId, lat et lng sont requis",
            });
        }
        // ✅ Phase 1 — guider le livreur vers l'adresse de COLLECTE
        const data = await navService.guiderVersCollecteService(Number(livraisonId), { lat: Number(lat), lng: Number(lng) } // position GPS du livreur
        );
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.demarrerNavigation = demarrerNavigation;
// ─── GET /navigation/:livraisonId/instruction ─────────────────────────────────
// Retourne la prochaine instruction turn-by-turn
// Query: ?lat=14.69&lng=-17.44
const getInstruction = async (req, res) => {
    try {
        const livraisonId = Number(req.params.livraisonId);
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const data = await navService.getInstructionService(livraisonId, { lat, lng });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getInstruction = getInstruction;
// ─── GET /navigation/:livraisonId/eta ─────────────────────────────────────────
// ETA mis à jour avec trafic temps réel
// Query: ?lat=14.69&lng=-17.44
const getETA = async (req, res) => {
    try {
        const livraisonId = Number(req.params.livraisonId);
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const data = await navService.getETAService(livraisonId, { lat, lng });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getETA = getETA;
// ─── POST /navigation/route ────────────────────────────────────────────────────
// Calcule une route ad hoc entre deux points (sans livraison)
// Body: { depart: { lat, lng }, destination: { lat, lng } }
const calculerRouteAdHoc = async (req, res) => {
    try {
        const { depart, destination } = req.body;
        const route = await (0, mapboxService_1.calculerRoute)([depart, destination], "driving-traffic");
        res.json(route);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.calculerRouteAdHoc = calculerRouteAdHoc;
// ─── GET /navigation/geocode ──────────────────────────────────────────────────
// Convertit une adresse en coordonnées GPS
// Query: ?adresse=12 Rue Moussa, Dakar
const geocoder = async (req, res) => {
    try {
        const adresse = req.query.adresse;
        if (!adresse)
            return res.status(400).json({ error: "adresse requise" });
        const coords = await (0, mapboxService_1.geocoderAdresse)(adresse);
        res.json(coords);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.geocoder = geocoder;
