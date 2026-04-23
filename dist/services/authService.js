"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserService = exports.registerAdminService = exports.loginAdminService = exports.registerLivreurService = exports.loginLivreurService = void 0;
const prisma_config_1 = require("../prisma/prisma.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// LOGIN LIVREUR
const loginLivreurService = async (telephone, password) => {
    const user = await prisma_config_1.prisma.user.findUnique({
        where: { telephone },
    });
    if (!user || user.role !== "LIVREUR") {
        throw new Error("Livreur non trouvé");
    }
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        throw new Error("Mot de passe incorrect");
    return generateToken(user);
};
exports.loginLivreurService = loginLivreurService;
// REGISTER LIVREUR
// REGISTER LIVREUR
const registerLivreurService = async (data) => {
    const existing = await prisma_config_1.prisma.user.findUnique({
        where: { telephone: data.telephone },
    });
    if (existing)
        throw new Error("Ce numéro est déjà utilisé");
    const hashed = await bcrypt_1.default.hash(data.password, 10);
    const user = await prisma_config_1.prisma.user.create({
        data: {
            nom: data.nom, // ✅ champs explicites, pas de ...data
            prenom: data.prenom,
            telephone: data.telephone,
            password: hashed,
            role: "LIVREUR",
            livreur: {
                create: {
                    disponible: false,
                },
            },
        },
    });
    return generateToken(user);
};
exports.registerLivreurService = registerLivreurService;
// LOGIN ADMIN
const loginAdminService = async (email, password) => {
    const user = await prisma_config_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
        throw new Error("Admin non trouvé");
    }
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        throw new Error("Mot de passe incorrect");
    return generateToken(user);
};
exports.loginAdminService = loginAdminService;
// REGISTER ADMIN (par superadmin)
const registerAdminService = async (data) => {
    const hashed = await bcrypt_1.default.hash(data.password, 10);
    return prisma_config_1.prisma.user.create({
        data: {
            ...data,
            password: hashed,
            role: "ADMIN",
        },
    });
};
exports.registerAdminService = registerAdminService;
const getUserService = async (userId) => {
    const user = await prisma_config_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            livreur: true, // 🔥 si c'est un livreur
        },
    });
    if (!user) {
        throw new Error("Utilisateur non trouvé");
    }
    return user;
};
exports.getUserService = getUserService;
// Génération JWT
const generateToken = (user) => {
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "24h" });
    return {
        token,
        user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom, // 🔥 AJOUT ICI
            role: user.role,
        },
    };
};
