const blocksKit = require("./classes/utilities/BlockKitBuilder");
const hubspot = require("./classes/apis/Hubspot");

function registerViews(app) {
  /**
   * This view is triggered when the user wants to get information about a company.
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

  /**
   * This view is triggered when the user wants to get the recent tickets of a company.
   */
  app.view(
    "get_recent_tickets",
    async ({ ack, body, view, client, logger }) => {
      await ack();

      const selectedCompanyId =
        view.state.values.select_company.select_company.selected_option.value;

      const associatedTickets = await hubspot.findLatestTicketsByCompanyId(
        selectedCompanyId
      );

      const stageMap = await hubspot.getTicketPipelineStages();
      const tickets = associatedTickets.results.reverse();

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

          blocks.push(blocksKit.addWhitespace());

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
    }
  );
}

module.exports = {
  registerViews,
};
