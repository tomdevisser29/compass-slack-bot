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
      response.results.forEach((company) => {
        this.getCompanyBranch(company.id);
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch companies from HubSpot:", error);
      throw error;
    }
  }

  async search(keyword) {
    try {
      const response = await this.client.crm.companies.searchApi.doSearch({
        query: keyword,
        properties: ["name"],
      });
      return response;
    } catch (error) {
      console.error("Failed to search companies in HubSpot:", error);
      throw error;
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
    } catch (error) {
      console.error("Failed to fetch company information from HubSpot:", error);
      throw error;
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
      return await this.client.crm.tickets.searchApi.doSearch(query);
    } catch (error) {
      console.error("Failed to fetch tickets from HubSpot:", error);
      throw error;
    }
  }

  async getCompanyBranch(companyId) {
    try {
      const properties = ["industry"];
      return await this.client.crm.companies.basicApi.getById(
        companyId,
        properties
      );
    } catch (error) {
      console.error("Failed to fetch company information from HubSpot:", error);
      throw error;
    }
  }

  async getTicketPipelineStages() {
    try {
      const response = await this.client.crm.pipelines.pipelinesApi.getAll(
        "tickets"
      );
      const pipelines = response.results;

      // Extract pipeline stages into a lookup table.
      const stageMap = {};
      pipelines.forEach((pipeline) => {
        pipeline.stages.forEach((stage) => {
          stageMap[stage.id] = stage.label;
        });
      });
      return stageMap;
    } catch (error) {
      console.error("Failed to fetch pipeline stages:", error);
      throw error;
    }
  }
}

module.exports = new HubSpot(process.env.HUBSPOT_ACCESS_TOKEN);
