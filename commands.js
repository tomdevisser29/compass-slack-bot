const blocksKit = require("./classes/utilities/BlockKitBuilder");

function registerCommands(app) {
  /**
   * Registers the /kompas command, which is used to interact with Compass.
   */
  app.command("/kompas", async ({ command, ack, respond }) => {
    await ack();

    // TODO: Implement the /kompas help command.
    if (!command.text) {
      return await respond(
        "Probeer `/kompas help` om te zien waarmee ik je kan helpen."
      );
    }

    const blocks = [];

    /**
     * If the user types "hubspot", show the HubSpot options.
     */
    switch (command.text.trim().toLowerCase()) {
      case "hubspot":
        blocks.push(
          blocksKit.addSection({
            text: "Wat wil je doen met HubSpot?",
          })
        );
        blocks.push(
          blocksKit.addActions({
            elements: [
              blocksKit.addButton({
                text: "Bedrijfsinformatie bekijken",
                actionId: "get_company_info",
              }),
              blocksKit.addButton({
                text: "Recente tickets bekijken",
                actionId: "get_recent_tickets",
              }),
            ],
          })
        );
        break;
    }

    return await respond({
      blocks,
    });
  });
}

module.exports = {
  registerCommands,
};
