import { expect, test } from "@playwright/test";

test.describe("Login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("email step renders and validates", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText(/enter the email associated with your account/i)).toBeVisible();
  });
});
