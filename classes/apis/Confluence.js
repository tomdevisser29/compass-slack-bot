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
    const url = `${this.baseUrl}/wiki/api/v2/spaces`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return await response.json();
    } catch (error) {
      console.error("Failed to get spaces:", error);
      throw error;
    }
  }

  async getSpace(spaceKey) {
    const url = `${this.baseUrl}/wiki/api/v2/space/${spaceKey}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return await response.json();
    } catch (error) {
      console.error("Failed to get space:", error);
      throw error;
    }
  }

  async getPagesBySpace({
    spaceId,
    status = "current",
    depth = "root",
    limit = 25,
  }) {
    let results = [];
    let hasMore = true;

    // Construct base query parameters for the first request
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      status,
      depth,
    });

    let nextUrl = `${
      this.baseUrl
    }/wiki/api/v2/spaces/${spaceId}/pages?${queryParams.toString()}`;

    while (hasMore) {
      try {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: this.defaultHeaders,
        });

        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.results) {
          results.push(...data.results);
        }

        if (data._links?.next) {
          nextUrl = `${this.baseUrl}${data._links.next}`;
        } else if (data._links?.cursor) {
          nextUrl = `${this.baseUrl}/wiki/api/v2/spaces/${spaceId}/pages?cursor=${data._links.cursor}`;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(
          `Error fetching pages for depth=${depth}:`,
          error.message
        );
        return results;
      }
    }

    return results;
  }

  async getPage(pageId) {
    const query = {
      "body-format": "storage",
    };

    const params = new URLSearchParams(query);

    const url = `${this.baseUrl}/wiki/api/v2/pages/${pageId}?${params}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return await response.json();
    } catch (error) {
      console.error("Failed to get page:", error);
      throw error;
    }
  }
}

module.exports = new Confluence();
