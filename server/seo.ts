import { storage } from "./storage";
import { generateVehicleSlug, extractIdFromSlug, type InventoryCar, type SiteSettings } from "@shared/schema";

interface SEOData {
  title: string;
  description: string;
  image?: string;
  url: string;
  canonicalUrl?: string;
  type: string;
  twitterHandle?: string;
  jsonLd?: object;
  noindex?: boolean;
}

function generateVehicleJsonLd(car: InventoryCar, settings: SiteSettings | null, baseUrl: string, canonicalUrl: string): object {
  if (!car) return {};
  
  const dealerName = settings?.siteName || "Prestige Auto Consignment";
  const city = settings?.dealerCity || "";
  const state = settings?.dealerState || "";
  const address = settings?.dealerAddress || "";
  const phone = settings?.contactPhone || "";
  
  const year = car.year ?? "";
  const make = car.make ?? "";
  const model = car.model ?? "";
  const trim = car.trim || "";
  
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "name": `${year} ${make} ${model}${trim ? ` ${trim}` : ""}`,
    "brand": {
      "@type": "Brand",
      "name": make
    },
    "model": model,
    "vehicleModelDate": String(year),
    "mileageFromOdometer": car.mileage ? {
      "@type": "QuantitativeValue",
      "value": car.mileage,
      "unitCode": "SMI"
    } : undefined,
    "vehicleIdentificationNumber": car.vin || undefined,
    "color": car.color || undefined,
    "itemCondition": car.condition === "New" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    "image": car.photos && car.photos.length > 0 ? car.photos.map(p => p.startsWith('http') ? p : `${baseUrl}${p}`) : undefined,
    "description": car.description || `${year} ${make} ${model} for sale`,
    "offers": {
      "@type": "Offer",
      "price": car.price ?? 0,
      "priceCurrency": "USD",
      "availability": car.status === "available" ? "https://schema.org/InStock" : (car.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/LimitedAvailability"),
      "url": canonicalUrl,
      "seller": {
        "@type": "AutoDealer",
        "name": dealerName,
        "address": address ? {
          "@type": "PostalAddress",
          "addressLocality": city,
          "addressRegion": state,
          "streetAddress": address
        } : undefined,
        "telephone": phone || undefined
      }
    }
  };
}

