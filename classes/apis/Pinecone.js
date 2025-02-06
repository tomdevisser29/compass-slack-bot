const { config } = require("dotenv");
const { Pinecone: PineconeClient } = require("@pinecone-database/pinecone");

config();

class Pinecone {
  constructor() {
    this.client = new PineconeClient({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }

  async getIndex(indexName) {
    return await this.client.index(indexName);
  }
}

module.exports = new Pinecone();
