"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.registerAdmin = exports.loginAdmin = exports.registerLivreur = exports.loginLivreur = void 0;
const authService_1 = require("../services/authService");
// LOGIN LIVREUR
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
// LOGIN ADMIN
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
// REGISTER ADMIN (SUPERADMIN ONLY)
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
