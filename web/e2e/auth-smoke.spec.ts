import { expect, test } from "@playwright/test";
import { e2eCommunityName, e2eDisplayName, e2eEmail, e2ePassword } from "./env";

test("未ログインはログインへ", async ({ page }) => {
  await page.goto("/communities");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
});

test("ログインできる、自分の麻雀グループが見える", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メール").fill(e2eEmail());
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByLabel("パスワード").fill(e2ePassword());
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/communities$/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "俺たちの雀歴" }),
  ).toBeVisible();
  await expect(page.getByText(e2eDisplayName(), { exact: true })).toBeVisible();
  await expect(
    page.getByText(e2eCommunityName(), { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/メンバー \d+人/)).toBeVisible();
});
