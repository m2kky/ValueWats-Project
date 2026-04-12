const prisma = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

const CONFIG_TYPE = 'channel_config';

const DEFAULT_CHANNEL_CONFIG = {
  chatMenu: {
    enabled: false,
    allowUserInput: true,
    locale: 'default',
    buttons: []
  },
  privateReplies: {
    enabled: false,
    track: 'all', // all | specific
    postId: '',
    message: 'Thanks for your comment! We just sent you a private message.'
  },
  templates: {
    items: []
  }
};

const normalizeButton = (button, index) => {
  const safeType = button?.type === 'web_url' ? 'web_url' : 'postback';
  const safeTitle = String(button?.title || '').trim().slice(0, 20);

  if (!safeTitle) {
    throw new Error(`Chat menu button #${index + 1} title is required.`);
  }

  if (safeType === 'web_url') {
    const safeUrl = String(button?.url || '').trim();
    if (!safeUrl || !/^https:\/\//i.test(safeUrl)) {
      throw new Error(`Chat menu button #${index + 1} must include a valid HTTPS URL.`);
    }

    return {
      type: 'web_url',
      title: safeTitle,
      url: safeUrl,
      webview_height_ratio: button?.webview_height_ratio || 'full'
    };
  }

  const safePayload = String(button?.payload || '').trim().slice(0, 1000);
  if (!safePayload) {
    throw new Error(`Chat menu button #${index + 1} must include a payload.`);
  }

  return {
    type: 'postback',
    title: safeTitle,
    payload: safePayload
  };
};

const sanitizeTemplates = (templates) => {
  const items = Array.isArray(templates?.items) ? templates.items : [];

  return {
    items: items
      .map((item, index) => {
        const name = String(item?.name || '').trim().slice(0, 120);
        if (!name) throw new Error(`Template #${index + 1} name is required.`);

        const payload = item?.payload;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new Error(`Template "${name}" must include a valid payload object.`);
        }

        return {
          id: String(item?.id || `tpl_${Date.now()}_${index}`),
          name,
          payload,
          createdAt: item?.createdAt || new Date().toISOString()
        };
      })
      .slice(0, 100)
  };
};

const sanitizeChannelConfig = (inputConfig = {}) => {
  const chatMenuInput = inputConfig.chatMenu || {};
  const buttons = Array.isArray(chatMenuInput.buttons) ? chatMenuInput.buttons : [];

  const normalizedChatMenu = {
    enabled: Boolean(chatMenuInput.enabled),
    allowUserInput: chatMenuInput.allowUserInput !== false,
    locale: String(chatMenuInput.locale || 'default').trim() || 'default',
    buttons: buttons.map(normalizeButton).slice(0, 20)
  };

  const privateRepliesInput = inputConfig.privateReplies || {};
  const track = privateRepliesInput.track === 'specific' ? 'specific' : 'all';
  const postId = String(privateRepliesInput.postId || '').trim();

  const normalizedPrivateReplies = {
    enabled: Boolean(privateRepliesInput.enabled),
    track,
    postId: track === 'specific' ? postId : '',
    message: String(
      privateRepliesInput.message || DEFAULT_CHANNEL_CONFIG.privateReplies.message
    )
      .trim()
      .slice(0, 1000)
  };

  if (normalizedPrivateReplies.track === 'specific' && !normalizedPrivateReplies.postId) {
    throw new Error('Private Replies postId is required when track is set to specific.');
  }

  const normalizedTemplates = sanitizeTemplates(inputConfig.templates || {});

  return {
    chatMenu: normalizedChatMenu,
    privateReplies: normalizedPrivateReplies,
    templates: normalizedTemplates
  };
};

const mergeWithDefaults = (config) => ({
  ...DEFAULT_CHANNEL_CONFIG,
  ...config,
  chatMenu: {
    ...DEFAULT_CHANNEL_CONFIG.chatMenu,
    ...(config?.chatMenu || {})
  },
  privateReplies: {
    ...DEFAULT_CHANNEL_CONFIG.privateReplies,
    ...(config?.privateReplies || {})
  },
  templates: {
    ...DEFAULT_CHANNEL_CONFIG.templates,
    ...(config?.templates || {})
  }
});

const parseStoredConfig = (rawCredentials) => {
  if (!rawCredentials) return DEFAULT_CHANNEL_CONFIG;

  try {
    const decrypted = decrypt(rawCredentials);
    return mergeWithDefaults(decrypted);
  } catch (decryptError) {
    // Backward compatibility: allow non-encrypted JSON blobs if any legacy data exists.
    try {
      const parsed = JSON.parse(rawCredentials);
      return mergeWithDefaults(parsed);
    } catch (_) {
      return DEFAULT_CHANNEL_CONFIG;
    }
  }
};

const getConfigRecord = async (tenantId, instanceId) => {
  return prisma.integration.findFirst({
    where: {
      tenantId,
      type: CONFIG_TYPE,
      name: `instance:${instanceId}`
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getChannelConfig = async ({ tenantId, instanceId }) => {
  const record = await getConfigRecord(tenantId, instanceId);
  if (!record) return mergeWithDefaults(DEFAULT_CHANNEL_CONFIG);
  return parseStoredConfig(record.credentials);
};

const saveChannelConfig = async ({ tenantId, instanceId, config }) => {
  const sanitized = sanitizeChannelConfig(config);
  const encrypted = encrypt(sanitized);
  const name = `instance:${instanceId}`;

  const existing = await getConfigRecord(tenantId, instanceId);

  if (existing) {
    await prisma.integration.update({
      where: { id: existing.id },
      data: {
        credentials: encrypted,
        status: 'active',
        updatedAt: new Date()
      }
    });
  } else {
    await prisma.integration.create({
      data: {
        tenantId,
        type: CONFIG_TYPE,
        name,
        credentials: encrypted,
        status: 'active'
      }
    });
  }

  return sanitized;
};

module.exports = {
  DEFAULT_CHANNEL_CONFIG,
  sanitizeChannelConfig,
  getChannelConfig,
  saveChannelConfig
};
