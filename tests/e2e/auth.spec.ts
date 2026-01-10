import { test, expect } from "@playwright/test";

test.describe("Admin Authentication", () => {
  test("shows login form on admin page when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    
    // Wait for page to load and check login form elements using stable data-testid selectors
    await expect(page.getByTestId("input-login-username")).toBeVisible();
    await expect(page.getByTestId("input-login-password")).toBeVisible();
    await expect(page.getByTestId("button-login")).toBeVisible();
  });

  test("logs in successfully with valid credentials", async ({ page }) => {
    await page.goto("/admin");
    
    // Wait for login form to be visible
    await expect(page.getByTestId("input-login-username")).toBeVisible();
    
    await page.getByTestId("input-login-username").fill("Josh");
    await page.getByTestId("input-login-password").fill("Starfish1000!");
    await page.getByTestId("button-login").click();
    
    // Should redirect to dashboard and show admin content
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/dashboard|inventory|leads/i)).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/admin");
    
    // Wait for login form to be visible
    await expect(page.getByTestId("input-login-username")).toBeVisible();
    
    await page.getByTestId("input-login-username").fill("invalid");
    await page.getByTestId("input-login-password").fill("invalid");
    await page.getByTestId("button-login").click();
    
    // Should show error message
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible();
  });

  test("session persists after page refresh", async ({ page }) => {
    await page.goto("/admin");
    
    // Wait for login form to be visible
    await expect(page.getByTestId("input-login-username")).toBeVisible();
    
    await page.getByTestId("input-login-username").fill("Josh");
    await page.getByTestId("input-login-password").fill("Starfish1000!");
    await page.getByTestId("button-login").click();
    
    await expect(page.getByText(/dashboard|inventory/i)).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page.getByText(/dashboard|inventory/i)).toBeVisible();
  });
});
