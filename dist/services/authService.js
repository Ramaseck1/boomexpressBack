"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserService = exports.registerAdminService = exports.loginAdminService = exports.loginLivreurService = exports.registerLivreurService = void 0;
const prisma_config_1 = require("../prisma/prisma.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ocrService_1 = require("./ocrService");
const registerLivreurService = async (data) => {
    if (!data.cniRecto || !data.cniVerso) {
        throw new Error("CNI obligatoire (recto + verso)");
    }
    // Vérifier téléphone
    const existing = await prisma_config_1.prisma.user.findUnique({
        where: { telephone: data.telephone },
    });
    if (existing) {
        throw new Error("Numéro déjà utilisé");
    }
    // 🔥 OCR + VALIDATION
    const cni = await (0, ocrService_1.processCNI)(data.cniRecto, data.cniVerso);
    if (!cni.isAdult) {
        throw new Error("Vous devez avoir au moins 18 ans");
    }
    // 🔐 HASH PASSWORD
    const hashed = await bcrypt_1.default.hash(data.password, 10);
    // 💾 CREATE USER
    const user = await prisma_config_1.prisma.user.create({
        data: {
            nom: data.nom,
            prenom: data.prenom,
            telephone: data.telephone,
            password: hashed,
            role: "LIVREUR",
            livreur: {
                create: {
                    disponible: false,
                    cniRecto: data.cniRecto,
                    cniVerso: data.cniVerso,
                    dateNaissance: new Date(cni.dateNaissance.split(/[\/\-]/).reverse().join("-")),
                    permis: data.permis || null,
                    carteGrise: data.carteGrise || null,
                    assurance: data.assurance || null,
                    estVerifie: false,
                },
            },
        },
    });
    return generateToken(user);
};
exports.registerLivreurService = registerLivreurService;
// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
const loginLivreurService = async (telephone, password) => {
    const user = await prisma_config_1.prisma.user.findUnique({
        where: { telephone },
    });
    if (!user || user.role !== "LIVREUR") {
        throw new Error("Livreur non trouvé");
    }
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid) {
        throw new Error("Mot de passe incorrect");
    }
    return generateToken(user);
};
exports.loginLivreurService = loginLivreurService;
// ─────────────────────────────────────────────
// TOKEN
// ─────────────────────────────────────────────
const generateToken = (user) => {
    const token = jsonwebtoken_1.default.sign({
        userId: user.id,
        role: user.role,
    }, process.env.JWT_SECRET || "secret", { expiresIn: "24h" });
    return {
        token,
        user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role,
        },
    };
};
const loginAdminService = async (email, password) => {
    const user = await prisma_config_1.prisma.user.findUnique({ where: { email } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN"))
        throw new Error("Admin non trouvé.");
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        throw new Error("Mot de passe incorrect.");
    return generateToken(user);
};
exports.loginAdminService = loginAdminService;
const registerAdminService = async (data) => {
    const hashed = await bcrypt_1.default.hash(data.password, 10);
    return prisma_config_1.prisma.user.create({ data: { ...data, password: hashed, role: "ADMIN" } });
};
exports.registerAdminService = registerAdminService;
const getUserService = async (userId) => {
    const user = await prisma_config_1.prisma.user.findUnique({ where: { id: userId }, include: { livreur: true } });
    if (!user)
        throw new Error("Utilisateur non trouvé.");
    return user;
};
exports.getUserService = getUserService;
