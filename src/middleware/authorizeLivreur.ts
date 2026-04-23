import { Request, Response, NextFunction } from "express";

export const authorizeLivreur = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user;

  if (!user || user.role !== "LIVREUR") {
    return res.status(403).json({ message: "Accès réservé aux livreurs" });
  }

  next();
};