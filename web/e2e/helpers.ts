import { expect, type Page } from "@playwright/test";
import { e2eEmail, e2ePassword } from "./env";

export const headingTimeout = 20_000;

export function heading(page: Page, name: string | RegExp) {
  return page.getByRole("heading", { name, level: 1 });
}

export async function expectHeading(page: Page, name: string | RegExp) {
  await expect(heading(page, name)).toBeVisible({ timeout: headingTimeout });
}

export function sectionLink(page: Page, section: string, linkName: string) {
  return page
    .locator("section")
    .filter({
      has: page.getByRole("heading", { name: section, exact: true }),
    })
    .getByRole("link", { name: linkName });
}

export async function loginAsE2eUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(e2eEmail());
  await page.getByLabel("パスワード").fill(e2ePassword());
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/communities$/, { timeout: headingTimeout });
}

export async function openCommunity(page: Page, name: string) {
  await page.getByRole("link", { name: `${name}の詳細` }).click();
  await expectHeading(page, name);
}

export async function goBack(page: Page) {
  await page.getByRole("link", { name: "戻る" }).click();
}
