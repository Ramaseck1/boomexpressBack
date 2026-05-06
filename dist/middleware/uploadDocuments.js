"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocuments = void 0;
const multer_1 = __importDefault(require("multer"));
// Stockage en mémoire — on upload vers Cloudinary manuellement dans le service
exports.uploadDocuments = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        cb(null, allowed.includes(file.mimetype) ? true : false);
    },
});
