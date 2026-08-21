# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY backend/prisma backend/prisma
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY backend backend
RUN npm run db:generate --workspace backend \
  && npm run build --workspace backend

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3333

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend ./backend

WORKDIR /app/backend
RUN sed -i 's/\r$//' docker-entrypoint.sh \
  && chmod +x docker-entrypoint.sh

USER node
EXPOSE 3333
ENTRYPOINT ["/app/backend/docker-entrypoint.sh"]
