import { prisma } from "../prisma/prisma.config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { processCNI } from "./ocrService";

 



export const registerLivreurService = async (data: {
  nom: string;
  prenom: string;
  telephone: string;
  password: string;
  cniRecto: string;
  cniVerso: string;
  permis?: string;
  carteGrise?: string;
  assurance?: string;
}) => {
  if (!data.cniRecto || !data.cniVerso) {
    throw new Error("CNI obligatoire (recto + verso)");
  }

  // Vérifier téléphone
  const existing = await prisma.user.findUnique({
    where: { telephone: data.telephone },
  });

  if (existing) {
    throw new Error("Numéro déjà utilisé");
  }

  // 🔥 OCR + VALIDATION
  const cni = await processCNI(data.cniRecto, data.cniVerso);

  if (!cni.isAdult) {
    throw new Error("Vous devez avoir au moins 18 ans");
  }

  // 🔐 HASH PASSWORD
  const hashed = await bcrypt.hash(data.password, 10);

  // 💾 CREATE USER
  const user = await prisma.user.create({
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
          dateNaissance: new Date(
            cni.dateNaissance.split(/[\/\-]/).reverse().join("-")
          ),
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

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export const loginLivreurService = async (
  telephone: string,
  password: string
) => {
  const user = await prisma.user.findUnique({
    where: { telephone },
  });

  if (!user || user.role !== "LIVREUR") {
    throw new Error("Livreur non trouvé");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new Error("Mot de passe incorrect");
  }

  return generateToken(user);
};

// ─────────────────────────────────────────────
// TOKEN
// ─────────────────────────────────────────────
const generateToken = (user: any) => {
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "24h" }
  );

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

 
export const loginAdminService = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) throw new Error("Admin non trouvé.");
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Mot de passe incorrect.");
  return generateToken(user);
};

export const registerAdminService = async (data: {
  nom: string; prenom: string; email: string; password: string;
}) => {
  const hashed = await bcrypt.hash(data.password, 10);
  return prisma.user.create({ data: { ...data, password: hashed, role: "ADMIN" } });
};

export const getUserService = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { livreur: true } });
  if (!user) throw new Error("Utilisateur non trouvé.");
  return user;
};

 