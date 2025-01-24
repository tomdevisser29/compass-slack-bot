const { OpenAI } = require("openai");
const { config } = require("dotenv");
config();

module.exports = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
