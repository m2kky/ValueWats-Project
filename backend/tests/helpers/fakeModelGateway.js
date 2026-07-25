class FakeModelGateway {
  constructor(response = { content: 'Test response' }) {
    this.response = response;
    this.calls = [];
  }

  async chat(request) {
    this.calls.push(request);
    return this.response;
  }

  async close() {}
}

module.exports = { FakeModelGateway };
