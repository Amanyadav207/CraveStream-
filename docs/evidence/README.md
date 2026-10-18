# Evidence

Everything here was captured from the running system with the exact commands shown,
so each step can be reproduced.

| File | Shows |
|---|---|
| [END-TO-END-CHAIN.md](END-TO-END-CHAIN.md) | **One version end to end:** commit `02e8825` → CI run → GHCR image (digest) → pods in prod and dev → user request → the same request in JSON logs (by request id) → Prometheus metrics |
| [release-and-rollback.txt](release-and-rollback.txt) | Deploy version B, then a broken release (missing image) that never got traffic, then `helm rollback`: **281/281 requests succeeded** |
| [gitops-drift-selfheal.txt](gitops-drift-selfheal.txt) | Argo CD reverting manual changes (deleted NetworkPolicy, hot-patched image) within seconds |
| [fault-recovery-mongodb.md](fault-recovery-mongodb.md) | MongoDB outage: symptom → hypothesis → evidence → fix → verification, plus the lesson learned |
| [data-persistence.txt](data-persistence.txt) | Data survives MongoDB/SeaweedFS pod recreation (PVC-backed StatefulSets) |
| [security-networkpolicy-podsecurity.txt](security-networkpolicy-podsecurity.txt) | NetworkPolicy blocking access from another namespace; Pod Security rejecting a privileged pod |
| [grafana-dashboard.jpg](grafana-dashboard.jpg) | Dashboard: SLO availability, error budget, p95, running version, and the 5xx spike from the fault demo |

CI runs: https://github.com/Amanyadav207/CraveStream-/actions
- First run, **failed on purpose by the security gate**: Trivy found HIGH CVEs in the npm CLI inside the API image
  (https://github.com/Amanyadav207/CraveStream-/actions/runs/39122176548). The fix (commit `02e8825`) removed npm from the runtime image.
- Green run for `02e8825`: https://github.com/Amanyadav207/CraveStream-/actions/runs/39122361582

## What was tested
- API: 10 automated tests (validation, auth flow, 401 vs 403, fast 503 when the DB is down, metrics, request id)
- Manual and browser checks: signup/login for both roles, partner upload → SeaweedFS → user feed → video
  streaming with Range requests, cart, role redirects
- Failure modes: MongoDB down, SeaweedFS down and restarted, bad image release, manual drift

## What does not work / is limited
See "Known limitations" in the main [README](../../README.md#known-limitations).
