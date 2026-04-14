---

## [2026-04-14] - RBAC System + Workflow Trigger Wiring

### Added
- **Role-Based Access Control (RBAC) system**:
  - Created `backend/src/config/permissions.js` — Permission matrix for 5 roles: `owner`, `admin`, `supervisor`, `agent`, `viewer`.
  - Created `backend/src/middleware/checkPermission.js` — Route-level authorization middleware.
  - Created `frontend/src/hooks/usePermission.js` — Frontend hooks `usePermission()` and `useNavFilter()` for role-based UI guards.
- **Workflow automation trigger wiring**:
  - `webhookController.js` now auto-triggers matching workflows on inbound messages via `workflowService`.
  - Added "Workflows" navigation link in sidebar (`Layout.jsx`).

### Changed
- **RBAC applied to ALL write routes** across 8 route files:
  - `team.js` — `team.manage`
  - `campaigns.js` — `campaigns.manage`
  - `templates.js` — `templates.manage`
  - `agent.routes.js` — `agents.manage`
  - `workflows.js` — `automations.manage`
  - `settings.js` — `settings.manage`
  - `instances.js` — `channels.manage`
  - `contacts.js` — `contacts.manage`
- **First user per tenant now gets `owner` role** instead of `admin` (in `auth.js`).
- **`isAdmin.js`** now accepts both `owner` and `admin` roles for super-admin check.
- **`planLimit.service.js`** PAID_SEAT_ROLES updated to include `owner` and `supervisor`.
- **Frontend sidebar** now filters nav items by user role permissions.
- **User profile badge** now shows `{role} * {plan}` instead of just plan name.

### Fixed
- **`agent.service.js`** TRIGGER_WORKFLOW action — was calling nonexistent `executeWorkflow()`, fixed to `executeWorkflowRecord()` with proper workflow lookup (by ID or name).
- **`agent.routes.js`** — Fixed incorrect `require('../../middleware/checkPermission')` import path to `../middleware/checkPermission`.

---

## [2026-04-14] - AI Agent Prompt Quality Alignment (respond.io style)

### Added
- **Instruction quality guardrails in Agent Editor**:
  - Added required-section checklist for `# CONTEXT`, `# ROLE & COMMUNICATION STYLE`, `# TOP-LEVEL FLOW`, and `# BOUNDARIES`.
  - Added live instruction character counter with 10,000-character limit visibility.
  - Added over-limit warning and blocked save/publish when instructions exceed 10,000 characters.

### Changed
- **Default AI agent templates upgraded to structured prompts**:
  - Rewrote `receptionist`, `sales`, and `support` template instructions into explicit sections with context, communication style, flow, action rules, and boundaries.
- **System prompt assembly improved**:
  - Updated backend prompt builder to enforce a clear section execution order and explicitly separate top-level flow from action settings.
  - Improved knowledge-base usage guidance to reduce unsupported answers.
- **Agent test preview now matches production prompt logic**:
  - `/api/agents/:id/test` now reuses `buildSystemPrompt()` for parity with live conversation behavior.

### Fixed
- **Create-agent API parity with editor capabilities**:
  - Added support for saving `actionConfig`, `allowGroupResponse`, and `allowedGroups` during agent creation.
  - Added validation for required/non-empty instructions and hard 10,000-character limit in create/update APIs.

### Verification
- `npm run build` completed successfully in `frontend`.
- Backend modules loaded successfully via Node (`agent.service.js`, `agent.routes.js`).

## [2026-04-14] - Agent Mentions, Variables, and Tags Parity Pass

### Changed
- **Frontend mention/tag/variable lookup sources aligned with backend APIs**:
  - Replaced non-existing lookup calls (`/users/all`, `/teams`, `/lifecycle-stages`) with tenant-scoped routes that actually exist: `/team`, `/lifecycle`, and `/contact-fields/definitions`.
  - Added dynamic mention options for:
    - Human users (`@user:<id>`)
    - AI agents (`@agent:<id>`)
    - Team selectors (`@team:agents`, `@team:admins`, `@team:humans`)
  - Added dynamic variables sourced from contact field definitions (`{{contact.<fieldKey>}}`).
- **Rich textarea UX upgraded toward respond.io behavior**:
  - Added searchable picker with tabs for Mention, Variable, and Tag insertion.
  - Kept trigger autocomplete while typing (`@`, `%`, `{{`, `$`).
  - Improved filtering and insertion behavior for all token types.
- **Action editors now receive dynamic variables explicitly**:
  - Passed `variables` into all `ActionCard` instruction editors.
  - Passed `availableVariables` into HTTP Request side-sheet instruction editor.

### Fixed
- **Backend ASSIGN action resolution made robust**:
  - Replaced brittle `split(':')[1]` parsing with full-target parsing.
  - Added assignment target resolver supporting:
    - `@user:<id>` / `USER:<id>`
    - `@agent:<id>` / `AGENT:<id>`
    - `@team:<name>` / `TEAM:<name>` (with strategy support)
    - `HUMAN` / `ESCALATE`
    - Fallback by partial name/email matching.
  - Added team assignment strategies:
    - `round_robin` (least recently assigned fallback)
    - `least_open` / `least_loaded`
  - Assignment now updates conversation ownership flags consistently and logs assignment activity.
- **Tag action normalization**:
  - `ADD_TAG` / `REMOVE_TAG` now normalize `%tag` and `tag` to the same stored label name.
- **HTTP variable interpolation parity improved**:
  - Added unified template interpolation for both `{{path.to.value}}` and `$path.to.value`.
  - Added richer interpolation context (`contact`, `agent`, `conversation`, `message`, `date`) including dynamic contact fields.
  - Added safe request-body handling when JSON parsing is not possible.

## [2026-04-12] - Meta Embedded Signup Completion, Messenger Controls, and Channel Scope Lock

### Added
- **Meta App compliance pages and domain ownership support**:
  - Added public Data Deletion page and legal footer links for Meta app requirements.
  - Added Facebook domain verification meta tag on the public website.
- **Meta Embedded Signup channel flow**:
  - Switched Messenger and Instagram connect flow to Embedded Signup.
  - Added separate frontend config support for Messenger and Instagram Meta login configuration IDs.
- **Messenger control features in Channel Manage**:
  - Added Messenger Chat Menu templates for faster setup.
  - Added Messenger Private Replies management for post comments.
  - Added Template Tester support for validating Messenger message payloads before production use.

### Changed
- **Channel catalog scope is now Meta-only (temporary product scope)**:
  - Hidden channel options except `WhatsApp`, `Messenger`, and `Instagram` on the Channels page.
  - Filtered connected channels to show only the active supported channel types.
  - Blocked unsupported direct connect routes with a clear "Channel Unavailable" state.
- **Help Center scope alignment**:
  - Removed TikTok and Telegram from channel collections.
  - Updated Messaging Channels category copy to reflect only current supported channels.
  - Updated WhatsApp docs text to match current QR-first flow.
  - Updated Messenger docs with current operational features: Chat Menu, Private Replies, and Template Tester.
  - Updated docs freshness marker to `April 2026`.

### Fixed
- **Frontend API path and Meta login callback issues**:
  - Fixed duplicated `/api/api` path bug in notifications calls.
  - Fixed async callback misuse in Facebook login flow.
- **Messenger webhook subscription compatibility**:
  - Replaced invalid subscription fields with supported Meta fields and added `feed` subscription support for private-reply scenarios.
