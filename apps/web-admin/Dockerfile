# syntax=docker/dockerfile:1
# Fastfood Kitchen Web Admin — Next.js 14 (Node 24)
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/web-admin apps/web-admin
COPY packages packages

RUN npm ci --omit=optional --ignore-scripts || npm install --omit=optional

COPY services services
RUN npm run build --workspace=web-admin

FROM node:24-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/web-admin apps/web-admin
COPY --from=builder /app/packages packages

WORKDIR /app/apps/web-admin

EXPOSE 4173

CMD ["npm", "run", "start"]
