const { config } = require("dotenv");
const { App } = require("@slack/bolt");
const { compass } = require("./compass");
const hubspot = require("./classes/Hubspot");
const blocksKit = require("./classes/BlockKitBuilder");

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
 * Handles commands.
 */
app.command("/kompas", async ({ command, ack, respond }) => {
  await ack();

  if (!command.text) {
    return await respond(
      "Probeer `/kompas help` om te zien waarmee ik je kan helpen."
    );
  }

  if ("hubspot" === command.text.trim().toLowerCase()) {
    // Send a message that says "choose what you want to do with HubSpot", and then two action buttons, one that says "get company info" and one that says "get latest tickets for a company"

    await respond({
      blocks: [
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
      ],
    });
  }
});

/**
 * Handles action buttons.
 */
app.action("get_company_info", async ({ body, client, ack, logger }) => {
  await ack();

  const modalOptions = {
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "get_company_info",
      title: {
        type: "plain_text",
        text: "Bedrijfsinformatie",
      },
      close: {
        type: "plain_text",
        text: "Sluiten",
      },
      blocks: [
        blocksKit.addDispatchInput({
          blockId: "search_company",
          actionId: "search_company",
          label: "Bedrijf zoeken",
          placeholder: "Vul hier een bedrijfsnaam in",
        }),
      ],
    },
  };

  await client.views.open(modalOptions);
});

app.action("get_recent_tickets", async ({ body, client, ack, logger }) => {
  await ack();

  const modalOptions = {
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "get_recent_tickets",
      title: {
        type: "plain_text",
        text: "Recente tickets",
      },
      close: {
        type: "plain_text",
        text: "Sluiten",
      },
      blocks: [
        blocksKit.addDispatchInput({
          blockId: "search_company",
          actionId: "search_company",
          label: "Bedrijfsnaam zoeken",
          placeholder: "Vul hier een bedrijfsnaam in",
        }),
      ],
    },
  };

  await client.views.open(modalOptions);
});

app.action("search_company", async ({ body, client, ack, logger }) => {
  await ack();
  const companyName = body.actions[0].value;

  // Call HubSpot API with the company name
  const hubspotResponse = await hubspot.search(companyName);

  if (hubspotResponse.total === 0) {
    const blocks = [
      blocksKit.addDispatchInput({
        blockId: "search_company",
        actionId: "search_company",
        label: "Bedrijfsnaam zoeken",
        placeholder: "Vul hier een bedrijfsnaam in",
        initialValue: companyName,
      }),
      blocksKit.addSection({
        text: "Geen bedrijven gevonden.",
      }),
    ];

    if ("get_company_info" === body.view.callback_id) {
      await client.views.update({
        view_id: body.view.id,
        view: {
          type: "modal",
          callback_id: "get_company_info",
          title: {
            type: "plain_text",
            text: "Bedrijfsinformatie",
          },
          blocks,
        },
      });
    } else if ("get_recent_tickets" === body.view.callback_id) {
      await client.views.update({
        view_id: body.view.id,
        view: {
          type: "modal",
          callback_id: "get_recent_tickets",
          title: {
            type: "plain_text",
            text: "Recente tickets",
          },
          blocks,
        },
      });
    }

    return;
  }

  const companies = await hubspotResponse.results;

  // Prepare the select menu options
  const options = companies.map((company) => ({
    text: {
      type: "plain_text",
      text: company.properties.name,
    },
    value: company.id,
  }));

  const blocks = [
    blocksKit.addDispatchInput({
      blockId: "search_company",
      actionId: "search_company",
      label: "Bedrijfsnaam zoeken",
      placeholder: "Vul hier een bedrijfsnaam in",
      initialValue: companyName,
    }),
  ];

  if (options.length > 0) {
    blocks.push(
      blocksKit.addSelectInput({
        blockId: "select_company",
        actionId: "select_company",
        label: "Resultaten",
        placeholder: "Selecteer een bedrijf",
        options,
      })
    );
  } else {
    blocks.push(
      blocksKit.addSection({
        text: "Geen tickets gevonden",
      })
    );
  }

  if ("get_company_info" === body.view.callback_id) {
    await client.views.update({
      view_id: body.view.id,
      view: {
        type: "modal",
        callback_id: "get_company_info",
        title: {
          type: "plain_text",
          text: "Bedrijfsinformatie",
        },
        blocks,
        close: {
          type: "plain_text",
          text: "Sluiten",
        },
        submit: {
          type: "plain_text",
          text: "Informatie bekijken",
        },
      },
    });
  } else if ("get_recent_tickets" === body.view.callback_id) {
    await client.views.update({
      view_id: body.view.id,
      view: {
        type: "modal",
        callback_id: "get_recent_tickets",
        title: {
          type: "plain_text",
          text: "Recente tickets",
        },
        blocks,
        close: {
          type: "plain_text",
          text: "Sluiten",
        },
        submit: {
          type: "plain_text",
          text: "Tickets bekijken",
        },
      },
    });
  }
});

