import { Router } from "express";
import {
  loginLivreur,
  loginAdmin,
  registerAdmin,registerLivreur,
  getUser
} from "../controllers/authController";
import { authenticate ,onlySuperAdmin} from "../middleware/authMiddleware";

const router = Router();

// 🔐 LOGIN
router.post("/login/livreur", loginLivreur);
router.post("/login/admin", loginAdmin);

// 👑 REGISTER ADMIN (SUPERADMIN ONLY)
router.post(
  "/register/admin",
  authenticate(["SUPERADMIN"]),
  onlySuperAdmin,
  registerAdmin
);

router.get(
  "/me",
  authenticate(["LIVREUR", "ADMIN", "SUPERADMIN"]),
  getUser
);

router.post("/register/livreur", registerLivreur); // ← public
 export default router;