import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

const APP_USER = process.env.APP_USER || "";
const APP_PASSWORD_HASH = process.env.APP_PASSWORD_HASH || "";

export function login(username: string, password: string): boolean {
  if (!APP_USER || !APP_PASSWORD_HASH) {
    throw new Error(
      "APP_USER / APP_PASSWORD_HASH não configurados no ambiente do backend."
    );
  }
  if (username !== APP_USER) return false;
  return bcrypt.compareSync(password, APP_PASSWORD_HASH);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (session && session.authed) {
    return next();
  }
  return res.status(401).json({ error: "not_authenticated" });
}
