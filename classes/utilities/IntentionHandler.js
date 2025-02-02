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
  intentRouter = async (userQuestion) => {
    const intentObject = await this.analyseIntent(userQuestion);

    switch (intentObject.intent) {
      case "website_count":
        const websiteCount = await mainwp.getWebsiteCount();
        const countResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          n: 1,
          messages: [
            { role: "system", content: COMPASS_BRIEFING },
            {
              role: "system",
              content: `${WEBSITE_COUNT_PROMPT} ${JSON.stringify(
                websiteCount
              )}`,
            },
          ],
        });

        return countResponse.choices[0].message.content;

      case "website_tag_count":
        const tags = await mainwp.getTags();

        const tag = Object.values(tags.data).find(
          (tag) => tag.name === intentObject.tag
        );

        if (!tag) {
          return null;
        }

        const tagCountResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          n: 1,
          messages: [
            { role: "system", content: COMPASS_BRIEFING },
            {
              role: "system",
              content: `${WEBSITE_TAG_COUNT_PROMPT} ${JSON.stringify(tag)}`,
            },
          ],
        });

        return tagCountResponse.choices[0].message.content;
    }

    return null;
  };

  analyseIntent = async (userQuestion) => {
    const prompt = `${ANALYSE_INTENT_PROMPT} ${userQuestion}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      n: 1,
      messages: [{ role: "system", content: prompt }],
    });

    const intentObject = response.choices[0].message.content;

    try {
      return JSON.parse(intentObject);
    } catch (e) {
      console.error(`Error parsing JSON: ${e}`);
      return { intent: "unknown" };
    }
  };
}

module.exports = new IntentionHandler();
