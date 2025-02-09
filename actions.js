const blocksKit = require("./classes/utilities/BlockKitBuilder");
const hubspot = require("./classes/apis/HubSpot");
const float = require("./classes/apis/Float");

function registerActions(app) {
  /**
   * This action is triggered when the user wants to get the team working on a project.
   */
  app.action("get_project_team", async ({ body, client, ack, logger }) => {
    await ack();

    const blocks = [];

    const allProjects = await float.getProjects();

    const options = allProjects.map((project) => ({
      text: {
        type: "plain_text",
        text: project.name,
      },
      value: project.project_id.toString(),
    }));

    blocks.push(
      blocksKit.addSelectInput({
        blockId: "select_project",
        actionId: "select_project",
        label: "Projecten",
        placeholder: "Selecteer een project",
        options,
      })
    );

    const modalOptions = blocksKit.createModal({
      triggerId: body.trigger_id,
      callbackId: "get_project_team",
      title: "Team opzoeken",
      blocks,
      submitText: "Team bekijken",
    });

    await client.views.open(modalOptions);
  });

  /**
   * This action is triggered when the user wants to get information about a project.
   */
  app.action("get_project_manager", async ({ body, client, ack, logger }) => {
    await ack();

    const blocks = [];

    const allProjects = await float.getProjects();

    const options = allProjects.map((project) => ({
      text: {
        type: "plain_text",
        text: project.name,
      },
      value: project.project_id.toString(),
    }));

    blocks.push(
      blocksKit.addSelectInput({
        blockId: "select_project",
        actionId: "select_project",
        label: "Projecten",
        placeholder: "Selecteer een project",
        options,
      })
    );

    const modalOptions = blocksKit.createModal({
      triggerId: body.trigger_id,
      callbackId: "get_project_manager",
      title: "Projectmanager opzoeken",
      blocks,
      submitText: "Projectmanager bekijken",
    });

    await client.views.open(modalOptions);
  });

  /**
   * This action is triggered when the user wants to get information about a company.
   */
  app.action("get_company_info", async ({ body, client, ack, logger }) => {
    await ack();

    const blocks = [];

    blocks.push(
      blocksKit.addDispatchInput({
        blockId: "search_company",
        actionId: "search_company",
        label: "Bedrijf zoeken",
        placeholder: "Vul hier een bedrijfsnaam in",
      })
    );

    const modalOptions = blocksKit.createModal({
      triggerId: body.trigger_id,
      callbackId: "get_company_info",
      title: "Bedrijfsinformatie",
      blocks,
    });

    await client.views.open(modalOptions);
  });

  /**
   * This action is triggered when the user wants to get the recent tickets of a company.
   */
  app.action("get_recent_tickets", async ({ body, client, ack }) => {
    await ack();

    const blocks = [];

    blocks.push(
      blocksKit.addDispatchInput({
        blockId: "search_company",
        actionId: "search_company",
        label: "Bedrijf zoeken",
        placeholder: "Vul hier een bedrijfsnaam in",
      })
    );

    const modalOptions = blocksKit.createModal({
      triggerId: body.trigger_id,
      callbackId: "get_recent_tickets",
      title: "Recente tickets",
      blocks,
    });

    await client.views.open(modalOptions);
  });

  /**
   * This action is triggered when the user wants to search for a company.
   */
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
        const updatedModal = blocksKit.updateModal({
          viewId: body.view.id,
          callbackId: "get_company_info",
          title: "Bedrijfsinformatie",
          blocks,
        });

        await client.views.update(updatedModal);
      } else if ("get_recent_tickets" === body.view.callback_id) {
        const updatedModal = blocksKit.updateModal({
          viewId: body.view.id,
          callbackId: "get_recent_tickets",
          title: "Recente tickets",
          blocks,
        });

        await client.views.update(updatedModal);
      }

      return;
    }

    const companies = await hubspotResponse.results;

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
      const updatedModal = blocksKit.updateModal({
        viewId: body.view.id,
        callbackId: "get_company_info",
        title: "Bedrijfsinformatie",
        blocks,
      });

      await client.views.update(updatedModal);
    } else if ("get_recent_tickets" === body.view.callback_id) {
      const updatedModal = blocksKit.updateModal({
        viewId: body.view.id,
        callbackId: "get_recent_tickets",
        title: "Recente tickets",
        blocks,
      });

      await client.views.update(updatedModal);
    }
  });

  /**
   * This action is triggered when someone provides feedback for a project through the
   * cron job that interacts with the Float API and runs every day at 16:30.
   */
  app.action(/feedback_(.*)/, async ({ body, ack, say, client }) => {
    await ack();

    const floatProjectId = body.actions[0].action_id.replace("feedback_", "");
    const feedback = body.actions[0].value;
    const userId = body.user.id;

    const channelId = body.channel.id;
    const threadTs = body.message.thread_ts || body.message.ts;

    // Remove the dispatch input and add a confirmation message
    const updatedBlocks = body.message.blocks.filter(
      (block) => block.block_id !== `feedback_${floatProjectId}`
    );

    // Update the message by removing the dispatch input and adding the new confirmation message
    await client.chat.update({
      channel: channelId,
      ts: threadTs,
      blocks: updatedBlocks,
    });

    const project = await float.getProjectById(floatProjectId);
    if (!project) return;

    const { name: projectName, project_manager: projectManagerId } = project;
    let projectManagerSlackId;

    if (process.env.NODE_ENV === "development") {
      projectManagerSlackId = userId;
    } else {
      const projectManager = await float.getAccountById(projectManagerId);
      const projectManagerEmail = projectManager?.email;

      const result = await client.users.lookupByEmail({
        email: projectManagerEmail,
      });

      if (!result.ok) {
        return await say({
          channel: channelId,
          thread_ts: threadTs,
          text: `Bedankt voor de terugkoppeling voor *${projectName}*. Ik kon de projectmanager niet vinden, dus hier is je terugkoppeling: ${feedback}.`,
        });
      }

      projectManagerSlackId = result.user.id;
    }

    await client.chat.postMessage({
      token: process.env.USER_OAUTH_TOKEN,
      channel: projectManagerSlackId,
      text: `:wave: <@${projectManagerSlackId}>, hierbij een korte terugkoppeling voor *${projectName}*.\n\n*Terugkoppeling*\n${feedback}`,
    });

    await say({
      channel: channelId,
      thread_ts: threadTs,
      text: `Bedankt voor de terugkoppeling voor *${projectName}*. Ik heb het doorgestuurd naar <@${projectManagerSlackId}>.`,
    });
  });
}

module.exports = {
  registerActions,
};
