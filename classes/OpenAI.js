/**
 * This file returns an instance of the OpenAI class with the API key from the .env file.
 */

const { OpenAI } = require("openai");
const { config } = require("dotenv");
config();

module.exports = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
