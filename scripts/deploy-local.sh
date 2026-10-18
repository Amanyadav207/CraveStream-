#!/usr/bin/env bash
# Build images from the current commit, load them into kind and deploy with Helm.
# The image tag is the git commit SHA, so every running pod traces back to a commit.
#
#   scripts/deploy-local.sh prod            # build + deploy current commit
#   TAG=<sha> SKIP_BUILD=1 scripts/deploy-local.sh prod   # redeploy an existing tag
set -euo pipefail
cd "$(dirname "$0")/.."

ENV="${1:-prod}"
case "$ENV" in
  prod) NS=cravestream ;;
  dev)  NS=cravestream-dev ;;
  *) echo "usage: $0 dev|prod" >&2; exit 1 ;;
esac

REGISTRY=ghcr.io/amanyadav207
SHA="$(git rev-parse --short=12 HEAD)"
if [ -n "$(git status --porcelain)" ]; then SHA="${SHA}-dirty"; fi
TAG="${TAG:-$SHA}"

if [ -z "${SKIP_BUILD:-}" ]; then
  docker build -t "$REGISTRY/cravestream-api:$TAG" \
    --build-arg APP_VERSION="$TAG" --build-arg GIT_SHA="$(git rev-parse HEAD)" Backend
  docker build -t "$REGISTRY/cravestream-frontend:$TAG" \
    --build-arg APP_VERSION="$TAG" --build-arg GIT_SHA="$(git rev-parse HEAD)" Frontend
  kind load docker-image --name cravestream \
    "$REGISTRY/cravestream-api:$TAG" "$REGISTRY/cravestream-frontend:$TAG"
fi

scripts/create-secrets.sh "$ENV"

helm upgrade --install cravestream deploy/helm/cravestream \
  --namespace "$NS" \
  -f deploy/helm/cravestream/values.yaml \
  -f "deploy/helm/cravestream/values-$ENV.yaml" \
  --set api.image.tag="$TAG" \
  --set frontend.image.tag="$TAG"

# Wait on the workloads (not on every object: the backup PVC only binds when
# the backup job first runs, because kind's storage binds on first use).
for w in deploy/cravestream-api deploy/cravestream-frontend statefulset/mongo statefulset/seaweedfs; do
  kubectl -n "$NS" rollout status "$w" --timeout=5m
done

kubectl -n "$NS" get pods -o wide
echo "Deployed $TAG to $NS"
