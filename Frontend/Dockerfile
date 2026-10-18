# syntax=docker/dockerfile:1

# ---- build: compile the React app to static files
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# No API URL is baked in: the app calls same-origin /api.
ARG APP_VERSION=dev
ARG GIT_SHA=unknown
RUN npm run build \
 && printf '{"version":"%s","commit":"%s"}\n' "${APP_VERSION}" "${GIT_SHA}" > dist/version.json

# ---- runtime: unprivileged nginx (uid 101, listens on 8080) serving static files
FROM nginxinc/nginx-unprivileged:1.30-alpine3.24 AS runtime
ARG APP_VERSION=dev
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.source="https://github.com/Amanyadav207/CraveStream-" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${APP_VERSION}"

# Pick up OS security fixes published after the base image was built.
USER root
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# The base image already runs as nginx (uid 101); stated explicitly for clarity/scanners.
USER 101
EXPOSE 8080
