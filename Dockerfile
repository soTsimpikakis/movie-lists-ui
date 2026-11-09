FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build-only

# Caddy serves the built SPA and proxies /api; the Caddyfile is mounted by the deploy compose.
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
