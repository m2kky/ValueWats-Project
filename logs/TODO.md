# TODO — Active Tasks & Backlog

> This file is the single source of truth for what needs to be done. Update it after every session.
> Last updated: 2026-03-04

## 🔴 High Priority

- [x] 1. **Resolve AI Agent Response Issues** (Harmonized field names and fixed Prisma validation) - 2026-02-27
- [x] 2. **Resolve Evolution API DNS/Instance Issues** (Monitoring needed)
- [x] 3. **Implement CRM System** (Contacts, Labels, Notes, Lifecycle Stages) — Schema + Backend + Frontend
- [x] 4. **Implement Agent Actions** (8 distinct actions like respond.io) - Premium single-page UI, RichTextarea, and universal HTTP connector.
- [ ] 5. **Implement Agent Tools** (Google Calendar, Google Sheets, Google Drive, Email, WhatsApp Notifications)
- [ ] 6. **Implement Activity Feed** (Chat Banner & CRM Timeline)
- [ ] 7. **Implement Saved Segments & Retargeting** (Smart filtering)
- [ ] 8. **Implement Analytics Dashboard** (Campaigns, Agents, Funnel)
- [ ] 9. **Implement Quick Replies & Auto-Contact Creation**
- [ ] 10. **Implement Anti-Ban Smart Sending** (Warm-up, delays, rotation)
- [ ] 11. **Implement Webhook API** (For business external integrations)

## 🟡 Medium Priority

- [ ] Add Smart Scheduling (send at optimal times per recipient timezone)
- [ ] Add Auto-Retry for failed messages with configurable backoff
- [ ] Add Blacklist system (auto opt-out on reply keywords like STOP, UNSUBSCRIBE)

## 🟢 Low Priority

- [ ] Build Billing Dashboard (usage tracking, invoices, plan management)
- [ ] Build advanced User Roles & Permissions system
- [ ] Add In-app notifications system (bell icon)

## 🐛 Known Issues

- [ ] `crypto.randomUUID` polyfill needed because production uses HTTP (not HTTPS) — permanent fix is SSL
- [ ] Socket.io CORS set to `"*"` — should restrict to production domain

## ✅ Done

- [x] Phase 12: Onboarding Wizard (3-step data collection & redirects) — 2026-03-04
- [x] Phase 11: Auth Pages Redesign & Google OAuth integration — 2026-03-04
- [x] Redesigned OTP & Team Invitation Email Templates (Dark theme + Base64 SVG) — 2026-03-04
- [x] Fix Backend Startup Express 5 wildcard `PathError` crash — 2026-02-21
- [x] Fix Backend Startup crash (fixed invalid `knowledge.routes` import) — 2026-02-17
- [x] Fix Frontend Build failure (added `@headlessui/react`) — 2026-02-17
- [x] Fix 405 webhook routing (Evolution API v2 event appending) — 2026-02-17
- [x] Fix 413 Nginx body too large (added `client_max_body_size 50m`) — 2026-02-17
- [x] Fix `crypto.randomUUID` polyfill timing (moved to index.html) — 2026-02-17
- [x] Complete project documentation (all docs, changelog, error log) — 2026-02-17
- [x] Create agent rules and workflows — 2026-02-17
- [x] AI Agent multi-agent system with DeepSeek — 2026-02-15
- [x] Chat Inbox with real-time WebSocket — 2026-02-05
- [x] Real-time analytics (WebSocket delivery tracking) — 2026-02-08
- [x] MinIO 403 + Evolution API DNS fixes — 2026-02-10
- [x] Core platform launch (campaigns, instances, auth, team) — 2026-02-02
- [x] Facebook-style Inbox right sidebar (Assignment & CRM Fields) — 2026-03-01
- [x] Fix Agent Actions UI cutoff and visually redesign to dark theme — 2026-03-01
- [x] Premium Inbox Redesign (4-Column Layout, Dark Theme, Custom Filters) — 2026-03-01
- [x] Inbox Chat Assignment to Team Members — 2026-03-01
- [x] Dashboard Team Insights for messages replied to by staff — 2026-03-01
- [x] Campaigns UI Redesign (Premium Dark Theme with Glassmorphism) — 2026-03-04
- [x] Public marketing site, Mega Menu, and Legal hub pages — 2026-03-04
