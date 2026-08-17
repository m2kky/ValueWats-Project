const axios = require('axios');
const { decryptMetaToken } = require('../meta/metaTokenCrypto');
const { sanitizeError } = require('../logging/redaction');

const META_API_VERSION = process.env.META_API_VERSION || 'v20.0';
const FB_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function publicReplyError(code, message, options = {}) {
  return Object.assign(new Error(message), {
    code,
    dispatchOutcome: 'before_request',
    outcomeUnknown: false,
    retryable: false,
    ...options
  });
}

function classifyPublicReplyError(error) {
  const status = Number(error?.response?.status || 0);
  if (status) {
    return publicReplyError(
      status === 429 ? 'META_RATE_LIMITED' : 'META_PUBLIC_REPLY_REJECTED',
      status === 429 ? 'Meta rate limited the public reply' : 'Meta rejected the public reply',
      {
        dispatchOutcome: 'response_received',
        retryable: status === 429 || status >= 500,
        providerStatus: status
      }
    );
  }
  if (error?.requestTransmitted === false) {
    return publicReplyError(
      'META_PUBLIC_REPLY_NOT_SENT',
      'Meta public reply request was not transmitted',
      { retryable: true }
    );
  }
  return publicReplyError(
    'META_PUBLIC_REPLY_OUTCOME_AMBIGUOUS',
    'Meta public reply outcome is ambiguous',
    {
      dispatchOutcome: 'outcome_ambiguous',
      outcomeUnknown: true
    }
  );
}

function classifyPrivateReplyError(error) {
  const status = Number(error?.response?.status || 0);
  if (status) {
    return publicReplyError(
      status === 429 ? 'META_RATE_LIMITED' : 'META_PRIVATE_REPLY_REJECTED',
      status === 429 ? 'Meta rate limited the private reply' : 'Meta rejected the private reply',
      {
        dispatchOutcome: 'response_received',
        retryable: status === 429 || status >= 500,
        providerStatus: status
      }
    );
  }
  if (error?.requestTransmitted === false) {
    return publicReplyError('META_PRIVATE_REPLY_NOT_SENT', 'Meta private reply request was not transmitted', { retryable: true });
  }
  return publicReplyError('META_PRIVATE_REPLY_OUTCOME_AMBIGUOUS', 'Meta private reply outcome is ambiguous', {
    dispatchOutcome: 'outcome_ambiguous', outcomeUnknown: true
  });
}

class MetaApi {
  getAccessToken(instance) {
    return decryptMetaToken(instance.accessToken);
  }

