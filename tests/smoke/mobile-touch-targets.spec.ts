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

    expect(
      box.height,
      `${selector} #${index} height ${box.height}px is below ${MIN_TOUCH_PX}px`
    ).toBeGreaterThanOrEqual(MIN_TOUCH_PX);

    const tag = await element.evaluate((node) => node.tagName.toLowerCase());
    const isIconOnly = await element.evaluate((node) => {
      const text = (node.textContent || "").trim();
      return text.length === 0 || text.length <= 2;
    });

    if (tag === "button" && isIconOnly) {
      expect(
        box.width,
        `${selector} #${index} width ${box.width}px is below ${MIN_TOUCH_PX}px`
      ).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    }
  }
}

test.describe("P1 mobile touch targets", () => {
  test("login page buttons meet 44px minimum", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator("button").first().waitFor({ timeout: 20_000 });
    await assertTouchTargets(page, "button");
  });

  test("public RSVP invalid link page renders without crash", async ({ page }) => {
    await page.goto("/rsvp/invalid-test-code", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/invalid|expired|loading/i)).toBeVisible({ timeout: 20_000 });
  });
});
