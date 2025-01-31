/**
 * Compass is the Assistant all users interact with in threads.
 *
 * @see https://tools.slack.dev/bolt-js/reference#agents--assistants
 */

const { Assistant } = require("@slack/bolt");
const blockKitBuilder = require("./classes/BlockKitBuilder");
const intentionHandler = require("./classes/IntentionHandler");
const openai = require("./classes/OpenAI");
const {
  COMPASS_BRIEFING,
  FIRST_SUGGESTED_PROMPTS,
  GENERATE_TITLE_PROMPT,
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
  }) => {
    try {
      const { text, channel, thread_ts, bot_id } = message;
      await setStatus("aan het typen...");

      /**
       * The intentionHandler is responsible for routing the user's message to the correct
       * handler based on the detected intention.
       */
      const intentionReponse = await intentionHandler.intentRouter(text);

      if (intentionReponse) {
        await say(`${intentionReponse}`);
        return;
      }

      /**
       * If the intention is not handled by the intentionHandler, the message is sent to OpenAI
       * for default processing. First the thread history is retrieved and tagged for OpenAI processing.
       */
      const thread = await client.conversations.replies({
        channel: channel,
        ts: thread_ts,
        oldest: thread_ts,
      });

      /**
       * The user's message is tagged as a user message and added to the thread history.
       */
      const userMessage = { role: "user", content: text };

      /**
       * The thread history is mapped to the correct format for OpenAI processing.
       */
      const threadHistory = thread.messages.map((message) => {
        const role = bot_id ? "assistant" : "user";
        return { role, content: text };
      });

      /**
       * The correctly formatted messages are combined.
       */
      const messages = [
        { role: "system", content: COMPASS_BRIEFING },
        ...threadHistory,
        userMessage,
      ];

      /**
       * The messages are sent to OpenAI for processing.
       */
      const openAiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        n: 1,
        messages,
      });

      const openAiMessage = openAiResponse.choices[0].message.content;

      /**
       * The OpenAI response is sent back to the user.
       */
      await say({
        blocks: [blockKitBuilder.addSection({ text: openAiMessage })],
        text: openAiMessage,
      });

      /**
       * The OpenAI response is used to generate a title for the thread.
       */
      const openAiGeneratedTitle = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        n: 1,
        messages: [
          {
            role: "system",
            content: `${GENERATE_TITLE_PROMPT} ${openAiMessage}.`,
          },
        ],
      });

      /**
       * Set the generated title as the thread title.
       */
      await setTitle(openAiGeneratedTitle.choices[0].message.content);
      return;
    } catch (e) {
      /**
       * If an error occurs, log the error and send a message to the user.
       */
      logger.error(`Error processing message: ${e}`);
      await say("Er is iets misgegaan bij het verwerken van je verzoek.");
    }
  },
});

module.exports = {
  compass,
};
