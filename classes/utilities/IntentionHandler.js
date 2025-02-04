/**
 * This file returns an instance of the IntentionHandler class, used to
 * route user questions to the appropriate handler based on the intent
 * of the question.
 */
const openai = require("../apis/OpenAI");
const mainwp = require("../apis/MainWP");
const {
  ANALYSE_INTENT_PROMPT,
  COMPASS_BRIEFING,
  WEBSITE_COUNT_PROMPT,
  WEBSITE_TAG_COUNT_PROMPT,
} = require("../../prompts");

/**
 * The IntentionHandler class is responsible for routing user questions to
 * the appropriate handler based on the intent of the question. The intention
 * is determined by the OpenAI model, which returns a JSON object based on
 * the app's prompts.
 *
 * E.g. (see prompts.js):
 * 1. "Hoeveel websites hebben we op dit moment?"
 *    -> {"intent": "website_count"}
 */
class IntentionHandler {
  intentRouter = async (intention) => {
    const messages = [{ role: "system", content: COMPASS_BRIEFING }];
    switch (intention.intent) {
      case "website_count":
        const websiteCount = await mainwp.getWebsiteCount();
        messages.push({
          role: "system",
          content: `${WEBSITE_COUNT_PROMPT} ${JSON.stringify(websiteCount)}`,
        });
        return await openai.createCompletion({ messages });

      case "website_tag_count":
        const tags = await mainwp.getTags();
        const tag = Object.values(tags.data).find(
          (tag) => tag.name === intention.tag
        );
        if (!tag) return null;
        messages.push({
          role: "system",
          content: `${WEBSITE_TAG_COUNT_PROMPT} ${JSON.stringify(tag)}`,
        });
        return await openai.createCompletion({ messages });

      default:
        return null;
    }
  };

  analyseIntent = async (userQuestion) => {
    const prompt = `${ANALYSE_INTENT_PROMPT} ${userQuestion}`;
    const messages = [{ role: "system", content: prompt }];
    const intentObject = await openai.createCompletion({ messages });

    try {
      return JSON.parse(intentObject);
    } catch (e) {
      console.error(`Error parsing JSON: ${e}`);
      return { intent: "unknown" };
    }
  };
}

module.exports = new IntentionHandler();
