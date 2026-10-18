#!/usr/bin/env bash
# Install Argo CD and register the dev Application (GitOps).
# UI: http://argocd.localhost  (user admin, password printed below)
set -euo pipefail
cd "$(dirname "$0")/.."

helm repo add argo https://argoproj.github.io/argo-helm >/dev/null
helm repo update >/dev/null
helm upgrade --install argocd argo/argo-cd --version 10.10.5 \
  --namespace argocd --create-namespace \
  -f deploy/platform/argocd-values.yaml --wait --timeout 10m

# dev namespace + secrets are created out-of-band (never stored in git)
scripts/create-secrets.sh dev

kubectl apply -f deploy/argocd/cravestream-dev.yaml

echo "Argo CD: http://argocd.localhost  user=admin password=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d)"
