# TODO — Active Tasks & Backlog

> This file is the single source of truth for what needs to be done. Update it after every session.
> Last updated: 2026-02-17

## 🔴 High Priority

- [ ] Set up HTTPS/SSL on Coolify — fixes `crypto.randomUUID` needing a polyfill
- [ ] Verify campaign 500 error is resolved after webhook + nginx fixes
- [ ] Test full campaign flow end-to-end on production (create → send → track delivery)
- [x] **Frontend**: Build Agent Management UI (List, Create, Edit, Templates) — 2026-02-17
- [x] **Frontend**: Premium UI Overhaul (Dashboard, Inbox, Agents, Campaigns, Instances, Automations, Team) — 2026-02-21
- [ ] **Frontend**: Build Lifecycle Stage Management UI
- [ ] **Frontend**: Update Chat Interface to show current Agent & Status

## 🟡 Medium Priority

- [ ] Add Smart Scheduling (send at optimal times per recipient timezone)
- [ ] Add Auto-Retry for failed messages with configurable backoff
- [ ] Add Blacklist system (auto opt-out on reply keywords like STOP, UNSUBSCRIBE)
- [ ] Build drag-and-drop Chatbot Builder UI
- [ ] Add WhatsApp-style message preview before sending

## 🟢 Low Priority

- [ ] Build Billing Dashboard (usage tracking, invoices, plan management)
- [ ] Add Advanced Analytics (charts, ROI tracking, A/B testing)
- [ ] Add Contact Groups (import/export, tagging, segmentation)
- [ ] Add Template Library (saved message templates with categories)

## 🐛 Known Issues

- [ ] `crypto.randomUUID` polyfill needed because production uses HTTP (not HTTPS) — permanent fix is SSL
- [ ] Socket.io CORS set to `"*"` — should restrict to production domain

## ✅ Done

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
