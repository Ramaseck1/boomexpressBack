import { Request, Response } from "express";
import {
  loginLivreurService,
  loginAdminService,
  registerAdminService,
  registerLivreurService,
  getUserService
} from "../services/authService";

// LOGIN LIVREUR
export const loginLivreur = async (req: Request, res: Response) => {
  try {
    const { telephone, password } = req.body;
    const result = await loginLivreurService(telephone, password);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const registerLivreur = async (req: Request, res: Response) => {
  try {
    const result = await registerLivreurService(req.body);
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
// LOGIN ADMIN
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginAdminService(email, password);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};


// REGISTER ADMIN (SUPERADMIN ONLY)
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const admin = await registerAdminService(req.body);
    res.status(201).json(admin);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await getUserService(userId);

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};