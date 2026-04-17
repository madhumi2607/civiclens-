# ── Stage 1: Build client ──────────────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --legacy-peer-deps
COPY client/ ./
RUN npm run build

# ── Stage 2: Production server ─────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Server deps
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Server source
COPY server/ ./server/

# Built client assets
COPY --from=client-build /app/client/dist ./client/dist

# Runtime config
ENV NODE_ENV=production
ENV DEMO_MODE=true
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/src/index.js"]
