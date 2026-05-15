import { Router } from "express";
import * as controller from "../controllers/adminController";
import { authenticate } from "../middleware/authMiddleware";
import { authorizeAdmin } from "../middleware/adminMiddleware";
import { uploadDocuments } from "../middleware/uploadDocuments";

const router = Router();

router.use(authenticate(["ADMIN", "SUPERADMIN"]));
router.use(authorizeAdmin);

// Clients
router.get("/clients",                          controller.getClients);
router.put("/clients/:clientId",                controller.updateClient);
router.delete("/clients/:clientId",             controller.deleteClient);
router.get("/clients/:clientId/historique",     controller.getClientHistorique);
router.post("/clients-commandes",               controller.createClientEtCommande);

// Commandes
router.get("/commandes",                        controller.getCommandes);
router.post("/commandes/annuler", controller.annulerCommande);
router.post("/commandes",                       controller.createCommande);
router.put("/commandes/:commandeId",            controller.updateCommande);
router.delete("/commandes/:commandeId",         controller.deleteCommande);
router.post("/commandes/assigner",              controller.assignerCommande);
router.post("/commandes/assigner-proche", controller.assignerCommandeAuPlusProche);
router.get("/livreurs/positions", controller.getLivreursPositions);


// Livreurs — routes statiques AVANT les routes dynamiques (:livreurId)
router.get("/livreurs",                         controller.getLivreurs);
router.get("/livreurs/statut-commissions",      controller.getLivreursStatutCommissions);
router.post("/livreurs/bloquer-commission",     controller.bloquerLivreurCommissionImpayee);
router.post("/livreurs/debloquer",              controller.debloquerLivreur);
router.post("/livreurs/bloquer",                controller.bloquerLivreur);

// Livreurs — routes dynamiques
router.get("/livreurs/:livreurId",              controller.getProfilLivreur);
router.patch("/livreurs/:livreurId/toggle",     controller.toggleCompteLivreur);
router.post(
  "/livreurs/:livreurId/documents",
  uploadDocuments.fields([
    { name: "cni_recto",      maxCount: 1 },
    { name: "cni_verso",      maxCount: 1 },
    { name: "permis",         maxCount: 1 },
    { name: "assurance",      maxCount: 1 },
    { name: "recepisse_moto", maxCount: 1 },
  ]),
  controller.uploadDocumentsLivreur
);
router.get("/livreurs/:livreurId/documents",    controller.getDocumentsLivreur);
router.post("/livreurs/:livreurId/valider",     controller.validerProfilLivreur);
router.delete("/livreurs/:livreurId/documents", controller.supprimerDocument);

// Commissions
router.get("/commissions/jour",                 controller.getCommissionsJour);
router.post("/commissions/payer",               controller.payerCommissionsJour);
router.get("/commissions/stats",                controller.getStatsCommissionsGlobales);

export default router;