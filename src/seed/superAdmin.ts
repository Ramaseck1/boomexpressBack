import { prisma } from "../prisma/prisma.config";
import bcrypt from "bcrypt";

export const createDefaultSuperAdmin = async () => {
  const existing = await prisma.user.findFirst({
    where: { role: "SUPERADMIN" },
  });

  if (existing) {
    console.log("✅ SuperAdmin déjà existant");
    return;
  }

  const hashed = await bcrypt.hash("123456", 10);

  await prisma.user.create({
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