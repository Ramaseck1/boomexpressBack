"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Import des sous-routeurs
const livreur_1 = __importDefault(require("./livreur"));
const auth_1 = __importDefault(require("./auth"));
const admin_1 = __importDefault(require("./admin"));
/* import commandesRoutes from "./commandes.routes.js";
import clientsRoutes from "./clients.routes.js"; */
/* import paiementsRoutes from "./paiements.routes";
import blocagesRoutes from "./blocages.routes";
import notificationsRoutes from "./notifications.routes"; */
const router = (0, express_1.Router)();
// Préfixe des routes
router.use("/auth", auth_1.default);
router.use("/livreur", livreur_1.default);
router.use("/admin", admin_1.default);
/* router.use("/commandes", commandesRoutes);
router.use("/clients", clientsRoutes); */
/* router.use("/paiements", paiementsRoutes);
router.use("/blocages", blocagesRoutes);
router.use("/notifications", notificationsRoutes); */
exports.default = router;