/**
 * Updates the views.
 */
app.view("get_company_info", async ({ ack, body, view, client, logger }) => {
  await ack();

  const selectedCompanyId =
    view.state.values.select_company.select_company.selected_option.value;

  const companyInformation = await hubspot.getCompanyInformation(
    selectedCompanyId
  );

  const companyProperties = companyInformation.properties;

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Naam:* ${companyProperties.name}\n*Hubspot ID:* ${
          companyInformation.id
        }\n*Gemaakt op:* ${new Date(
          companyProperties.createdate
        ).toLocaleDateString()}\n*Laatst gewijzigd op:* ${new Date(
          companyProperties.hs_lastmodifieddate
        ).toLocaleDateString()}\n*Industrie:* ${
          companyProperties.industry || "Niet beschikbaar"
        }\n*Telefoon:* ${
          companyProperties.phone || "Niet beschikbaar"
        }\n*Website:* ${companyProperties.website || "Niet beschikbaar"}`,
      },
    },
  ];

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "company_info",
      close: {
        type: "plain_text",
        text: "Sluiten",
      },
      title: {
        type: "plain_text",
        text: "Bedrijfsinformatie",
      },
      blocks,
    },
  });
});

app.view("get_recent_tickets", async ({ ack, body, view, client, logger }) => {
  await ack();

  const selectedCompanyId =
    view.state.values.select_company.select_company.selected_option.value;

  const associatedTickets = await hubspot.findLatestTicketsByCompanyId(
    selectedCompanyId
  );

  const stageMap = await hubspot.getTicketPipelineStages();
  const tickets = associatedTickets.results;

  const blocks = [];

  if (0 === tickets.length) {
    blocks.push(
      blocksKit.addSection({
        text: "Geen tickets gevonden.",
      })
    );
  } else {
    tickets.forEach((ticket, index) => {
      const { subject, content, createdate, hs_pipeline_stage, id } =
        ticket.properties;

      blocks.push(
        blocksKit.addLinkButton({
          text: `*Onderwerp:* ${subject}`,
          buttonText: "Bekijk op HubSpot",
          actionId: "view_ticket",
          buttonValue: "view_ticket",
          url: `https://app.hubspot.com/contacts/${process.env.HUBSPOT_PORTAL_ID}/tickets/${id}`,
        })
      );

      if (content) {
        blocks.push(
          blocksKit.addSection({
            text: `${content.substring(0, 200)}...`,
          })
        );
      }

      blocks.push(
        blocksKit.addContext({
          text: `*Aangemaakt op:* ${new Date(createdate).toLocaleDateString(
            "nl-NL",
            { day: "numeric", month: "long", year: "numeric" }
          )}\n*Status:* ${stageMap[hs_pipeline_stage]}`,
        })
      );

      blocks.push(
        blocksKit.addSection({
          text: ` `,
        })
      );

      // Add a divider unless it's the last ticket
      if (index < tickets.length - 1) {
        blocks.push(blocksKit.addDivider());
      }
    });
  }

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "company_tickets",
      close: {
        type: "plain_text",
        text: "Sluiten",
      },
      title: {
        type: "plain_text",
        text: "Recente tickets",
      },
      blocks,
    },
  });
});

/**
 * Starts the app.
 */
(async () => {
  await app.start();
  app.logger.info("⚡️ Compass is awake!");
})();
