const { Pinecone: PineconeClient } = require("@pinecone-database/pinecone");
const { config } = require("dotenv");
config();

/**
 * Class for interacting with Pinecone API.
 */
class Pinecone {
  constructor() {
    try {
      this.client = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY,
      });
    } catch (error) {
      console.error("Failed to initialize Pinecone client:", error);
      throw error;
    }
  }

  async getIndex(indexName) {
    try {
      return await this.client.index(indexName);
    } catch (error) {
      console.error("Failed to get Pinecone index:", error);
      throw error;
    }
  }

  async search(indexName, embedding, topK = 10) {
    try {
      const index = await this.getIndex(indexName);
      const searchResults = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
      });
      return searchResults.matches;
    } catch (error) {
      console.error("Failed to search Pinecone index:", error);
      throw error;
    }
  }
}

module.exports = new Pinecone();
