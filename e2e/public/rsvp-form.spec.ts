import { expect, test } from "@playwright/test";

const inviteCode = process.env.TEST_INVITE_CODE;

test.describe("Public RSVP", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("invalid invite shows error state", async ({ page }) => {
    await page.goto("/rsvp/invalid-test-code", { waitUntil: "networkidle" });
    await expect(page.getByText(/This RSVP link is invalid or expired/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test("valid invite loads when TEST_INVITE_CODE is set", async ({ page }) => {
    test.skip(!inviteCode, "Set TEST_INVITE_CODE for seeded invite E2E");

    await page.goto(`/rsvp/${inviteCode}`);
    await expect(page.getByRole("heading", { name: /rsvp/i })).toBeVisible({
      timeout: 20_000,
    });
  });
});
