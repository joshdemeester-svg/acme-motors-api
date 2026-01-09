import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, initializeDefaultAdmin, seedDatabaseFromConfig } from "./routes";
import { createServer } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";
import { requestIdMiddleware } from "./middleware/requestId";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
    role?: string;
    sellerPhone?: string;
    isSeller?: boolean;
  }
}

export async function createApp() {
  const app = express();
  const httpServer = createServer(app);

  const MemoryStoreSession = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "test-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
    })
  );

  app.use(requestIdMiddleware);

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  app.use(express.urlencoded({ extended: false }));

  await registerRoutes(httpServer, app);

  if (process.env.NODE_ENV !== "test") {
    await initializeDefaultAdmin();
    await seedDatabaseFromConfig();
  }

  const attachedAssetsPath = path.resolve(process.cwd(), "attached_assets");
  app.use("/attached_assets", express.static(attachedAssetsPath));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return { app, httpServer };
}
