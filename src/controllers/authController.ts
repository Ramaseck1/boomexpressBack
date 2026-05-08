import { Request, Response } from "express";
import {
  loginLivreurService,
  loginAdminService,
  registerAdminService,
  registerLivreurService,
  getUserService,
  requestPasswordResetService,
  verifyResetCodeService,
  resetPasswordService,
} from "../services/authService";

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

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginAdminService(email, password);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

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

// ─── RESET MOT DE PASSE ───────────────────────────────────

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body; // téléphone ou email
    const result = await requestPasswordResetService(identifier);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { identifier, code } = req.body;
    const result = await verifyResetCodeService(identifier, code);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    const result = await resetPasswordService(resetToken, newPassword, confirmPassword);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};