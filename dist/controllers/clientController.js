"use strict";
// controllers/clientController.ts
// NOUVEAU CONTROLLER — dédié au client. N'importe/ne modifie aucun fichier existant.
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
exports.annulerCommandeClient = exports.suivreCommande = exports.listerCommandesClient = exports.creerCommande = exports.savePushTokenClient = exports.updateLocalisationClient = exports.updateProfilClient = exports.getProfilClient = exports.estimerCommande = exports.resoudreAdresse = exports.rechercherAdresses = exports.loginClient = exports.registerClient = void 0;
const service = __importStar(require("../services/clientService"));
// ═══════════════════════ AUTH ═══════════════════════
const registerClient = async (req, res) => {
    try {
        const { nom, prenom, telephone, password, email, adresse } = req.body;
        const result = await service.registerClientService({ nom, prenom, telephone, password, email, adresse });
        res.status(201).json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.registerClient = registerClient;
const loginClient = async (req, res) => {
    try {
        const { telephone, password } = req.body;
        const result = await service.loginClientService(telephone, password);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.loginClient = loginClient;
const rechercherAdresses = async (req, res) => {
    try {
        const query = String(req.query.q || "");
        const result = await service.rechercherAdressesService(query);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.rechercherAdresses = rechercherAdresses;
const resoudreAdresse = async (req, res) => {
    try {
        const placeId = String(req.query.placeId ?? req.params.placeId ?? "");
        if (!placeId)
            return res.status(400).json({ message: "placeId requis" });
        const result = await service.resoudreAdresseService(placeId);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.resoudreAdresse = resoudreAdresse;
// ═══════════════════════ PROFIL ═══════════════════════
// clientController.ts
const estimerCommande = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await service.estimerCommandeService(userId, req.body);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.estimerCommande = estimerCommande;
const getProfilClient = async (req, res) => {
    try {
        const userId = req.user.userId;
        res.json(await service.getProfilClientService(userId));
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.getProfilClient = getProfilClient;
const updateProfilClient = async (req, res) => {
    try {
        const userId = req.user.userId;
        res.json(await service.updateProfilClientService(userId, req.body));
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.updateProfilClient = updateProfilClient;
const updateLocalisationClient = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { lat, lng } = req.body;
        res.json(await service.updateLocalisationClientService(userId, Number(lat), Number(lng)));
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.updateLocalisationClient = updateLocalisationClient;
const savePushTokenClient = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { token } = req.body;
        res.json(await service.savePushTokenClientService(userId, token));
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.savePushTokenClient = savePushTokenClient;
// ═══════════════════════ COMMANDES ═══════════════════════
const creerCommande = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await service.creerCommandeService(userId, req.body);
        res.status(201).json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.creerCommande = creerCommande;
const listerCommandesClient = async (req, res) => {
    try {
        const userId = req.user.userId;
        res.json(await service.listerCommandesClientService(userId));
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.listerCommandesClient = listerCommandesClient;
const suivreCommande = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { commandeId } = req.params;
        res.json(await service.suivreCommandeService(userId, Number(commandeId)));
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.suivreCommande = suivreCommande;
const annulerCommandeClient = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { commandeId } = req.body;
        if (!commandeId)
            return res.status(400).json({ message: "commandeId requis" });
        res.json(await service.annulerCommandeClientService(userId, Number(commandeId)));
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.annulerCommandeClient = annulerCommandeClient;
