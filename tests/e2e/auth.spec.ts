import { test, expect } from "@playwright/test";

test.describe("Admin Authentication", () => {
  test("shows login prompt on admin page when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    
    // Admin page shows "Admin Access Required" prompt with login button
    await expect(page.getByRole("heading", { name: /admin access required/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  });

  test("logs in successfully with valid credentials", async ({ page }) => {
    await page.goto("/admin");
    
    // Click the login button to open the login dialog
    await page.getByRole("button", { name: /log in/i }).click();
    
    // Select "Staff Login" option in the dialog using data-testid
    await page.getByTestId("btn-admin-login").click();
    
    // Wait for login form to be visible
    await expect(page.getByTestId("input-admin-username")).toBeVisible();
    
    await page.getByTestId("input-admin-username").fill("Josh");
    await page.getByTestId("input-admin-password").fill("Sunshine2024!");
    await page.getByTestId("btn-admin-submit").click();
    
    // Should redirect to dashboard and show admin nav
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByTestId("nav-inventory")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/admin");
    
    // Click the login button to open the login dialog
    await page.getByRole("button", { name: /log in/i }).click();
    
    // Select "Staff Login" option in the dialog using data-testid
    await page.getByTestId("btn-admin-login").click();
    
    // Wait for login form to be visible
    await expect(page.getByTestId("input-admin-username")).toBeVisible();
    
    await page.getByTestId("input-admin-username").fill("invalid");
    await page.getByTestId("input-admin-password").fill("invalid");
    await page.getByTestId("btn-admin-submit").click();
    
    // Should show error toast message - use first() to get the toast title
    await expect(page.getByText("Login Failed").first()).toBeVisible();
  });

  test("session persists after page refresh", async ({ page }) => {
    await page.goto("/admin");
    
    // Click the login button to open the login dialog
    await page.getByRole("button", { name: /log in/i }).click();
    
    // Select "Staff Login" option in the dialog using data-testid
    await page.getByTestId("btn-admin-login").click();
    
    // Wait for login form to be visible
    await expect(page.getByTestId("input-admin-username")).toBeVisible();
    
    await page.getByTestId("input-admin-username").fill("Josh");
    await page.getByTestId("input-admin-password").fill("Sunshine2024!");
    await page.getByTestId("btn-admin-submit").click();
    
    await expect(page.getByTestId("nav-inventory")).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in - nav should still be visible
    await expect(page.getByTestId("nav-inventory")).toBeVisible();
  });
});
