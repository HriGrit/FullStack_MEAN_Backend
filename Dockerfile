# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies separately for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY . .

# Set environment and expose application port
ENV NODE_ENV=production
ENV PORT=1313
EXPOSE 1313

# Start the server
CMD ["node", "server.js"]