- **Channel config save robustness**:
  - Improved validation messaging for Chat Menu buttons (payload/URL requirements).
  - Allowed partial config saves for Private Replies with clearer debug logging during feed event processing.

### Verification
- `npm run build:frontend` completed successfully after channel-scope and docs updates.

### Related Commits (2026-04-12)
- `0aa6407` chore: add facebook domain verification meta tag
- `da9a472` feat: add public data deletion page and legal links
- `d4edb15` feat: switch messenger/instagram to meta embedded signup
- `e582910` fix: normalize api paths and remove async fb.login callback
- `368e1cc` feat(channels): add messenger chat menu templates and private replies
- `22ea932` fix(messenger): subscribe page feed field for auto private replies
- `8a45f2f` fix(meta): valid webhook fields and friendlier chat menu validation
- `181c5f0` fix(private-replies): allow partial config saves and add feed debug logs
- `2864824` feat: hide non-meta channels and align channel docs

## [2026-04-08] - Rebrand Assets Finalization & Campaign Prerequisite Guard

### Changed
- **Branding asset paths stabilized**: Switched runtime logo/icon references to space-safe public paths:
  - `/main-logo.svg`
  - `/icon-blue-animated.svg`
  - `/icon-blue-animated-2.svg`
- **Favicon + OG branding**: Confirmed `frontend/index.html` uses `/icon-yellow.svg` and updated OG image path to `/main-logo.svg`.
- **Documentation branding alignment**: Updated core docs titles from `ValueWats` to `Value chat` in:
  - `docs/API_REFERENCE.md`
  - `docs/BACKEND_GUIDE.md`
  - `docs/CODEBASE_WALKTHROUGH.md`
  - `docs/DATABASE_SCHEMA.md`
  - `docs/FRONTEND_GUIDE.md`

### Fixed
- **Campaign launch prerequisite**: Campaign creation now enforces connected-instance validation in both UI and API:
  - Frontend blocks navigation/submit with clear guidance to connect a number first.
  - Backend rejects campaign creation when tenant has no connected instances or selected instances are disconnected.

### Notes
- Frontend production build re-run successfully after branding path updates.

## [2026-04-08] - AI Agent Actions Docs Refresh & Help Route Repair

### Added
- **AI Agent action documentation overhaul**: Rewrote `/help/ai-agents/actions` content in `frontend/src/pages/public/help/FeatureHelp.jsx` with:
  - Action-by-action guides for all 8 agent actions (`CLOSE_CONVERSATION`, `ASSIGN`, `UPDATE_CONTACT`, `UPDATE_LIFECYCLE`, `TRIGGER_WORKFLOW`, `ADD_TAG/REMOVE_TAG`, `ADD_COMMENT`, `HTTP_REQUEST`).
  - Practical instruction formula plus copy-ready sample instructions for each action.
  - HTTP placeholder reference for dynamic variables (`{{contact.*}}`, `{{agent.*}}`, `{{message.content}}`).
  - Execution notes aligned with backend behavior (workflow expects ID, lifecycle matches by name, HTTP body must be valid JSON for non-GET).

### Changed
- **Prompt helper deep-link**: Updated `RichTextarea.jsx` "Learn how to write this" link from `/help/ai-agents` to `/help/ai-agents/actions`.
- **Help routing consistency**: Replaced remaining `/help/agents` links with `/help/ai-agents` in:
  - `frontend/src/components/public/HelpCenterLayout.jsx`
  - `frontend/src/pages/public/help/HelpCenter.jsx`
  - `frontend/src/pages/public/help/GettingStarted.jsx`
  - `frontend/src/pages/Channels.jsx`

### Notes
- Frontend production build now passes after fixing invalid JSX text in `frontend/src/components/admin/AdminLayout.jsx` (`&larr; Exit Admin Mode`).

## [2026-03-10] — Realtime Inbox Socket.io Fix

### Fixed
- **Inbox not realtime**: Socket.io client in `Inbox.jsx`, `Layout.jsx`, and `CampaignDetails.jsx` was connecting without transport configuration, causing failures behind Nginx/QUIC proxies. Added `transports: ['polling', 'websocket']` (starts with polling, then upgrades to WS), reconnection config, and connection error logging.


## [2026-03-10] — Meta Messenger/Instagram Integration Fix

### Fixed
- **Messenger/Instagram replies not sending**: `metaApi.js` `sendMetaMessage()` was posting to the WhatsApp Cloud API endpoint — which doesn't work for Messenger or Instagram. Rewrote with 3 separate methods per official Meta docs:
  - **Messenger**: `POST graph.facebook.com/{PAGE_ID}/messages` with `messaging_type: RESPONSE` + `access_token` query param
  - **Instagram**: `POST graph.instagram.com/{IG_ID}/messages` with Bearer token (different host!)
  - **Unified**: `sendMetaMessage()` auto-routes based on `instance.channelType`
- **WhatsApp status casing**: `metaWebhookController.js` stored delivery statuses as `DELIVERED`/`READ` (uppercase) while all dashboard/stats code expected lowercase. Unified to lowercase.


## [2026-03-10] — Security & Codebase Audit Patches

### Added
- **Webhook Security**: Created `verifyWebhookContext.js` middleware to mandate an `apikey` or `x-webhook-secret` header on all Evolution API webhook requests, preventing spoofing and unauthorized access.

### Changed
- **CORS Lockdown**: Tightened the CORS origin regex in `server.js` from `/\.sslip\.io$/` to strictly match the Coolify VPS subnet (`/^https?:\/\/[a-z0-9-]+\.72\.62\.50\.238\.sslip\.io$/`), eliminating widespread cross-origin vulnerabilities.
- **Production Error Masking**: Updated the global error handler in `server.js` to return generic "Internal server error" messages when `NODE_ENV === 'production'`, preventing Prisma SQL query and schema leakage.
- **Local DB Security**: Restricted PostgreSQL port binding to `127.0.0.1:5433` in `docker-compose.dev.yml` to prevent accidental public exposure.

## [2026-03-10] — Deep Audit: Bug & Feature Fixes

### Fixed
- **Scheduled/Resumed Campaigns Media Loss**: `schedulerService.js` and `campaignController.js` (resumeCampaign) were not passing `mediaUrl`/`mediaType` to the queue, causing media-attached campaigns to send text-only messages after scheduling or resuming.
- **AI Agent Working Hours Crash**: `agent.service.js` used `now.toLocaleLowerCase()` (nonexistent method), causing a runtime crash when any agent had working hours enabled. Replaced with correct `toLocaleDateString().toLowerCase()`.
- **AI Agent ADD_COMMENT Crash**: `agent.service.js` tried to create `ContactNote` with wrong fields (`contactNumber` instead of `contactId`, nonexistent `type` field, missing required `userId`). Rewrote to properly find/create Contact and use admin user as note author.
- **Dashboard Instance Name**: `dashboardController.js` queried `Instance.name` which doesn't exist in the schema. Fixed to use `Instance.instanceName`.
- **Dashboard SQL Safety**: Replaced `$queryRawUnsafe()` with `$queryRaw` tagged template literal in `dashboardController.js` to prevent future SQL injection risk.
- **Message Status Casing**: `queueService.js` stored statuses as `'SENT'`/`'FAILED'` (uppercase) while all other code expected lowercase. Unified to lowercase `'sent'`/`'failed'`.
- **Meta Webhook Opt-out**: `metaWebhookController.js` used a hardcoded 3-keyword array `['stop', 'unsubscribe', 'الغاء']` instead of the tenant's configured opt-out keywords from the database. Now fetches from tenant settings (same as Evolution webhook handler).

