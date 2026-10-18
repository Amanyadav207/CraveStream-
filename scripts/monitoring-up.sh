#!/usr/bin/env bash
# Install Prometheus, Alertmanager and Grafana (kube-prometheus-stack).
# Grafana: http://grafana.localhost  (user: admin, password printed below)
set -euo pipefail
cd "$(dirname "$0")/.."

kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

if ! kubectl -n monitoring get secret grafana-admin >/dev/null 2>&1; then
  kubectl -n monitoring create secret generic grafana-admin \
    --from-literal=admin-user=admin \
    --from-literal=admin-password="$(openssl rand -hex 12)"
fi

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null
helm repo update >/dev/null
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack --version 92.10.1 \
  --namespace monitoring -f deploy/platform/monitoring-values.yaml --wait --timeout 10m

echo "Grafana: http://grafana.localhost  user=admin password=$(kubectl -n monitoring get secret grafana-admin -o jsonpath='{.data.admin-password}' | base64 -d)"
