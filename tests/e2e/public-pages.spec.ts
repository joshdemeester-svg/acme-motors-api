import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    
    // Should have main content
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("inventory page shows vehicles", async ({ page }) => {
    await page.goto("/inventory");
    
    // Wait for page to load
    await expect(page.locator("body")).toBeVisible();
    
    // Should have inventory content
    await expect(page.getByText(/inventory|vehicles|browse/i)).toBeVisible({ timeout: 10000 });
  });

  test("consignment form is accessible", async ({ page }) => {
    await page.goto("/consign");
    
    // Should show consignment form or intro
    await expect(page.getByText(/consign|sell your|vehicle/i)).toBeVisible({ timeout: 10000 });
  });

  test("trade-in page is accessible", async ({ page }) => {
    await page.goto("/trade-in");
    
    await expect(page.getByText(/trade-in|value your vehicle/i)).toBeVisible({ timeout: 10000 });
  });

  test("credit application page is accessible", async ({ page }) => {
    await page.goto("/get-approved");
    
    await expect(page.getByText(/credit|finance|apply/i)).toBeVisible({ timeout: 10000 });
  });

  test("privacy policy page is accessible", async ({ page }) => {
    await page.goto("/privacy");
    
    await expect(page.getByText(/privacy|policy/i)).toBeVisible({ timeout: 10000 });
  });

  test("terms of service page is accessible", async ({ page }) => {
    await page.goto("/terms");
    
    await expect(page.getByText(/terms|service/i)).toBeVisible({ timeout: 10000 });
  });
});
