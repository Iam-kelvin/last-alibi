# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app
ENV CI=1 \
    EXPO_NO_TELEMETRY=1 \
    NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Expo public variables are compiled into the browser bundle. They are optional
# and are safe to leave empty for a completely offline, telemetry-free build.
ARG EXPO_PUBLIC_POSTHOG_KEY=""
ARG EXPO_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
ARG EXPO_PUBLIC_SENTRY_DSN=""
ENV EXPO_PUBLIC_POSTHOG_KEY=${EXPO_PUBLIC_POSTHOG_KEY} \
    EXPO_PUBLIC_POSTHOG_HOST=${EXPO_PUBLIC_POSTHOG_HOST} \
    EXPO_PUBLIC_SENTRY_DSN=${EXPO_PUBLIC_SENTRY_DSN}

RUN npm run build:web

FROM nginx:1.28-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/healthz >/dev/null || exit 1
