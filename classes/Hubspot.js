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

  getSearchInput({ blockId, actionId, label, placeholder, initialValue = "" }) {
    return {
      block_id: blockId,
      dispatch_action: true,
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: actionId,
        initial_value: initialValue,
        placeholder: {
          type: "plain_text",
          text: placeholder,
        },
      },
      label: {
        type: "plain_text",
        text: label,
        emoji: true,
      },
    };
  }

  async getCompanyBranch(companyId) {
    try {
      const properties = ["industry"];
      const response = await this.client.crm.companies.basicApi.getById(
        companyId,
        properties
      );
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      e.message === "HTTP request failed"
        ? console.error(JSON.stringify(e.response, null, 2))
        : console.error(e);
    }
  }
}

module.exports = new HubSpot(process.env.HUBSPOT_ACCESS_TOKEN);
