const { config } = require("dotenv");
const { App } = require("@slack/bolt");
const { compass } = require("./compass");
const { registerActions } = require("./actions");
const { registerViews } = require("./views");
const { registerCrons } = require("./crons");
const { registerCommands } = require("./commands");

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
 * Registers the app's actions.
 */
registerActions(app);

/**
 * Registers the app's views.
 */
registerViews(app);

/**
 * Registers the app's crons.
 */
registerCrons(app);

/**
 * Registers the app's commands.
 */
registerCommands(app);

/**
 * Sets the app's assistant to Compass.
 */
app.assistant(compass);

/**
 * Starts the app.
 */
(async () => {
  await app.start();
  app.logger.info("🌊 Compass is sailing!");
})();
