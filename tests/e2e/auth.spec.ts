import { test, expect } from "@playwright/test";

test.describe("Admin Authentication", () => {
  test("shows login form on admin page when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    
    // Should show login form
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test("logs in successfully with valid credentials", async ({ page }) => {
    await page.goto("/admin");
    
    await page.getByPlaceholder(/username/i).fill("Josh");
    await page.getByPlaceholder(/password/i).fill("Starfish1000!");
    await page.getByRole("button", { name: /sign in|login/i }).click();
    
    // Should redirect to dashboard and show admin content
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/dashboard|inventory|leads/i)).toBeVisible({ timeout: 10000 });
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/admin");
    
    await page.getByPlaceholder(/username/i).fill("invalid");
    await page.getByPlaceholder(/password/i).fill("invalid");
    await page.getByRole("button", { name: /sign in|login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 5000 });
  });

  test("session persists after page refresh", async ({ page }) => {
    await page.goto("/admin");
    
    await page.getByPlaceholder(/username/i).fill("Josh");
    await page.getByPlaceholder(/password/i).fill("Starfish1000!");
    await page.getByRole("button", { name: /sign in|login/i }).click();
    
    await expect(page.getByText(/dashboard|inventory/i)).toBeVisible({ timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page.getByText(/dashboard|inventory/i)).toBeVisible({ timeout: 10000 });
  });
});
