import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { storage } from "./storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 5000);

app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);
app.use(
  session({
    store: storage.pool
      ? new PgSession({
          pool: storage.pool,
          createTableIfMissing: true
        })
      : undefined,
    secret: process.env.SESSION_SECRET || "dev-prompt-for-profit-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 14
    }
  })
);

registerRoutes(app);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Something went wrong.";
  res.status(500).json({ message });
});

if (isProduction) {
  const clientDist = path.resolve(__dirname, "../client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true, host: "0.0.0.0" },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Prompt For Profit running on http://0.0.0.0:${port}`);
});
