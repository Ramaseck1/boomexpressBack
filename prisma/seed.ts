import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // Vérifier si superadmin existe déjà
  const existing = await prisma.user.findFirst({
    where: { role: Role.SUPERADMIN }, // ✅ FIX
  });

  if (existing) {
    console.log("✅ SuperAdmin déjà existant");
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Création SUPERADMIN
  const superAdmin = await prisma.user.create({
    data: {
      nom: "Super",
      prenom: "Admin",
      email: "superadmin@gmail.com",
      password: hashedPassword,
      role: Role.SUPERADMIN, // ✅ FIX
    },
  });

  console.log("🔥 SuperAdmin créé :", superAdmin.email);
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });