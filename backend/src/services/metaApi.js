const axios = require('axios');

const BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v20.0'}`;

class MetaApi {
  // Common headers builder
  getHeaders(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // --- WHATSAPP METHODS ---
  async sendMessage(instance, to, text) {
    const res = await axios.post(`${BASE}/${instance.phoneNumberId}/messages`, {
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
    const res = await axios.post(`${BASE}/${instance.phoneNumberId}/messages`, payload, { headers: this.getHeaders(instance.accessToken) });
    console.log(`[MetaApi:WhatsApp] Sent media to ${to}:`, res.data);
    return res.data;
  }

  // --- MESSENGER & INSTAGRAM METHODS ---
  async sendMetaMessage(instance, recipientId, text, mediaUrl = null, messageType = 'text') {
    const payload = { recipient: { id: recipientId }, message: {} };

    if (mediaUrl && messageType !== 'text') {
      const typeMap = { image: 'image', video: 'video', audio: 'audio', document: 'file' };
      const type = typeMap[messageType] || 'file';
      payload.message.attachment = {
        type,
        payload: { url: mediaUrl, is_reusable: true }
      };
      // For Messenger, we can't send text AND attachment in the same message object easily
      // but if there's text, we send it as a separate caption or ignored if text-only is not supported in the same call
    } else {
      payload.message.text = text;
    }

    const res = await axios.post(`${BASE}/${instance.phoneNumberId}/messages`, payload, {
      headers: this.getHeaders(instance.accessToken)
    });
    console.log(`[MetaApi:${instance.channelType}] Sent to ${recipientId}:`, res.data);
    return res.data;
  }

  // --- COMMON UTILS ---
  async getMediaUrl(mediaId, token) {
    const res = await axios.get(`${BASE}/${mediaId}`, { headers: this.getHeaders(token) });
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
