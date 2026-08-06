# syntax=docker/dockerfile:1
# Fastfood Kitchen API — NestJS backend (Node 24)
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY services/api services/api
COPY packages packages

RUN npm ci --omit=optional --ignore-scripts || npm install --omit=optional

COPY apps apps
RUN npm run build --workspace=api

FROM node:24-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/services/api services/api
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/services/api/dist services/api/dist

WORKDIR /app/services/api

EXPOSE 3000

CMD ["sh", "-c", "node ../../node_modules/typeorm/cli.js -d dist/database/data-source.js migration:run && node dist/main"]
