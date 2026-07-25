process.env.NODE_ENV = 'test';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6381';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/valuewats_agent_test?schema=public';
