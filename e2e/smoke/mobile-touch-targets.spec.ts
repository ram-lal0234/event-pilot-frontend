import { expect, test } from "@playwright/test";

const MIN_TOUCH_PX = 44;

async function assertTouchTargets(page: import("@playwright/test").Page, selector: string) {
  const elements = page.locator(selector);
  const count = await elements.count();

  expect(count, `Expected at least one ${selector}`).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const element = elements.nth(index);
    if (!(await element.isVisible())) continue;

    const box = await element.boundingBox();
    expect(box, `Missing bounding box for ${selector} #${index}`).not.toBeNull();
    if (!box) continue;

    expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
  }
}

test.describe("Mobile touch targets", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login buttons meet 44px minimum", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator("button").first().waitFor({ timeout: 20_000 });
    await assertTouchTargets(page, "button");
  });
});