### Changed
- **Socket.io CORS**: Restricted Socket.io CORS from wildcard `"*"` to specific Coolify VPS origins and localhost dev servers in `socketService.js`.
- **Schema**: Added missing `createdAt` field + index to `Message` model in `schema.prisma` (dashboard timeline queries depended on it).
- **Dead Code Cleanup**: Removed orphaned link-shortener comments (~20 lines) from `campaignController.js`.

---

## [2026-07-14] — Dashboard Enhancement

### Fixed
- **Dashboard blank data**: `dashboardController.js` crashing due to unsupported `where` inside `_count.select` in Prisma `findMany`. Removed invalid filter — all stats now load correctly.

### Added
- **Backend `getStats`**: Added `disconnectedInstances`, `openConversations`, `pendingConversations`, `recentFailed` (last 2 days), `topKeywords` (last 200 incoming msgs), `avgResponseTime` (SQL lateral join, 7d), `leadsByStage` with %, `teamTotal`, real `contacts` count from `Contact` table.
- **Dashboard UI**: Campaigns stat card, Open/Pending mini-cards, Recent Campaigns list, Disconnected Channels alert, Avg Response Time card, Failed Messages (2d) list, Top Keywords tags, Team progress bars, Leads Pipeline section.

---

## [2026-03-06] — WhatsApp Cloud API Connect Flow (06:55 AM)

### Added

- **WhatsApp Cloud API Connect Form**: Added `whatsapp_cloud` config to `ConnectChannel.jsx` with Meta-native form fields: Phone Number ID, WABA ID, and Permanent Access Token — each with helper text pointing to Meta Business Suite.
- **WhatsApp Cloud API Help Docs**: Enriched `ChannelHelp.jsx` with comprehensive documentation including a QR vs Cloud API comparison table, prerequisites checklist, and 6-step connection guide.
- **Smart Channel Form Logic**: `ConnectChannel.jsx` now differentiates 4 channel types: WhatsApp QR (name + QR scan), WhatsApp Cloud API (3 API fields), Messenger/Instagram (page selector + token), and generic channels (API token).

---

## [2026-03-06] — Channel Management System (06:40 AM)

### Added

- **Two-View Channels Page**: Refactored `Channels.jsx` into a dual-view system — "My Channels" (connected channel cards with Manage buttons + status indicators) and "Channel Catalog" (with back navigation arrow).
- **Channel Management Page**: Created `ChannelManage.jsx` — a full-screen sidebar+content management page at `/channels/manage/:instanceId` with per-channel navigation tabs.
  - **Configuration Tab** (all channels): Editable channel name, chat link, phone number, connection status, Save Changes, Danger Zone (delete).
  - **Templates Tab** (Messenger/WhatsApp Cloud): Message template management UI with sync functionality.
  - **Private Replies Tab** (Messenger/Instagram): Auto-reply to post comments with post tracking and eligibility rules.
  - **Chat Menu Tab** (Messenger): Persistent chat menu builder with Payload/URL button types.
  - **Troubleshoot Tab** (all channels): Numbered troubleshooting steps, Refresh Permission button (Meta), platform status page links.
- **Backend Endpoints**: Added `GET /api/instances/:id/details` (single instance with status sync) and `PATCH /api/instances/:id` (update channel name with duplicate checking).
- **Full-Width Layout**: Added `/channels/manage` to full-screen mode in `Layout.jsx`.
- **Routing**: Added lazy-loaded `/channels/manage/:instanceId` route in `App.jsx`.

---

## [2026-03-06] — Phase 7: Help Center Expansion & Product Alignment (05:50 AM)

### Added

- **Unified Help Center Hub**: Launched a comprehensive landing page at `/help` with high-fidelity collection cards for all major product categories, featuring categorized search and premium dark theme layout. (03:10 AM)
- **Product Help Hub**: Created a dedicated navigation hub at `/help/product` that serves as the central documentation tree for core platform features (Contacts, Inbox, Campaigns, AI Agents, Workflows). (03:45 AM)
- **AI Agent Actions Documentation**: Authored granular guides for AI Agent Actions at `/help/ai-agents/actions`, detailing the configuration of 8 distinct neural response behaviors. (04:15 AM)
- **Dynamic Help Routing Engine**: Implemented `FeatureHelp.jsx` to dynamically serve multi-topic documentation based on URL parameters, ensuring scalable content management for all platform modules. (04:30 AM)
- **Premium Navigation Assets**: Migrated to a professional, high-fidelity sidebar icon set and integrated official brand logos (WhatsApp, TikTok, Meta) across the Channel Catalog for enterprise-grade visual identity. (04:45 AM)
- **Internal Knowledge Shortcuts**: Directly linked the "Learn how to write this" UI hook in the AI Agent editor to the local Help Center, replacing external redirects with native product guidance. (05:20 AM)
- **Context-Aware Header Links**: Integrated direct documentation shortcuts in the headers of Contacts, Campaigns, Integrations, and Workflows modules, enabling users to access help without leaving their task context. (05:40 AM)
- **Seamless Sidebar Navigation**: Updated `Layout.jsx` to treat the "Help Center" entry as an internal application route, ensuring faster loading and persistent UI state. (05:45 AM)
- **Critical Build Recovery**: Resolved production build failure caused by stale React Router imports in `App.jsx` after the support hub migration. (05:55 AM)
- **Product Roadmap Refresh**: Updated the public `/roadmap` to reflect "Recently Launched" milestones (Multi-Channel Inbox, Help Center) and current Q1 focus (Mobile App, Shopify). (05:58 AM)

## [2026-03-06] — Phase 5: Multi-Channel Inbox

### Added

- **Multi-Channel Inbox (Phase 5)**: Fully integrated Facebook Messenger and Instagram Direct into the unified chat experience.
- **Channel Icons**: Platform-specific identifiers for WhatsApp, Messenger, and Instagram across all chat views.
- **Media Messaging**: Implemented full support for images, videos, and files for both WhatsApp and Meta channels.
- **Intelligent Routing**: Automatic API selection (Evolution vs Meta Graph) based on conversation channel type.
- **Robust Webhooks**: Unified handler for all Meta platforms with platform detection and media extraction.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Media Sending Regression**: Fixed a bug where media attachments sent from the dashboard across all channels were being transmitted as plain text.
- **Auto-Sync Reliability**: Prevented non-WhatsApp instances from triggering Evolution API errors during background chat syncing.
- **Identifier Formatting**: Ensured platform-specific IDs (PSIDs) are not erroneously formatted as phone numbers.

---

## [2026-03-06] — Phase 4: Saved Segments & Retargeting

### Added

