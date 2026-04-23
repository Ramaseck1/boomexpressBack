"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    // @ts-ignore
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
exports.prisma = prisma;
