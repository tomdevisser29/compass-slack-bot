const { config } = require("dotenv");
config();

/**
 * The FloatAPI class lets you interact with the Float API.
 */
class FloatAPI {
  constructor() {
    this.baseUrl = "https://api.float.com/v3";
    this.apiKey = process.env.FLOAT_API_KEY;
    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async getPeopleReport() {
    /**
     * The start and end dates are now hardcoded, it would be nice to make
     * these dynamic in the intention handler based on the user's question.
     */
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);

    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    const url = `${this.baseUrl}/reports/people?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return response.json();
  }
}

module.exports = new FloatAPI();
