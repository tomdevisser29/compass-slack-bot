const { config } = require("dotenv");
config();

class Confluence {
  constructor() {
    this.baseUrl = process.env.CONFLUENCE_BASE_URL;
    this.email = process.env.CONFLUENCE_EMAIL;
    this.apiKey = process.env.CONFLUENCE_API_KEY;

    this.defaultHeaders = {
      Authorization: `Basic ${Buffer.from(
        `${this.email}:${this.apiKey}`
      ).toString("base64")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async getSpaces() {
    const url = `${this.baseUrl}/wiki/rest/api/space`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return await response.json();
  }

  async getSpace(spaceKey) {
    const url = `${this.baseUrl}/wiki/rest/api/space/${spaceKey}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return await response.json();
  }

  async getPages(spaceKey) {
    const url = `${this.baseUrl}/wiki/rest/api/space/${spaceKey}/content`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return await response.json();
  }

  async getPage(pageId) {
    const query = {
      expand: "body.storage",
    };

    const params = new URLSearchParams(query);

    const url = `${this.baseUrl}/wiki/rest/api/content/${pageId}?${params}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return await response.json();
  }
}

module.exports = new Confluence();
