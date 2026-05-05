import { Router } from "express";
import * as controller from "../controllers/adminController";
import { authenticate } from "../middleware/authMiddleware";
import { authorizeAdmin } from "../middleware/adminMiddleware";

const router = Router();

router.use(authenticate(["ADMIN", "SUPERADMIN"]));  // ✅
router.use(authorizeAdmin);

// Clients
router.get("/clients", controller.getClients);
/* router.post("/clients", controller.createOrGetClient);
 */router.put("/clients/:clientId", controller.updateClient);
router.delete("/clients/:clientId",           controller.deleteClient);           // ✅ nouveau

router.get("/clients/:clientId/historique", controller.getClientHistorique);

router.post("/clients-commandes", controller.createClientEtCommande); // ✅ nouveau


// Commandes
router.get("/commandes", controller.getCommandes);
router.post("/commandes", controller.createCommande);
router.put("/commandes/:commandeId", controller.updateCommande);
router.delete("/commandes/:commandeId",       controller.deleteCommande);         // ✅ nouveau

router.post("/commandes/assigner", controller.assignerCommande);


// Livreurs
router.get("/livreurs", controller.getLivreurs);
router.get("/livreurs/:livreurId", controller.getProfilLivreur);
router.patch("/livreurs/:livreurId/toggle", controller.toggleCompteLivreur);
// Bloquer un livreur
router.post("/livreurs/bloquer", controller.bloquerLivreur);
// Liste des paiements
/* router.get("/paiements", controller.getPaiements);
 */router.post("/paiements/payer", controller.marquerPaiementJour);
/*  router.post("/paiements/payer-jour", controller.marquerPaiementJour);
 */
export default router;