import { db } from "../../server/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export async function truncateTables(): Promise<void> {
  await db.execute(sql`
    TRUNCATE TABLE 
      buyer_inquiries,
      vehicle_views,
      price_alerts,
      vehicle_alerts,
      vehicle_documents,
      seller_documents,
      seller_notes,
      status_history,
      lead_notes,
      activity_log,
      credit_applications,
      phone_verifications,
      inventory_cars,
      consignment_submissions,
      testimonials,
      users
    CASCADE
  `);
}

export async function seedAdmin(): Promise<void> {
  const hashedPassword = hashPassword("testpassword123");
  
  await db.execute(sql`
    INSERT INTO users (id, username, password, is_admin, role)
    VALUES ('test-admin-id', 'testadmin', ${hashedPassword}, true, 'master')
    ON CONFLICT (username) DO NOTHING
  `);

  await db.execute(sql`
    INSERT INTO site_settings (id, site_name, primary_color)
    VALUES ('default', 'Test Dealership', '#D4AF37')
    ON CONFLICT (id) DO NOTHING
  `);
}

export async function cleanupTestData(): Promise<void> {
  await truncateTables();
}
