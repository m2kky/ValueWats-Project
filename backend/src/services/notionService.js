const axios = require('axios');

class NotionService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: 'https://api.notion.com/v1',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
  }

  async searchWorkspace(query) {
    const response = await this.client.post('/search', {
      query: query || '',
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    });
    return response.data;
  }

  async createPage(parent, properties, children) {
    const payload = {
      parent,
      properties
    };
    if (children && children.length > 0) {
      payload.children = children;
    }
    const response = await this.client.post('/pages', payload);
    return response.data;
  }

  async updatePage(pageId, properties) {
    const response = await this.client.patch(`/pages/${pageId}`, {
      properties
    });
    return response.data;
  }

  async archivePage(pageId) {
    const response = await this.client.patch(`/pages/${pageId}`, {
      archived: true
    });
    return response.data;
  }

  async appendBlock(blockId, children) {
    const response = await this.client.patch(`/blocks/${blockId}/children`, {
      children
    });
    return response.data;
  }
}

module.exports = NotionService;
