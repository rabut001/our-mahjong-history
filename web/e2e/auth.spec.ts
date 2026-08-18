import { expect, test } from "@playwright/test";
import { e2eDisplayName, e2eEmail, e2ePassword } from "./env";
import { expectHeading } from "./helpers";

test("E-01 未ログインはログインへ", async ({ page }) => {
  await page.goto("/communities");
  await expect(page).toHaveURL(/\/login/);
  await expectHeading(page, "ログイン");
  await expect(page.getByLabel("メール")).toBeVisible();
});

test("E-02 アカウント作成を表示する", async ({ page }) => {
  await page.goto("/signup");
  await expectHeading(page, "アカウント作成");
  await page
    .getByLabel("メールアドレスで登録")
    .fill(`preview-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "次へ" }).click();
  await expectHeading(page, "アカウント作成");
  await expect(page.getByLabel("表示名")).toBeVisible();
  await expect(page.getByLabel("パスワード")).toBeVisible();
  await expect(page.getByRole("button", { name: "登録する" })).toBeVisible();
});

test("E-03 ログインできる、トップが見える", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メール").fill(e2eEmail());
  await page.getByRole("button", { name: "次へ" }).click();
  await expectHeading(page, "ログイン");
  await expect(page.getByLabel("パスワード")).toBeVisible();
  await page.getByLabel("パスワード").fill(e2ePassword());
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/communities$/, { timeout: 20_000 });
  await expectHeading(page, "俺たちの雀歴");
  await expect(page.getByText(e2eDisplayName(), { exact: true })).toBeVisible();
});
