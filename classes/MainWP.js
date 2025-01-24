const { config } = require("dotenv");
config();

class MainWP {
  constructor() {
    this.baseUrl = "https://mainwp.stuurlui.dev/wp-json/mainwp/v2";
    this.apiKey = process.env.MAINWP_API_KEY;
    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async getWebsiteCount() {
    const response = await fetch(`${this.baseUrl}/sites/count`, {
      headers: this.defaultHeaders,
    });

    return response.json();
  }

  async getTags() {
    const response = await fetch(`${this.baseUrl}/tags`, {
      headers: this.defaultHeaders,
    });

    return response.json();
  }
}

module.exports = new MainWP();
