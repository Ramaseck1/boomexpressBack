import { prisma } from "../prisma/prisma.config";
 import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
 import crypto from "crypto";
import nodemailer from "nodemailer";

// ─── EMAIL TRANSPORTER ────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendCodeByEmail = async (email: string, code: string) => {
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
export const loginLivreurService = async (telephone: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { telephone },
  });

  if (!user || user.role !== "LIVREUR") {
    throw new Error("Livreur non trouvé");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Mot de passe incorrect");

  return generateToken(user);
};
// REGISTER LIVREUR
// REGISTER LIVREUR
export const registerLivreurService = async (data: {
  nom: string;
  prenom: string;
  telephone: string;
  password: string;
  adresse?: string; // appartient au Livreur, pas au User
}) => {
  const existing = await prisma.user.findUnique({
    where: { telephone: data.telephone },
  });

  if (existing) throw new Error("Ce numéro est déjà utilisé");

  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      nom: data.nom,           // ✅ champs explicites, pas de ...data
      prenom: data.prenom,
      telephone: data.telephone,
      password: hashed,
      role: "LIVREUR",
      livreur: {
        create: {              // ✅ création atomique du profil livreur
          disponible: false,
        },
      },
    },
  });

  return generateToken(user);
};



// ─── ÉTAPE 1 : Demande de code (inchangé) ─────────────────
export const requestPasswordResetService = async (identifier: string) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ telephone: identifier }, { email: identifier }] },
  });

  if (!user) throw new Error("Aucun compte trouvé avec cet identifiant");
  if (!user.email) throw new Error("Aucun email associé à ce compte");

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetCode.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  await prisma.passwordResetCode.create({
    data: { userId: user.id, code, expiresAt },
  });

  await sendCodeByEmail(user.email, code);
  return { message: "Code envoyé à votre adresse email" };
};

// ─── ÉTAPE 2 : Vérification du code uniquement ────────────
export const verifyResetCodeService = async (identifier: string, code: string) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ telephone: identifier }, { email: identifier }] },
  });

  if (!user) throw new Error("Aucun compte trouvé");

  const resetEntry = await prisma.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      code,
      used: false,
      verified: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!resetEntry) throw new Error("Code invalide ou expiré");

  // Marquer comme vérifié sans le consommer (used reste false)
  await prisma.passwordResetCode.update({
    where: { id: resetEntry.id },
    data: { verified: true },
  });

  return { message: "Code vérifié avec succès" };
};

// ─── ÉTAPE 3 : Nouveau mot de passe ───────────────────────
export const resetPasswordService = async (
  identifier: string,
  newPassword: string,
  confirmPassword: string
) => {
  if (newPassword !== confirmPassword) {
    throw new Error("Les mots de passe ne correspondent pas");
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ telephone: identifier }, { email: identifier }] },
  });

  if (!user) throw new Error("Aucun compte trouvé");

  // Cherche un code vérifié et non encore consommé
  const resetEntry = await prisma.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      verified: true,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!resetEntry) throw new Error("Aucune vérification valide trouvée, recommencez");

  // Consommer le code
  await prisma.passwordResetCode.update({
    where: { id: resetEntry.id },
    data: { used: true },
  });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return { message: "Mot de passe modifié avec succès" };
};
// LOGIN ADMIN
export const loginAdminService = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    throw new Error("Admin non trouvé");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Mot de passe incorrect");

  return generateToken(user);
};

// REGISTER ADMIN (par superadmin)
export const registerAdminService = async (data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}) => {
  const hashed = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      ...data,
      password: hashed,
      role: "ADMIN",
    },
  });
};

export const getUserService = async (userId: number) => {
  const user = await prisma.user.findUnique({
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

// Génération JWT
const generateToken = (user: any) => {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "24h" }
  );

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


export const updateUserService = async (
  userId: number,
  data: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
  }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { livreur: true },
  });
  if (!user) throw new Error("Utilisateur non trouvé");

  // Vérifier unicité du téléphone si modifié
  if (data.telephone && data.telephone !== user.telephone) {
    const existing = await prisma.user.findUnique({
      where: { telephone: data.telephone },
    });
    if (existing) throw new Error("Ce numéro est déjà utilisé");
  }

  // Vérifier unicité de l'email si modifié
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existing) throw new Error("Cet email est déjà utilisé");
  }

  const { adresse, ...userFields } = data;

  // Filtrer les champs undefined
  const filteredFields = Object.fromEntries(
    Object.entries(userFields).filter(([_, v]) => v !== undefined && v !== "")
  );

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...filteredFields,
    },
    include: { livreur: true },
  });

  return updated;
};