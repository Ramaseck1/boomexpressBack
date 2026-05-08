"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// 🔐 LOGIN
router.post("/login/livreur", authController_1.loginLivreur);
router.post("/login/admin", authController_1.loginAdmin);
// 📝 REGISTER
router.post("/register/livreur", authController_1.registerLivreur);
router.post("/register/admin", (0, authMiddleware_1.authenticate)(["SUPERADMIN"]), authMiddleware_1.onlySuperAdmin, authController_1.registerAdmin);
// 👤 PROFIL
router.get("/me", (0, authMiddleware_1.authenticate)(["LIVREUR", "ADMIN", "SUPERADMIN"]), authController_1.getUser);
router.put("/me", (0, authMiddleware_1.authenticate)(["LIVREUR", "ADMIN", "SUPERADMIN"]), authController_1.updateUser);
// 🔑 RESET MOT DE PASSE (routes publiques, 3 étapes)
router.post("/password-reset/request", authController_1.requestPasswordReset); // { identifier }
router.post("/password-reset/verify", authController_1.verifyResetCode); // { identifier, code }
router.post("/password-reset/confirm", authController_1.resetPassword); // { resetToken, newPassword, confirmPassword }
exports.default = router;
