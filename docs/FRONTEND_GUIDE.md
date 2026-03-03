# ValueWats Frontend Guide

## Tech Stack
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS
- **HTTP client**: Axios (via `src/api/client.js`)
- **Served by**: Nginx → proxies `/api` to `localhost:3000`

## Project Structure
```
frontend/src/
  pages/           ← One component per page
  components/      ← Reusable UI components
  api/
    client.js      ← Axios instance with JWT interceptor
  hooks/           ← Custom React hooks
```

## Pages
| Route | File | Description |
|---|---|---|
| `/login` | `pages/LoginPage.jsx` | Login form + OTP flow |
| `/register` | `pages/RegisterPage.jsx` | Tenant + user registration |
| `/dashboard` | `pages/Dashboard.jsx` | Stats overview |
| `/campaigns/new` | `pages/NewCampaign.jsx` | Create campaign |
| `/campaigns` | `pages/Campaigns.jsx` | Campaign list |
| `/instances` | `pages/Instances.jsx` | WhatsApp QR connect |
| `/inbox` | `pages/Inbox.jsx` | Live chat inbox |
| `/contacts` | `pages/Contacts.jsx` | CRM contacts |
| `/agents` | `pages/Agents.jsx` | AI agent config |
| `/analytics` | `pages/Analytics.jsx` | Reports + click tracking |

## Anti-Ban UI Notes

### NewCampaign.jsx
| Setting | Min | Max | Default |
|---|---|---|---|
| Delay Min | 15s | 60s | 15s |
| Delay Max | 15s | 120s | 25s |

> Users cannot set delay below 15 seconds — enforced by slider `min="15"`.

**Supported message variables:**
- `{{name}}` — Contact name (from number list or CSV)
- `{{rand}}` — Random number (auto per message)  
- `{{date}}` — Send time (auto per message)
- `{{column}}` — Any column from uploaded CSV

### Campaign Form Flow
1. User types/uploads contacts
2. Selects WhatsApp instance(s)
3. Writes message(s) — can add multiple for rotation
4. Sets delay sliders (min 15s)
5. Optionally schedules for later
6. Submits → `POST /api/campaigns`

## Important Notes

> [!IMPORTANT]
> The UUID polyfill is loaded in `index.html` via a sync `<script>` tag. Do NOT move it to `main.jsx` — vendor chunks load before module scripts.

> [!NOTE]
> Nginx config in `frontend/nginx.conf` proxies `/api` to backend and must have matching `client_max_body_size` for file uploads.

## Planned Pages (not yet built)
- `/templates` — Global message templates library (Phase 5)
- `/settings/plan` — Subscription plan + limits display
- `/settings/optout` — View blacklisted contacts
