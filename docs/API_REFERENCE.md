# Value chat API Reference

Base URL: `https://valuechat.app/api`  
All protected routes require: `Authorization: Bearer <JWT>`

---

## Auth

### `POST /api/auth/register`
Register a new tenant + admin user.
```json
{ "name": "...", "email": "...", "password": "..." }
```

### `POST /api/auth/login`
```json
{ "email": "...", "password": "..." }
```
Returns: `{ token, user, tenant }`

### `POST /api/auth/verify-otp`
```json
{ "email": "...", "otp": "123456" }
```

---

## Instances (WhatsApp Numbers)

### `GET /api/instances`
List all connected WhatsApp instances for the tenant.

### `POST /api/instances`
Create a new WhatsApp instance. Returns QR code for scanning.
```json
{ "instanceName": "MyBusiness" }
```

### `GET /api/instances/:id/status`
Get connection status: `connected` | `disconnected` | `qr_pending`

### `GET /api/instances/:id/qr`
Get fresh QR code (base64).

### `DELETE /api/instances/:id`
Disconnect and delete an instance.

---

## Campaigns

### `GET /api/campaigns`
List campaigns for the tenant.

### `POST /api/campaigns`
Create a new campaign.
```json
{
  "name": "Summer Promo",
  "messages": ["Hello {{name}}!", "Hey {{name}}, check this out!"],
  "numbers": "201xxxxxxxxx\n202xxxxxxxxx",
  "instanceIds": ["uuid1", "uuid2"],
  "delayMin": 15,
  "delayMax": 25,
  "instanceSwitchCount": 50,
  "messageRotationCount": 1,
  "mediaUrl": null,
  "scheduleEnabled": false,
  "scheduledAt": null
}
```

**Spintax variables available in messages:**
- `{{name}}` — Contact name from CSV
- `{{rand}}` — Random number (auto-injected)
- `{{date}}` — Current date (auto-injected)
- Any CSV column name as `{{column_name}}`

### `GET /api/campaigns/:id`
Get campaign details + message stats.

### `DELETE /api/campaigns/:id`
Cancel/delete a campaign.

---

## Inbox / Conversations

### `GET /api/inbox`
Get open conversation list.

### `GET /api/inbox/:conversationId/messages`
Get messages for a conversation.

### `POST /api/inbox/:conversationId/send`
Send a message from agent to conversation.
```json
{ "text": "Hello!", "instanceId": "uuid" }
```

---

## Contacts (CRM)

### `GET /api/contacts`
List contacts. Supports query params: `?search=`, `?label=`, `?stage=`

### `POST /api/contacts`
Create a contact.
```json
{ "phoneNumber": "201xxxxxxxxx", "name": "Ahmed", "email": "..." }
```

### `PATCH /api/contacts/:id`
Update contact fields.

### `DELETE /api/contacts/:id`
Delete a contact.

---

## AI Agents

### `GET /api/agents`
List AI agents for the tenant.

### `POST /api/agents`
Create an AI agent.

### `PATCH /api/agents/:id`
Update agent config (instructions, model, working hours, etc.)

### `DELETE /api/agents/:id`
Delete an agent.

---

## Webhooks (Public — No Auth)

### `POST /api/webhooks/receive`
Evolution API sends all WhatsApp events here.
Events handled: `MESSAGES_UPSERT`, `MESSAGES_UPDATE`, `CONNECTION_UPDATE`, `QRCODE_UPDATED`

> [!WARNING]
> This route has NO authentication by design. It is scoped by `X-Instance-Name` and `X-Tenant-ID` headers set during webhook registration.

---

## Dashboard

### `GET /api/dashboard/stats`
Returns: `{ campaigns, messages, instances, contacts, recentActivity }`

---

## File Upload

### `POST /api/upload`
Upload media for campaigns. Body: `multipart/form-data` with `file` field.  
Returns: `{ url }` (MinIO URL)
