FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

# Persist uploads across restarts
VOLUME /app/uploads

EXPOSE 3000

CMD ["npm", "start"]
