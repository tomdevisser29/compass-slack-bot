const {
  ANALYSE_INTENT_PROMPT,
  COMPASS_BRIEFING,
  WEBSITE_COUNT_PROMPT,
  WEBSITE_TAG_COUNT_PROMPT,
} = require("../prompts");
const openai = require("./OpenAI");
const mainwp = require("./MainWP");

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
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
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
