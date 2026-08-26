const {
  createAgentCapabilityService,
  normalizeCapabilities,
  agentCapabilityService
} = require('./agentCapabilityService');

module.exports = {
  createTerminalCapabilityService: createAgentCapabilityService,
  normalizeCapabilities,
  terminalCapabilityService: agentCapabilityService
};
