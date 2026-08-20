import { expect, test } from "@playwright/test";
import { e2eDisplayName, e2eEmail, e2ePassword } from "./env";
import { expectHeading } from "./helpers";

test("E-01 未ログインはログインへ", async ({ page }) => {
  await page.goto("/communities");
  await expect(page).toHaveURL(/\/login/);
  await expectHeading(page, "ログイン");
  await expect(page.getByLabel("メールアドレス")).toBeVisible();
});

test("E-02 アカウント作成を表示する", async ({ page }) => {
  await page.goto("/signup");
  await expectHeading(page, "アカウント作成");
  await page.getByRole("button", { name: "メールアドレスで登録" }).click();
  await expectHeading(page, "アカウント作成");
  await expect(page.getByLabel("表示名")).toBeVisible();
  await expect(page.getByLabel("メールアドレス")).toBeVisible();
  await expect(page.getByLabel("パスワード", { exact: true })).toBeVisible();
  await expect(page.getByLabel("パスワード（確認）")).toBeVisible();
  await expect(page.getByRole("button", { name: "登録する" })).toBeVisible();
});

test("E-03 ログインできる、トップが見える", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(e2eEmail());
  await page.getByLabel("パスワード").fill(e2ePassword());
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/communities$/, { timeout: 20_000 });
  await expectHeading(page, "俺たちの雀歴");
  await expect(page.getByText(e2eDisplayName(), { exact: true })).toBeVisible();
});

test("E-04 パスワードを忘れたを表示する", async ({ page }) => {
  await page.goto("/forgot-password");
  await expectHeading(page, "パスワードを忘れた");
  await expect(page.getByLabel("メールアドレス")).toBeVisible();
  await expect(page.getByRole("button", { name: "送信する" })).toBeVisible();
});

test("E-05 再設定メール送信後を表示する", async ({ page }) => {
  await page.goto("/forgot-password/sent");
  await expectHeading(page, "パスワードを忘れた");
});

test("E-06 パスワードの再設定を表示する", async ({ page }) => {
  await page.goto("/reset-password");
  await expectHeading(page, "パスワードの再設定");
  await expect(page.getByRole("button", { name: "変更する" })).toBeVisible();
});

test("E-07 callback 失敗はログインにメッセージ", async ({ page }) => {
  await page.goto("/login?auth=denied");
  await expectHeading(page, "ログイン");
  await expect(
    page.getByText("ログインがキャンセルされました。"),
  ).toBeVisible();

  await page.getByLabel("メールアドレス").fill(e2eEmail());
  await page.getByLabel("パスワード").fill(e2ePassword());
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/communities$/, { timeout: 20_000 });

  await page.goto("/login?auth=denied");
  await expect(page).toHaveURL(/\/login/);
  await expectHeading(page, "ログイン");
  await expect(
    page.getByText("ログインがキャンセルされました。"),
  ).toBeVisible();
});
