const hubspot = require("@hubspot/api-client");
const { config } = require("dotenv");
config();

/**
 * The HubSpot class lets you interact with the HubSpot API.
 * @see https://github.com/HubSpot/hubspot-api-nodejs
 */
class HubSpot {
  constructor(accessToken) {
    this.client = new hubspot.Client({ accessToken });
  }

  async getCompanies() {
    try {
      const response = await this.client.crm.companies.basicApi.getPage();

      // loop through companies
      response.results.forEach((company) => {
        this.getCompanyBranch(company.id);
      });
    } catch (e) {
      e.message === "HTTP request failed"
        ? console.error(JSON.stringify(e.response, null, 2))
        : console.error(e);
    }
  }

  async search(keyword) {
    try {
      const response = await this.client.crm.companies.searchApi.doSearch({
        query: keyword,
        properties: ["name"],
      });
      return response;
    } catch (e) {
      e.message === "HTTP request failed"
        ? console.error(JSON.stringify(e.response, null, 2))
        : console.error(e);
    }
  }

  async getCompanyInformation(companyId) {
    try {
      const properties = ["name", "industry", "phone", "website"];
      const response = await this.client.crm.companies.basicApi.getById(
        companyId,
        properties
      );
      return response;
    } catch (e) {
      e.message === "HTTP request failed"
        ? console.error(JSON.stringify(e.response, null, 2))
        : console.error(e);
    }
  }

  async findLatestTicketsByCompanyId(companyId) {
    const query = {
      properties: ["subject", "content", "hs_pipeline_stage", "createdate"],
      limit: 10,
      after: 0,
      filterGroups: [
        {
          filters: [
            {
              propertyName: "associations.company",
              operator: "EQ",
              value: companyId,
            },
          ],
        },
      ],
    };

    try {
      const response = await this.client.crm.tickets.searchApi.doSearch(query);
      return response;
    } catch (e) {
      console.error(e);
      throw new Error("Failed to fetch tickets from HubSpot");
    }
  }

  async getCompanyBranch(companyId) {
    try {
      const properties = ["industry"];
      const response = await this.client.crm.companies.basicApi.getById(
        companyId,
        properties
      );
      return response;
    } catch (e) {
      e.message === "HTTP request failed"
        ? console.error(JSON.stringify(e.response, null, 2))
        : console.error(e);
    }
  }

  async getTicketPipelineStages() {
    try {
      const response = await this.client.crm.pipelines.pipelinesApi.getAll(
        "tickets"
      );
      const pipelines = response.results;

      // Extract pipeline stages into a lookup table
      const stageMap = {};
      pipelines.forEach((pipeline) => {
        pipeline.stages.forEach((stage) => {
          stageMap[stage.id] = stage.label; // Maps ID -> Name
        });
      });

      return stageMap;
    } catch (error) {
      console.error("Failed to fetch pipeline stages:", error);
      throw new Error("Could not retrieve pipeline stages.");
    }
  }
}

module.exports = new HubSpot(process.env.HUBSPOT_ACCESS_TOKEN);