- **Saved Segments UI**: Added a sleek "Save Segment" modal to the Contacts page (`Contacts.jsx`) enabling users to persist complex search & filter rules.
- **Dynamic Segment Broadcasting**: Added a new "Saved Segment" audience tab to the `NewCampaign.jsx` campaign builder, letting users seamlessly target refined subsets of their CRM.
- **Backend Infrastructure**: Built `segmentController.js` and `/api/segments` routes to execute dynamic contact querying based on stored JSON rules via the `crmService`.
- **Database Schema**: Expanded `schema.prisma` natively with a `SavedSegment` model and connected `savedSegmentId` integrally into ongoing `Campaign` deployments.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Deployment Crash**: Resolved a critical `MODULE_NOT_FOUND` error in `segments.js` caused by a non-existent auth middleware import. Switched to the established `tenantContext` middleware.

---

## [2026-03-05]

### Added

- **Google Integrations**: Added manual connection options for Google Drive, Google Calendar, and Gmail to the Integrations page (`Integrations.jsx`). Users can now provide Service Account JSONs or App Passwords to link these services.
- **Integrations UI Redesign**: Fully completely revamped `Integrations.jsx` to adopt the platform's standard `glass-card` look with vibrant type-specific colors, hover effects, and a modern dark theme add-service modal.
- **Inbox Snippets Integration**: Unified Snippets and Templates in the Inbox (`ChatWindow.jsx`). Typing `/` now brings up a combined picker with visual badges to easily deploy both snippet shortcuts and dynamic templates into messages.
- **Agent Tag Actions**: AI Agents can now add (`ADD_TAG`) and remove (`REMOVE_TAG`) contact tags/labels autonomously based on conversation context. Tags are created automatically if they don't exist.
- **Agent Google Calendar Tools**: AI Agents can create events and list upcoming events on Google Calendar via DeepSeek function calls. Tools are dynamically loaded based on `actionConfig` and linked to tenant Integrations.
- **Agent Tool Integration Linking**: New `integrationId` field on `AgentAction` model links agent tools to authenticated Integration credentials (Prisma schema update).
- **Agent Action UI Expansion**: Added 4 new ActionCards in the Agent Editor: Tag Injection, Tag Removal, Calendar Create Event, and Calendar Read Events — each with integration selector dropdowns.
- **AI Agent Action Overhaul (Respond.io Replica)**: Completely redesigned the AI Agent actions system.
  - New `RichTextarea` component with real-time `@mention`, `{{variable}}`, and `%tag` suggestions.
  - Standardized 8 core actions with real-time backend execution.
  - **Agent Preview Tabs**: Added "Chat" and "Contact fields" tabs to the preview mode for real-time action verification.
  - **Real-time Sync**: Agent actions (tags, lifecycle, assignee) now update the mock contact fields instantly in the preview window.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Missing Dependency**: Resolved a Vite import-analysis error by running `npm install` to restore the missing `@react-oauth/google` package.
- **Contact Fields UI**: Fixed issue where custom fields were not rendering or improperly saving in the Inbox sidebar (`ContactSidebar.jsx`) and Contact Details page (`ContactProfile.jsx`) by syncing components with the global definitions API endpoints.
- **Lifecycle Stages Settings**: Rewrote `LifecycleSettings.jsx` from hardcoded static data to a fully functional CRUD page connected to `/api/lifecycle`. Added missing `DELETE /api/lifecycle/:id` route.
- **AI Knowledge Base Buttons**: Fixed non-functional "Upload Document" and "Add Text Source" buttons in `AIKnowledgeSettings.jsx` by adding modal forms connected to the backend knowledge API.
- **Tags in Inbox**: Connected Tags from Settings to the Inbox sidebar label suggestions, so pre-created tags now appear as options when adding labels to contacts.
- **UI Unification**: Renamed "Labels" to "Tags" everywhere.
- **Group Response Removal**: Removed all "MULTI-CHANNEL SYNC" and group response logic to focus on 1-on-1 CRM interactions.
- **Improved Rich Editor**: Refined trigger detection and fixed suggestion list clipping in ActionCards.

---

## [2026-03-04] — Phase 12: Onboarding Wizard

### Added

- **Onboarding Pipeline**: New 3-step mandatory onboarding wizard (`Onboarding.jsx`) for new signups collecting Organization, Role, and Survey data.
- **Database Schema**: Added `onboardingCompleted`, `industry`, `website`, `orgSize`, `customerType`, `chatPurposes`, `referralSource` to `Tenant` model, and `name`, `phone`, `orgRole` to `User` model.
- **Backend Flow**: New `POST /api/onboarding` endpoint to save wizard progress securely.
- **Auth Redirects**: Intelligent routing in `App.jsx`, `Login.jsx` and `Register.jsx` to intercept users who haven't completed onboarding and redirect them transparently to the wizard.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Onboarding UI Behaviors**: Fixed unclickable Checkboxes and Radio buttons in "Org Size" and "Chat Purposes" selections within the wizard.

### Changed

- **Email Templates Redesigned**: Switched to a sleek dark theme (`#0f0f12`) inline HTML structure. Embedded the branded `valuewats-animated-loader.svg` as a central Base64 logo. Applied to OTP and Team Invitation emails.

### Changed

- **Campaigns UI**: Replaced generic loading spinners with the branded `ValueWatsLoader` and updated the header megaphone icon to use `valuewats-broadcast.svg`.

---

## [2026-03-04] — Phase 11: Auth Pages Redesign & Google OAuth

### Added

- **Google OAuth Sign-In/Sign-Up**: Full Google authentication flow using `@react-oauth/google` (frontend) and `google-auth-library` (backend). Users can now sign in or create accounts with one click via Google.
- **Password Strength Validator**: Signup form now enforces 5 password requirements with real-time visual feedback (8+ chars, uppercase, lowercase, number, special char).
- **Show/Hide Password Toggle**: Both Login and Register pages have eye icon toggles for password visibility.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Google OAuth Popup Crash**: Fixed `Cross-Origin-Opener-Policy` block caused by `helmet.js` in the backend preventing Google Sign-In popup from completing the transform redirect.

### Changed

- **Login & Register UI Overhaul**: Redesigned both pages from light/white theme to a premium dark glassmorphic theme (`#0f0f12` background, indigo accents, `#7d8cf0` CTA buttons).
- **Backend auth route**: New `POST /api/auth/google` endpoint verifies Google ID tokens, finds or creates users automatically.
- **Frontend Provider**: App wrapped with `GoogleOAuthProvider` in `main.jsx`.

---

## [2026-03-04] — Phase 10 & 6.2: Marketing & Legal Pages

### Added

- **Landing Page Enchancements**: Completely rebuilt the landing page to feature high-conversion sections inspired by Respond.io.
  - Added Interactive Demo placeholder video area.
  - Added "Capture, Convert, Retain" three pillars strategy workflow section.
  - Added ROI metrics ribbon (Higher Conversion, Faster Resolutions).
  - Added Unified Omnichannel Inbox visualizer syncing WhatsApp, Meta, & Instagram in one screen.
  - Added G2 Badges / Social Proof trust ribbon.
  - Added 6-card Bento Grid presenting core features with user-provided high-quality screenshots (Neural Lab, Module Configuration, Lifecycle Stages, Dashboard, Smart Inbox, Visual Automations).
