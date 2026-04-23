// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;



// Connexion à la base de données
prisma.$connect()
  .then(() => {
    console.log('✅ Connecté à la base de données');
  })
 .catch((error: unknown) => {
  console.error('❌ Erreur de connexion à la base de données:', error);
  process.exit(1);
});
