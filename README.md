# ValueWats - WhatsApp SaaS Platform

Multi-tenant WhatsApp marketing and management platform built with Evolution API.

## Project Structure

```
valuewats/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/   # Database & Redis
│   │   ├── middleware/ # Auth & Tenant isolation
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── server.js
│   └── prisma/       # Database schema
└── frontend/         # React + Vite
    └── src/
        ├── api/      # API client
        ├── pages/    # Page components
        └── App.jsx
```

## Features

### Phase 1 (MVP) ✅
- Multi-tenant architecture with tenant isolation
- JWT authentication
- WhatsApp instance management
- Single message sending
- PostgreSQL + Prisma ORM
- React frontend with Tailwind CSS

### Phase 2 (Coming Soon)
- Bulk messaging with Bull Queue
- Campaign builder
- CSV contact import

### Phase 3 (Coming Soon)
- AI chatbot integration
- Evolution Bot webhook

### Phase 4 (Coming Soon)
- CRM integrations
- Unified inbox

## Setup Instructions

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

- **Backend**: Node.js, Express, Prisma, PostgreSQL, Redis, Bull
- **Frontend**: React, Vite, Tailwind CSS, React Router
- **WhatsApp**: Evolution API
- **Auth**: JWT

## Documentation

- [Database Schema](./brain/database_schema.md)
- [API Specification](./brain/api_specification.yaml)
- [Pricing Model](./brain/pricing_model.md)
- [Wireframes](./brain/wireframes.md)
