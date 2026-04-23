"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlySuperAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (roles = []) => {
    return (req, res, next) => {
        const header = req.headers.authorization;
        if (!header) {
            return res.status(401).json({ message: "Token requis" });
        }
        const token = header.split(" ")[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Accès interdit" });
            }
            req.user = decoded;
            next();
        }
        catch {
            return res.status(401).json({ message: "Token invalide" });
        }
    };
};
exports.authenticate = authenticate;
const onlySuperAdmin = (req, res, next) => {
    if (req.user.role !== "SUPERADMIN") {
        return res.status(403).json({ message: "Accès réservé au SUPERADMIN" });
    }
    next();
};
exports.onlySuperAdmin = onlySuperAdmin;
