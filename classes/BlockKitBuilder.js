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
      text: {
        type,
        text,
      },
    };
  }
}

module.exports = new BlockKitBuilder();
