import { prisma } from "../prisma/prisma.config";
 import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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