/**
 * This file returns an instance of the OpenAI class with the API key from the .env file.
 */

const { OpenAI: client } = require("openai");
const { config } = require("dotenv");
config();

class OpenAI {
  constructor({ apiKey }) {
    this.client = new client({ apiKey });
  }

  async createCompletion({ model = "gpt-4o-mini", messages }) {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        n: 1,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error(error);
    }
  }

  async createEmbedding({ model = "text-embedding-ada-002", text }) {
    try {
      const response = await this.client.embeddings.create({
        model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
