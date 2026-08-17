const prismaDefault = require('../config/database');
const { getChannelConfig: getChannelConfigDefault } = require('../services/channelConfig.service');

const MATCH_MODES = new Set(['contains_any', 'contains_all', 'exact']);
const OVERRIDE_MODES = new Set(['inherit', 'disabled', 'profile']);
const AI_MODES = new Set(['rules_only', 'rules_then_ai', 'ai_only']);
const PLATFORM_BY_CHANNEL = { messenger: 'facebook', instagram: 'instagram' };

class CommentReplyError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function conflict() {
  return new CommentReplyError(409, 'CONFIG_VERSION_CONFLICT', 'Comment reply config version is stale');
}

function validation(message) {
  return new CommentReplyError(400, 'COMMENT_REPLY_VALIDATION_FAILED', message);
}

function requireVersion(expectedConfigVersion) {
  if (!Number.isInteger(expectedConfigVersion) || expectedConfigVersion < 0) {
    throw validation('expectedConfigVersion must be a non-negative integer');
  }
}

function toSafeInstance(instance) {
  if (!instance) return null;
  const { id, channelType, instanceName, phoneNumber, phoneNumberId, status } = instance;
  return { id, channelType, instanceName, phoneNumber, phoneNumberId, status };
}

function toProfile(profile) {
  if (!profile) return null;
  const {
    id, agentId, isEnabled, aiFallbackEnabled, aiMode, commentAiInstructions,
    privateReplyEnabled, privateReplyInstructions, publicAfterPrivateSuccess,
    defaultMatchMode, configVersion
  } = profile;
  return {
    id, agentId, isEnabled, aiFallbackEnabled,
    aiMode: aiMode || (aiFallbackEnabled ? 'rules_then_ai' : 'rules_only'),
    commentAiInstructions: commentAiInstructions || '',
    privateReplyEnabled: privateReplyEnabled === true,
    privateReplyInstructions: privateReplyInstructions || '',
    publicAfterPrivateSuccess: publicAfterPrivateSuccess !== false,
    defaultMatchMode, configVersion
  };
}

function toBinding(binding) {
  const { id, profileId, instanceId, provider, externalAccountId, isEnabled, permissionState, lastPermissionCheckAt } = binding;
  return { id, profileId, instanceId, provider, externalAccountId, isEnabled, permissionState, lastPermissionCheckAt, instance: toSafeInstance(binding.instance) };
}

function toVariant(variant) {
  const { id, platform, body, orderIndex, isEnabled } = variant;
  return { id, platform, body, orderIndex, isEnabled };
}

function toRule(rule) {
  const { id, name, isEnabled, priority, matchMode, keywords } = rule;
  return { id, name, isEnabled, priority, matchMode, keywords, variants: (rule.variants || []).map(toVariant) };
}

function toOverride(override) {
  const { id, bindingId, externalPostId, mode, overrideProfileId, postName, thumbnailUrl, postPublishedAt } = override;
  return { id, bindingId, externalPostId, mode, overrideProfileId, postName, thumbnailUrl, postPublishedAt };
}

function normalizeRule(input = {}, existing = {}) {
  const name = input.name === undefined ? existing.name : String(input.name).trim();
  const keywordsInput = input.keywords === undefined ? existing.keywords : input.keywords;
  const matchMode = input.matchMode === undefined ? existing.matchMode : input.matchMode;
  const priority = input.priority === undefined ? existing.priority : input.priority;
  const isEnabled = input.isEnabled === undefined ? (existing.isEnabled ?? false) : input.isEnabled;

  if (!name || name.length > 120) throw validation('name must be 1 to 120 characters');
  if (!Number.isInteger(priority) || priority < 0 || priority > 100000) throw validation('priority must be an integer from 0 to 100000');
  if (!MATCH_MODES.has(matchMode)) throw validation('matchMode must be contains_any, contains_all, or exact');
  if (!Array.isArray(keywordsInput) || keywordsInput.length < 1 || keywordsInput.length > 25) throw validation('keywords must contain 1 to 25 entries');
  const keywords = keywordsInput.map((keyword) => String(keyword).trim()).filter(Boolean);
  if (keywords.length !== keywordsInput.length || keywords.some((keyword) => keyword.length > 120)) throw validation('keywords must be non-empty strings up to 120 characters');
  if (typeof isEnabled !== 'boolean') throw validation('isEnabled must be a boolean');
  return { name, priority, matchMode, keywords, isEnabled };
}

