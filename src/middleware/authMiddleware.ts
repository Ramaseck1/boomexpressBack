import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticate = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ message: "Token requis" });
    }

    const token = header.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Accès interdit" });
      }

      (req as any).user = decoded;
      next();
    } catch {
      return res.status(401).json({ message: "Token invalide" });
    }
  };
};
export const onlySuperAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "SUPERADMIN") {
    return res.status(403).json({ message: "Accès réservé au SUPERADMIN" });
  }
  next();
};