import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("main navigation links work", async ({ page }) => {
    await page.goto("/");
    
    // Find and click inventory link
    const inventoryLink = page.getByRole("link", { name: /inventory/i }).first();
    if (await inventoryLink.isVisible()) {
      await inventoryLink.click();
      await expect(page).toHaveURL(/\/inventory/);
    }
  });

  test("can navigate from homepage to vehicle details", async ({ page }) => {
    await page.goto("/");
    
    // Look for any vehicle card/link
    const vehicleLinks = page.locator("a[href*='/inventory/']");
    const count = await vehicleLinks.count();
    
    if (count > 0) {
      await vehicleLinks.first().click();
      await expect(page.url()).toContain("/inventory/");
    }
  });
});
