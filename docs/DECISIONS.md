# Design decisions

Each entry gives the choice, the reason for it, the alternative, and when the alternative would be better.

**Baseline:** `0ede08bd0728a1dcd4c0b396770eb3245578ecb8` (no Dockerfile, CI, Kubernetes files or tests;
the frontend was on Vercel; config came from env via dotenv).

## 1. App changes needed before containerizing

| Decision | Why | Alternative / when better |
|---|---|---|
| `/healthz` (liveness) does **not** check MongoDB; `/readyz` does | Restarting the API cannot fix a dead database; restarts would only add churn. Readiness removes pods from traffic instead. | Some teams check dependencies in liveness. That only helps when the dependency failure is *inside* the pod (e.g. a corrupted local connection pool). |
| A `requireDb` middleware fails fast with 503 | Before, a DB outage hung requests for ~30 s and then returned **401**, which logged users out. | Mongoose command buffering (the default) suits short blips, but it hides outages from users and operators. |
| Pluggable storage, `STORAGE_DRIVER=s3\|imagekit` | Removes a hard dependency on a SaaS account, so the demo runs offline. The same code works with AWS S3. | ImageKit (CDN, image transformations) is better for a real product with global users. |
| SeaweedFS instead of MinIO | MinIO stopped publishing its community images in 2025. SeaweedFS is Apache-2.0 and one container. | MinIO, AWS S3 or a cloud bucket in a real deployment. |
| The API streams videos (`/api/media/:key`) instead of exposing the bucket | Only the Ingress is reachable from outside; the bucket stays private. | Pre-signed URLs or a CDN offload bandwidth from the API; better at scale. |
| Graceful SIGTERM shutdown plus a `preStop` sleep of 5 s | Kubernetes removes the pod from the endpoints at the same time it sends SIGTERM. The sleep lets in-flight requests and the endpoint update finish, so a rolling update drops no requests. | Not needed for workers that receive no traffic. |
| Cookie `SameSite=lax`, `Secure` when TLS is on | The app is now same-origin (Ingress/nginx), so `SameSite=none` (needed for Vercel's separate origin) is no longer required. `lax` also protects against CSRF. | `none` + `Secure` only if the frontend and API live on different sites. |

## 2. Containers
- **Multi-stage builds.** Dev dependencies and build tools stay out of the runtime image. The
  frontend runtime is only nginx plus static files (82 MB).
- **`node:22-alpine`** (LTS) and **`nginx-unprivileged`** (runs as uid 101 on port 8080, so it
  needs no root to bind a port). Alternative: distroless (smaller, no shell). It is better for
  security, but harder to debug with `kubectl exec`.
- **npm/yarn removed from the API runtime image.** Trivy found HIGH CVEs in the npm CLI bundled
  with the base image, and the app runs with plain `node`.
- **Non-root** (`USER node` / `USER 101`). If someone breaks out of the container, they
  have no root privileges.

## 3. Kubernetes
| Decision | Why | Alternative / when better |
|---|---|---|
| **kind**, 1 control plane + 2 workers | Runs in Docker, supports several nodes (to demo spreading pods, PDBs and drains), and the same tool works in CI (`k8s-smoke` job) | minikube (add-ons, a single VM); a managed cluster (EKS/GKE) for anything real |
| API / frontend as **Deployments** | Stateless; any pod can serve any request | — |
| MongoDB / SeaweedFS as **StatefulSets** + `volumeClaimTemplates` | Stable identity (`mongo-0.mongo`) and a dedicated PVC that survives restarts | A managed database (Atlas/DocumentDB) gives replication and backups without operating them yourself |
| Probes: **startup** (slow boot), **liveness** (process alive), **readiness** (DB reachable) | Separates "starting", "broken" and "temporarily cannot serve" | — |
| 2 API replicas, **HPA** 2→5 at 70% CPU; topology spread across nodes; **PDB** minAvailable 1 | Survives one pod or node going away; scales on load; a drain cannot take both pods down | Scaling on requests per second (needs a custom-metrics adapter) is better when the load is I/O-bound |
| Requests/limits on every container | The scheduler can place pods safely; noisy neighbours are contained; the HPA has a baseline | — |
| Ingress via **Traefik** | ingress-nginx was retired in 2026; Traefik supports the standard Ingress API | Gateway API (newer, more expressive) |
| ConfigMap for config, Secret for credentials (`existingSecret`) | Config changes need no image rebuild; secrets stay out of git | — |

## 4. Deployment configuration: Helm
- **One chart** + `values.yaml` (shared) + `values-dev.yaml` / `values-prod.yaml` (differences only).
  Adding a third environment means adding a values file and a namespace.
- **Why Helm over Kustomize:** versioned releases with `helm history` / `helm rollback`, a
  conditional template for monitoring objects (`.Capabilities` check), and Argo CD supports it natively.
  **Kustomize is better** when the differences are small patches and you want plain YAML with no templating.
- **Secrets are not in the chart.** `scripts/create-secrets.sh` generates them per cluster
  (idempotent, so the Mongo password never rotates under an existing volume).

## 5. CI: GitHub Actions
- **Triggers:** every push to `devops`/`main`, and pull requests to `main`.
- **What fails the build:** lint errors, failing tests, `npm audit` high+, a gitleaks hit anywhere
  in the history, `helm lint` errors, Trivy config HIGH/CRITICAL, or Trivy image **fixable**
  HIGH/CRITICAL (`--ignore-unfixed`: CVEs nobody can fix yet would block every build without
  improving security).
- **Trivy and gitleaks run from pinned Docker images**, not marketplace Actions. The trivy-action
  tags were hijacked in a 2026 supply-chain attack, and pinning reduces that risk.
- **Tag = commit SHA (12 chars)**, never `latest`. Tags are immutable and traceable to a commit.
- **Registry:** GHCR (free, tied to the repo, uses `GITHUB_TOKEN`, so there is no long-lived secret).
- **SBOM** (CycloneDX) is uploaded for every image.
- **Smoke deploy** to a fresh kind cluster in CI proves the chart deploys from scratch with the
  same script people use locally.

## 6. CD and release control
- **dev: GitOps (Argo CD, pull-based).** CI commits the new tag to `values-dev.yaml`, and Argo CD
  syncs it automatically with `selfHeal` and `prune`. Pull-based CD is needed here because GitHub's
  CI cannot reach a cluster on a laptop.
- **prod: manual promotion** of a tag already proven in dev. **Automation stops at prod**:
  a person decides. In a team this would be a PR to `values-prod.yaml` plus an Argo CD prod
  Application with manual sync.
- **Release strategy: rolling update** with `maxSurge: 1, maxUnavailable: 0` plus readiness gates.
  A bad image never receives traffic. This was demonstrated: 281/281 requests succeeded during a broken release.
  - **Blue-green** is better when you need instant switch-back or to test the full new stack
    before cutover (it costs double the resources).
  - **Canary** (Argo Rollouts / a service mesh) is better when you need to limit the blast radius
    by percentage of traffic and analyse metrics automatically.
- **Rollback:** `helm rollback` (prod) or `git revert` (dev, through Argo CD).
- **Drift:** Argo CD self-heal reverts manual changes within seconds (demonstrated). For prod,
  `helm diff` or an Argo CD app with auto-sync off would at least *detect* drift.
- **Database migrations:** none are needed (Mongo, schema in code). With more time: an
  expand/contract approach so old and new versions can run side by side during a rolling update.

## 7. Observability
- **Prometheus + Grafana + Alertmanager** (kube-prometheus-stack): standard, pull-based, and
  ServiceMonitor/PrometheusRule live next to the app in the chart.
- **RED metrics** for the API, with route **patterns** as labels (`/api/media/:key`), never raw URLs,
  to keep label cardinality bounded. **USE** for resources: CPU and memory per pod, restarts, HPA replicas.
- **SLOs:** availability 99.5% over 30 days (error budget 0.5%, about 3.6 h/month) and p95 < 500 ms.
  **Alerts use multi-window burn rates** (14.4× over 5m+1h for paging, 6× over 30m+6h as a warning)
  instead of a raw "error > X%", which would be noisy.
- **Logs:** pino JSON with request ids (also returned as `X-Request-Id`). There is no central log store yet;
  `kubectl logs | jq` is enough for one cluster. Next step: Loki.
- **Tracing:** not implemented. There is only one backend service and the request id already
  connects its logs. With more time: OpenTelemetry SDK → collector → Tempo/Jaeger.

## 8. Security
| Control | Where |
|---|---|
| Non-root, read-only root filesystem, capabilities dropped, seccomp RuntimeDefault | every pod (`_helpers.tpl`) |
| Pod Security Standard `restricted` enforced | namespace labels (`create-secrets.sh`); a privileged pod is rejected (evidence) |
| Least-privilege ServiceAccount (no RBAC, token not mounted) | `serviceaccount.yaml` |
| Default-deny NetworkPolicies; DB/storage reachable only from the API | `networkpolicy.yaml` (tested from another namespace: blocked) |
| No secrets in git (including history); generated per cluster | `create-secrets.sh`, gitleaks in CI |
| Dependency, image and config scanning + SBOM | CI |

**Limits of Kubernetes Secrets:** they are only base64-encoded, readable by anyone with
`get secret` on the namespace, and stored unencrypted in etcd unless encryption at rest is
configured. **With more time:** Sealed Secrets or External Secrets Operator + Vault, image
signing (cosign) with admission verification, and Dependabot.

## 9. What would change for real production
A managed Kubernetes cluster across availability zones, a managed database with replicas and
point-in-time recovery, object storage behind a CDN, cert-manager + Let's Encrypt, Terraform
for the infrastructure, an Argo CD prod app with PR-based promotion, Alertmanager routed to
Slack/PagerDuty, and Loki + Tempo for logs and traces.
