import { expect, test as setup } from "@playwright/test";

const authFile = "e2e/.auth/user.json";
const testEmail = process.env.TEST_EMAIL;
const testOtp = process.env.TEST_OTP ?? "123456";

async function fillOtp(page: import("@playwright/test").Page, code: string) {
  const digits = code.replace(/\D/g, "").slice(0, 6).padEnd(6, "0");
  for (let index = 0; index < 6; index += 1) {
    await page.locator(`#otp-${index}`).fill(digits[index] ?? "0");
  }
}

setup("authenticate", async ({ page }) => {
  setup.skip(!testEmail, "Set TEST_EMAIL to run authenticated E2E");

  let devOtp = testOtp;

  await page.route("**/api/auth/login", async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    if (json?.data?.otp) {
      devOtp = String(json.data.otp);
    }
    await route.fulfill({ response });
  });

  await page.goto("/login");
  await page.getByPlaceholder("Email or username").fill(testEmail!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: /verify your email/i }).waitFor();

  await fillOtp(page, devOtp);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
  await expect(page).not.toHaveURL(/\/login/);

  await page.context().storageState({ path: authFile });
});
