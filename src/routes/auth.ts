import { Router } from "express";
import {
  loginLivreur,
  loginAdmin,
  registerAdmin,
  registerLivreur,
  getUser,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from "../controllers/authController";
import { authenticate, onlySuperAdmin } from "../middleware/authMiddleware";

const router = Router();

// 🔐 LOGIN
router.post("/login/livreur", loginLivreur);
router.post("/login/admin", loginAdmin);

// 📝 REGISTER
router.post("/register/livreur", registerLivreur);
router.post(
  "/register/admin",
  authenticate(["SUPERADMIN"]),
  onlySuperAdmin,
  registerAdmin
);

// 👤 PROFIL
router.get("/me", authenticate(["LIVREUR", "ADMIN", "SUPERADMIN"]), getUser);

// 🔑 RESET MOT DE PASSE (routes publiques, 3 étapes)
router.post("/password-reset/request", requestPasswordReset);   // { identifier }
router.post("/password-reset/verify", verifyResetCode);         // { identifier, code }
router.post("/password-reset/confirm", resetPassword);          // { resetToken, newPassword, confirmPassword }

export default router;