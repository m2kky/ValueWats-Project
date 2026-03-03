# ValueWats Database Schema

Generated from `prisma/schema.prisma`. 26 models total.

## Core Tables

### `tenants`
The root of multi-tenancy. Every row in every table is scoped to a tenant.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Business name |
| `email` | String unique | Login email |
| `subscription_plan` | String? | `'basic'`, `'pro'`, `'enterprise'` |
| `status` | String | `'active'`, `'suspended'`, `'trial'` |
| `created_at` | DateTime | |

### `users`
Users (agents/admins) belonging to a tenant.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `tenant_id` | UUID FK → tenants | |
| `email` | String unique | |
| `password_hash` | String | |
| `role` | String | `'admin'`, `'agent'`, `'viewer'` |
| `email_verified` | Boolean | |

### `instances`
WhatsApp instances connected via Evolution API.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `tenant_id` | UUID FK → tenants | |
| `instance_name` | String | ASCII only, used in Evolution API calls |
| `phone_number` | String? | |
| `phone_number_id` | String? | Meta Cloud API field |
| `access_token` | Text? | Meta Cloud API token |
| `status` | String | `'connected'`, `'disconnected'`, `'qr_pending'` |
| `qr_code` | Text? | Base64 QR code |

---

## Campaign Tables

### `campaigns`
Campaign definitions and their settings.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `tenant_id` | UUID FK | |
| `instance_id` | UUID? FK | Optional — multi-instance campaigns use `campaign_instances` |
| `name` | String | |
| `message_template` | Text | Main message text (supports `{{name}}`, `{{rand}}`, `{{date}}`) |
| `status` | String | `'draft'`, `'scheduled'`, `'running'`, `'completed'` |
| `total_contacts` | Int | |
| `sent_count` | Int | |
| `failed_count` | Int | |
| `delay_min` | Int | Minimum delay between messages (seconds). **Default: 15** |
| `delay_max` | Int | Maximum delay between messages (seconds). **Default: 25** |
| `instance_switch_count` | Int | Switch WhatsApp number every N messages. Default: 50 |
| `message_rotation_count` | Int | Rotate templates every N messages. Default: 1 |
| `scheduled_at` | DateTime? | Future send time |
| `media_url` | String? | |
| `media_type` | String? | `'image'`, `'video'`, `'document'` |

### `message_templates`
Additional message variants for a campaign (A/B rotation).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `campaign_id` | UUID FK | |
| `content` | Text | Message variant |
| `order_index` | Int | Rotation order |

### `messages`
Individual message records (one per contact per campaign).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `tenant_id` | UUID FK | |
| `campaign_id` | UUID? FK | |
| `instance_id` | UUID FK | Which WhatsApp number sent it |
| `recipient_number` | String | E.164 format |
| `message_text` | Text | Final message after Spintax injection |
| `status` | String | `'pending'`, `'sent'`, `'delivered'`, `'failed'`, `'cancelled'` |
| `fail_reason` | Text? | |
| `sent_at` | DateTime? | |
| `delivered_at` | DateTime? | |
| `wamid` | String? unique | Evolution API message ID |
| `variables` | JSON? | Contact variables used |

---

## CRM Tables

### `contacts`
CRM contact storage per tenant.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `tenant_id` | UUID FK | |
| `phone_number` | String | Unique per tenant |
| `name` | String? | |
| `email` | String? | |
| `source` | String | `'whatsapp'`, `'manual'`, `'import'`, `'website'` |
| `custom_fields` | JSON? | Key-value pairs |
| `lifecycle_stage_id` | UUID? FK | |

### `conversations`
Live chat conversations (one per contact number per tenant).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `tenant_id` / `contact_number` | [unique] | |
| `status` | String | `'open'`, `'closed'`, `'pending'` |
| `labels` | String[] | Array of label strings |
| `ai_enabled` | Boolean | Whether AI agent is responding |
| `escalated` | Boolean | Whether escalated to human |
| `current_agent_id` | UUID? FK → ai_agents | |
| `assigned_user_id` | UUID? FK → users | |

---

## AI Agent Tables

### `ai_agents`
AI agent configurations per tenant.

| Column | Type | Notes |
|---|---|---|
| `instructions` | Text | System prompt |
| `ai_provider` | String | `'deepseek'` |
| `ai_model` | String | `'deepseek-chat'` |
| `working_hours_enabled` | Boolean | |
| `working_hours` | JSON? | `{ mon: {start, end}, ... }` |

---

## Schema Notes

> [!IMPORTANT]
> Every Prisma query MUST include `tenantId` in the `where` clause. Use the `tenantContext` middleware to get `req.user.tenantId`.

> [!NOTE]
> `delay_min` and `delay_max` defaults in the schema are still set to 5/15. After the Anti-Ban update, the application defaults to 15/25 in the controller and queue service. A migration to update the schema defaults is pending.

### Pending Schema Changes (from Anti-Ban plan)
- Add `max_messages_per_day` to `tenants` or a `plans` table
- Add `working_hours_start` / `working_hours_end` to tenant/plan config
- Add `blacklisted` boolean to `contacts` for opt-out support
