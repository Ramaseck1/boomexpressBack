import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  // @ts-ignore
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export { prisma };
