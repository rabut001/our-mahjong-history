import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import rule from "./no-dead-button.mjs";

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

describe("no-dead-button", () => {
  it("有効な type=button に onClick が無いものを落とす", () => {
    tester.run("no-dead-button", rule, {
      valid: [
        { code: '<button type="submit">保存</button>' },
        { code: "<button>保存</button>" },
        { code: '<button type="button" onClick={onClick}>追加</button>' },
        { code: '<button type="button" disabled>追加</button>' },
        { code: '<button type="button" disabled={pending}>追加</button>' },
        { code: '<button type="button" formAction={action}>保存</button>' },
        { code: '<button type="button" {...props}>追加</button>' },
        { code: '<button type={action ? "submit" : "button"}>保存</button>' },
        { code: '<NavButton href="/x">追加</NavButton>' },
      ],
      invalid: [
        {
          code: '<button type="button">追加</button>',
          errors: [{ messageId: "dead" }],
        },
        {
          code: '<button type={"button"} className={cls}>追加</button>',
          errors: [{ messageId: "dead" }],
        },
      ],
    });
  });
});
