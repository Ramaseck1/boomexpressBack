import { Router } from "express";

// Import des sous-routeurs
import livreurRoutes from "./livreur";
import authRoutes from "./auth";
 import adminRoutes from "./admin";
/* import commandesRoutes from "./commandes.routes.js";
import clientsRoutes from "./clients.routes.js"; */
/* import paiementsRoutes from "./paiements.routes";
import blocagesRoutes from "./blocages.routes";
import notificationsRoutes from "./notifications.routes"; */

const router = Router();

// Préfixe des routes
router.use("/auth", authRoutes);

router.use("/livreur", livreurRoutes);
router.use("/admin", adminRoutes);
/* router.use("/commandes", commandesRoutes);
router.use("/clients", clientsRoutes); */
/* router.use("/paiements", paiementsRoutes);
router.use("/blocages", blocagesRoutes);
router.use("/notifications", notificationsRoutes); */

export default router;