- **Pitch Deck README**: Created a new `PITCH_README.md` and updated the main repository `README.md` with an investor-ready pitch including the 6-card feature screenshots, problem/solution statement, architecture map, and ROI metrics.
- **Public Layout & Mega Menu**: Added `PublicLayout.jsx` with an interactive, scroll-aware, glassmorphic navbar including desktop Mega Menus for "Product" and "Resources".
- **Marketing Shell Pages**: Stubbed out routes and React components for Pricing, About Us, Roadmap, Contact Us, and Why Us.
- **Resources Hub shells**: Stubbed routes and React components for Blog, Support Center, and Free Tools.
- **Legal Stub Pages**: Stubbed out routes and React components for Privacy Policy, ToS, Cookie Policy, Security, Subprocessors, and DPA.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **React Router Navigation**: Added a `ScrollManager` wrapper inside `BrowserRouter` in `App.jsx` to smoothly scroll anchor hashes `#features` and `#ai`. Added fallback routing `/*` mapping to the landing page. Fixed unhandled links pointing to absent pages.

---

## [2026-03-04] — Phase 6: Internal Notes

### Added

- **Internal Notes (Inbox)**: Added the ability for team members to leave internal notes on a contact directly from the Inbox Chat Sidebar. These notes are attached to the contact profile and visible to all users.
- Updated `getConversation` backend to attach contact notes and handle user attribution.

---

### Added & Changed

- **Campaigns UI Redesign**: Completely overhauled `Campaigns.jsx` to match the premium "Respond.io" glassmorphic CRM theme. Features table-view, dynamic status pills, and backdrop-blur styling.
- **New Campaign UI Redesign**: Completely overhauled `NewCampaign.jsx` with the same premium glassmorphic CRM theme, restyling input forms, variants, and scheduler blocks.
- **AI Agent Assignment**: `Inbox.jsx` assign dropdown now successfully renders AI Agents alongside human team members.
- **Agent Session Tracking**: `chat.service.js` successfully creates and tracks `ConversationAgent` records (start/end) when manual human-to-AI or AI-to-human assignments happen via the Inbox UI.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- Fixed channel visibility issue by adding missing `tenantContext` middleware to protected backend routes.
- Fixed AI Agent configuration sync logic in `Agents.jsx` to prevent state loss/corruption.
- Fixed `isSuperAdmin` flag missing from authentication response payload.
- **Inbox**: Fixed an issue where clicking on a chat would not open the conversation due to a missing Prisma Schema relation `user` in `ContactNote`.
- **Campaigns**: Fixed a React build syntax error (missing closing tags) in the `NewCampaign.jsx` page.

---

## [2026-03-04] — Phase 3: Respond.io AI & Settings Completion

### Added

- **Automatic Lifecycle Transitions**: Added `/settings/automation` to define `LifecycleRule` entities. System now tracks trigger actions (add tag, update field) to automate transitioning contacts to a target stage.
- **Lifecycle Rules API**: New backend CRUD routes at `/api/lifecycle-rules` and Prisma `LifecycleRule` model.

---

## [2026-03-04] — Phase 2: Respond.io UI Replication

### Added

- **Unified Settings Module**: Implemented a multi-tab sidebar layout at `/settings` grouping: General, Users & Roles, Contact Fields, Tags, Lifecycle Stages, and Integrations.
- **`SettingsLayout.jsx`**: New internal layout component with sidebar navigation for the Settings module.
- **Contact Fields Settings UI**: Full CRUD management page for global `ContactFieldDefinition` entries.
- **Tag Management UI & Backend**: New `/api/tags` backend CRUD routes and a dedicated Settings page for managing global contact labels.
- **Lifecycle Stages Settings**: Visual pipeline management page with emoji-coded stage cards.
- **Bulk Tag Assignment**: Contacts list now supports multi-select → bulk assign tags via a floating toolbar dropdown.
- **Bulk Lifecycle Stage Change**: Contacts list supports multi-select → bulk change lifecycle stages.
- **Per-Contact Label Assignment API**: New `POST /contacts/:id/labels` endpoint enabling label assignment from bulk actions.
- **Contact Custom Field Values API**: New `GET /contacts/:id/fields` endpoint to retrieve field values for the contact profile.
- **Dynamic Custom Fields in Contact Profile**: `ContactProfile.jsx` now renders all `ContactFieldDefinition` entries with type-aware inputs (text, number, date, dropdown).
- **Enhanced Activity Timeline**: Always-visible timeline with typed icons (lifecycle, tag, assignment, note) and proper empty state messaging.

### Changed

- **Sidebar Navigation**: Replaced separate "Team" and "Integrations" sidebar items with a unified "Settings" entry. Legacy routes redirect automatically.

---

## [2026-03-04]

### Added

- **Public Marketing Site**: Created a robust public-facing marketing site (`Landing`, `About`, `Roadmap`, `Contact`, `Pricing`, `Why Us`) featuring dark-mode glassmorphism and stunning aesthetics.
- **Mega Menu Navigation**: Built a respond.io-style Mega Menu in `PublicLayout` with dropdowns for Product, Resources, and Company.
- **Resources Hub**: Implemented resource pages including `Support` (Help Center), `Learn` (Blog/Guides), and `Tools`.
- **Legal Trust Center**: Developed a comprehensive suite of legal pages (`PrivacyPolicy`, `TermsOfService`, `CookiePolicy`, `Security`, `Subprocessors`, `DPA`) accessible via a structured `LegalLayout` sidebar.
- **Orbiting Circles Integration**: Added the MagicUI OrbitingCircles animation component to visually represent AI agent integrations on the Landing page.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Inbox Crash Error**: Fixed a 500 error preventing WhatsApp threads from loading properly. Root cause was an invalid invalid field `name` queried inside the `ContactNote` prisma include block in `chat.service.js`.

### Changed

- Re-routed the base URL `/` to the new `Landing` page and moved the authenticated dashboard to a protected wrapper.

---

## [2026-03-04] — Architecture & Data Integrity Overhaul

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Prisma Client Connection Leak**: Replaced `new PrismaClient()` with shared singleton from `config/database.js` across 17 files (controllers, services, routes). Prevents connection pool exhaustion under load.

### Added

- **`ContactFieldDefinition` model**: New Prisma model for centralized "Global Field" definitions (respond.io-style). Supports field types: text, number, date, dropdown, url, email, phone.
- **`contactId` FK on `Conversation`**: Links conversations to CRM contacts with a real foreign key instead of implicit `contactNumber` matching.
- **Contact auto-creation on webhook**: `webhookController.js` now auto-creates a `Contact` record and links it to the `Conversation` when a new WhatsApp message arrives.
- **`/api/contact-fields/definitions`**: New CRUD API route for managing global contact field definitions, including a seed endpoint for default fields.
- **Template Variable Engine**: Expanded template replacement in `ChatWindow.jsx` to support `{{name}}`, `{{phone}}`, `{{email}}`, `{{date}}`, and `$contact.*` syntax.
- **AI Agent Real-time Responses**: Fixed `webhookController.js` to capture `prisma.chatMessage.create()` return value and emit via `socketService.emitChatMessage()` so AI replies appear instantly in Inbox.

### Changed

- **Schema**: Added `conversations` relation on `Contact`, `contactFieldDefinitions` on `Tenant`.

---

## [2026-03-04] — Inbox Core Bug Fixes

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Sender Name Overwrite**: Fixed `webhookController.js` so it doesn't overwrite the contact's name with the agent's (`pushName`) when an outgoing message is sent.
- **Custom Fields Empty States**: Fixed `ContactSidebar.jsx` so global custom fields aren't deleted if saved with empty values. They are now persistently rendered.
- **Template Variables**: Fixed `ChatWindow.jsx` templates picker so `{{name}}` variables automatically compile and replace with the contact's actual name.
- **Media Output Rendering**: Added 'sticker' media type parsing in `webhookController.js` and fixed `ChatWindow.jsx` so stickers, videos, and images don't render as an ugly fallback `[Media Content]` but display their respective UI elements natively.

