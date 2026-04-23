"use strict";
// src/lib/prisma.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
// Connexion à la base de données
exports.prisma.$connect()
    .then(() => {
    console.log('✅ Connecté à la base de données');
})
    .catch((error) => {
    console.error('❌ Erreur de connexion à la base de données:', error);
    process.exit(1);
});
