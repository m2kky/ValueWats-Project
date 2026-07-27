const { redactForLog } = require('../logging/redaction');

const PROVIDER_REFERENCE_FIELDS = ['provider', 'instanceId', 'accountId'];
const COMMENT_PAYLOAD_FIELDS = ['executionId', 'providerReference'];
const COMMENT_REFERENCE_FIELDS = ['provider', 'instanceId'];

function normalizeChannelPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw Object.assign(new Error('Channel outbox payload must be an object'), { code: 'INVALID_OUTBOX_PAYLOAD' });
  }

  const reference = {};
  for (const field of PROVIDER_REFERENCE_FIELDS) {
    const value = payload.providerReference?.[field];
    if (typeof value === 'string' && value.trim()) {
      reference[field] = field === 'provider' ? value.trim().toLowerCase() : value.trim();
    }
  }

  const pendingMessageId = String(payload.pendingMessageId || '').trim();
  if (!reference.provider || (!reference.instanceId && !reference.accountId) || !pendingMessageId) {
    throw Object.assign(
      new Error('Channel outbox requires a provider reference and pending message ID'),
      { code: 'INVALID_OUTBOX_PAYLOAD' }
    );
  }

  return { providerReference: reference, pendingMessageId };
}

function hasExactFields(value, fields) {
  return value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === fields.slice().sort().join(',');
}

function normalizeCommentReplyPayload(payload) {
  if (!hasExactFields(payload, COMMENT_PAYLOAD_FIELDS)
    || !hasExactFields(payload.providerReference, COMMENT_REFERENCE_FIELDS)) {
    throw Object.assign(
      new Error('Comment reply outbox payload must have the exact reference shape'),
      { code: 'INVALID_OUTBOX_PAYLOAD' }
    );
  }

  const executionId = String(payload.executionId || '').trim();
  const provider = String(payload.providerReference.provider || '').trim().toLowerCase();
  const instanceId = String(payload.providerReference.instanceId || '').trim();
  if (!executionId || !instanceId || !['facebook', 'instagram'].includes(provider)) {
    throw Object.assign(
      new Error('Comment reply outbox payload contains an invalid reference'),
      { code: 'INVALID_OUTBOX_PAYLOAD' }
    );
  }

  return { executionId, providerReference: { provider, instanceId } };
}

function sanitizePayload(aggregateType, payload) {
  if (aggregateType === 'channel_message') return normalizeChannelPayload(payload);
  if (aggregateType === 'comment_reply_execution') return normalizeCommentReplyPayload(payload);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw Object.assign(new Error('Outbox payload must be an object'), { code: 'INVALID_OUTBOX_PAYLOAD' });
  }
  return redactForLog(payload);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])])
  );
}

function sameOutboxIdentity(existing, data, payload) {
  return existing.commandId === (data.commandId || null)
    && existing.runId === (data.runId || null)
    && existing.aggregateType === data.aggregateType
    && existing.aggregateId === data.aggregateId
    && existing.eventType === data.eventType
    && JSON.stringify(canonicalJson(existing.payload)) === JSON.stringify(canonicalJson(payload));
}

function createOutboxService(prisma, { clock = () => new Date() } = {}) {
  if (!prisma) throw new Error('Prisma client is required');

  return {
    async createOrGet(data, { prisma: transaction } = {}) {
      const client = transaction || prisma;
      const payload = sanitizePayload(data.aggregateType, data.payload);
      try {
        return await client.outboxEvent.create({
          data: {
            tenantId: data.tenantId,
            commandId: data.commandId || null,
            runId: data.runId || null,
            aggregateType: data.aggregateType,
            aggregateId: data.aggregateId,
            eventType: data.eventType,
            idempotencyKey: data.idempotencyKey,
            payload,
            availableAt: data.availableAt || clock()
          }
        });
      } catch (error) {
        if (error?.code !== 'P2002') throw error;
        const existing = await client.outboxEvent.findUniqueOrThrow({
          where: {
            tenantId_idempotencyKey: {
              tenantId: data.tenantId,
              idempotencyKey: data.idempotencyKey
            }
          }
        });
        if (!sameOutboxIdentity(existing, data, payload)) {
          throw Object.assign(
            new Error('Outbox idempotency key already belongs to another intent'),
            { code: 'OUTBOX_IDEMPOTENCY_CONFLICT' }
          );
        }
        return existing;
      }
    }
  };
}

module.exports = {
  createOutboxService,
  normalizeChannelPayload,
  normalizeCommentReplyPayload
};