  // Common headers builder (Bearer token auth — used by WhatsApp + Instagram)
  getHeaders(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // --- WHATSAPP CLOUD API ---
  // Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
  // Endpoint: POST /{phoneNumberId}/messages (Bearer token)
  async sendMessage(instance, to, text) {
    const res = await axios.post(`${FB_BASE}/${instance.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    }, { headers: this.getHeaders(this.getAccessToken(instance)) });
    console.log(`[MetaApi:WhatsApp] Sent to ${to}:`, res.data);
    return res.data;
  }

  async sendMedia(instance, to, mediaUrl, mediaType, caption = '') {
    const typeMap = { image: 'image', video: 'video', audio: 'audio', document: 'document' };
    const type = typeMap[mediaType] || 'document';
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type,
      [type]: { link: mediaUrl, ...(caption && type !== 'audio' ? { caption } : {}) }
    };
    const res = await axios.post(`${FB_BASE}/${instance.phoneNumberId}/messages`, payload, { headers: this.getHeaders(this.getAccessToken(instance)) });
    console.log(`[MetaApi:WhatsApp] Sent media to ${to}:`, res.data);
    return res.data;
  }

  // --- MESSENGER SEND API ---
  // Docs: https://developers.facebook.com/docs/messenger-platform/reference/send-api/
  // Endpoint: POST graph.facebook.com/{PAGE_ID}/messages?access_token=TOKEN
  // - messaging_type is REQUIRED
  // - recipient.id = PSID (Page-Scoped ID)
  async sendMessengerMessage(instance, recipientId, text, mediaUrl = null, messageType = 'text') {
    const payload = {
      messaging_type: 'RESPONSE',
      recipient: { id: recipientId },
      message: {}
    };

    if (mediaUrl && messageType !== 'text') {
      const typeMap = { image: 'image', video: 'video', audio: 'audio', document: 'file' };
      const type = typeMap[messageType] || 'file';
      payload.message.attachment = {
        type,
        payload: { url: mediaUrl, is_reusable: true }
      };
    } else {
      payload.message.text = text;
    }

    const res = await axios.post(`${FB_BASE}/${instance.phoneNumberId}/messages`, payload, {
      params: { access_token: this.getAccessToken(instance) },
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`[MetaApi:Messenger] Sent to ${recipientId}:`, res.data);
    return res.data;
  }

  async postToMessengerPage(instance, payload) {
    const res = await axios.post(`${FB_BASE}/${instance.phoneNumberId}/messages`, payload, {
      params: { access_token: this.getAccessToken(instance) },
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  }

  async sendMessengerTemplate(instance, recipientId, templatePayload) {
    const payload = {
      messaging_type: 'RESPONSE',
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: templatePayload
        }
      }
    };

    const data = await this.postToMessengerPage(instance, payload);
    console.log(`[MetaApi:Messenger] Template sent to ${recipientId}:`, data);
    return data;
  }

  async sendMessengerPrivateReply(instance, { postId, commentId, text }) {
    const recipient = commentId ? { comment_id: commentId } : { post_id: postId };

    const payload = {
      messaging_type: 'RESPONSE',
      recipient,
      message: {
        text
      }
    };

    try {
      return await this.postToMessengerPage(instance, payload);
    } catch (error) {
      throw classifyPrivateReplyError(error);
    }
  }

  async setMessengerPersistentMenu(instance, { locale = 'default', allowUserInput = true, buttons = [] }) {
    const payload = {
      persistent_menu: [
        {
          locale,
          composer_input_disabled: !allowUserInput,
          call_to_actions: buttons
        }
      ]
    };

    const res = await axios.post(`${FB_BASE}/me/messenger_profile`, payload, {
      params: { access_token: this.getAccessToken(instance) },
      headers: { 'Content-Type': 'application/json' }
    });

    return res.data;
  }

  async clearMessengerPersistentMenu(instance) {
    const res = await axios.delete(`${FB_BASE}/me/messenger_profile`, {
      params: { access_token: this.getAccessToken(instance) },
      headers: { 'Content-Type': 'application/json' },
      data: { fields: ['persistent_menu'] }
    });

    return res.data;
  }

  // --- INSTAGRAM MESSAGING API ---
  // Docs: https://developers.facebook.com/docs/messenger-platform/instagram/features/send-message
  // Endpoint: POST graph.facebook.com/{version}/me/messages?access_token={PAGE_ACCESS_TOKEN}
  // - recipient.id = IGSID (Instagram-Scoped ID)
  // - Uses the Page Access Token tied to the connected Instagram Professional account
  async sendInstagramMessage(instance, recipientId, text, mediaUrl = null, messageType = 'text') {
    const payload = {
      messaging_type: 'RESPONSE',
      recipient: { id: recipientId },
      message: {}
    };

    if (mediaUrl && messageType !== 'text') {
      const typeMap = { image: 'image', video: 'video', audio: 'audio', document: 'file' };
      const type = typeMap[messageType] || 'file';
      payload.message.attachment = {
        type,
        payload: { url: mediaUrl }
      };
    } else {
      payload.message.text = text;
    }

    const res = await axios.post(`${FB_BASE}/me/messages`, payload, {
      params: { access_token: this.getAccessToken(instance) },
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`[MetaApi:Instagram] Sent to ${recipientId}:`, res.data);
    return res.data;
  }

  async sendInstagramPrivateReply(instance, commentId, text) {
    let token;
    try {
      token = this.getAccessToken(instance);
    } catch (_) {
      throw publicReplyError('META_CREDENTIALS_UNAVAILABLE', 'Meta credentials are unavailable for private reply');
    }
    try {
      const response = await axios.post(
        `${FB_BASE}/${encodeURIComponent(commentId)}/private_replies`,
        { message: text },
        { params: { access_token: token }, headers: { 'Content-Type': 'application/json' } }
      );
      const id = String(response?.data?.id || response?.data?.message_id || response?.data?.recipient_id || '').trim();
      if (!id) {
        throw publicReplyError('META_PRIVATE_REPLY_OUTCOME_AMBIGUOUS', 'Meta returned an invalid private reply result', {
          dispatchOutcome: 'outcome_ambiguous', outcomeUnknown: true
        });
      }
      return { ...response.data, id };
    } catch (error) {
      if (error?.dispatchOutcome) throw error;
      throw classifyPrivateReplyError(error);
    }
  }

  async publishPublicCommentReply(instance, commentId, message, edge) {
    let token;
    try {
      token = this.getAccessToken(instance);
    } catch (_) {
      throw publicReplyError(
        'META_CREDENTIALS_UNAVAILABLE',
        'Meta credentials are unavailable for public reply'
      );
    }

    let response;
    try {
      response = await axios.post(`${FB_BASE}/${encodeURIComponent(commentId)}/${edge}`, {
        message
      }, {
        params: { access_token: token },
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw classifyPublicReplyError(error);
    }

    const id = String(response?.data?.id || '').trim();
    if (!id) {
      throw publicReplyError(
        'META_PUBLIC_REPLY_OUTCOME_AMBIGUOUS',
        'Meta returned an invalid public reply result',
        {
          dispatchOutcome: 'outcome_ambiguous',
          outcomeUnknown: true
        }
      );
    }
    return { id };
  }

  async replyToFacebookComment(instance, commentId, message) {
    return this.publishPublicCommentReply(instance, commentId, message, 'comments');
  }

  async replyToInstagramComment(instance, commentId, message) {
    return this.publishPublicCommentReply(instance, commentId, message, 'replies');
  }

  // --- UNIFIED SEND (auto-detect channel) ---
  // Convenience method used by webhookController — picks the right API per channelType
  async sendMetaMessage(instance, recipientId, text, mediaUrl = null, messageType = 'text') {
    if (instance.channelType === 'instagram') {
      return this.sendInstagramMessage(instance, recipientId, text, mediaUrl, messageType);
    }
    // Default to Messenger for 'messenger' or any non-whatsapp channel
    return this.sendMessengerMessage(instance, recipientId, text, mediaUrl, messageType);
  }

  // --- COMMON UTILS ---

  // Fetch Messenger/Instagram user profile (name, profile_pic)
  // Docs: https://developers.facebook.com/docs/messenger-platform/identity/user-profile/
  async getUserProfile(instance, psid) {
    try {
      const res = await axios.get(`${FB_BASE}/${psid}`, {
        params: { fields: 'name,profile_pic', access_token: this.getAccessToken(instance) }
      });
      return { name: res.data.name || null, profilePic: res.data.profile_pic || null };
    } catch (err) {
      console.warn(`[MetaApi] Failed to fetch profile for ${psid}:`, sanitizeError(err));
      return { name: null, profilePic: null };
    }
  }

  async getMediaUrl(instance, mediaId) {
    const res = await axios.get(`${FB_BASE}/${mediaId}`, { headers: this.getHeaders(this.getAccessToken(instance)) });
    return res.data.url;
  }

  async downloadMedia(instance, mediaUrl) {
    const res = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${this.getAccessToken(instance)}` },
      responseType: 'arraybuffer'
    });
    return res.data;
  }
}

module.exports = new MetaApi();

