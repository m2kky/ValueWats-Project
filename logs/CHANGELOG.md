# Changelog

All notable changes to the ValueWats project, tracked by date.

---


## [2026-02-21] — Premium UI Overhaul (Visual Excellence)

### Added
- **Design System**: Implemented a global premium dark theme with glassmorphism (`index.css`).
- **Layout**: Transitioned to a sidebar-first architecture with a sleek, persistent glassmorphic navigation (`Layout.jsx`).
- **Dashboard**: Redesigned analytics suite with high-fidelity `StatCard` components, interactive hover effects, and sophisticated data visualization.
- **Inbox**: Comprehensive overhaul of the chat interface featuring a unified conversation list, date-based grouping, and premium message bubble aesthetics.
- **AI Agents**: Transformed the config page into a "Neural Lab" environment with custom gradients, interactive capability cards, and a sophisticated RAG monitoring interface.
- **Components**: Added `SkeletonLoader` for various data-fetching states to improve perceived performance.

### Changed
- **DevOps**: Connected custom domain `app.muhammedmekky.com` to Coolify service. SSL enabled via Let's Encrypt.

### Fixed
- **Agents Page**: Repaired structural JSX corruption in `Agents.jsx` and standardized styling across all tabs (Identity, Settings, Skills, Knowledge).
- **Global**: Standardized scrollbars and backdrop-blur effects throughout the application for a cohesive enterprise feel.

---

### Changed
- **Environment**: Updated `valuewats/backend/.env` to match new Ubuntu Linux local development setup.
- **Configuration**: Updated Database, Redis, Evolution API, and MinIO connection strings.
- **Configuration**: Updated DeepSeek AI API Key in `.env`.
- **Configuration**: Set `PUBLIC_URL` to `http://localhost:3000` for local development.
- **System**: Created `scripts/health_check.js` and `scripts/setup_minio.js` for system verification.
- **System**: Created `valuewats` MinIO bucket and set public policy.
- **DevOps**: Updated `~/valuewats-local/docker-compose.yml` to use `pgvector/pgvector:pg16` for AI features.
- **Frontend**: Explicitly set `VITE_API_URL=http://localhost:3000` in `.env` to fix `ERR_NAME_NOT_RESOLVED`.
- **Frontend**: Changed default port to 5174 due to conflict.
- **Backend**: Updated CORS in `server.js` to allow requests from `http://localhost:5174`.
- **Backend**: Fixed `PrismaClientValidationError` in `evolutionApi.js` by correctly handling `qrCode` object from Evolution API.
- **Backend**: Improved error handling in `GET /api/instances` to prevent 500 errors when Evolution API sync fails.
- **Backend**: Patched `evolutionApi.js` to sanitize `qrCode` variable immediately, preventing object leak to frontend/DB.
- **Frontend**: Fixed `TypeError: qrCode.startsWith` in `NewInstance.jsx` by checking for null/non-string values.

---

## [2026-02-17] — Integrations & Workflows (Phase 5)

### Added
- **Backend Services**: `integration.service.js` (Google Sheets, Webhooks) and `workflow.service.js` (engine).
- **Security**: `encryption.js` utility for storing API credentials (AES-256).
- **Frontend**: `Integrations` page to connect services.
- **Frontend**: `Workflows` page to create automated triggers (e.g. "Save Lead" -> Append to Sheet).
- **Agent Action**: Support for `[ACTION: TRIGGER_WORKFLOW: <ID>]` in `agent.service.js`.
- **Database**: `Integration`, `Workflow`, `WorkflowExecution`, `WorkflowLog` models.
- **SQL Migration**: Manual `migration_integrations.sql` for production update.

### Added (Phase 4: Contact & Inbox Improvements)
- **Inbox**: `ContactSidebar` for editing name, phone, labels, and lifecycle stages.
- **UI**: Phone number formatting (`+1 (555) ...`) via `formatPhoneNumber` utility.
- **Database**: `labels` column array for Conversations.
- **Actions API**: Backend implementation for `CLOSE_CONVERSATION`, `ASSIGN`, `UPDATE_CONTACT`.

