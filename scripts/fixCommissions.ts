import { prisma } from "../src/prisma/prisma.config";

async function fix() {
  const result = await prisma.commande.updateMany({
    where: {
      commissionPaye: true,
      livraisons: {
        none: { statut: "livree" }
      }
    },
    data: { commissionPaye: false }
  });

  console.log(`✅ ${result.count} commande(s) corrigée(s)`);
  await prisma.$disconnect();
}

fix().catch(console.error);