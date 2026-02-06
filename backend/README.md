# ValueWats Backend

WhatsApp SaaS Platform - Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

3. Setup database:
```bash
npm run prisma:migrate
npm run prisma:generate
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new tenant
- `POST /api/auth/login` - Login user

### Instances (Protected)
- `GET /api/instances` - List all instances
- `POST /api/instances` - Create new instance
- `GET /api/instances/:id/status` - Get instance status
- `DELETE /api/instances/:id` - Delete instance
- `POST /api/instances/:id/send` - Send single message

## Tech Stack
- Node.js + Express
- PostgreSQL + Prisma ORM
- Redis + Bull Queue
- JWT Authentication
- Evolution API Integration
