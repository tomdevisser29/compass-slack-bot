/**
 * The BlockKitBuilder class is a utility class that helps you build
 * blocks for the Slack Block Kit. While the Block Kit is a JSON-based
 * DSL (Domain Specific Language), this class provides a more readable
 * and maintainable way to construct blocks.
 */

class BlockKitBuilder {
  addSection({ text, type = "mrkdwn" }) {
    return {
      type: "section",
      text: { type, text },
    };
  }

  addActions({ elements }) {
    return {
      type: "actions",
      elements,
    };
  }

  addButton({ text, actionId }) {
    return {
      type: "button",
      text: {
        type: "plain_text",
        text,
      },
      action_id: actionId,
    };
  }

  addContext({ text, type = "mrkdwn" }) {
    return {
      type: "context",
      elements: [{ type, text }],
    };
  }

  addDispatchInput({
    blockId,
    actionId,
    label,
    placeholder,
    initialValue = "",
  }) {
    return {
      block_id: blockId,
      dispatch_action: true,
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: actionId,
        initial_value: initialValue,
        placeholder: {
          type: "plain_text",
          text: placeholder,
        },
      },
      label: {
        type: "plain_text",
        text: label,
        emoji: true,
      },
    };
  }

  addSelectInput({ blockId, actionId, label, placeholder, options }) {
    return {
      type: "input",
      block_id: blockId,
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: placeholder,
        },
        options,
        action_id: actionId,
      },
      label: {
        type: "plain_text",
        text: label,
        emoji: true,
      },
    };
  }

  addTextInput({
    label,
    blockId,
    multiline = false,
    initialValue = "",
    focusOnLoad = false,
  }) {
    return {
      type: "input",
      block_id: blockId,
      element: {
        type: "plain_text_input",
        multiline,
        action_id: blockId,
        initial_value: initialValue,
        focus_on_load: focusOnLoad,
        placeholder: {
          type: "plain_text",
          text: `Vul hier een ${label.toLowerCase()} in`,
        },
      },
      label: {
        type: "plain_text",
        text: label,
        emoji: true,
      },
    };
  }
}

module.exports = new BlockKitBuilder();
