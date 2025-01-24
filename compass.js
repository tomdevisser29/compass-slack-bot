const { Assistant } = require("@slack/bolt");
const intentionHandler = require("./classes/IntentionHandler");
const openai = require("./classes/OpenAI");
const { COMPASS_BRIEFING, SUGGESTED_PROMPTS } = require("./prompts");

// @see https://tools.slack.dev/bolt-js/reference#agents--assistants
const compass = new Assistant({
  // Responds to new threads.
  threadStarted: async ({ say, setSuggestedPrompts }) => {
    await say("Ahoy! Waar kan ik je mee helpen?");
    await setSuggestedPrompts({
      prompts: SUGGESTED_PROMPTS,
      title: "Hier wat suggesties:",
    });
  },

  // Responds to new messages in existing threads.
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

      // Analyse the user's intention, and if recognised, respond accordingly.
      const intentionReponse = await intentionHandler.intentRouter(text);

      if (intentionReponse) {
        await say(`${intentionReponse}`);
        return;
      }

      const thread = await client.conversations.replies({
        channel: channel,
        ts: thread_ts,
        oldest: thread_ts,
      });

      // Prepares and tags each message for OpenAI processing.
      const userMessage = { role: "user", content: text };

      const threadHistory = thread.messages.map((message) => {
        const role = bot_id ? "assistant" : "user";
        return { role, content: text };
      });

      const messages = [
        { role: "system", content: COMPASS_BRIEFING },
        ...threadHistory,
        userMessage,
      ];

      const openAiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        n: 1,
        messages,
      });

      await say({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: openAiResponse.choices[0].message.content,
            },
          },
        ],
        text: openAiResponse.choices[0].message.content,
      });

      const openAiGeneratedTitle = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        n: 1,
        messages: [
          {
            role: "system",
            content: `Genereer een korte alfanumerieke titel (zonder quotes eromheen) voor dit gesprek in minder dan 10 woorden, aan de hand van dit laatst gegenereerde antwoord: ${openAiResponse.choices[0].message.content}.`,
          },
        ],
      });

      await setTitle(openAiGeneratedTitle.choices[0].message.content);
      return;
    } catch (e) {
      logger.error(`Error processing message: ${e}`);
      await say("Er is iets misgegaan bij het verwerken van je verzoek.");
    }
  },
});

module.exports = {
  compass,
};
