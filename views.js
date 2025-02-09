const blocksKit = require("./classes/utilities/BlockKitBuilder");
const hubspot = require("./classes/apis/HubSpot");
const float = require("./classes/apis/Float");

function registerViews(app) {
  /**
   * This view is triggered when the user wants to get the team working on a project.
   */
  app.view("get_project_team", async ({ ack, body, view, client }) => {
    await ack();

    const blocks = [];

    const selectedProjectId =
      view.state.values.select_project.select_project.selected_option.value;

    const project = await float.getProjectById(selectedProjectId);
    const { project_team: team } = project;

    if (0 === team.length) {
      blocks.push(
        blocksKit.addSection({
          text: "Geen teamleden gevonden.",
        })
      );
    } else {
      blocks.push(
        blocksKit.addSection({
          text: "De volgende collega's werk(t)en aan dit project:",
        })
      );

      for (const teamMember of team) {
        const memberId = teamMember.people_id;
        const member = await float.getPeopleById(memberId);
        let slackUser = null;

        try {
          slackUser = await client.users.lookupByEmail({
            email: member.email,
          });
        } catch (error) {
          console.error(error);
          continue;
        }

        const slackUserId = slackUser.user.id;

        blocks.push(
          blocksKit.addSection({
            text: `*Naam:* <@${slackUserId}>\n*E-mail:* ${member.email}`,
          })
        );

        if (team.indexOf(teamMember) < team.length - 1) {
          blocks.push(blocksKit.addDivider());
        }
      }

      blocks.push(
        blocksKit.addContext({
          text: "Deze informatie is dynamisch verzameld uit Float, en kan onvolledig zijn.",
        })
      );
    }

    const modalOptions = blocksKit.createModal({
      triggerId: body.trigger_id,
      callbackId: "get_project_team",
      title: "Team opzoeken",
      blocks,
    });

    await client.views.open(modalOptions);
  });

  /**
   * This view is triggered whe the user wants to see the PM of a project.
   */
  app.view("get_project_manager", async ({ ack, body, view, client }) => {
    await ack();

    const selectedProjectId =
      view.state.values.select_project.select_project.selected_option.value;

    const project = await float.getProjectById(selectedProjectId);

    const projectManagerId = project.project_manager;
    const projectManager = await float.getAccountById(projectManagerId);

    const slackUser = await client.users.lookupByEmail({
      email: projectManager.email,
    });

    const projectManagerSlackId = slackUser.user.id;

    const blocks = [
      blocksKit.addSection({
        text: `*Project:* ${project.name}\n*Projectmanager:* <@${projectManagerSlackId}>\n*E-mail:* ${projectManager.email}`,
      }),
    ];

    const modalOptions = blocksKit.createModal({
      triggerId: body.trigger_id,
      callbackId: "project_manager",
      title: "Projectmanager",
      blocks,
    });

    await client.views.open(modalOptions);
  });

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

    const modalOptions = blocksKit.createModal({
      triggerId: body.trigger_id,
      callbackId: "company_info",
      title: "Bedrijfsinformatie",
      blocks,
    });

    await client.views.open(modalOptions);
  });

  /**
   * This view is triggered when the user wants to get the recent tickets of a company.
   */
  app.view("get_recent_tickets", async ({ ack, body, view, client }) => {
    await ack();

    const blocks = [];

    const selectedCompanyId =
      view.state.values.select_company.select_company.selected_option.value;

    const associatedTickets = await hubspot.findLatestTicketsByCompanyId(
      selectedCompanyId
    );

    if (!associatedTickets || 0 === associatedTickets.results.length) {
      blocks.push(
        blocksKit.addSection({
          text: "Geen tickets gevonden.",
        })
      );
    } else {
      const stageMap = await hubspot.getTicketPipelineStages();
      const tickets = associatedTickets.results.reverse();

      tickets.forEach((ticket, index) => {
        const id = ticket.id;
        const { subject, content, createdate, hs_pipeline_stage } =
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

    const modalOptions = blocksKit.createModal({
      triggerId: body.trigger_id,
      callbackId: "company_tickets",
      title: "Recente tickets",
      blocks,
    });

    await client.views.open(modalOptions);
  });
}

module.exports = {
  registerViews,
};
