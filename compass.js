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
      const { text, channel, thread_ts, bot_id } = message;
      await setStatus("aan het typen...");

      const intention = await intentionHandler.analyseIntent(text);

      if (intention.intent === "summarize_chat") {
        const limit = intention.limit || 50;

        return await summarizeChannel({
          client,
          say,
          setTitle,
          getThreadContext,
          limit,
        });
      } else if (intention) {
        const response = await intentionHandler.intentRouter(intention);

        if (response) {
          return await say(`${response}`);
        }
      }

      const thread = await client.conversations.replies({
        channel,
        ts: thread_ts,
        oldest: thread_ts,
      });

      const userMessage = { role: "user", content: text };
      const threadHistory = thread.messages.map((message) => ({
        role: message.bot_id ? "assistant" : "user",
        content: message.text,
      }));

      const messages = [
        { role: "system", content: COMPASS_BRIEFING },
        ...threadHistory,
        userMessage,
      ];
      const openAiMessage = await getOpenAiResponse(messages);

      await say({
        blocks: [blockKitBuilder.addSection({ text: openAiMessage })],
        text: openAiMessage,
      });

      const titleMessage = [
        {
          role: "system",
          content: `${GENERATE_TITLE_PROMPT} ${openAiMessage}.`,
        },
      ];
      const generatedTitle = await getOpenAiResponse(titleMessage);
      return await setTitle(generatedTitle);
    } catch (e) {
      logger.error(`Error processing message: ${e}`);
      await say("Er is iets misgegaan bij het verwerken van je verzoek.");
    }
  },
});

async function summarizeChannel({
  client,
  say,
  setTitle,
  getThreadContext,
  limit,
}) {
  const threadContext = await getThreadContext();
  let channelHistory;

  try {
    channelHistory = await client.conversations.history({
      channel: threadContext.channel_id,
      limit: limit,
    });
  } catch (e) {
    if (e.data.error === "not_in_channel") {
      await client.conversations.join({ channel: threadContext.channel_id });
      channelHistory = await client.conversations.history({
        channel: threadContext.channel_id,
        limit: 50,
      });
    } else {
      throw e;
    }
  }

  let prompt = `${SUMMARIZE_CHAT_PROMPT} <#${threadContext.channel_id}>:`;
  for (const m of channelHistory.messages.reverse()) {
    if (m.user) prompt += `\n<@${m.user}> says: ${m.text}`;
  }

  const messages = [
    { role: "system", content: COMPASS_BRIEFING },
    { role: "user", content: prompt },
  ];

  const summary = await getOpenAiResponse(messages);

  await say({
    blocks: [blockKitBuilder.addSection({ text: summary })],
    text: summary,
  });

  await setTitle(`Samenvatting van <#${threadContext.channel_id}>`);
}

async function getOpenAiResponse(messages) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    n: 1,
    messages,
  });
  return response.choices[0].message.content;
}

module.exports = {
  compass,
};
