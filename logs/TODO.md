# TODO â€” Active Tasks & Backlog

> This file is the single source of truth for what needs to be done. Update it after every session.
> Last updated: 2026-04-08

## ðŸ”´ High Priority

- [x] 1. **Link Internal App Pages to Help Center**: Ensure all core modules (Agents, Integrations, Contacts, Campaigns) have direct links to their respective help pages.
- [x] 2. **Resolve AI Agent Response Issues** (Harmonized field names and fixed Prisma validation) - 2026-02-27
- [x] 2. **Resolve Evolution API DNS/Instance Issues** (Monitoring needed)
- [x] 3. **Implement CRM System** (Contacts, Labels, Notes, Lifecycle Stages) â€” Schema + Backend + Frontend
- [x] 4. **Implement Agent Actions** (8 distinct actions like respond.io) - Premium single-page UI, RichTextarea, and universal HTTP connector.
- [ ] 5. **Implement Agent Tools** (Google Calendar, Google Sheets, Google Drive, Email, WhatsApp Notifications)
- [ ] 6. **Implement Activity Feed** (Chat Banner & CRM Timeline)
- [x] 7. **Implement Saved Segments & Retargeting** (Smart filtering) — 2026-04-19
- [ ] 8. **Implement Analytics Dashboard** (Campaigns, Agents, Funnel) â€” Dashboard overview enhanced with delivery stats, team insights, leads pipeline, response time, failed messages, top keywords, disconnected instances alert.
- [ ] 11. **Implement Webhook API** (For business external integrations)

## ðŸŸ¡ Medium Priority

- [ ] Add Smart Scheduling (send at optimal times per recipient timezone)
- [ ] Add Auto-Retry for failed messages with configurable backoff

## ðŸŸ¢ Low Priority

- [ ] Build Billing Dashboard (usage tracking, invoices, plan management)
- [ ] Build advanced User Roles & Permissions system
- [ ] Add In-app notifications system (bell icon)

## ðŸ› Known Issues

- [ ] `crypto.randomUUID` polyfill needed because production uses HTTP (not HTTPS) â€” permanent fix is SSL
- [ ] Socket.io CORS set to `"*"` â€” should restrict to production domain

## ✅ Done

- [x] Integrate OpenRouter Qwen3 Embeddings for RAG File Uploads — 2026-04-19
- [x] Rebrand platform name and visual identity to **Value chat** across app shell/docs (logo, favicon, color palette) — 2026-04-08
- [x] Enforce connected-instance prerequisite before creating/starting campaigns (frontend + backend guard) — 2026-04-08

- [x] Implement Agent Tools (Google Calendar, Google Sheets, Google Drive, Email, WhatsApp Notifications) â€” 2026-03-05
- [x] Implement Quick Replies & Auto-Contact Creation â€” 2026-03-04
- [x] Implement Anti-Ban Smart Sending (Warm-up, delays, rotation) â€” 2026-03-04
- [x] Add Blacklist system (auto opt-out on reply keywords) â€” 2026-03-04
- [x] Phase 12: Onboarding Wizard (3-step data collection & redirects) â€” 2026-03-04
- [x] Phase 11: Auth Pages Redesign & Google OAuth integration â€” 2026-03-04
- [x] Redesigned OTP & Team Invitation Email Templates (Dark theme + Base64 SVG) â€” 2026-03-04
- [x] Fix Backend Startup Express 5 wildcard `PathError` crash â€” 2026-02-21
- [x] Fix Backend Startup crash (fixed invalid `knowledge.routes` import) â€” 2026-02-17
- [x] Fix Frontend Build failure (added `@headlessui/react`) â€” 2026-02-17
- [x] Fix 405 webhook routing (Evolution API v2 event appending) â€” 2026-02-17
- [x] Fix 413 Nginx body too large (added `client_max_body_size 50m`) â€” 2026-02-17
- [x] Fix `crypto.randomUUID` polyfill timing (moved to index.html) â€” 2026-02-17
- [x] Complete project documentation (all docs, changelog, error log) â€” 2026-02-17
- [x] Create agent rules and workflows â€” 2026-02-17
- [x] AI Agent multi-agent system with DeepSeek â€” 2026-02-15
- [x] Chat Inbox with real-time WebSocket â€” 2026-02-05
- [x] Real-time analytics (WebSocket delivery tracking) â€” 2026-02-08
- [x] MinIO 403 + Evolution API DNS fixes â€” 2026-02-10
- [x] Core platform launch (campaigns, instances, auth, team) â€” 2026-02-02
- [x] Facebook-style Inbox right sidebar (Assignment & CRM Fields) â€” 2026-03-01
- [x] Fix Agent Actions UI cutoff and visually redesign to dark theme â€” 2026-03-01
- [x] Premium Inbox Redesign (4-Column Layout, Dark Theme, Custom Filters) â€” 2026-03-01
- [x] Inbox Chat Assignment to Team Members â€” 2026-03-01
- [x] Dashboard Team Insights for messages replied to by staff â€” 2026-03-01
- [x] Campaigns UI Redesign (Premium Dark Theme with Glassmorphism) â€” 2026-03-04
- [x] Public marketing site, Mega Menu, and Legal hub pages â€” 2026-03-04
- [x] Redesign Help Center following `respond.io` structure (Hub, Categories, Breadcrumbs) â€” 2026-03-06 (03:15 AM)
- [x] Create Product Help Hub (`/help/product`) and feature-specific guides â€” 2026-03-06 (03:50 AM)
- [x] Rename `/help/agents` to `/help/ai-agents` and add `AI Agent Actions` guide â€” 2026-03-06 (04:20 AM)
- [x] Update Sidebar icons to premium set â€” 2026-03-06 (04:50 AM)
- [x] Use official high-fidelity logos for all messaging channels â€” 2026-03-06 (05:00 AM)
- [x] Integrated context-aware internal help links across core app modules â€” 2026-03-06 (05:40 AM)
