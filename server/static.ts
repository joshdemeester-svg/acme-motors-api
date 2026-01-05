import express, { type Express, type Request } from "express";
import fs from "fs";
import path from "path";
import { getSEODataForRoute, injectSEOTags } from "./seo";

function getBaseUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
  return `${protocol}://${host}`;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Serve index.html with injected SEO tags
  app.use("*", async (req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");
      
      const baseUrl = getBaseUrl(req);
      const seoData = await getSEODataForRoute(req.originalUrl, baseUrl);
      
      if (seoData) {
        html = injectSEOTags(html, seoData);
      }
      
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      console.error("[static] Error serving index.html:", error);
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
