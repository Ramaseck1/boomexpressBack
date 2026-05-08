"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserService = exports.registerAdminService = exports.loginAdminService = exports.resetPasswordService = exports.verifyResetCodeService = exports.requestPasswordResetService = exports.registerLivreurService = exports.loginLivreurService = void 0;
const prisma_config_1 = require("../prisma/prisma.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
// ─── EMAIL TRANSPORTER ────────────────────────────────────
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});
const sendCodeByEmail = async (email, code) => {
    await transporter.sendMail({
        from: `"Mon App" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Code de réinitialisation de mot de passe",
        html: `
      <div style="font-family: Arial; padding: 20px; max-width: 400px;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Voici votre code de vérification :</p>
        <h1 style="letter-spacing: 8px; color: #4F46E5; font-size: 36px;">${code}</h1>
        <p>Ce code expire dans <strong>15 minutes</strong>.</p>
        <p style="color: #888;">Si vous n'avez pas demandé ce code, ignorez ce message.</p>
      </div>
    `,
    });
};
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
// ─── ÉTAPE 1 : Demande de code (inchangé) ─────────────────
const requestPasswordResetService = async (identifier) => {
    const user = await prisma_config_1.prisma.user.findFirst({
        where: { OR: [{ telephone: identifier }, { email: identifier }] },
    });
    if (!user)
        throw new Error("Aucun compte trouvé avec cet identifiant");
    if (!user.email)
        throw new Error("Aucun email associé à ce compte");
    const code = crypto_1.default.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma_config_1.prisma.passwordResetCode.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
    });
    await prisma_config_1.prisma.passwordResetCode.create({
        data: { userId: user.id, code, expiresAt },
    });
    await sendCodeByEmail(user.email, code);
    return { message: "Code envoyé à votre adresse email" };
};
exports.requestPasswordResetService = requestPasswordResetService;
// ─── ÉTAPE 2 : Vérification du code uniquement ────────────
const verifyResetCodeService = async (identifier, code) => {
    const user = await prisma_config_1.prisma.user.findFirst({
        where: { OR: [{ telephone: identifier }, { email: identifier }] },
    });
    if (!user)
        throw new Error("Aucun compte trouvé");
    const resetEntry = await prisma_config_1.prisma.passwordResetCode.findFirst({
        where: {
            userId: user.id,
            code,
            used: false,
            verified: false,
            expiresAt: { gt: new Date() },
        },
    });
    if (!resetEntry)
        throw new Error("Code invalide ou expiré");
    // Marquer comme vérifié sans le consommer (used reste false)
    await prisma_config_1.prisma.passwordResetCode.update({
        where: { id: resetEntry.id },
        data: { verified: true },
    });
    return { message: "Code vérifié avec succès" };
};
exports.verifyResetCodeService = verifyResetCodeService;
// ─── ÉTAPE 3 : Nouveau mot de passe ───────────────────────
const resetPasswordService = async (identifier, newPassword, confirmPassword) => {
    if (newPassword !== confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas");
    }
    const user = await prisma_config_1.prisma.user.findFirst({
        where: { OR: [{ telephone: identifier }, { email: identifier }] },
    });
    if (!user)
        throw new Error("Aucun compte trouvé");
    // Cherche un code vérifié et non encore consommé
    const resetEntry = await prisma_config_1.prisma.passwordResetCode.findFirst({
        where: {
            userId: user.id,
            verified: true,
            used: false,
            expiresAt: { gt: new Date() },
        },
    });
    if (!resetEntry)
        throw new Error("Aucune vérification valide trouvée, recommencez");
    // Consommer le code
    await prisma_config_1.prisma.passwordResetCode.update({
        where: { id: resetEntry.id },
        data: { used: true },
    });
    const hashed = await bcrypt_1.default.hash(newPassword, 10);
    await prisma_config_1.prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
    });
    return { message: "Mot de passe modifié avec succès" };
};
exports.resetPasswordService = resetPasswordService;
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
