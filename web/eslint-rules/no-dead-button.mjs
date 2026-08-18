const TYPE_ATTR = "type";
const CLICK_ATTR = "onClick";
const DISABLED_ATTR = "disabled";
const FORM_ACTION_ATTR = "formAction";

function attrName(attribute) {
  if (attribute.type !== "JSXAttribute") {
    return null;
  }
  if (attribute.name.type === "JSXIdentifier") {
    return attribute.name.name;
  }
  return null;
}

function literalString(node) {
  if (!node) {
    return null;
  }
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (
    node.type === "JSXExpressionContainer" &&
    node.expression.type === "Literal" &&
    typeof node.expression.value === "string"
  ) {
    return node.expression.value;
  }
  return null;
}

/**
 * @type {import("eslint").Rule.RuleModule}
 */
const noDeadButton = {
  meta: {
    type: "problem",
    docs: {
      description:
        '有効な type="button" には onClick が必要。見た目だけなら disabled。',
    },
    schema: [],
    messages: {
      dead: '有効な type="button" には onClick が必要です。見た目だけのボタンは disabled にしてください。',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "button") {
          return;
        }
        if (
          node.attributes.some(
            (attribute) => attribute.type === "JSXSpreadAttribute",
          )
        ) {
          return;
        }

        const attrs = new Map();
        for (const attribute of node.attributes) {
          const name = attrName(attribute);
          if (name) {
            attrs.set(name, attribute);
          }
        }

        const typeAttr = attrs.get(TYPE_ATTR);
        if (!typeAttr || literalString(typeAttr.value) !== "button") {
          return;
        }
        if (
          attrs.has(CLICK_ATTR) ||
          attrs.has(DISABLED_ATTR) ||
          attrs.has(FORM_ACTION_ATTR)
        ) {
          return;
        }

        context.report({ node: typeAttr, messageId: "dead" });
      },
    };
  },
};

export default noDeadButton;
