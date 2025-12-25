import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: object;
}

export function useSEO({ title, description, image, url, type = "website", schema, siteName = "Navarre Motors" }: SEOProps & { siteName?: string }) {
  useEffect(() => {
    const displayName = siteName || "Navarre Motors";
    const fullTitle = title ? `${title} | ${displayName}` : displayName;
    
    document.title = fullTitle;

    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    if (description) {
      setMetaTag("description", description);
      setMetaTag("og:description", description, true);
      setMetaTag("twitter:description", description);
    }

    setMetaTag("og:title", fullTitle, true);
    setMetaTag("twitter:title", fullTitle);
    setMetaTag("og:type", type, true);

    if (image) {
      setMetaTag("og:image", image, true);
      setMetaTag("twitter:image", image);
    }

    if (url) {
      setMetaTag("og:url", url, true);
      const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (canonicalLink) {
        canonicalLink.href = url;
      } else {
        const link = document.createElement("link");
        link.rel = "canonical";
        link.href = url;
        document.head.appendChild(link);
      }
    }

    return () => {
      document.title = siteName || "Navarre Motors";
    };
  }, [title, description, image, url, type, siteName]);

  useEffect(() => {
    if (schema) {
      let scriptElement = document.querySelector('script[data-seo-schema]') as HTMLScriptElement;
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.type = "application/ld+json";
        scriptElement.setAttribute("data-seo-schema", "true");
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(schema);

      return () => {
        scriptElement?.remove();
      };
    }
  }, [schema]);
}

export function generateVehicleSchema(car: {
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  color: string;
  vin: string;
  condition: string;
  photos: string[];
  description?: string;
}, siteSettings?: { siteName?: string | null; contactAddress1?: string | null; contactAddress2?: string | null; contactPhone?: string | null; contactEmail?: string | null }) {
  const buildSellerAddress = () => {
    if (!siteSettings?.contactAddress1) return undefined;
    const address: Record<string, string> = {
      "@type": "PostalAddress",
      "streetAddress": siteSettings.contactAddress1,
    };
    if (siteSettings.contactAddress2) {
      address["addressLocality"] = siteSettings.contactAddress2;
    }
    return address;
  };

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "name": `${car.year} ${car.make} ${car.model}`,
    "brand": {
      "@type": "Brand",
      "name": car.make
    },
    "model": car.model,
    "vehicleModelDate": car.year.toString(),
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": car.mileage,
      "unitCode": "SMI"
    },
    "color": car.color,
    "vehicleIdentificationNumber": car.vin,
    "itemCondition": car.condition === "excellent" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    "offers": {
      "@type": "Offer",
      "price": car.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "AutoDealer",
        "name": siteSettings?.siteName || "Navarre Motors",
        "address": buildSellerAddress(),
        "telephone": siteSettings?.contactPhone || undefined,
        "email": siteSettings?.contactEmail || undefined
      }
    },
    "image": car.photos?.[0] || undefined,
    "description": car.description || `${car.year} ${car.make} ${car.model} with ${car.mileage.toLocaleString()} miles in ${car.color}. ${car.condition} condition.`
  };
}

export function generateOrganizationSchema(settings: {
  siteName?: string | null;
  logoUrl?: string | null;
  contactAddress1?: string | null;
  contactAddress2?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
}) {
  const sameAs = [
    settings.facebookUrl,
    settings.instagramUrl,
    settings.twitterUrl,
    settings.youtubeUrl
  ].filter(Boolean);

  const buildAddress = () => {
    if (!settings.contactAddress1) return undefined;
    const address: Record<string, string> = {
      "@type": "PostalAddress",
      "streetAddress": settings.contactAddress1,
    };
    if (settings.contactAddress2) {
      address["addressLocality"] = settings.contactAddress2;
    }
    return address;
  };

  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": settings.siteName || "Navarre Motors",
    "logo": settings.logoUrl || undefined,
    "address": buildAddress(),
    "telephone": settings.contactPhone || undefined,
    "email": settings.contactEmail || undefined,
    "sameAs": sameAs.length > 0 ? sameAs : undefined
  };
}