function normalizeVariants(variants) {
  if (!Array.isArray(variants) || variants.length < 1 || variants.length > 25) throw validation('variants must contain 1 to 25 entries');
  return variants.map((variant, index) => {
    const value = typeof variant === 'string' ? { body: variant } : variant;
    if (!value || typeof value !== 'object') throw validation('variants must be strings or objects');
    const body = String(value.body || '').trim();
    if (!body || body.length > 2000) throw validation('variant body must be 1 to 2000 characters');
    if (value.platform != null && !['facebook', 'instagram'].includes(value.platform)) throw validation('variant platform must be facebook or instagram');
    if (value.isEnabled !== undefined && typeof value.isEnabled !== 'boolean') throw validation('variant isEnabled must be a boolean');
    return { platform: value.platform || null, body, isEnabled: value.isEnabled ?? true, orderIndex: index };
  });
}

function createCommentReplyService(prisma = prismaDefault, {
  getChannelConfig = getChannelConfigDefault,
  decisionService
} = {}) {
  async function findAgent(tx, tenantId, agentId) {
    const agent = await tx.aIAgent.findFirst({ where: { id: agentId, tenantId, deletedAt: null }, select: { id: true, name: true } });
    if (!agent) throw new CommentReplyError(404, 'AGENT_NOT_FOUND', 'Agent not found');
    return agent;
  }

  async function findProfile(tx, tenantId, agentId) {
    return tx.commentReplyProfile.findFirst({ where: { tenantId, agentId, deletedAt: null } });
  }

  function virtualProfile(agentId) {
    return {
      id: null,
      agentId,
      isEnabled: false,
      aiFallbackEnabled: false,
      aiMode: 'rules_only',
      commentAiInstructions: '',
      privateReplyEnabled: false,
      privateReplyInstructions: '',
      publicAfterPrivateSuccess: true,
      defaultMatchMode: 'contains_any',
      configVersion: 0
    };
  }

  async function getCompatibleChannelConfig(tenantId, instanceId) {
    const config = await getChannelConfig({ tenantId, instanceId });
    if (config?.privateReplies?.enabled) {
      throw new CommentReplyError(409, 'PRIVATE_REPLIES_ENABLED', 'Disable private DM replies before enabling comment replies');
    }
    return config;
  }

  async function mutate({ tenantId, agentId, expectedConfigVersion, operation }) {
    requireVersion(expectedConfigVersion);
    try {
      return await prisma.$transaction(async (tx) => {
        await findAgent(tx, tenantId, agentId);
        const profile = await findProfile(tx, tenantId, agentId);
        if (!profile) throw conflict();
        if (profile.configVersion !== expectedConfigVersion) throw conflict();
        const result = await operation(tx, profile);
        const updated = await tx.commentReplyProfile.updateMany({
          where: { id: profile.id, tenantId, deletedAt: null, configVersion: expectedConfigVersion },
          data: { configVersion: { increment: 1 } }
        });
        if (updated.count !== 1) throw conflict();
        return { result, configVersion: expectedConfigVersion + 1 };
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error?.code === 'P2034') throw conflict();
      throw error;
    }
  }

  async function getWorkspace({ tenantId, agentId }) {
    return prisma.$transaction(async (tx) => {
      const agent = await findAgent(tx, tenantId, agentId);
      const profile = await findProfile(tx, tenantId, agentId);
      if (!profile) {
        const virtual = virtualProfile(agentId);
        return {
          agent: { id: agent.id, name: agent.name }, profile: toProfile(virtual), bindings: [], rules: [], overrides: [], configVersion: 0
        };
      }
      const bindings = await tx.commentChannelBinding.findMany({ where: { tenantId, profileId: profile.id }, include: { instance: true }, orderBy: { createdAt: 'asc' } });
      const rules = await tx.commentReplyRule.findMany({ where: { tenantId, profileId: profile.id, deletedAt: null }, include: { variants: { where: { tenantId, deletedAt: null }, orderBy: { orderIndex: 'asc' } } }, orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] });
      const overrides = await tx.commentPostOverride.findMany({ where: { tenantId, binding: { profileId: profile.id } }, orderBy: { createdAt: 'asc' } });
      return {
        agent: { id: agent.id, name: agent.name }, profile: toProfile(profile), bindings: bindings.map(toBinding), rules: rules.map(toRule), overrides: overrides.map(toOverride),
        configVersion: profile.configVersion
      };
    });
  }

  async function updateProfile({
    tenantId, agentId, expectedConfigVersion, isEnabled, aiFallbackEnabled, aiMode,
    commentAiInstructions, privateReplyEnabled, privateReplyInstructions,
    publicAfterPrivateSuccess, defaultMatchMode
  }) {
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') throw validation('isEnabled must be a boolean');
    if (aiFallbackEnabled !== undefined && typeof aiFallbackEnabled !== 'boolean') throw validation('aiFallbackEnabled must be a boolean');
    if (aiMode !== undefined && !AI_MODES.has(aiMode)) throw validation('aiMode must be rules_only, rules_then_ai, or ai_only');
    if (privateReplyEnabled !== undefined && typeof privateReplyEnabled !== 'boolean') throw validation('privateReplyEnabled must be a boolean');
    if (publicAfterPrivateSuccess !== undefined && typeof publicAfterPrivateSuccess !== 'boolean') throw validation('publicAfterPrivateSuccess must be a boolean');
    for (const [name, value] of [['commentAiInstructions', commentAiInstructions], ['privateReplyInstructions', privateReplyInstructions]]) {
      if (value !== undefined && (typeof value !== 'string' || value.length > 20_000)) throw validation(`${name} must be a string up to 20000 characters`);
    }
    if (defaultMatchMode !== undefined && !MATCH_MODES.has(defaultMatchMode)) throw validation('defaultMatchMode must be contains_any, contains_all, or exact');
    requireVersion(expectedConfigVersion);
    const data = {};
    if (isEnabled !== undefined) data.isEnabled = isEnabled;
    if (aiFallbackEnabled !== undefined) {
      data.aiFallbackEnabled = aiFallbackEnabled;
      if (aiMode === undefined) data.aiMode = aiFallbackEnabled ? 'rules_then_ai' : 'rules_only';
    }
    if (aiMode !== undefined) {
      data.aiMode = aiMode;
      data.aiFallbackEnabled = aiMode === 'rules_then_ai';
    }
    if (commentAiInstructions !== undefined) data.commentAiInstructions = commentAiInstructions.trim();
    if (privateReplyEnabled !== undefined) data.privateReplyEnabled = privateReplyEnabled;
    if (privateReplyInstructions !== undefined) data.privateReplyInstructions = privateReplyInstructions.trim();
    if (publicAfterPrivateSuccess !== undefined) data.publicAfterPrivateSuccess = publicAfterPrivateSuccess;
    if (defaultMatchMode !== undefined) data.defaultMatchMode = defaultMatchMode;
    try {
      return await prisma.$transaction(async (tx) => {
        await findAgent(tx, tenantId, agentId);
        const profile = await findProfile(tx, tenantId, agentId);
        if (!profile) {
          if (expectedConfigVersion !== 0) throw conflict();
          const created = await tx.commentReplyProfile.create({ data: { tenantId, agentId, ...data } });
          return { profile: toProfile(created), configVersion: created.configVersion };
        }
        if (profile.configVersion !== expectedConfigVersion) throw conflict();
        if (isEnabled === true && !profile.isEnabled) {
          const bindings = await tx.commentChannelBinding.findMany({ where: { tenantId, profileId: profile.id } });
          await Promise.all(bindings.map((binding) => getCompatibleChannelConfig(tenantId, binding.instanceId)));
        }
        const updated = await tx.commentReplyProfile.updateMany({
          where: { id: profile.id, tenantId, deletedAt: null, configVersion: expectedConfigVersion },
          data: { ...data, configVersion: { increment: 1 } }
        });
        if (updated.count !== 1) throw conflict();
        return { profile: toProfile({ ...profile, ...data, configVersion: expectedConfigVersion + 1 }), configVersion: expectedConfigVersion + 1 };
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error?.code === 'P2034' || error?.code === 'P2002') throw conflict();
      throw error;
    }
  }

  async function bindInstance({ tenantId, agentId, expectedConfigVersion, instanceId, isEnabled = false, provider }) {
    if (typeof isEnabled !== 'boolean') throw validation('isEnabled must be a boolean');
    const mutation = await mutate({ tenantId, agentId, expectedConfigVersion, operation: async (tx, profile) => {
      const instance = await tx.instance.findFirst({ where: { id: instanceId, tenantId } });
      const derivedProvider = PLATFORM_BY_CHANNEL[instance?.channelType];
      if (!instance || !derivedProvider || !instance.phoneNumberId || (provider !== undefined && provider !== derivedProvider)) {
        throw new CommentReplyError(400, 'COMMENT_REPLY_INVALID_BINDING', 'Bind a Messenger or Instagram instance with a provider identity');
      }
      const channelConfig = await getCompatibleChannelConfig(tenantId, instance.id);
      const existing = await tx.commentChannelBinding.findFirst({ where: { tenantId, instanceId: instance.id } });
      if (existing) throw new CommentReplyError(409, 'COMMENT_REPLY_BINDING_CONFLICT', 'Instance already has a comment reply binding');
      try {
        return await tx.commentChannelBinding.create({
          data: {
            tenantId,
            profileId: profile.id,
            instanceId: instance.id,
            provider: derivedProvider,
            externalAccountId: String(instance.phoneNumberId),
            isEnabled,
            permissionState: channelConfig?.commentReplies?.permissionsReady ? 'ready' : 'reconnect_required',
            lastPermissionCheckAt: channelConfig?.commentReplies?.checkedAt ? new Date(channelConfig.commentReplies.checkedAt) : null
          },
          include: { instance: true }
        });
      } catch (error) {
        if (error?.code === 'P2002') throw new CommentReplyError(409, 'COMMENT_REPLY_BINDING_CONFLICT', 'Provider account is already bound');
        throw error;
      }
    } });
    return { binding: toBinding(mutation.result), configVersion: mutation.configVersion };
  }

  async function unbindInstance({ tenantId, agentId, bindingId, expectedConfigVersion }) {
    const mutation = await mutate({ tenantId, agentId, expectedConfigVersion, operation: async (tx, profile) => {
      const deleted = await tx.commentChannelBinding.deleteMany({ where: { id: bindingId, tenantId, profileId: profile.id } });
      if (deleted.count !== 1) throw new CommentReplyError(404, 'COMMENT_REPLY_BINDING_NOT_FOUND', 'Comment reply binding not found');
      return { id: bindingId };
    } });
    return { ...mutation.result, configVersion: mutation.configVersion };
  }

  async function listRules({ tenantId, agentId }) {
    const workspace = await getWorkspace({ tenantId, agentId });
    return { rules: workspace.rules, configVersion: workspace.configVersion };
  }

  async function saveRule({ tenantId, agentId, ruleId, expectedConfigVersion, ...input }) {
    const variants = normalizeVariants(input.variants);
    const mutation = await mutate({ tenantId, agentId, expectedConfigVersion, operation: async (tx, profile) => {
      let existing = null;
      if (ruleId) {
        existing = await tx.commentReplyRule.findFirst({ where: { id: ruleId, tenantId, profileId: profile.id, deletedAt: null } });
        if (!existing) throw new CommentReplyError(404, 'COMMENT_REPLY_RULE_NOT_FOUND', 'Comment reply rule not found');
      }
      const data = normalizeRule(input, existing || { matchMode: profile.defaultMatchMode, isEnabled: false });
      let rule;
      if (existing) {
        await tx.commentReplyRule.updateMany({ where: { id: existing.id, tenantId, profileId: profile.id, deletedAt: null }, data });
        rule = { ...existing, ...data };
      } else {
        rule = await tx.commentReplyRule.create({ data: { tenantId, profileId: profile.id, ...data }, include: { variants: true } });
      }
      await tx.commentReplyVariant.updateMany({ where: { tenantId, ruleId: rule.id, deletedAt: null }, data: { deletedAt: new Date() } });
      await tx.commentReplyVariant.createMany({ data: variants.map((variant) => ({ tenantId, ruleId: rule.id, ...variant })) });
      const saved = await tx.commentReplyRule.findFirst({
        where: { id: rule.id, tenantId, profileId: profile.id, deletedAt: null },
        include: { variants: { where: { tenantId, deletedAt: null }, orderBy: { orderIndex: 'asc' } } }
      });
      return toRule(saved);
    } });
    return { rule: mutation.result, configVersion: mutation.configVersion };
  }

  async function deleteRule({ tenantId, agentId, ruleId, expectedConfigVersion }) {
    const mutation = await mutate({ tenantId, agentId, expectedConfigVersion, operation: async (tx, profile) => {
      const deleted = await tx.commentReplyRule.updateMany({ where: { id: ruleId, tenantId, profileId: profile.id, deletedAt: null }, data: { deletedAt: new Date() } });
      if (deleted.count !== 1) throw new CommentReplyError(404, 'COMMENT_REPLY_RULE_NOT_FOUND', 'Comment reply rule not found');
      return { id: ruleId };
    } });
    return { ...mutation.result, configVersion: mutation.configVersion };
  }

  async function listOverrides({ tenantId, agentId }) {
    const workspace = await getWorkspace({ tenantId, agentId });
    return { overrides: workspace.overrides, configVersion: workspace.configVersion };
  }

  async function saveOverride({ tenantId, agentId, expectedConfigVersion, bindingId, externalPostId, mode = 'inherit', overrideProfileId = null, postName, thumbnailUrl, postPublishedAt }) {
    if (!bindingId || !String(externalPostId || '').trim() || !OVERRIDE_MODES.has(mode)) throw validation('bindingId, externalPostId, and a valid mode are required');
    if (mode === 'profile' && !overrideProfileId) throw validation('overrideProfileId is required for profile mode');
    const mutation = await mutate({ tenantId, agentId, expectedConfigVersion, operation: async (tx, profile) => {
      const binding = await tx.commentChannelBinding.findFirst({ where: { id: bindingId, tenantId, profileId: profile.id } });
      if (!binding) throw new CommentReplyError(404, 'COMMENT_REPLY_BINDING_NOT_FOUND', 'Comment reply binding not found');
      if (overrideProfileId) {
        const overrideProfile = await tx.commentReplyProfile.findFirst({ where: { id: overrideProfileId, tenantId, deletedAt: null } });
        if (!overrideProfile) throw new CommentReplyError(404, 'COMMENT_REPLY_PROFILE_NOT_FOUND', 'Override profile not found');
      }
      const data = { mode, overrideProfileId: mode === 'profile' ? overrideProfileId : null, postName: postName == null ? null : String(postName).trim().slice(0, 240), thumbnailUrl: thumbnailUrl == null ? null : String(thumbnailUrl).trim().slice(0, 2000), postPublishedAt: postPublishedAt ? new Date(postPublishedAt) : null };
      return tx.commentPostOverride.upsert({
        where: { tenantId_bindingId_externalPostId: { tenantId, bindingId, externalPostId: String(externalPostId).trim() } },
        create: { tenantId, bindingId, externalPostId: String(externalPostId).trim(), ...data }, update: data
      });
    } });
    return { override: toOverride(mutation.result), configVersion: mutation.configVersion };
  }

  async function deleteOverride({ tenantId, agentId, overrideId, expectedConfigVersion }) {
    const mutation = await mutate({ tenantId, agentId, expectedConfigVersion, operation: async (tx, profile) => {
      const deleted = await tx.commentPostOverride.deleteMany({ where: { id: overrideId, tenantId, binding: { profileId: profile.id } } });
      if (deleted.count !== 1) throw new CommentReplyError(404, 'COMMENT_REPLY_OVERRIDE_NOT_FOUND', 'Comment reply override not found');
      return { id: overrideId };
    } });
    return { ...mutation.result, configVersion: mutation.configVersion };
  }

  async function getInstanceBinding({ tenantId, instanceId }) {
    const binding = await prisma.commentChannelBinding.findFirst({ where: { tenantId, instanceId }, include: { instance: true, profile: { include: { agent: { select: { id: true, name: true } } } } } });
    if (!binding) throw new CommentReplyError(404, 'COMMENT_REPLY_BINDING_NOT_FOUND', 'Comment reply binding not found');
    return { binding: toBinding(binding), profile: toProfile(binding.profile), agent: binding.profile?.agent ? { id: binding.profile.agent.id, name: binding.profile.agent.name } : null };
  }

  async function preview({ tenantId, agentId, platform, commentText, instanceId, postName }) {
    if (!decisionService?.decide) throw new CommentReplyError(503, 'COMMENT_AI_UNAVAILABLE', 'Comment AI preview is unavailable');
    if (!['facebook', 'instagram'].includes(platform) || !String(commentText || '').trim()) {
      throw validation('platform and commentText are required');
    }
    const agent = await prisma.aIAgent.findFirst({
      where: { id: agentId, tenantId, deletedAt: null, isActive: true, isPublished: true }
    });
    if (!agent) throw new CommentReplyError(404, 'AGENT_NOT_FOUND', 'Agent not found');
    const profile = await findProfile(prisma, tenantId, agentId);
    if (!profile) throw new CommentReplyError(409, 'COMMENT_REPLY_PROFILE_REQUIRED', 'Save Comment AI settings before previewing');
    const binding = await prisma.commentChannelBinding.findFirst({
      where: { tenantId, profileId: profile.id, ...(instanceId ? { instanceId } : {}) },
      include: { instance: true }
    });
    if (!binding) throw new CommentReplyError(404, 'COMMENT_REPLY_BINDING_NOT_FOUND', 'Connect an account before previewing');
    const decision = await decisionService.decide({
      execution: { tenantId, platform, commentText: String(commentText).slice(0, 10_000), postName: postName || null },
      agent,
      profile,
      binding,
      post: { name: postName || null }
    });
    return {
      decision,
      route: 'ai',
      agent: { id: agent.id, name: agent.name },
      account: toSafeInstance(binding.instance)
    };
  }

  return { getWorkspace, updateProfile, bindInstance, unbindInstance, listRules, saveRule, deleteRule, listOverrides, saveOverride, deleteOverride, getInstanceBinding, preview };
}

module.exports = { CommentReplyError, createCommentReplyService };
