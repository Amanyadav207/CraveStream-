#!/usr/bin/env bash
# Create the namespace and the app Secret for one environment.
# Values are random and generated on this machine; they never go into git.
# Idempotent: an existing Secret is kept (rotating the Mongo password would
# lock the API out of an existing database volume).
#
#   scripts/create-secrets.sh prod      # namespace cravestream
#   scripts/create-secrets.sh dev       # namespace cravestream-dev
#   IMAGEKIT_PRIVATE_KEY=... scripts/create-secrets.sh prod   # optional
set -euo pipefail
cd "$(dirname "$0")/.."

ENV="${1:-prod}"
case "$ENV" in
  prod) NS=cravestream; HOST=cravestream.localhost ;;
  dev)  NS=cravestream-dev; HOST=dev.cravestream.localhost ;;
  *) echo "usage: $0 dev|prod" >&2; exit 1 ;;
esac

# Namespace enforces the "restricted" Pod Security Standard.
kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace "$NS" --overwrite \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted

if kubectl -n "$NS" get secret cravestream-secrets >/dev/null 2>&1; then
  echo "Secret cravestream-secrets already exists in $NS (kept)"
else
  rand() { openssl rand -hex "$1"; }
  MONGO_USER=cravestream
  MONGO_PASS="$(rand 24)"
  S3_KEY="cravestream"
  S3_SECRET="$(rand 24)"
  S3_JSON=$(printf '{"identities":[{"name":"cravestream-api","credentials":[{"accessKey":"%s","secretKey":"%s"}],"actions":["Admin","Read","Write","List","Tagging"]}]}' "$S3_KEY" "$S3_SECRET")

  kubectl -n "$NS" create secret generic cravestream-secrets \
    --from-literal=JWT_SECRET="$(rand 32)" \
    --from-literal=MONGO_ROOT_USERNAME="$MONGO_USER" \
    --from-literal=MONGO_ROOT_PASSWORD="$MONGO_PASS" \
    --from-literal=DB_URL="mongodb://${MONGO_USER}:${MONGO_PASS}@mongo-0.mongo:27017/cravestream?authSource=admin" \
    --from-literal=S3_ACCESS_KEY_ID="$S3_KEY" \
    --from-literal=S3_SECRET_ACCESS_KEY="$S3_SECRET" \
    --from-literal=s3.json="$S3_JSON" \
    --from-literal=IMAGEKIT_PRIVATE_KEY="${IMAGEKIT_PRIVATE_KEY:-}"
  echo "Created Secret cravestream-secrets in $NS"
fi

# Self-signed TLS certificate for the ingress host (local only).
if ! kubectl -n "$NS" get secret cravestream-tls >/dev/null 2>&1; then
  tmp="$(mktemp -d)"
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -subj "/CN=$HOST" -addext "subjectAltName=DNS:$HOST" \
    -keyout "$tmp/tls.key" -out "$tmp/tls.crt" 2>/dev/null
  kubectl -n "$NS" create secret tls cravestream-tls --cert="$tmp/tls.crt" --key="$tmp/tls.key"
  rm -rf "$tmp"
  echo "Created TLS secret for $HOST"
fi
