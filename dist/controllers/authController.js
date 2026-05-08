"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.resetPassword = exports.verifyResetCode = exports.requestPasswordReset = exports.getUser = exports.registerAdmin = exports.loginAdmin = exports.registerLivreur = exports.loginLivreur = void 0;
const authService_1 = require("../services/authService");
const loginLivreur = async (req, res) => {
    try {
        const { telephone, password } = req.body;
        const result = await (0, authService_1.loginLivreurService)(telephone, password);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.loginLivreur = loginLivreur;
const registerLivreur = async (req, res) => {
    try {
        const result = await (0, authService_1.registerLivreurService)(req.body);
        res.status(201).json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.registerLivreur = registerLivreur;
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await (0, authService_1.loginAdminService)(email, password);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.loginAdmin = loginAdmin;
const registerAdmin = async (req, res) => {
    try {
        const admin = await (0, authService_1.registerAdminService)(req.body);
        res.status(201).json(admin);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.registerAdmin = registerAdmin;
const getUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await (0, authService_1.getUserService)(userId);
        res.json(user);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.getUser = getUser;
// ─── RESET MOT DE PASSE ───────────────────────────────────
const requestPasswordReset = async (req, res) => {
    try {
        const { identifier } = req.body; // téléphone ou email
        const result = await (0, authService_1.requestPasswordResetService)(identifier);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.requestPasswordReset = requestPasswordReset;
const verifyResetCode = async (req, res) => {
    try {
        const { identifier, code } = req.body;
        const result = await (0, authService_1.verifyResetCodeService)(identifier, code);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.verifyResetCode = verifyResetCode;
const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;
        const result = await (0, authService_1.resetPasswordService)(resetToken, newPassword, confirmPassword);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.resetPassword = resetPassword;
const updateUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await (0, authService_1.updateUserService)(userId, req.body);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.updateUser = updateUser;