function generateDealerJsonLd(settings: SiteSettings | null, baseUrl: string): object {
  const dealerName = settings?.siteName || "Prestige Auto Consignment";
  const city = settings?.dealerCity || "";
  const state = settings?.dealerState || "";
  const address = settings?.dealerAddress || "";
  const phone = settings?.contactPhone || "";
  const hours = settings?.dealerHours || "";
  
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": dealerName,
    "url": baseUrl,
    "telephone": phone || undefined,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": state,
      "streetAddress": address || undefined
    },
    "openingHours": hours || undefined,
    "sameAs": [
      settings?.facebookUrl,
      settings?.instagramUrl,
      settings?.twitterUrl,
      settings?.youtubeUrl,
      settings?.tiktokUrl
    ].filter(Boolean)
  };
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
    const siteName = settings?.ogTitle || settings?.siteName || "Prestige Auto Consignment";
    const defaultDescription = settings?.ogDescription || settings?.footerTagline || "Premium automotive consignment services for discerning collectors and enthusiasts.";
    const ogImageUrl = settings?.ogImage ? (settings.ogImage.startsWith('http') ? settings.ogImage : `${baseUrl}${settings.ogImage}`) : undefined;
    const logoUrl = ogImageUrl || (settings?.logoUrl ? `${baseUrl}${settings.logoUrl}` : undefined);
    const twitterHandle = settings?.twitterHandle || undefined;

    // Vehicle details page: /vehicle/:slug (new SEO-friendly URL)
    const vehicleSlugMatch = url.match(/^\/vehicle\/([a-z0-9-]+)$/i);
    if (vehicleSlugMatch) {
      const slug = vehicleSlugMatch[1];
      // Try by slug first, then by full ID, then extract ID from slug
      let car = await storage.getInventoryCarBySlug(slug);
      if (!car) {
        car = await storage.getInventoryCar(slug);
      }
      if (!car) {
        const extractedId = extractIdFromSlug(slug);
        if (extractedId) {
          // Try full ID lookup first
          car = await storage.getInventoryCar(extractedId);
          // If that fails, try short ID lookup (8-char prefix)
          if (!car && extractedId.length === 8) {
            car = await storage.getInventoryCarByShortId(extractedId);
          }
        }
      }
      if (car) {
        const city = settings?.dealerCity || "";
        const state = settings?.dealerState || "";
        const trim = car.trim || "";
        
        // Generate canonical slug with full format
        const canonicalSlug = car.slug || generateVehicleSlug({
          year: car.year,
          make: car.make,
          model: car.model,
          trim: settings?.slugIncludeTrim ? trim : null,
          city: settings?.slugIncludeLocation ? city : null,
          state: settings?.slugIncludeLocation ? state : null,
          id: car.id,
        });
        const canonicalUrl = `${baseUrl}/vehicle/${canonicalSlug}`;
        
        // Build title with location
        const locationPart = city && state ? ` in ${city}, ${state}` : "";
        const trimPart = trim ? ` ${trim}` : "";
        const title = `${car.year} ${car.make} ${car.model}${trimPart} for Sale${locationPart} | ${siteName}`;
        
        const imageUrl = car.photos?.[0] ? (car.photos[0].startsWith('http') ? car.photos[0] : `${baseUrl}${car.photos[0]}`) : logoUrl;
        const description = `Shop this ${car.year} ${car.make} ${car.model}${trimPart} with ${car.mileage?.toLocaleString()} miles for $${car.price?.toLocaleString()}.${locationPart ? ` Located${locationPart}.` : ""} View photos and contact us today!`;
        
        // Check if sold and should be noindex
        let noindex = false;
        if (car.status === "sold" && settings?.soldVehicleBehavior === "noindex" && car.soldDate) {
          const daysSinceSold = Math.floor((Date.now() - new Date(car.soldDate).getTime()) / (1000 * 60 * 60 * 24));
          const noindexDays = settings?.soldVehicleNoindexDays || 30;
          if (daysSinceSold >= noindexDays) {
            noindex = true;
          }
        }
        
        return setCachedSEO(cacheKey, {
          title,
          description,
          image: imageUrl,
          url: `${baseUrl}${url}`,
          canonicalUrl,
          type: "product",
          twitterHandle,
          jsonLd: generateVehicleJsonLd(car, settings || null, baseUrl, canonicalUrl),
          noindex,
        });
      }
    }

    // Legacy vehicle details page: /inventory/:id (backwards compatibility)
    const vehicleIdMatch = url.match(/^\/inventory\/([a-f0-9-]+)$/i);
    if (vehicleIdMatch) {
      const vehicleId = vehicleIdMatch[1];
      const car = await storage.getInventoryCar(vehicleId);
      if (car) {
        const imageUrl = car.photos?.[0] ? `${baseUrl}${car.photos[0]}` : logoUrl;
        return setCachedSEO(cacheKey, {
          title: `${car.year} ${car.make} ${car.model} for Sale | ${siteName}`,
          description: `${car.year} ${car.make} ${car.model} with ${car.mileage?.toLocaleString()} miles in ${car.color}. ${car.condition} condition. Price: $${car.price?.toLocaleString()}. View details and contact us today.`,
          image: imageUrl,
          url: `${baseUrl}${url}`,
          type: "product",
          twitterHandle,
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
        twitterHandle,
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
        twitterHandle,
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
        twitterHandle,
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
        twitterHandle,
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
        twitterHandle,
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
        twitterHandle,
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
        twitterHandle,
      });
    }

    // Default fallback
    return setCachedSEO(cacheKey, {
      title: siteName,
      description: defaultDescription,
      image: logoUrl,
      url: `${baseUrl}${url}`,
      type: "website",
      twitterHandle,
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

  // Add twitter:site if we have a handle
  if (seo.twitterHandle) {
    if (!html.includes('twitter:site')) {
      html = html.replace(
        '</head>',
        `  <meta name="twitter:site" content="${escapeHtml(seo.twitterHandle)}" />\n  </head>`
      );
    } else {
      html = html.replace(
        /<meta name="twitter:site" content="[^"]*"\s*\/?>/,
        `<meta name="twitter:site" content="${escapeHtml(seo.twitterHandle)}" />`
      );
    }
  }

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

  // Add canonical link tag
  if (seo.canonicalUrl) {
    if (!html.includes('rel="canonical"')) {
      html = html.replace(
        '</head>',
        `  <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />\n  </head>`
      );
    } else {
      html = html.replace(
        /<link rel="canonical" href="[^"]*"\s*\/?>/,
        `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`
      );
    }
  }

  // Add noindex meta tag if needed
  if (seo.noindex) {
    if (!html.includes('name="robots"')) {
      html = html.replace(
        '</head>',
        `  <meta name="robots" content="noindex, follow" />\n  </head>`
      );
    }
  }

  // Add JSON-LD structured data
  if (seo.jsonLd) {
    const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`;
    html = html.replace(
      '</head>',
      `  ${jsonLdScript}\n  </head>`
    );
  }

  return html;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
