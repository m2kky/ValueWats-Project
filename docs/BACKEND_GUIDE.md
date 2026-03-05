# ValueWats Backend Guide

## Tech Stack
- **Runtime**: Node.js 22
- **Framework**: Express.js
- **Database**: PostgreSQL 16 + pgvector via Prisma ORM
- **Queue**: BullMQ + Redis
- **Storage**: MinIO (S3-compatible)
- **AI**: DeepSeek API

## Architecture
```
frontend/nginx  →  /api  →  Express (port 3000)
```
All routes are prefixed with `/api`. Nginx proxies `/api` to `localhost:3000`.

## Key Files
| File | Purpose |
|---|---|
| `src/server.js` | Express entry point, route mounts |
| `src/middleware/tenantContext.js` | JWT auth + tenant isolation |
| `src/routes/webhooks.js` | Public webhook routes (no auth) |
| `src/controllers/campaignController.js` | Campaign creation + dispatch |
| `src/controllers/webhookController.js` | Incoming WhatsApp message processor |
| `src/services/queueService.js` | BullMQ campaign queue (send logic here) |
| `src/services/evolutionApi.js` | Evolution API HTTP client |
| `src/agents/` | AI agent system |
| `prisma/schema.prisma` | Full database schema (26 models) |

## AI Agent Action System
The AI Agent executes actions by outputting specific `[ACTION: TYPE: DATA]` tags.

### Standard Actions (Respond.io Protocol)
1. **`CLOSE_CONVERSATION`**: Sets status to closed.
2. **`ASSIGN`**: Routes to agent or team (`TEAM:GroupName`).
3. **`UPDATE_CONTACT`**: Updates CRM fields via JSON payload.
4. **`UPDATE_LIFECYCLE`**: Changes contact stage in pipeline.
5. **`TRIGGER_WORKFLOW`**: Fires an internal automation workflow.
6. **`ADD_TAG` / `REMOVE_TAG`**: Manages contact labels.
7. **`ADD_COMMENT`**: Adds an internal note (Agent Context).
8. **`HTTP_REQUEST`**: Executes a custom configured tool/API call.

### Universal HTTP Connector
- Handled by `executeHttpRequest` in `agent.service.js`.
- Supports variable substitution in URLs and Body using `{{contact.field}}` or `{{agent.name}}`.
- Uses `axios` for network calls with a 10s timeout.

## Anti-Ban System (Implemented)
All outbound campaign messages pass through `queueService.js` with these protections:

| Protection | Implementation | Values |
|---|---|---|
| Randomized Delay | BullMQ job delay | 15-25 seconds (configurable) |
| Spintax - Invisible Chars | Zero-width characters appended | 3-7 random ZW chars per message |
| Dynamic Variables | Regex replace on `{{rand}}` / `{{date}}` | Random number / locale datetime |
| Human Typing Simulation | `evolutionApi.sendPresence()` | 2-4 seconds "composing" before send |
| Instance Rotation | Alternate WhatsApp accounts | Every N messages (configurable) |
| Template Rotation | Multiple message templates | Cycles across template array |

### queueService.js Anti-Ban Flow
```javascript
// Per message in campaignQueue.process():
1. sendPresence(instanceName, number, 2000-4000ms)   // "typing..."
2. await setTimeout(typingDelay)                      // wait for it
3. evolutionApi.sendMessage(...)                      // send real msg
```

### Spintax Variables Available to Users
| Variable | Result |
|---|---|
| `{{rand}}` | Random 4-digit number |
| `{{date}}` | Current datetime in Arabic locale |
| `{{name}}` / `{{col}}` | Values from CSV column mapping |
| _(invisible)_ | Zero-width chars auto-appended to all messages |

## Middleware
- **`tenantContext.js`**: Validates JWT, extracts `tenantId`, injects into `req.user`. Required on all protected routes.
- **Webhook routes**: Public, no auth. Evolution API sends here.

## Environment Variables
| Key | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis for BullMQ |
| `JWT_SECRET` | JWT signing secret |
| `EVOLUTION_API_URL` | Evolution API base URL (must match Docker network — sslip.io domain in production) |
| `EVOLUTION_API_KEY` | Evolution API key |
| `BACKEND_URL` | Public backend URL for webhook registration |
| `MINIO_*` | MinIO file storage config |
| `DEEPSEEK_API_KEY` | DeepSeek AI key |

## Common Issues
- **`EAI_AGAIN` error**: `EVOLUTION_API_URL` is using an unreachable hostname. Update in Coolify to use the public `sslip.io` URL.
- **Body size errors**: Set `client_max_body_size` in `nginx.conf` AND the Express `bodyParser` limit.
- **Schema changes**: Always run `npx prisma migrate deploy` after changes via Coolify terminal.

## Deployment
Deployed on Coolify. Service name: `grumpy-gentoo-i0kwck044gc80s0osco8w0wg`.
VPS: `72.62.50.238`. See `/deploy` workflow for step-by-step.
