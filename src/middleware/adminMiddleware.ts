 import { Request, Response, NextFunction } from "express";

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  console.log("authorizeAdmin req.user:", user);

  if (!user) return res.status(401).json({ error: "Utilisateur non authentifié" });

  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }

  next();
};