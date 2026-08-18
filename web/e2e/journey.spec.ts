import { expect, test } from "@playwright/test";
import { e2eDisplayName } from "./env";
import {
  expectHeading,
  goBack,
  loginAsE2eUser,
  openCommunity,
  sectionLink,
} from "./helpers";

const stamp = Date.now();
const communityName = `e2eグループ ${stamp}`;
const ruleName = `e2eルール ${stamp}`;
const tournamentName = `e2e大会 ${stamp}`;
const guests = ["ゲスト南", "ゲスト西", "ゲスト北"] as const;
const adjustmentTitle = "席順";

test.describe.serial("E-12〜E-18 麻雀グループから試合まで", () => {
  test.describe.configure({ timeout: 90_000 });

  test("E-12 麻雀グループを作成し編集を開く", async ({ page }) => {
    await loginAsE2eUser(page);
    await page.getByRole("link", { name: "追加" }).click();
    await expectHeading(page, "麻雀グループを作成");
    await page.getByLabel("麻雀グループ名").fill(communityName);
    await page.getByRole("button", { name: "作成する" }).click();
    await expectHeading(page, communityName);
    await page.getByRole("link", { name: "編集" }).click();
    await expectHeading(page, "麻雀グループを編集");
  });

  test("E-13 既定ルールを追加し編集を開く", async ({ page }) => {
    await loginAsE2eUser(page);
    await openCommunity(page, communityName);
    await sectionLink(page, "ルール", "追加").click();
    await expectHeading(page, "ルールを追加");
    await page.getByLabel("表示名").fill(ruleName);
    await page.getByRole("button", { name: "追加する" }).click();
    await expectHeading(page, communityName);
    await expect(page.getByText(ruleName, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: `${ruleName}の詳細` }).click();
    await expectHeading(page, "ルールを編集");
  });

  test("E-14 招待コードを発行する", async ({ page }) => {
    await loginAsE2eUser(page);
    await openCommunity(page, communityName);
    await sectionLink(page, "メンバー", "招待").click();
    await expectHeading(page, "招待");
    await page.getByRole("button", { name: "発行する" }).click();
    await expect(page.getByText(/^[0-9A-HJKMNP-TV-Z]{10}$/)).toBeVisible({
      timeout: 20_000,
    });
  });

  test("E-15 大会作成と作成中の子画面", async ({ page }) => {
    await loginAsE2eUser(page);
    await openCommunity(page, communityName);
    await sectionLink(page, "大会", "追加").click();
    await expectHeading(page, "大会を作成");
    await page.getByLabel("大会名").fill(tournamentName);

    await sectionLink(page, "参加者", "追加").click();
    await expectHeading(page, "参加者を追加");
    await goBack(page);
    await expectHeading(page, "大会を作成");

    await sectionLink(page, "ゲスト参加者", "追加").click();
    await expectHeading(page, "ゲスト参加者を追加");
    await goBack(page);
    await expectHeading(page, "大会を作成");

    await sectionLink(page, "ルール", "追加").click();
    await expectHeading(page, "ルールを追加");
    await page.getByRole("link", { name: "新規作成" }).click();
    await expectHeading(page, "ルールを追加");
    await goBack(page);
    await expectHeading(page, "ルールを追加");
    await goBack(page);
    await expectHeading(page, "大会を作成");
    await page.getByLabel("大会名").fill(tournamentName);

    await page.getByRole("button", { name: "作成する" }).click();
    await expectHeading(page, tournamentName);
  });

  test("E-16 大会編集で参加者・ゲスト・ルール", async ({ page }) => {
    await loginAsE2eUser(page);
    await openCommunity(page, communityName);
    await page.getByRole("link", { name: `${tournamentName}の詳細` }).click();
    await expectHeading(page, tournamentName);
    await page.getByRole("link", { name: "編集" }).click();
    await expectHeading(page, "大会を編集");

    await sectionLink(page, "参加者", "追加").click();
    await expectHeading(page, "参加者を追加");
    await page.getByText(e2eDisplayName(), { exact: true }).click();
    await page.getByRole("button", { name: "追加する" }).click();
    await expectHeading(page, "大会を編集");
    await expect(
      page.getByText(e2eDisplayName(), { exact: true }),
    ).toBeVisible();

    for (const guest of guests) {
      await sectionLink(page, "ゲスト参加者", "追加").click();
      await expectHeading(page, "ゲスト参加者を追加");
      await page.getByLabel("表示名").fill(guest);
      await page.getByRole("button", { name: "追加する" }).click();
      await expectHeading(page, "大会を編集");
      await expect(page.getByText(guest, { exact: true })).toBeVisible();
    }

    await sectionLink(page, "ルール", "追加").click();
    await expectHeading(page, "ルールを追加");
    await page.getByRole("link", { name: "新規作成" }).click();
    await expectHeading(page, "ルールを追加");
    await goBack(page);
    await expectHeading(page, "ルールを追加");
    await goBack(page);
    await expectHeading(page, "大会を編集");

    await page.getByRole("link", { name: `${ruleName}の詳細` }).click();
    await expectHeading(page, "ルールを編集");
  });

  test("E-17 試合を追加し編集を開く", async ({ page }) => {
    await loginAsE2eUser(page);
    await openCommunity(page, communityName);
    await page.getByRole("link", { name: `${tournamentName}の詳細` }).click();
    await expectHeading(page, tournamentName);

    await sectionLink(page, "試合一覧", "追加").click();
    await expectHeading(page, "試合結果を追加");

    await page
      .getByLabel("東家の参加者")
      .selectOption({ label: e2eDisplayName() });
    await page.getByLabel("南家の参加者").selectOption({ label: "ゲスト南" });
    await page.getByLabel("西家の参加者").selectOption({ label: "ゲスト西" });
    await page.getByLabel("北家の参加者").selectOption({ label: "ゲスト北" });

    await page.getByLabel(`${e2eDisplayName()}の素点`).fill("35000");
    await page.getByLabel("ゲスト南の素点").fill("25000");
    await page.getByLabel("ゲスト西の素点").fill("25000");
    await page.getByLabel("ゲスト北の素点").fill("15000");

    await page.getByRole("button", { name: "追加する" }).click();
    await expect(page).toHaveURL(/\/matches\//, { timeout: 20_000 });
    await expectHeading(page, "#1");
    await expect(
      page.getByText(e2eDisplayName(), { exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: "修正" }).click();
    await expectHeading(page, "試合を編集");
  });

  test("E-18 ポイントを補正する", async ({ page }) => {
    await loginAsE2eUser(page);
    await openCommunity(page, communityName);
    await page.getByRole("link", { name: `${tournamentName}の詳細` }).click();
    await expectHeading(page, tournamentName);
    await page.getByRole("link", { name: "ポイント補正" }).click();
    await expectHeading(page, "ポイントの補正");

    await page.getByLabel("補正1のタイトル").fill(adjustmentTitle);
    await page
      .getByLabel(`${e2eDisplayName()}の${adjustmentTitle}`)
      .fill("1.0");
    await page.getByRole("button", { name: "保存する" }).click();
    await expectHeading(page, tournamentName);
    await page.getByRole("link", { name: "ポイント補正" }).click();
    await expectHeading(page, "ポイントの補正");
    await expect(page.getByLabel("補正1のタイトル")).toHaveValue(
      adjustmentTitle,
    );
  });
});
