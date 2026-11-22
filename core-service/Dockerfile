# Image resmi node:22-bookworm-slim tersedia untuk linux/amd64 dan linux/arm64,
# jadi Dockerfile yang sama bisa di-build di laptop maupun langsung di STB Armbian (arm64).
# better-sqlite3 v13 sudah membawa binary prebuilt linux-arm64 -> tidak perlu compiler.

# ---------- Tahap 1: install dependency produksi ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Tahap 2: image runtime yang ramping ----------
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/app.db
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json openapi.yaml ./
COPY src ./src

# Folder database di volume; jalankan sebagai user non-root "node".
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
