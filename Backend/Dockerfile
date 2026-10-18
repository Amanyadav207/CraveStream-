# syntax=docker/dockerfile:1

# ---- deps: install production dependencies only (reproducible via lockfile)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime: small image, no npm cache, runs as the non-root "node" user
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Build metadata so the running version is visible at /version
ARG APP_VERSION=dev
ARG GIT_SHA=unknown
ENV APP_VERSION=${APP_VERSION} \
    GIT_SHA=${GIT_SHA}
LABEL org.opencontainers.image.source="https://github.com/Amanyadav207/CraveStream-" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${APP_VERSION}"

# The app runs with plain "node"; package managers are not needed at runtime.
# Removing them shrinks the attack surface (Trivy flagged HIGH CVEs in the
# npm CLI bundled with the base image).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn-* \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg \
 && apk upgrade --no-cache

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node src ./src

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# exec form: node is PID 1 and receives SIGTERM directly (graceful shutdown)
CMD ["node", "server.js"]
