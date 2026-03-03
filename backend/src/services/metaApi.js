const axios = require('axios');

const BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v20.0'}`;
const TOKEN = () => process.env.META_ACCESS_TOKEN;
const PHONE_ID = () => process.env.META_PHONE_NUMBER_ID;

const headers = () => ({ Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' });

class MetaApi {
  async sendMessage(to, text) {
    const res = await axios.post(`${BASE}/${PHONE_ID()}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    }, { headers: headers() });
    console.log(`[MetaApi] Sent to ${to}:`, res.data);
    return res.data;
  }

  async sendMedia(to, mediaUrl, mediaType, caption = '') {
    const typeMap = { image: 'image', video: 'video', audio: 'audio', document: 'document' };
    const type = typeMap[mediaType] || 'document';
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type,
      [type]: { link: mediaUrl, ...(caption && type !== 'audio' ? { caption } : {}) }
    };
    const res = await axios.post(`${BASE}/${PHONE_ID()}/messages`, payload, { headers: headers() });
    console.log(`[MetaApi] Sent media to ${to}:`, res.data);
    return res.data;
  }

  async getMediaUrl(mediaId) {
    const res = await axios.get(`${BASE}/${mediaId}`, { headers: headers() });
    return res.data.url;
  }

  async downloadMedia(mediaUrl) {
    const res = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${TOKEN()}` },
      responseType: 'arraybuffer'
    });
    return res.data;
  }
}

module.exports = new MetaApi();
