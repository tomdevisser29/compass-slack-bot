const float = require("./classes/apis/Float");
const blocksKit = require("./classes/utilities/BlockKitBuilder");
const cron = require("node-cron");
const confluence = require("./classes/apis/Confluence");
const pinecone = require("./classes/apis/Pinecone");
const openai = require("./classes/apis/OpenAI");

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
      const { name: projectName, project_manager: projectManagerId } = project;

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

/**
 * This cron job syncs our Confluence data to Pinecone for better
 * Compass responses, every weekday at 00:00.
 */
const syncConfluenceToPinecone = async () => {
  let pages = [];
  let spaces = await confluence.getSpaces();
  const spacesToImport = ["KB", "D2"];
  // const spacesToImport = ["DEV", "KB", "D2"];
  const index = await pinecone.getIndex("kompas-index");

  if (!spaces.results) {
    return;
  }

  for (const key of spacesToImport) {
    // spaces are objects with the key property, find the object with the key dev
    const devSpace = spaces.results.find((space) => space.key === key);

    if (!devSpace) {
      continue;
    }

    const devSpacePages = await confluence.getPagesBySpace({
      spaceId: devSpace.id,
      status: "current",
      depth: "all",
      limit: 10,
    });

    let pagesProcessed = 0;

    for (let page of devSpacePages) {
      const pageContent = await confluence.getPage(page.id);

      if (/standup|stand-up|breakout|stand up/i.test(pageContent.title)) {
        continue;
      }

      // Remove entire <ac:*> tags along with their content
      let content = pageContent.body.storage.value.replace(
        /<ac:[^>]*>.*?<\/ac:[^>]*>/gs,
        ""
      );
      // Remove standard HTML tags
      content = content.replace(/<(?!\/?(p|h[1-6]|ul|ol|li)\b)[^>]+>/g, "");
      // Trim any excess whitespace
      content = content.trim();
      const embedding = await openai.createEmbedding({ text: content });
      if (embedding) {
        const data = {
          id: pageContent.id,
          values: embedding,
          metadata: {
            title: pageContent.title,
            content,
          },
        };

        pages.push(data);
      } else {
        console.log(`Page ${pageContent.title} has no data to embed`);
        continue;
      }

      console.log(`Page ${pageContent.title} processed.`);

      if (50 === pagesProcessed) {
        console.log(`Inserting ${pagesProcessed} pages into Pinecone...`);
        await index.upsert(pages);
        pagesProcessed = 0;
        pages = [];
      }

      pagesProcessed++;
    }
    console.log(`Inserting ${pagesProcessed} pages into Pinecone...`);
    await index.upsert(pages);
  }

  console.log("All pages inserted into Pinecone");
};

function registerCrons(app) {
  if (process.env.NODE_ENV === "development") {
    // collectFeedback();
  } else if (process.env.NODE_ENV === "production") {
    cron.schedule("0 16 * * 1-5", collectFeedback);
  }
}

module.exports = {
  registerCrons,
  cronJobs: {
    collectFeedback,
    syncConfluenceToPinecone,
  },
};
