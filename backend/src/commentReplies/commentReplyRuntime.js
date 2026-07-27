const {
  getVariantPool,
  matchCommentRule,
  normalizeCommentText,
  renderCommentTemplate
} = require('./commentReplyRules');

const MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REPLY_LENGTH = {
  facebook: 8_000,
  instagram: 2_200
};
const MAX_ROTATION_RETRIES = 4;

class CommentReplyRuntimeError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'CommentReplyRuntimeError';
    this.code = code;
    Object.assign(this, options);
  }
}

function bounded(value, limit) {
  if (value == null) return null;
  return String(value).slice(0, limit);
}

function staleLease() {
  return new CommentReplyRuntimeError('STALE_LEASE', 'Comment reply execution lease is stale');
}

function assertProcessingLease(execution, executionId, leaseToken) {
  if (!execution
    || execution.id !== executionId
    || execution.status !== 'processing'
    || execution.leaseToken !== leaseToken) {
    throw staleLease();
  }
}

function validAgent(agent, tenantId) {
  return agent
    && agent.tenantId === tenantId
    && agent.isActive === true
    && agent.isPublished === true
    && !agent.deletedAt;
}

function normalizeRenderedReply(template, variables, platform) {
  const rendered = renderCommentTemplate(template, variables)
    .replace(/\s+/gu, ' ')
    .trim();
  if (!rendered) {
    throw new CommentReplyRuntimeError('EMPTY_PUBLIC_REPLY', 'Rendered public reply is empty');
  }
  if (rendered.length > MAX_REPLY_LENGTH[platform]) {
    throw new CommentReplyRuntimeError('PUBLIC_REPLY_TOO_LONG', 'Rendered public reply exceeds the provider limit');
  }
  if (/\{\{[\s\S]*?\}\}/u.test(rendered) || /\[(?:ACTION|COMMAND)\s*:/iu.test(rendered)) {
    throw new CommentReplyRuntimeError('INVALID_PUBLIC_REPLY', 'Rendered public reply contains an unsafe marker');
  }
  return rendered;
}

function createCommentReplyRuntime({
  prisma,
  outboxService,
  clock = () => new Date(),
  maxEventAgeMs = MAX_EVENT_AGE_MS
}) {
  if (!prisma) throw new Error('Prisma client is required');
  if (!outboxService?.createOrGet) throw new Error('Outbox service is required');

  async function findBinding(client, provider, externalAccountId) {
    return client.commentChannelBinding.findUnique({
      where: {
        provider_externalAccountId: { provider, externalAccountId }
      },
      include: {
        instance: true,
        profile: { include: { agent: true } }
      }
    });
  }

  async function ingest(event) {
    const provider = String(event?.provider || '').trim().toLowerCase();
    const externalAccountId = bounded(event?.externalAccountId, 255)?.trim();
    const externalCommentId = bounded(event?.externalCommentId, 512)?.trim();
    const externalPostId = bounded(event?.externalPostId, 512)?.trim();
    if (!['facebook', 'instagram'].includes(provider)
      || !externalAccountId
      || !externalCommentId
      || !externalPostId) {
      throw new CommentReplyRuntimeError('INVALID_COMMENT_EVENT', 'Comment event identity is invalid');
    }

    const binding = await findBinding(prisma, provider, externalAccountId);
    const profile = binding?.profile;
    const agent = profile?.agent;
    if (!binding
      || !binding.instance
      || binding.provider !== provider
      || binding.externalAccountId !== externalAccountId
      || binding.tenantId !== binding.instance.tenantId
      || binding.tenantId !== profile?.tenantId
      || binding.tenantId !== agent?.tenantId) {
      throw new CommentReplyRuntimeError('COMMENT_BINDING_NOT_FOUND', 'Active provider binding was not found');
    }

    const identity = {
      platform: provider,
      providerAccountId: externalAccountId,
      externalCommentId
    };
    try {
      return await prisma.commentReplyExecution.create({
        data: {
          tenantId: binding.tenantId,
          instanceId: binding.instanceId,
          bindingId: binding.id,
          profileId: profile.id,
          agentId: agent.id,
          agentNameSnapshot: bounded(agent.name, 255),
          ...identity,
          externalPostId,
          parentCommentId: bounded(event.parentCommentId, 512),
          commentText: bounded(event.text, 10_000),
          commenterExternalId: bounded(event.commenterId, 255),
          commenterName: bounded(event.commenterName, 255),
          postName: bounded(event.postName, 500),
          eventCreatedAt: event.createdAt instanceof Date && !Number.isNaN(event.createdAt.getTime())
            ? event.createdAt
            : null,
          isSelf: event.isSelf === true,
          profileConfigVersion: profile.configVersion,
          agentConfigVersion: agent.configVersion,
          availableAt: clock()
        }
      });
    } catch (error) {
      if (error?.code !== 'P2002') throw error;
      return prisma.commentReplyExecution.findUnique({
        where: {
          platform_providerAccountId_externalCommentId: identity
        }
      });
    }
  }

  async function loadBindingGraph(client, execution) {
    return client.commentChannelBinding.findFirst({
      where: {
        id: execution.bindingId,
        tenantId: execution.tenantId
      },
      include: {
        instance: true,
        profile: { include: { agent: true } }
      }
    });
  }

  async function resolveConfiguration(client, execution) {
    const binding = await loadBindingGraph(client, execution);
    if (!binding
      || binding.provider !== execution.platform
      || binding.externalAccountId !== execution.providerAccountId
      || binding.instanceId !== execution.instanceId
      || binding.tenantId !== execution.tenantId
      || binding.instance?.tenantId !== execution.tenantId) {
      return { skipReason: 'binding_missing' };
    }
    if (!binding.isEnabled) return { skipReason: 'binding_disabled' };
    if (binding.permissionState !== 'ready') return { skipReason: 'binding_not_ready' };

    let profile = binding.profile;
    let agent = profile?.agent;
    if (!profile || profile.tenantId !== execution.tenantId || profile.deletedAt) {
      return { skipReason: 'profile_missing' };
    }
    if (!profile.isEnabled) return { skipReason: 'profile_disabled' };
    if (!validAgent(agent, execution.tenantId)) return { skipReason: 'agent_inactive' };

    const override = await client.commentPostOverride.findFirst({
      where: {
        tenantId: execution.tenantId,
        bindingId: binding.id,
        externalPostId: execution.externalPostId
      },
      include: {
        overrideProfile: { include: { agent: true } }
      }
    });
    if (override?.mode === 'disabled') return { skipReason: 'post_disabled' };
    if (override?.overrideProfileId) {
      profile = override.overrideProfile;
      agent = profile?.agent;
      if (!profile
        || profile.id !== override.overrideProfileId
        || profile.tenantId !== execution.tenantId
        || profile.deletedAt
        || !profile.isEnabled
        || !validAgent(agent, execution.tenantId)) {
        return { skipReason: 'override_profile_invalid' };
      }
    }

    const mode = override?.mode && override.mode !== 'inherit'
      ? override.mode
      : 'rules_then_ai';
    if (mode === 'ai_only') return { skipReason: 'fixed_rules_disabled' };
    if (!['rules_then_ai', 'rules_only'].includes(mode)) {
      return { skipReason: 'override_mode_invalid' };
    }
    return { agent, binding, mode, override, profile };
  }

  async function fencedUpdate(client, executionId, leaseToken, data) {
    const result = await client.commentReplyExecution.updateMany({
      where: { id: executionId, status: 'processing', leaseToken },
      data
    });
    if (result.count !== 1) throw staleLease();
  }

  async function skip(execution, leaseToken, skipReason, details = {}) {
    await fencedUpdate(prisma, execution.id, leaseToken, {
      ...details,
      status: 'skipped',
      skipReason,
      completedAt: clock(),
      leaseExpiresAt: null,
      leaseToken: null,
      errorCode: null,
      errorMessage: null
    });
    return prisma.commentReplyExecution.findUnique({ where: { id: execution.id } });
  }

  async function requeue(executionId, leaseToken) {
    await fencedUpdate(prisma, executionId, leaseToken, {
      status: 'received',
      availableAt: clock(),
      leaseExpiresAt: null,
      leaseToken: null,
      errorCode: 'CONFIGURATION_CHANGED',
      errorMessage: 'Configuration changed before reply finalization'
    });
    return prisma.commentReplyExecution.findUnique({ where: { id: executionId } });
  }

  async function finalizeRule(execution, leaseToken, selected) {
    for (let attempt = 0; attempt < MAX_ROTATION_RETRIES; attempt += 1) {
      try {
        return await prisma.$transaction(async (tx) => {
          const fenced = await tx.commentReplyExecution.findUnique({ where: { id: execution.id } });
          assertProcessingLease(fenced, execution.id, leaseToken);

          const current = await resolveConfiguration(tx, fenced);
          if (current.skipReason
            || current.profile.id !== selected.profile.id
            || current.agent.id !== selected.agent.id
            || current.profile.configVersion !== selected.profile.configVersion
            || current.agent.configVersion !== selected.agent.configVersion) {
            throw new CommentReplyRuntimeError(
              'CONFIGURATION_CHANGED',
              'Configuration changed before reply finalization'
            );
          }

          const rule = await tx.commentReplyRule.findFirst({
            where: {
              id: selected.rule.id,
              tenantId: fenced.tenantId,
              profileId: current.profile.id,
              isEnabled: true,
              deletedAt: null
            },
            include: { variants: true }
          });
          if (!rule || matchCommentRule({ text: fenced.commentText, rules: [rule] })?.id !== rule.id) {
            throw new CommentReplyRuntimeError(
              'CONFIGURATION_CHANGED',
              'Matched rule changed before reply finalization'
            );
          }

          const { pool, cursorField } = getVariantPool({
            variants: rule.variants,
            platform: fenced.platform
          });
          if (!pool.length) {
            throw new CommentReplyRuntimeError('RULE_HAS_NO_VARIANTS', 'Matched rule has no usable variants');
          }
          const cursor = Number(rule[cursorField] || 0);
          const variant = pool[((cursor % pool.length) + pool.length) % pool.length];
          const advanced = await tx.commentReplyRule.updateMany({
            where: {
              id: rule.id,
              tenantId: fenced.tenantId,
              profileId: current.profile.id,
              isEnabled: true,
              deletedAt: null,
              [cursorField]: cursor
            },
            data: { [cursorField]: { increment: 1 } }
          });
          if (advanced.count !== 1) {
            throw new CommentReplyRuntimeError('ROTATION_CONFLICT', 'Reply variant cursor changed');
          }

          const renderedReply = normalizeRenderedReply(variant.body, {
            customer_name: fenced.commenterName,
            page_name: current.binding.instance?.instanceName,
            post_name: current.override?.postName || fenced.postName,
            platform: fenced.platform
          }, fenced.platform);
          const outboxEvent = await outboxService.createOrGet({
            tenantId: fenced.tenantId,
            aggregateType: 'comment_reply_execution',
            aggregateId: fenced.id,
            eventType: 'comment_reply.publish_requested',
            idempotencyKey: `comment-reply:${fenced.id}:publish`,
            payload: {
              executionId: fenced.id,
              providerReference: {
                provider: fenced.platform,
                instanceId: current.binding.instanceId
              }
            }
          }, { prisma: tx });

          await fencedUpdate(tx, fenced.id, leaseToken, {
            profileId: current.profile.id,
            agentId: current.agent.id,
            agentNameSnapshot: bounded(current.agent.name, 255),
            profileConfigVersion: current.profile.configVersion,
            agentConfigVersion: current.agent.configVersion,
            routeSource: 'rule',
            ruleId: rule.id,
            ruleNameSnapshot: bounded(rule.name, 255),
            variantId: variant.id,
            renderedReply,
            status: 'ready',
            outboxEventId: outboxEvent.id,
            completedAt: clock(),
            leaseExpiresAt: null,
            leaseToken: null,
            skipReason: null,
            errorCode: null,
            errorMessage: null
          });
          return tx.commentReplyExecution.findUnique({ where: { id: fenced.id } });
        });
      } catch (error) {
        if (error?.code === 'ROTATION_CONFLICT' && attempt + 1 < MAX_ROTATION_RETRIES) continue;
        throw error;
      }
    }
    throw new CommentReplyRuntimeError('ROTATION_CONFLICT', 'Reply variant cursor remained contended');
  }

  async function process(executionId, leaseToken) {
    const execution = await prisma.commentReplyExecution.findUnique({ where: { id: executionId } });
    assertProcessingLease(execution, executionId, leaseToken);

    if (execution.isSelf) return skip(execution, leaseToken, 'self_comment');
    if (!normalizeCommentText(execution.commentText)) return skip(execution, leaseToken, 'missing_text');
    if (execution.eventCreatedAt
      && clock().getTime() - new Date(execution.eventCreatedAt).getTime() > maxEventAgeMs) {
      return skip(execution, leaseToken, 'event_too_old');
    }

    const resolved = await resolveConfiguration(prisma, execution);
    if (resolved.skipReason) return skip(execution, leaseToken, resolved.skipReason);

    const rules = await prisma.commentReplyRule.findMany({
      where: {
        tenantId: execution.tenantId,
        profileId: resolved.profile.id,
        isEnabled: true,
        deletedAt: null
      },
      include: { variants: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
    });
    const rule = matchCommentRule({ text: execution.commentText, rules });
    if (!rule) {
      return skip(execution, leaseToken, 'no_rule_match', {
        profileId: resolved.profile.id,
        agentId: resolved.agent.id,
        profileConfigVersion: resolved.profile.configVersion,
        agentConfigVersion: resolved.agent.configVersion
      });
    }

    try {
      return await finalizeRule(execution, leaseToken, { ...resolved, rule });
    } catch (error) {
      if (error?.code === 'CONFIGURATION_CHANGED') return requeue(execution.id, leaseToken);
      throw error;
    }
  }

  return {
    complete: process,
    ingest,
    process
  };
}

module.exports = {
  CommentReplyRuntimeError,
  createCommentReplyRuntime
};
