"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = void 0;
const authorizeAdmin = (req, res, next) => {
    const user = req.user;
    console.log("authorizeAdmin req.user:", user);
    if (!user)
        return res.status(401).json({ error: "Utilisateur non authentifié" });
    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
