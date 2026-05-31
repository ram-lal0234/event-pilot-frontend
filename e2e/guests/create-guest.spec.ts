import { expect, test } from "@playwright/test";

test.describe("Guest management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/guests");
  });

  test("guests page loads for authenticated user", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /guests/i })).toBeVisible({
      timeout: 20_000,
    });
  });

  test.skip("creates a guest successfully — requires seeded event", async () => {
    // Expand when TEST_EVENT_ID + API seed data are available in CI.
  });
});
