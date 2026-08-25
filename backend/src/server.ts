import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import { authRouter } from "./routes/auth";
import { assuntosRouter } from "./routes/assuntos";
import { requireAuth } from "./auth";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const IS_PROD = process.env.NODE_ENV === "production";

// necessário atrás de um proxy (Render/Railway/etc terminam o HTTPS antes do app) para que o
// Express reconheça a conexão como segura via X-Forwarded-Proto, senão o cookie de sessão
// (secure: true em produção) nunca é enviado pelo navegador.
if (IS_PROD) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  cookieSession({
    name: "session",
    keys: [SESSION_SECRET],
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: IS_PROD,
  })
);

// PDFs semanais (Resumo do Conteúdo abre direto na página correta via #page=N no front-end)
app.use("/pdfs", express.static(path.join(__dirname, "..", "public", "pdfs")));

app.use("/api/auth", authRouter);
app.use("/api", requireAuth, assuntosRouter);

// serve o build do frontend em produção (deploy único)
const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/pdfs")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
