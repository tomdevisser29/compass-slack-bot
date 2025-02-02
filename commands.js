const blocksKit = require("./classes/utilities/BlockKitBuilder");

function registerCommands(app) {
  /**
   * Registers the /kompas-hubspot command, which is used to interact with HubSpot.
   */
  app.command("/kompas-hubspot", async ({ ack, respond }) => {
    await ack();

    const blocks = [
      blocksKit.addSection({
        text: "Wat wil je doen met HubSpot?",
      }),
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
      }),
    ];

    return await respond({
      blocks,
    });
  });

  /**
   * Registers the /kompas-projecten command, which is used to retrieve
   * information about our projects.
   */
  app.command("/kompas-projecten", async ({ ack, respond }) => {
    await ack();

    const blocks = [
      blocksKit.addSection({
        text: "Wat wil je weten over onze projecten?",
      }),
      blocksKit.addActions({
        elements: [
          blocksKit.addButton({
            text: "Projectmanager opzoeken",
            actionId: "get_project_manager",
          }),
        ],
      }),
    ];

    return await respond({
      blocks,
    });
  });
}

module.exports = {
  registerCommands,
};
