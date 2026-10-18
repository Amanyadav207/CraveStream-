#!/usr/bin/env bash
# Create the local kind cluster and install platform add-ons:
#   Traefik (ingress), metrics-server (for HPA / kubectl top).
# Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."

CLUSTER=cravestream

if ! kind get clusters | grep -qx "$CLUSTER"; then
  kind create cluster --config deploy/kind/cluster.yaml
fi
kubectl config use-context "kind-$CLUSTER"

helm repo add traefik https://traefik.github.io/charts >/dev/null
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/ >/dev/null
helm repo update >/dev/null

helm upgrade --install traefik traefik/traefik --version 42.0.0 \
  --namespace traefik --create-namespace \
  -f deploy/platform/traefik-values.yaml --wait

# kind kubelets use self-signed certs, so metrics-server must skip TLS verify (local only).
helm upgrade --install metrics-server metrics-server/metrics-server --version 3.14.0 \
  --namespace kube-system \
  --set 'args={--kubelet-insecure-tls}' --wait

echo "Cluster ready:"
kubectl get nodes -o wide
