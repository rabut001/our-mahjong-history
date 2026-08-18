import { test } from "@playwright/test";
import { e2eCommunityName, e2eDisplayName } from "./env";
import { expectHeading, loginAsE2eUser, openCommunity } from "./helpers";

test("E-10 プロフィール編集とユーザ詳細", async ({ page }) => {
  await loginAsE2eUser(page);
  await page.getByRole("link", { name: "編集" }).click();
  await expectHeading(page, "プロフィール");

  await page.getByRole("link", { name: "ホーム" }).click();
  await expectHeading(page, "俺たちの雀歴");
  await openCommunity(page, e2eCommunityName());
  await page.getByRole("link", { name: "自分の詳細" }).click();
  await expectHeading(page, e2eDisplayName());
});

test("E-11 ヘルプと招待参加を表示する", async ({ page }) => {
  await loginAsE2eUser(page);
  await page.getByRole("link", { name: "麻雀グループってなに？" }).click();
  await expectHeading(page, "麻雀グループとは");

  await page.getByRole("link", { name: "ホーム" }).click();
  await page.getByRole("link", { name: "招待コードで参加" }).click();
  await expectHeading(page, "招待コードで参加");
});
