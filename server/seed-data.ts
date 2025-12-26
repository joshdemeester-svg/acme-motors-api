import crypto from "crypto";

const SALT_LENGTH = 32;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export interface SeedSettings {
  primaryColor: string;
  backgroundColor: string;
  mainMenuColor: string;
  mainMenuHoverColor: string;
  contactButtonColor: string;
  contactButtonHoverColor: string;
  menuFontSize: string;
  bodyFontSize: string;
  menuAllCaps: boolean;
  vehicleTitleColor: string;
  vehiclePriceColor: string;
  stepBgColor: string;
  stepNumberColor: string;
  socialIconBgColor: string;
  socialIconHoverColor: string;
  footerTagline: string;
  logoUrl: string | null;
  logoWidth: string;
  siteName: string;
  contactAddress1: string;
  contactAddress2: string;
  contactPhone: string;
  contactEmail: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  commissionRate: number;
  avgDaysToFirstInquiry: number;
  avgDaysToSell: number;
}

export interface SeedAdmin {
  username: string;
  password: string;
}

export const seedAdmin: SeedAdmin = {
  username: "Josh",
  password: "Sunshine2024!",
};

export const seedSettings: SeedSettings = {
  primaryColor: "#cc181f",
  backgroundColor: "#1e293b",
  mainMenuColor: "#fff",
  mainMenuHoverColor: "#B8960C",
  contactButtonColor: "#cc181f",
  contactButtonHoverColor: "#B8960C",
  menuFontSize: "18",
  bodyFontSize: "18",
  menuAllCaps: true,
  vehicleTitleColor: "#FFFFFF",
  vehiclePriceColor: "#FFFFFF",
  stepBgColor: "#DC2626",
  stepNumberColor: "#FFFFFF",
  socialIconBgColor: "#D4AF37",
  socialIconHoverColor: "#B8960C",
  footerTagline: "Luxury automotive consignment services for discerning collectors and enthusiasts.",
  logoUrl: "/objects/uploads/9800d8a0-60ae-432e-9b3d-e6ccc1223f45",
  logoWidth: "180",
  siteName: "Navarre Motors, Inc",
  contactAddress1: "9100 Navarre Pkwy",
  contactAddress2: "Navarre, FL 32566",
  contactPhone: "850-461-8301",
  contactEmail: "josh@acmecars.com",
  facebookUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  commissionRate: 10,
  avgDaysToFirstInquiry: 5,
  avgDaysToSell: 45,
};

export async function getHashedAdminPassword(): Promise<string> {
  return await hashPassword(seedAdmin.password);
}
