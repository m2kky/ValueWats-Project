let sequence = 0;

const nextId = (prefix) => `${prefix}-${++sequence}`;
const resetFactories = () => { sequence = 0; };
const tenant = (overrides = {}) => ({ id: nextId('tenant'), name: 'Test tenant', ...overrides });
const agent = (overrides = {}) => ({ id: nextId('agent'), tenantId: 'tenant-1', name: 'Test agent', instructions: 'Help the customer.', isActive: true, priority: 0, useHistory: true, historyLength: 10, ...overrides });
const conversation = (overrides = {}) => ({ id: nextId('conversation'), tenantId: 'tenant-1', contactNumber: '+15550000000', status: 'open', failedAttempts: 0, currentAgentId: null, ...overrides });

module.exports = { resetFactories, tenant, agent, conversation };
