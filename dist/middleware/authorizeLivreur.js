"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeLivreur = void 0;
const authorizeLivreur = (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "LIVREUR") {
        return res.status(403).json({ message: "Accès réservé aux livreurs" });
    }
    next();
};
exports.authorizeLivreur = authorizeLivreur;