---

## [2026-02-17] — Production Fixes & AI Agents Backend

### Added
- **Backend**: Implemented full AI Agent system structure (`agent.service.js`, `deepseek.service.js`).
- **API**: Added Agent management routes (`/api/agents`) and Template endpoints (`/api/agents/templates`).
- **API**: Added Lifecycle Stage management routes (`/api/lifecycle`).
- **Database**: Added migration `20260215175500_add_multi_agent_system` with `pgvector` support.
- **DevOps**: Updated `docker-compose.dev.yml` to use `pgvector/pgvector:pg16` image.
- **Workflow**: Added `/update-logs` workflow for standardized documentation.
- **Frontend**: Added AI Agents management page (`Agents.jsx`) with list view, templates gallery, and split-layout editor with live test chat.
- **Frontend**: Added `useAgents.js` hook for agent CRUD, templates, and test chat API calls.
- **Frontend**: Added "AI Agents" navigation item to Layout with `CpuChipIcon`.
- **Frontend**: Added `/agents` route to `App.jsx`.
- **Backend**: Added `POST /api/agents/:id/test` endpoint for live agent testing in the editor.

### Added (Phase 3: Knowledge Base & RAG)

- **Schema**: Changed `AgentKnowledge` embedding vector dimension from 1536 to 768 (nomic-embed-text). Added `chunkIndex` and `fileKey` fields.
- **Backend**: Created `embeddingService.js` — Ollama integration for generating 768-dim embeddings.
- **Backend**: Created `knowledgeService.js` — text chunking, PDF extraction (`pdf-parse`), embedding generation, and pgvector similarity search.
- **Backend**: Created `knowledge.routes.js` — CRUD endpoints for knowledge sources (text + file upload with Multer).
- **Backend**: Updated `agent.service.js` `buildContext()` — RAG vector search with keyword fallback.
- **Backend**: Mounted knowledge routes in `server.js`.
- **Frontend**: Extended `useAgents.js` hook with `fetchKnowledge`, `addTextKnowledge`, `uploadFileKnowledge`, `deleteKnowledge`.
- **Frontend**: Replaced Knowledge Base "Coming Soon" placeholder in `Agents.jsx` with full UI (add text, upload file, list/delete sources).

### Added (Phase 4: Security & Advanced Actions)

- **Security**: Implemented "Core Prime Directive" in `agent.service.js` to prevent prompt injection and strictly enforce instructions.
- **Backend**: Added Group Chat filtering logic (whitelist/blacklist) in `agent.service.js`.
- **Schema**: Added `allowGroupResponse`, `allowedGroups`, and `actionConfig` fields to `AIAgent` model.

### Fixed
- **Database**: Resolved `type "vector" does not exist` error by enabling extension and updating Docker image.
- **Database**: Fixed migration SQL table name mismatches (e.g., `Conversation` -> `conversations`).
- **Webhook**: Integrated AI Agent logic into `webhookController.js` to replace legacy AI fallback.

### Fixed
- **Webhook 405 Error**: Evolution API v2 appends event names to webhook URLs (e.g. `/receive/messages-upsert`). Added `router.post('/receive/:event', ...)` to `backend/src/routes/webhooks.js`.
- **Nginx 413 Body Too Large**: Added `client_max_body_size 50m` to `frontend/nginx.conf`. Default was 1MB, but webhook payloads with media can be 12MB+.
- **crypto.randomUUID Error**: Moved polyfill from `main.jsx` to `index.html` as inline `<script>` before module scripts. Vendor chunks were calling `crypto.randomUUID()` at initialization, before `main.jsx` had a chance to polyfill it. This only affects HTTP (non-HTTPS) sites.
- **Campaign 500 Error**: Diagnosed as Redis DNS failure (`EAI_AGAIN` on host `b4sc440ckcwg8gscoskowcs4`). Backend and Redis are in different Coolify projects → different Docker networks → internal hostname doesn't resolve. Fix: move to same project or use public URL.
- **Frontend Build**: Fixed missing `@headlessui/react` dependency causing Rollup build failure.
- **Frontend Build**: Fixed incorrect API import in `ContactSidebar.jsx`.
- **Frontend Build**: Fixed invalid `CommandCommandLineIcon` import in `ActionCard.jsx` (renamed to `CommandLineIcon`).
- **Backend Startup**: Fixed `MODULE_NOT_FOUND` crash due to invalid `knowledge.routes` import in `server.js`.

