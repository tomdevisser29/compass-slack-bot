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

  addDivider() {
    return {
      type: "divider",
    };
  }

  addLinkButton({ text, buttonText, url, buttonValue, actionId }) {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: buttonText,
          emoji: true,
        },
        value: buttonValue,
        url,
        action_id: actionId,
      },
    };
  }

  addWhitespace() {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: " ",
      },
    };
  }

  createModal({ triggerId, callbackId, title, blocks, submitText = "" }) {
    const modalOptions = {
      trigger_id: triggerId,
      view: {
        type: "modal",
        callback_id: callbackId,
        title: {
          type: "plain_text",
          text: title,
        },
        close: {
          type: "plain_text",
          text: "Sluiten",
        },
        blocks,
      },
    };

    if ("" !== submitText) {
      modalOptions.view.submit = {
        type: "plain_text",
        text: submitText,
      };
    }

    return modalOptions;
  }

  updateModal({ viewId, callbackId, title, blocks, submitText = "" }) {
    return {
      view_id: viewId,
      view: {
        type: "modal",
        callback_id: callbackId,
        title: {
          type: "plain_text",
          text: title,
        },
        close: {
          type: "plain_text",
          text: "Sluiten",
        },
        submit: {
          type: "plain_text",
          text: submitText,
        },
        blocks,
      },
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
