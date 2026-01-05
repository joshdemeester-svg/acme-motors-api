import { storage } from "./storage";

interface SEOData {
  title: string;
  description: string;
  image?: string;
  url: string;
  type: string;
}

const seoCache = new Map<string, { data: SEOData; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

function getCachedSEO(cacheKey: string): SEOData | null {
  const cached = seoCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedSEO(cacheKey: string, data: SEOData): SEOData {
  seoCache.set(cacheKey, { data, timestamp: Date.now() });
  if (seoCache.size > 100) {
    const now = Date.now();
    const keysToDelete: string[] = [];
    seoCache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_TTL) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => seoCache.delete(key));
  }
  return data;
}

export async function getSEODataForRoute(url: string, baseUrl: string): Promise<SEOData | null> {
  const cacheKey = `${baseUrl}:${url}`;
  const cached = getCachedSEO(cacheKey);
  if (cached) return cached;

  try {
    const settings = await storage.getSiteSettings();
    const siteName = settings?.siteName || "Prestige Auto Consignment";
    const defaultDescription = settings?.footerTagline || "Premium automotive consignment services for discerning collectors and enthusiasts.";
    const logoUrl = settings?.logoUrl ? `${baseUrl}${settings.logoUrl}` : undefined;

    // Vehicle details page: /inventory/:id
    const vehicleMatch = url.match(/^\/inventory\/([a-f0-9-]+)$/i);
    if (vehicleMatch) {
      const vehicleId = vehicleMatch[1];
      const car = await storage.getInventoryCar(vehicleId);
      if (car) {
        const imageUrl = car.photos?.[0] ? `${baseUrl}${car.photos[0]}` : logoUrl;
        return setCachedSEO(cacheKey, {
          title: `${car.year} ${car.make} ${car.model} for Sale | ${siteName}`,
          description: `${car.year} ${car.make} ${car.model} with ${car.mileage?.toLocaleString()} miles in ${car.color}. ${car.condition} condition. Price: $${car.price?.toLocaleString()}. View details and contact us today.`,
          image: imageUrl,
          url: `${baseUrl}${url}`,
          type: "product",
        });
      }
    }

    // Inventory listing page
    if (url === "/inventory" || url === "/inventory/") {
      const inventory = await storage.getAllInventoryCars();
      const featuredCar = inventory.find((c) => c.featured === true);
      const imageUrl = featuredCar?.photos?.[0] ? `${baseUrl}${featuredCar.photos[0]}` : logoUrl;
      return setCachedSEO(cacheKey, {
        title: `Luxury Vehicle Inventory | ${siteName}`,
        description: `Browse our collection of premium luxury and exotic vehicles. ${inventory.length} vehicles currently available for purchase or consignment.`,
        image: imageUrl,
        url: `${baseUrl}/inventory`,
        type: "website",
      });
    }

    // Consign page
    if (url === "/consign" || url === "/consign/") {
      return setCachedSEO(cacheKey, {
        title: `Consign Your Vehicle | ${siteName}`,
        description: `Submit your luxury or exotic vehicle for professional consignment. Get a complimentary market valuation and expert marketing to qualified buyers worldwide.`,
        image: logoUrl,
        url: `${baseUrl}/consign`,
        type: "website",
      });
    }

    // Trade-in page
    if (url === "/trade-in" || url === "/trade-in/") {
      return setCachedSEO(cacheKey, {
        title: `Trade-In Your Vehicle | ${siteName}`,
        description: `Get a fair trade-in value for your current vehicle. We accept all makes and models as trade-ins toward your next luxury purchase.`,
        image: logoUrl,
        url: `${baseUrl}/trade-in`,
        type: "website",
      });
    }

    // Compare page
    if (url === "/compare" || url.startsWith("/compare")) {
      return setCachedSEO(cacheKey, {
        title: `Compare Vehicles | ${siteName}`,
        description: `Compare luxury and exotic vehicles side by side. View specifications, pricing, and features to find your perfect match.`,
        image: logoUrl,
        url: `${baseUrl}/compare`,
        type: "website",
      });
    }

    // Credit application
    if (url === "/credit-application" || url === "/credit-application/") {
      return setCachedSEO(cacheKey, {
        title: `Credit Application | ${siteName}`,
        description: `Apply for financing on your next luxury vehicle purchase. Quick and secure online credit application.`,
        image: logoUrl,
        url: `${baseUrl}/credit-application`,
        type: "website",
      });
    }

    // Contact page
    if (url === "/contact" || url === "/contact/") {
      return setCachedSEO(cacheKey, {
        title: `Contact Us | ${siteName}`,
        description: `Get in touch with our luxury automotive experts. We're here to help with vehicle inquiries, consignments, and more.`,
        image: logoUrl,
        url: `${baseUrl}/contact`,
        type: "website",
      });
    }

    // Home page (default)
    if (url === "/" || url === "") {
      return setCachedSEO(cacheKey, {
        title: `${siteName} | Premium Auto Consignment`,
        description: defaultDescription,
        image: logoUrl,
        url: baseUrl,
        type: "website",
      });
    }

    // Default fallback
    return setCachedSEO(cacheKey, {
      title: siteName,
      description: defaultDescription,
      image: logoUrl,
      url: `${baseUrl}${url}`,
      type: "website",
    });
  } catch (error) {
    console.error("[seo] Error fetching SEO data:", error);
    return null;
  }
}

export function injectSEOTags(html: string, seo: SEOData): string {
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`
  );

  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`
  );

  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`
  );

  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`
  );

  if (seo.image) {
    if (!html.includes('og:image')) {
      html = html.replace(
        '</head>',
        `  <meta property="og:image" content="${escapeHtml(seo.image)}" />\n  </head>`
      );
    } else {
      html = html.replace(
        /<meta property="og:image" content="[^"]*"\s*\/?>/,
        `<meta property="og:image" content="${escapeHtml(seo.image)}" />`
      );
    }

    if (!html.includes('twitter:image')) {
      html = html.replace(
        '</head>',
        `  <meta name="twitter:image" content="${escapeHtml(seo.image)}" />\n  </head>`
      );
    } else {
      html = html.replace(
        /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
        `<meta name="twitter:image" content="${escapeHtml(seo.image)}" />`
      );
    }
  }

  if (!html.includes('og:url')) {
    html = html.replace(
      '</head>',
      `  <meta property="og:url" content="${escapeHtml(seo.url)}" />\n  </head>`
    );
  } else {
    html = html.replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${escapeHtml(seo.url)}" />`
    );
  }

  html = html.replace(
    /<meta property="og:type" content="[^"]*"\s*\/?>/,
    `<meta property="og:type" content="${escapeHtml(seo.type)}" />`
  );

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(seo.title)}</title>`
  );

  if (!html.includes('<title>')) {
    html = html.replace(
      '</head>',
      `  <title>${escapeHtml(seo.title)}</title>\n  </head>`
    );
  }

  if (!html.includes('name="description"')) {
    html = html.replace(
      '</head>',
      `  <meta name="description" content="${escapeHtml(seo.description)}" />\n  </head>`
    );
  } else {
    html = html.replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeHtml(seo.description)}" />`
    );
  }

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
