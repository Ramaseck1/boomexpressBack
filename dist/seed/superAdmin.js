"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultSuperAdmin = void 0;
const prisma_config_1 = require("../prisma/prisma.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const createDefaultSuperAdmin = async () => {
    const existing = await prisma_config_1.prisma.user.findFirst({
        where: { role: "SUPERADMIN" },
    });
    if (existing) {
        console.log("✅ SuperAdmin déjà existant");
        return;
    }
    const hashed = await bcrypt_1.default.hash("123456", 10);
    await prisma_config_1.prisma.user.create({
        data: {
            nom: "Super",
            prenom: "Admin",
            email: "superadmin@gmail.com",
            password: hashed,
            role: "SUPERADMIN",
        },
    });
    console.log("🔥 SuperAdmin créé avec succès");
};
exports.createDefaultSuperAdmin = createDefaultSuperAdmin;
