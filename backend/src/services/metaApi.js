const axios = require('axios');

const META_API_VERSION = process.env.META_API_VERSION || 'v20.0';
const FB_BASE = `https://graph.facebook.com/${META_API_VERSION}`;
const IG_BASE = `https://graph.instagram.com/${META_API_VERSION}`;

class MetaApi {
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
    }, { headers: this.getHeaders(instance.accessToken) });
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
    const res = await axios.post(`${FB_BASE}/${instance.phoneNumberId}/messages`, payload, { headers: this.getHeaders(instance.accessToken) });
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
      params: { access_token: instance.accessToken },
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`[MetaApi:Messenger] Sent to ${recipientId}:`, res.data);
    return res.data;
  }

  // --- INSTAGRAM MESSAGING API ---
  // Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
  // Endpoint: POST graph.instagram.com/{IG_ID}/messages (Bearer token)
  // - recipient.id = IGSID (Instagram-Scoped ID)
  // - Different host: graph.instagram.com (NOT graph.facebook.com)
  async sendInstagramMessage(instance, recipientId, text, mediaUrl = null, messageType = 'text') {
    const payload = {
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

    const res = await axios.post(`${IG_BASE}/${instance.phoneNumberId}/messages`, payload, {
      headers: this.getHeaders(instance.accessToken)
    });
    console.log(`[MetaApi:Instagram] Sent to ${recipientId}:`, res.data);
    return res.data;
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
  async getMediaUrl(mediaId, token) {
    const res = await axios.get(`${FB_BASE}/${mediaId}`, { headers: this.getHeaders(token) });
    return res.data.url;
  }

  async downloadMedia(mediaUrl, token) {
    const res = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });
    return res.data;
  }
}

module.exports = new MetaApi();

