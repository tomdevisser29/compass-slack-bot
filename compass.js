/**
 * Compass is the Assistant all users interact with in threads.
 *
 * @see https://tools.slack.dev/bolt-js/reference#agents--assistants
 */

const { Assistant } = require("@slack/bolt");
const blockKitBuilder = require("./classes/utilities/BlockKitBuilder");
const intentionHandler = require("./classes/utilities/IntentionHandler");
const openai = require("./classes/apis/OpenAI");
const {
  COMPASS_BRIEFING,
  FIRST_SUGGESTED_PROMPTS,
  GENERATE_TITLE_PROMPT,
  SUMMARIZE_CHAT_PROMPT,
} = require("./prompts");

/**
 * Initiate the Assistant.
 */
const compass = new Assistant({
  /**
   * The `threadStarted` event is triggered when a new thread is created.
   */
  threadStarted: async ({ say, setSuggestedPrompts }) => {
    await say("Ahoy, waar kan ik je mee helpen?");

    await setSuggestedPrompts({
      prompts: FIRST_SUGGESTED_PROMPTS,
      title: "Hier wat suggesties:",
    });
  },

  /**
   * The `userMessage` event is triggered when a user sends a message in a thread.
   */
  userMessage: async ({
    client,
    logger,
    message,
    say,
    setStatus,
    setTitle,
    getThreadContext,
  }) => {
    try {
      const { text, channel, thread_ts } = message;
      const userMessage = { role: "user", content: text };
      let threadContext;
      let prompts;

      await setStatus("aan het typen...");

      const intention = await intentionHandler.analyseIntent(text);

      logger.info(
        `Received message with intention: ${JSON.stringify(intention)}`
      );

      if (intention && intention.intent !== "summarize_chat") {
        const response = await intentionHandler.intentRouter(intention);

        if (response) {
          return await say(`${response}`);
        }
      }

      logger.info("Preparing channel history for OpenAI completion.");

      if (intention.intent === "summarize_chat") {
        threadContext = await getThreadContext();

        try {
          channelHistory = await client.conversations.history({
            channel: threadContext.channel_id,
            limit: intention.limit || 50,
          });
        } catch (e) {
          // If the bot is not in the channel, join it and try again.
          if (e.data.error === "not_in_channel") {
            await client.conversations.join({
              channel: threadContext.channel_id,
            });
            channelHistory = await client.conversations.history({
              channel: threadContext.channel_id,
              limit: intention.limit || 50,
            });
          } else {
            throw e;
          }
        }

        let prompt = `${SUMMARIZE_CHAT_PROMPT} <#${threadContext.channel_id}>:`;

        for (const m of channelHistory.messages.reverse()) {
          if (m.user) prompt += `\n<@${m.user}> says: ${m.text}`;
        }

        prompts = [{ role: "user", content: prompt }];
      } else {
        channelHistory = await client.conversations.replies({
          channel,
          ts: thread_ts,
          oldest: thread_ts,
        });

        prompts = channelHistory.messages.map((message) => ({
          role: message.bot_id ? "assistant" : "user",
          content: message.text,
        }));

        prompts.push(userMessage);
      }

      const messages = [
        { role: "system", content: COMPASS_BRIEFING },
        ...prompts,
      ];

      const completion = await openai.createCompletion({ messages });

      logger.info("Sending back OpenAI completion.");

      await say({
        blocks: [blockKitBuilder.addSection({ text: completion })],
        text: completion,
      });

      const titlePrompt = [
        { role: "system", content: `${GENERATE_TITLE_PROMPT} ${completion}.` },
      ];

      const generatedTitle = await openai.createCompletion({
        messages: titlePrompt,
      });

      return await setTitle(generatedTitle);
    } catch (e) {
      logger.error(`Error processing message: ${e}`);
      await say("Er is iets misgegaan bij het verwerken van je verzoek.");
    }
  },
});

module.exports = {
  compass,
};
