const { config } = require("dotenv");
const { App } = require("@slack/bolt");
const { compass } = require("./compass");

config();

/**
 * Initializes your app with your bot token and signing secret.
 */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000,
});

/**
 * Sets the app's assistant to Compass.
 */
app.assistant(compass);

/**
 * Starts the app.
 */
(async () => {
  await app.start();
  app.logger.info("⚡️ Compass is awake!");
})();
