import { Router } from "express";
import { login } from "../auth";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "missing_credentials" });
  }
  let ok = false;
  try {
    ok = login(username, password);
  } catch (e: any) {
    return res.status(500).json({ error: "server_misconfigured", detail: e.message });
  }
  if (!ok) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  (req.session as any).authed = true;
  res.json({ ok: true });
});

authRouter.post("/logout", (req, res) => {
  (req.session as any) = null;
  res.json({ ok: true });
});

authRouter.get("/me", (req, res) => {
  res.json({ authed: !!(req.session as any)?.authed });
});