### Changed
- Updated all documentation in `docs/` to reflect current project state.

---

## [2026-02-15] — AI Agent System (Multi-Agent)

### Added
- **AI Agent CRUD**: Full API at `/api/agents` with templates (receptionist, sales, support, custom).
- **Agent routing rules**: Keyword/intent-based handoff between agents.
- **Agent knowledge base**: RAG-ready with pgvector embedding support.
- **Agent actions**: Close conversation, assign to agent/team, update lifecycle, add tag.
- **Lifecycle stages**: Customizable lead stages per tenant.
- **Contact custom fields**: Key-value metadata per contact.
- **Conversation agent tracking**: Audit trail for agent handoffs.
- **Database migration**: `20260215175500_add_multi_agent_system` — adds AIAgent, AgentAction, AgentKnowledge, AgentRoutingRule, ConversationAgent, LifecycleStage, ContactField models.
- **Backend services**: `aiService.js` (DeepSeek integration), `agent.service.js` (agent processing logic).
- **Agent routes**: `agents/agent.routes.js` with tenantContext middleware.

### Changed
- Updated `Conversation` model: added `currentAgentId`, `lifecycleStageId`, `aiEnabled`, `escalated`, `failedAttempts` fields.
- Updated `schema.prisma` to include pgvector extension.

---

## [2026-02-10] — MinIO & Evolution API Fixes

### Fixed
- **MinIO 403 Forbidden**: Fixed S3 access configuration for media uploads.
- **Evolution API DNS**: Fixed internal service DNS resolution for webhook delivery.

### Changed
- Updated storage service configuration for Coolify internal networking.

---

## [2026-02-08] — Real-time Analytics

### Added
- **WebSocket integration**: Socket.io for live campaign status updates.
- **Webhook handler**: Processes delivery and read receipts from Evolution API.
- **Real-time dashboard**: Live message status tracking (sent, delivered, read).

### Changed
- Updated `webhookController.js` to handle `MESSAGES_UPDATE` events.
- Added `socketService.js` for WebSocket management.

---

## [2026-02-05] — Chat Inbox & Conversations

### Added
- **Chat system**: Real-time inbox with conversation management.
- **Chat routes**: `/api/chat/conversations`, `/api/chat/messages/send`.
- **Chat controller**: `chatController.js` with conversation and message handling.
- **Chat service**: `chat.service.js` for conversation logic.
- **Database models**: `Conversation`, `ChatMessage` tables.
- **Inbox page**: `Inbox.jsx` frontend component.

---

## [2026-02-02] — Core Platform Launch

### Added
- **Campaign management**: CSV/Excel/Google Sheets import, template rotation, instance load balancing.
- **Instance management**: Create, connect (QR), delete WhatsApp instances.
- **Authentication**: JWT with OTP email verification (2-step registration).
- **Team management**: Invite users by email with role assignment.
- **Automation**: Keyword-based, welcome, and any-message auto-replies.
- **Link tracking**: URL shortening with CTR and device tracking.
- **Dashboard**: Stats overview with campaign and message metrics.
- **Email service**: OTP via SMTP (Hostinger).
- **Queue system**: BullMQ for throttled campaign message delivery.
- **Coolify deployment**: Single-container setup with Nginx proxy.
