import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: object;
}

export function useSEO({ title, description, image, url, type = "website", schema }: SEOProps) {
  useEffect(() => {
    const siteName = "Navarre Motors, Inc";
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    
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
      document.title = siteName;
    };
  }, [title, description, image, url, type]);

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
}, siteSettings?: { siteName?: string; contactAddress1?: string; contactAddress2?: string; contactPhone?: string; contactEmail?: string }) {
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
        "name": siteSettings?.siteName || "Navarre Motors, Inc",
        "address": siteSettings?.contactAddress1 ? {
          "@type": "PostalAddress",
          "streetAddress": siteSettings.contactAddress1,
          "addressLocality": siteSettings.contactAddress2?.split(",")[0]?.trim(),
          "addressRegion": siteSettings.contactAddress2?.split(",")[1]?.trim()?.split(" ")[0],
          "postalCode": siteSettings.contactAddress2?.split(",")[1]?.trim()?.split(" ")[1]
        } : undefined,
        "telephone": siteSettings?.contactPhone,
        "email": siteSettings?.contactEmail
      }
    },
    "image": car.photos?.[0],
    "description": car.description || `${car.year} ${car.make} ${car.model} with ${car.mileage.toLocaleString()} miles in ${car.color}. ${car.condition} condition.`
  };
}

export function generateOrganizationSchema(settings: {
  siteName?: string;
  logoUrl?: string;
  contactAddress1?: string;
  contactAddress2?: string;
  contactPhone?: string;
  contactEmail?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
}) {
  const sameAs = [
    settings.facebookUrl,
    settings.instagramUrl,
    settings.twitterUrl,
    settings.youtubeUrl
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": settings.siteName || "Navarre Motors, Inc",
    "logo": settings.logoUrl,
    "address": settings.contactAddress1 ? {
      "@type": "PostalAddress",
      "streetAddress": settings.contactAddress1,
      "addressLocality": settings.contactAddress2?.split(",")[0]?.trim(),
      "addressRegion": settings.contactAddress2?.split(",")[1]?.trim()?.split(" ")[0],
      "postalCode": settings.contactAddress2?.split(",")[1]?.trim()?.split(" ")[1]
    } : undefined,
    "telephone": settings.contactPhone,
    "email": settings.contactEmail,
    "sameAs": sameAs.length > 0 ? sameAs : undefined
  };
}
