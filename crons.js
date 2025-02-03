const float = require("./classes/apis/Float");
const blocksKit = require("./classes/utilities/BlockKitBuilder");
const cron = require("node-cron");

function registerCrons(app) {
  /**
   * This cron job sends each member that has a Float schedule, a message
   * at 16:00 on weekdays to check if they have reported their hours to the
   * project manager.
   */
  const collectFeedback = async () => {
    const result = await app.client.users.list({
      token: process.env.SLACK_BOT_TOKEN,
    });

    if (!result.ok || !result.members) {
      throw new Error("Failed to fetch Slack members.");
    }

    const slackMembers = result.members;
    const floatAccounts = await float.getPeople();

    for (const member of slackMembers) {
      const { id } = member;
      const email = member.profile.email;

      if (process.env.NODE_ENV === "development") {
        if (email !== process.env.SLACK_EMAIL_DEVELOPER) continue;
      }

      const floatAccount =
        process.env.NODE_ENV === "development"
          ? floatAccounts.find(
              (acc) => acc.email === process.env.FLOAT_EMAIL_DEVELOPER
            )
          : floatAccounts.find((acc) => acc.email === email);

      if (!floatAccount) {
        continue;
      }

      const todaysTasks = await float.fetchTasksByPersonId(
        floatAccount.people_id
      );

      if (!todaysTasks) {
        continue;
      }

      const blocks = [];

      blocks.push(
        blocksKit.addSection({
          text: `:wave: Ahoy <@${id}>, laten we je planning voor vandaag doornemen. Hou het kort; focus op bijzonderheden.`,
        }),
        blocksKit.addContext({
          text: "Deze terugkoppeling vervangt *niet* de terugkoppeling in Trello en HubSpot.",
        })
      );

      blocks.push(blocksKit.addWhitespace());
      blocks.push(blocksKit.addDivider());

      for (const task of todaysTasks) {
        const { task_id: taskId, project_id: projectId, hours } = task;

        const project = await float.getProjectById(projectId);
        const { name: projectName, project_manager: projectManagerId } =
          project;

        const floatTask = await float.getTaskById(taskId);
        const { name: taskName } = floatTask;

        const projectManager = await float.getAccountById(projectManagerId);
        const { name: projectManagerName } = projectManager;

        blocks.push(
          blocksKit.addSection({
            text: `Je stond vandaag ${hours} uur ingepland voor *${projectName}*.`,
          })
        );

        if (taskName) {
          blocks.push(
            blocksKit.addContext({
              text: `*Taak*: ${taskName}`,
            })
          );
        }

        blocks.push(
          blocksKit.addDispatchInput({
            blockId: `feedback_${projectId}`,
            actionId: `feedback_${projectId}`,
            label: `Terugkoppeling naar ${projectManagerName}`,
            placeholder: "Hoe is het gegaan?",
          })
        );

        blocks.push(blocksKit.addWhitespace());
        blocks.push(blocksKit.addDivider());
      }

      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: id,
        text: "Dagelijkse terugkoppeling voor " + new Date().toDateString(),
        blocks,
      });
    }
  };

  if (process.env.NODE_ENV === "development") {
    collectFeedback();
  } else if (process.env.NODE_ENV === "production") {
    cron.schedule("0 16 * * 1-5", collectFeedback);
  }
}

module.exports = {
  registerCrons,
};
