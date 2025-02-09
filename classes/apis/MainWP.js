const { config } = require("dotenv");
config();

/**
 * The MainWP class lets you interact with the MainWP API.
 */
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
    try {
      const response = await fetch(`${this.baseUrl}/sites/count`, {
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get website count:", error);
      throw error;
    }
  }

  async getTags() {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get tags:", error);
      throw error;
    }
  }
}

module.exports = new MainWP();
