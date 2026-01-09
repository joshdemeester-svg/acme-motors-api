import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, initializeDefaultAdmin, seedDatabaseFromConfig, autoBackfillSlugs } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";
import { pool } from "./db";

const app = express();
const httpServer = createServer(app);

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

const MemoryStoreSession = MemoryStore(session);

// Trust proxy for production (Replit uses a reverse proxy)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "prestige-auto-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days - remember sellers for a week
      sameSite: "lax",
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000,
    }),
  })
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function autoMigrateSiteSettings() {
  console.log("[migrate] Checking site_settings schema...");
  try {
    const client = await pool.connect();
    try {
      // First check if table exists, preferring public schema
      const tableCheck = await client.query(`
        SELECT table_name, table_schema 
        FROM information_schema.tables 
        WHERE table_name = 'site_settings'
        ORDER BY CASE WHEN table_schema = 'public' THEN 0 ELSE 1 END
        LIMIT 1
      `);
      
      if (tableCheck.rows.length === 0) {
        console.log("[migrate] site_settings table not found, skipping migration");
        return;
      }
      
      const tableSchema = tableCheck.rows[0].table_schema;
      console.log(`[migrate] Found site_settings table in schema: ${tableSchema}`);
      
      // Get properly quoted schema identifier
      const quoteResult = await client.query(`SELECT quote_ident($1) as quoted_schema`, [tableSchema]);
      const quotedSchema = quoteResult.rows[0].quoted_schema;
      
      // Check and add missing columns to site_settings table
      const columnsToCheck = [
        { name: "live_chat_enabled", type: "BOOLEAN DEFAULT FALSE" },
        { name: "live_chat_widget_id", type: "TEXT" },
        { name: "footer_logo_width", type: "TEXT" },
        { name: "mobile_logo_width", type: "TEXT" },
        { name: "slug_include_location", type: "BOOLEAN DEFAULT TRUE" },
        { name: "slug_location_first", type: "BOOLEAN DEFAULT FALSE" },
        { name: "slug_include_stock", type: "BOOLEAN DEFAULT FALSE" },
        { name: "hot_listing_threshold", type: "INTEGER DEFAULT 5" },
      ];
      
      let addedColumns = 0;
      for (const col of columnsToCheck) {
        const checkResult = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = 'site_settings' AND column_name = $2
        `, [tableSchema, col.name]);
        
        if (checkResult.rows.length === 0) {
          console.log(`[migrate] Adding missing column: ${col.name}`);
          await client.query(`ALTER TABLE ${quotedSchema}.site_settings ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
          addedColumns++;
        }
      }
      
      if (addedColumns > 0) {
        console.log(`[migrate] Added ${addedColumns} missing columns to site_settings`);
      } else {
        console.log("[migrate] Site settings schema up to date");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[migrate] Error checking/updating schema:", error);
  }
}

(async () => {
  await registerRoutes(httpServer, app);
  await initializeDefaultAdmin();
  
  // Auto-migrate: ensure all site_settings columns exist
  await autoMigrateSiteSettings();
  
  await seedDatabaseFromConfig();
  await autoBackfillSlugs();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve attached_assets directory for demo images and uploaded files
  const attachedAssetsPath = path.resolve(process.cwd(), "attached_assets");
  app.use("/attached_assets", express.static(attachedAssetsPath));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