---

## [2026-03-04] — Campaigns UI Redesign

### Changed

- **Campaigns List page** (`/campaigns`): Redesigned to premium dark theme (`bg-zinc-900`), replacing white cards with sleek glassmorphic ones. Updated empty state UI and CampaignStatus badges to elegant solid colors.
- **Campaign Details page** (`/campaigns/:id`): Migrated to the unified dark theme. Upgraded stats grid with glass background and solid progress bars. Modernized the action buttons (`btn-premium`, `btn-glass`), created a sleek message preview, and restyled the failed messages table and edit modal to seamlessly fit the dark interface.

---

## [2026-03-04] — Inbox Feature Audit & Complete Fix

### Added

- **Emoji Picker**: Inline emoji grid (4 category groups, no external deps) in `ChatWindow.jsx` composer
- **Formatting Toolbar**: WhatsApp markdown buttons (Bold `*`, Italic `_`, Strike `~`, Mono `` ` ``) with toggleable format bar
- **File Attach**: Hidden file input in composer → calls `POST /api/chat/messages/upload`. Supports images, video, PDF, docs
- **AI Assist**: Full DeepSeek integration in `POST /api/chat/ai-assist`. Shows suggestion banner with "Use" button in composer
- **Templates Panel**: Floating panel above composer shows all templates from `/api/templates`. Click to insert content
- **Quick Reply**: Typing `/` auto-triggers the templates panel
- **Conversation Search**: 🔍 in ChatWindow header toggles inline search bar that highlights matching messages
- **3-dot Menu**: Dropdown in ChatWindow header — Close Conversation, Reopen, Copy Number, Mark as Unread
- **Labels Feature**: Full labels system in `ContactSidebar.jsx` — add/remove colored label chips, suggestions from existing labels, persisted to `conversation.labels[]` via `PUT /contact`
- **Labels Filter**: `InboxFiltersSidebar.jsx` now fetches all tenant labels and shows them as filter buttons
- **Closed Conversation Banner**: Yellow banner shown in ChatWindow when `conversation.status === 'closed'` with Reopen button
- **Team Inbox Filter**: New filter showing conversations assigned to any human user
- **AI Bot Chats Filter**: New filter (renamed from "AI Instance Emulator") showing conversations with an AI agent assigned
- **Backend `GET /api/chat/labels`**: Returns all unique label values across tenant's conversations
- **Backend `POST /api/chat/ai-assist`**: DeepSeek reply suggestion endpoint
- **Backend `PUT /api/chat/conversations/:id/status`**: Close/open/pending status toggle

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **`dangerouslySetLabel` Bug**: `ContactSidebar.jsx` line 250 had wrong prop name → fixed to render emoji as plain text
- **`PlusIcon` Missing**: Was used but not imported in `ContactSidebar.jsx`
- **`ChatBubbleLeftRightIcon` Missing**: Was used in `ChatWindow.jsx` empty state but not imported → would crash on empty conversation
- **Lifecycle Stage Crash**: The above `dangerouslySetLabel` bug was preventing the stage dropdown from rendering at all
- **Search Bar Not Connected**: `ConversationList.jsx` MagnifyingGlassIcon button did nothing → now toggles search input that filters conversations
- **Create AI Agent Button**: Was a dummy button → now navigates to `/agents` via `useNavigate`
- **AI Instance Emulator**: Renamed to "AI Bot Chats" and now works as an actual filter

### Changed

- `InboxFiltersSidebar.jsx` — Restructured into proper sections with real filter logic. Added labels section. Custom Inbox shows "Coming Soon"
- `ConversationList.jsx` — Labels now shown as colored chips in conversation preview. Search is a real input. `label_` filter prefix added
- `ContactSidebar.jsx` — Name edit moved into dedicated input row. Labels section fully redesigned with color hash system
- `ChatWindow.jsx` — Fully rewritten. Instance selector now a `<select>` when multiple instances exist. Closed banner added

---

## [2026-03-04] — WhatsApp Anti-Ban System (Phases 1-3)

### Added

- **Anti-Ban: Randomized Delays**: `queueService.js` now enforces 15-25 second random delay between messages (configurable per campaign). Frontend slider min set to 15s.
- **Anti-Ban: Spintax & Invisible Chars**: Each outgoing message gets random zero-width Unicode characters appended. `{{rand}}` and `{{date}}` variables auto-inject randomized content.
- **Anti-Ban: Typing Presence**: Added `evolutionApi.sendPresence()` that triggers "composing..." status 2-4 seconds before each message is dispatched, mimicking human behavior.
- **Phase 2 — Plan Limits**: Added `Plan` model to `schema.prisma` with per-tier limits (`maxMessagesPerDay`, `maxContactsPerCampaign`, `maxInstances`, `workingHoursEnabled`).
- **Phase 2 — Tenant.planId**: Added FK relation from `Tenant` to `Plan` so limits are enforced automatically.
- **Phase 2 — Limit Enforcement**: `campaignController.js` now loads the tenant's plan and blocks campaign creation if contact count exceeds `maxContactsPerCampaign`.
- **Phase 3 — Opt-out Blacklist**: Added `blacklisted` and `blacklistedAt` fields to `Contact` model.
- **Phase 3 — Opt-out Detection**: `webhookController.js` now checks incoming messages for stop keywords (`وقف`, `stop`, `إلغاء`, etc.), marks the contact as blacklisted, and sends a confirmation reply.
- **Phase 3 — Blacklist Filter**: `campaignController.js` filters out all blacklisted contacts before adding any jobs to the BullMQ queue.
- **Migration**: `20260304000000_add_plans_and_blacklist` — SQL migration for `plans` table, `tenant.plan_id`, and `contact.blacklisted`.
- **Seed Script**: `prisma/seedPlans.js` — Upserts 3 default plans (basic/pro/enterprise) with appropriate limits.
- **Docs**: Created `docs/BACKEND_GUIDE.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_REFERENCE.md`, `docs/FRONTEND_GUIDE.md`.
- **Phase 4 — Working Hours Queue Delay**: `queueService.js` now uses `getWorkingHoursOffset` to hold scheduled campaigns and push them to the BullMQ queue at the exact moment the plan's working hours begin.
- **Phase 4 — Working Hours Param**: Evaluated plan params passed down from `campaignController.js` to `queueService.js`.
- **Phase 5 — Global Template Model**: Added `GlobalTemplate` to `schema.prisma` and generated manual SQL migration `20260304000001_add_global_templates`.
- **Phase 5 — Templates API**: Build fully isolated CRUD routes (`/api/templates`) in backend mapped in `server.js` using `tenantContext`.
- **Phase 5 — Templates UI**: Created a new sophisticated frontend library page `Templates.jsx` to draft, categorize, delete and copy templates. Accessible via sidebar.
- **MCP**: Enabled `ssh-vps` and `redis-valuewats` MCP servers in `mcp_config.json`.

### Changed

- `NewCampaign.jsx` — Default delay changed from 5/15s to 15/25s. Slider minimum set to 15s.
- `campaignController.js` — Default `delayMin`/`delayMax` now 15/25 seconds.

### Notes

- **DEPLOY REQUIRED**: Run `npx prisma migrate deploy` in Coolify terminal after pushing this commit.
- **SEED REQUIRED**: Run `node prisma/seedPlans.js` to create the 3 default plans.
- **Phase 1 (EVOLUTION_API_URL fix)** is still pending — needs the correct `.sslip.io` URL from user.

---

## [2026-03-03] — Meta WhatsApp Cloud API Integration

### Added

- **Meta Cloud API**: Complete native integration replacing Evolution API
- **Services**: `metaApi.js` — send text/media messages, download media from Meta
- **Webhook**: `metaWebhookController.js` — handle incoming messages and status updates from Meta
- **Schema**: Added `phoneNumberId` and `accessToken` fields to `Instance` model
- **Migration**: `20260801000000_add_meta_fields_to_instance` — Meta Cloud API support
- **Routes**: Added `/api/webhooks/meta` (GET verification + POST events)
- **Documentation**: `META_WHATSAPP_API.md` and `META_SENDING_MESSAGES.md`
- **Documentation**: `META_EMBEDDED_SIGNUP_GUIDE.md` — Technical guide for implementing Meta's Embedded Signup for Tech Providers (BSP)

### Changed

- **Architecture**: Transitioned from Evolution API to Meta WhatsApp Cloud API
- **Webhook**: Meta webhook verification now working with proper token validation
- **Instance Management**: Support for Meta Phone Number ID instead of QR codes

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Webhook Verification**: Improved Meta webhook verification format and logging
- **Token Handling**: Fixed corrupted access token in environment variables

---

## [2026-03-01] — Agent Actions & UI Refinements

### Added

- **Inbox Custom Fields Sync**: Completely refactored `ContactSidebar.jsx` to dynamically render custom fields and allow adding infinite new fields on the fly. Fields are strictly synced and upserted back to the `ContactField` and `Contact` models upon saving.
- **Inbox Dynamic Functional Filters**: Connected `Inbox.jsx`, `InboxFiltersSidebar.jsx`, and `ConversationList.jsx` states to enable fully functional live filtering across categories (All, Mine, Unassigned, Unread).
- **Dynamic Leads Status Badges**: Added logic to dynamically render CRM Lifecycle Stages correctly mapped with custom colors in the ConversationList and ChatWindow (replacing the hardcoded "New Lead").
- **Team Assignment**: Upgraded the chat assignment functionality to populate from actual team members (Users) instead of AI agents.
- **Team Insights Dashboard**: Introduced a new "Team Insights" section ranking team members by their number of replies.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Unread Toggle Fixed**: Restored functionality to the Unread toggle button in the Inbox to correctly parse local `unreadCount`.
- **Group Chat Names Overriden**: Fixed `webhookController.js` pulling the `pushName` of individual senders on group chats and using it to override the conversation name by bypassing assignment logic for IDs containing `@g.us`.
- **Team Assignment ID Nullification**: Fixed a payload bug in `ContactSidebar.jsx` where selecting a team member sent an `agentId` instead of a `userId`, resulting in missing selections on the server.
- **Inbox Flex Layout (Sidebar Cutoff)**: Fixed `.inbox-main` flex-direction CSS bug. Changing it to `row` ensured the ContactSidebar renders correctly on the right side instead of cutting off underneath the chat window.
- **Agent Actions Trigger Nullification**: Fixed `processMessage()` in `agent.service.js` where the `buildSystemPrompt()` function injection logic was completely skipped, causing valid actions (like `CLOSE_CONVERSATION`) to be ignored by the LLM.
- **Inbox Contact & Group Names**: Resolved issue where Webhook messages would arrive without `pushName` being saved to the database. Modified `webhookController.js` and `chat.service.js` to correctly pass and attach `contactName` for both 1-on-1 and Group chats. Group chats are now reliably synced.

### Changed

- **Premium Agent Configuration UI**: Completely refactored `Agents.jsx`. The legacy 3-tab system (Core, Skills, Database) has been flattened into a sleek, premium single-page vertical architecture for much faster configuration and zero context switching.
- **Inbox "Channel Source" Indicator**: Streamlined the `ChatWindow.jsx` header. Reduced visual clutter by converting the dropdown `<select>` into an elegant static channel label, while preserving auto-routing instance logic internally.
- **Premium Inbox UI Redesign (Facebook Messenger Style)**:
  - Implemented a collapsed "Thin Sidebar" in App Layout strictly for the Inbox page to maximize space.
  - Created a new inner `InboxFiltersSidebar.jsx` containing structured filters (All, Mine, Unassigned, Lifecycle Stages).
  - Redesigned `ConversationList.jsx` to feature a dark UI with top Tabs (Chats/Calls) and clean unread counts.
  - Revamped `ChatWindow.jsx` header into a sleek minimalist bar.
  - Redeveloped the input Composer area to look modern and integrated an "AI Assist" button aesthetic.
  - Darkened all backgrounds to `flat black #000000 / #0f0f11` to closely match a high-fidelity conceptual mockup.

---

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **AI Agent Field Mismatch**: Harmonized `model` vs `aiModel` field names across the stack. Added a mapping in `agent.routes.js` and updated `Agents.jsx` to use `aiModel`, resolving `PrismaClientValidationError`.
- **AIAgent Update 500 Error**: Implemented strict field filtering in `agent.routes.js` to prevent non-schema fields (like `actionConfig`) from crashing Prisma.
- **AI Agent Routing**: Updated `agent.service.js` and `deepseek.service.js` to correctly pass and use the configured agent model.
- **Backend Startup Crash**: Fixed `MODULE_NOT_FOUND` error caused by a leftover `linkShortener` import in `queueService.js`.

### Added

- **Inbox Sync Feature**: Added a "Sync" button to the Inbox to fetch historical chats and recent messages from Evolution API, resolving the "empty inbox" issue for newly connected instances.

---

## [2026-02-25] — Production Crash Fix & Infrastructure Recovery

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Backend Startup Crash**: `pdf-parse` was loaded at module level via `require('pdf-parse')` in `knowledgeService.js`. On Node.js v22, this triggers PDF.js browser polyfill code at startup which crashes the server. Fixed by moving `require('pdf-parse')` inside the `case 'pdf'` block (lazy load — only loads when a PDF is actually uploaded).
- **Evolution API Down**: Container was stopped. Restarted via Coolify dashboard.
- **Evolution API DB Auth Failure**: Evolution API was using wrong PostgreSQL credentials (`N2L1pFu2Qh4x1dYQ`) against the wrong host (`postgres:5432`). Fixed `DB_POSTGRESDB_HOST` to point to the correct Coolify internal hostname.
- **Message Dispatch Freeze (Timeout)**: Sending messages via Evolution API would time out after 30s. Increased backend axios timeout to 60s and added a retry loop in `evolutionApi.js` to handle transient WhatsApp/Baileys glitches.
- **CTR Tracking Removal**: Completely removed the URL shortening and click tracking system. Deleted `linkShortener.js`, `links.js`, and removed associated routes from `server.js` and UI from `CampaignDetails.jsx`.

### Notes

- Node.js v22 is confirmed working via nixpacks (`nodejs_22` in build plan)
- The `pdf-parse` lazy load fix is backward compatible — PDF upload feature still works

---

### Added

- **Schema**: Added `Contact`, `ContactLabel`, `ContactLabelAssignment`, `ContactNote`, `ActivityLog` models to `schema.prisma`
- **Migration**: `20260724000000_add_crm_system` — creates all 5 CRM tables with indexes and foreign keys
- **Backend**: `crmService.js` — full CRUD, bulk import, label management, activity logging, upsertByPhone
- **Backend**: `contactController.js` — HTTP handlers for all CRM operations
- **Backend**: `contacts.js` route file mounted at `/api/contacts`
- **Frontend**: `Contacts.jsx` — DataTable with search, filters (stage/source), bulk delete, CSV/Excel import, label management modal
- **Frontend**: `ContactProfile.jsx` — full profile editor with notes timeline, activity log, label picker, lifecycle stage selector, chat link
- **Frontend**: Added `/contacts` and `/contacts/:id` routes to `App.jsx`
- **Frontend**: Added "Contacts" nav item with `UsersIcon` to `Layout.jsx`

### Changed

- `csvService.js` — added `parseFile()` unified entry point supporting both CSV and Excel
- `upload.js` middleware — added xlsx/xls to allowed file types
- `LifecycleStage` model — added `contacts Contact[]` relation
- `Tenant` model — added `contacts`, `contactLabels`, `activityLogs` relations

---

### Added

- **Documentation**: Completely overhauled `walkthrough.md` with detailed schemas, diagrams, and a 10-step roadmap.
- **Agent Actions**: Documented 8 respond.io-style actions (Close, Assign, Update CRM, Trigger Workflow, Add Comment, Use Tools).
- **Agent Tools**: Documented external tools (Email, Google Calendar, internal WhatsApp Notifications) with variables and auto-mentions.
- **CRM Integration**: Specified `Contact`, `ContactLabel`, `ContactNote`, and `ActivityLog` (unified feed) models in `DATABASE_SCHEMA.md`.
- **Analytics & Marketing**: Documented Analytics Dashboard (Funnel tracking), Saved Segments, Quick Replies, Auto-Create Contact, and Anti-Ban Smart Sending.
- **Webhook API**: Added specs for exposing an external Webhook API for business integrations (e.g., Shopify triggers).

### Changed

- **Docs**: Updated `API_REFERENCE.md` with the new `/api/contacts` routes and expanded `/api/agents` routes for tools/actions.
- **Docs**: Updated `FRONTEND_GUIDE.md` with the new `/contacts` and `/contacts/:id` CRM pages.
- **Docs**: Updated `PROJECT_OVERVIEW.md` and `BACKEND_GUIDE.md` to reflect the expanded scope (26 DB models, new CRM services).
- **Roadmap**: Reorganized `logs/TODO.md` into a structured 10-step execution plan prioritizing the Evolution API fix, CRM, and Agent Tools.

---

## [2026-02-24] — Deployment Fixes & Architecture Consolidation

### Changed

- **Architecture**: Merged Frontend and Backend into a single unified Coolify service. Backend now serves built frontend assets via `express.static`. This architectural shift eliminates Nginx proxying issues and "Cross-Container Communication" failures.
- **DevOps**: Updated root `package.json` with scripts to build frontend and start backend concurrently (`install:all`, `build:frontend`, `deploy`).

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Infrastructure**: Resolved `405 Method Not Allowed` by bypassing the failing Nginx proxy.
- **Database**: Fixed `PrismaClientKnownRequestError (P2022)` by adding the missing `variables` JSONB column to the `Message` table via migration.
- **Dashboard**: Fixed `TypeError` crash by implementing defensive fallback guards when fetching stats data.
- **Campaigns**: Added safety guards to prevent page crashes when the API returns malformed responses.

---

## [2026-02-21] — Premium UI Overhaul (Visual Excellence)

### Added

- **Design System**: Implemented a global premium dark theme with glassmorphism (`index.css`).
- **Layout**: Transitioned to a sidebar-first architecture with a sleek, persistent glassmorphic navigation (`Layout.jsx`).
- **Dashboard**: Redesigned analytics suite with high-fidelity `StatCard` components, interactive hover effects, and sophisticated data visualization.
- **Inbox**: Comprehensive overhaul of the chat interface featuring a unified conversation list, date-based grouping, and premium message bubble aesthetics.
- **Campaigns, Instances, Automations, Team**: Converted all remaining core pages from light theme backgrounds to the premium glassmorphism dark theme, resolving the "white square" effect and ensuring visual consistency.
- **AI Agents**: Transformed the config page into a "Neural Lab" environment with custom gradients, interactive capability cards, and a sophisticated RAG monitoring interface.
- **Components**: Added `SkeletonLoader` for various data-fetching states to improve perceived performance.

### Changed

- **DevOps**: Connected custom domain `app.muhammedmekky.com` to Coolify service. SSL enabled via Let's Encrypt.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Agents Page**: Repaired structural JSX corruption in `Agents.jsx` and standardized styling across all tabs (Identity, Settings, Skills, Knowledge).
- **Global**: Standardized scrollbars and backdrop-blur effects throughout the application for a cohesive enterprise feel.
- **Auth**: Resolved `405 Method Not Allowed` errors on Login/Register by fixing Nginx prefix stripping and implementing dual-mount route fallback in the backend.
- **Infrastructure**: Fixed production "Route not found" error by implementing static serving in `server.js` and correcting Nginx proxy paths.
- **Backend Startup**: Resolved Express 5 `PathError` crash caused by wildcard route. Replaced `app.get('*')` with RegExp `app.get(/.*/)` in `server.js`.

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

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- **Database**: Resolved `type "vector" does not exist` error by enabling extension and updating Docker image.
- **Database**: Fixed migration SQL table name mismatches (e.g., `Conversation` -> `conversations`).
- **Webhook**: Integrated AI Agent logic into `webhookController.js` to replace legacy AI fallback.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

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

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

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

## [2026-03-02] Inbox UI, Badges, and Dashboard Metrics Fixes

- Removed direct 'X' buttons from sidebars
- Implemented persistent UI toggles natively in headers
- Rewrote dashboard stats logic to merge Message and ChatMessage calculations
- Updated left Sidebar (Inbox Filters) toggle to use an expand/collapse SVG dynamically.
- Added thin vertical menu panel to the far right specifically for toggling the Contact Details menu (emulating Zendesk UX).
- Refined Dashboard calculations using actual database records and identified the migration deployment issue.

### Fixed

- **Help Center**: Fixed routing issue where `/help` pages were not loading due to missing `PublicLayout` wrapper.
- **Channels**: Fixed bug preventing WhatsApp Cloud API instances from being connected (`Invalid channel type`).
- **Channels API**: Caught unhandled Evolution API sync errors that previously crashed the GET `/api/instances` endpoint, preventing the Connected Channels view from loading.

- Fixed General Settings page crash by implementing the missing `GET /api/auth/me` endpoint to supply tenant information.
- Fixed AI Knowledge Settings page by creating a workspace-wide `GET /api/agents/knowledge` endpoint to consolidate all AI agent knowledge sources.
- Fixed `LifecycleRules.jsx` UI bugs where rule triggers weren't correctly parsing assigned tags due to missing properties.
- Fixed `ContactFieldsSettings.jsx` API routes to match the `GET /api/contact-fields/definitions` route mapped in the backend.
- Registered the missing `/api/integrations` route in `server.js` preventing the Integrations settings page from fetching connected tools.
