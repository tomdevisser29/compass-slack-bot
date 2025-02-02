const float = require("./classes/apis/Float");
const blocksKit = require("./classes/utilities/BlockKitBuilder");
const cron = require("node-cron");

function registerCrons(app) {
  /**
   * This cron job sends each member that has a Float schedule, a message
   * at 16:30 on weekdays to check if they have reported their hours to the
   * project manager.
   */
  cron.schedule("30 16 * * 1-5", async () => {
    const result = await app.client.users.list({
      token: process.env.SLACK_BOT_TOKEN,
    });

    if (!result.ok || !result.members) {
      return;
    }

    const slackMembers = result.members;
    const floatAccounts = await float.getPeople();

    slackMembers.forEach(async (member) => {
      const { name, id } = member;
      const email = member.profile.email;

      const floatAccount = floatAccounts.find(
        (floatAccount) => floatAccount.email === email
      );

      if (!floatAccount) {
        return;
      }

      const todaysTasks = await float.fetchTasksByPersonId(
        floatAccount.people_id
      );

      if (!todaysTasks) {
        return;
      }

      const blocks = [];

      blocks.push(
        blocksKit.addSection({
          text: `:wave: Hey ${name}, laten we je planning voor vandaag kort doornemen. Heb je alles teruggekoppeld aan de projectmanager?`,
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

      // Send a slack message using blocks to the member
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: id,
        blocks,
      });
    });
  });
}

module.exports = {
  registerCrons,
};
