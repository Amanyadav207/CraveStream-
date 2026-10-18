# CraveStream runbook

What to do when an alert fires. Namespace `cravestream` (prod) or `cravestream-dev`.
Dashboard: Grafana → **CraveStream - API health & SLO** (http://grafana.localhost).

**Healthy means:** `/api/readyz` returns 200, at least 2 API pods are Ready, the 5xx ratio is
below 0.5% (the SLO), and p95 latency is under 500 ms.

General first steps:

```bash
kubectl -n cravestream get pods -o wide           # anything not Running/Ready? restarts?
kubectl -n cravestream get events --sort-by=.lastTimestamp | tail -20
curl -sk https://cravestream.localhost/api/version  # which build is live
curl -sk https://cravestream.localhost/api/readyz   # is MongoDB reachable from the API
kubectl -n cravestream logs deploy/cravestream-api --tail=100 | jq -c 'select(.level>=40)'   # warnings/errors only
```

Every response carries an `X-Request-Id` header, and the same id is the `reqId` field in the
API logs. To trace one failing request:
`kubectl -n cravestream logs -l app.kubernetes.io/name=api --tail=-1 | grep <id>`

## high-error-rate
`CraveStreamErrorBudgetFastBurn` / `SlowBurn`: too many 5xx responses.
1. Dashboard → "Requests per second by route and status": which route is failing?
   - `/api/media/:key` or uploads returning 502 → object storage problem, see [storage-down](#storage-down)
   - everything returning 503 → MongoDB, see [mongodb-down](#mongodb-down)
2. Did it start right after a deploy? Compare the "Running version" panel with when it started.
   If yes, roll back first and investigate after:
   `helm -n cravestream rollback cravestream` (or `git revert` the image tag bump if deployed through Argo CD).
3. Read the error logs (command above) for the failing route.

## high-latency
1. Dashboard: is CPU near its limit (500m)? Has the HPA already scaled out (see "API replicas")?
2. `kubectl -n cravestream top pods`. If the API is CPU-bound and the HPA is at its max, raise
   `api.autoscaling.maxReplicas`.
3. Slow MongoDB queries: check the mongo pod's CPU and memory.

## api-down
`CraveStreamAPIDown`: Prometheus cannot scrape any API pod.
1. `kubectl -n cravestream get pods -l app.kubernetes.io/name=api`
2. `ImagePullBackOff` → bad image tag. Check `kubectl describe pod`, then roll back.
3. `CrashLoopBackOff` → see [crashloop](#crashloop).
4. Pods are Running but not scraped → check the ServiceMonitor and that the NetworkPolicy
   `allow-api` still admits the `monitoring` namespace.

## mongodb-down
`CraveStreamMongoDBDown`: users get an instant 503 ("temporarily unavailable"), not a hang.
API pods turn NotReady (readiness checks MongoDB) but are deliberately not restarted
(liveness does not check MongoDB).
1. `kubectl -n cravestream get pod mongo-0`, `kubectl -n cravestream logs mongo-0 --tail=50`
2. `Pending` → PVC or scheduling problem: `kubectl describe pod mongo-0`, `kubectl get pvc`
3. `OOMKilled` → raise `mongo.resources.limits.memory`.
4. Once mongo-0 is Ready, the API reconnects by itself. Verify with `curl .../api/readyz` → 200.
5. Data loss: restore the latest backup from the `mongo-backup` PVC with
   `mongorestore --uri="$DB_URL" --archive=<file> --gzip` (run from a pod mounting the PVC).

## storage-down
Uploads return 502 and videos fail to load; login and the feed list still work.
1. `kubectl -n cravestream get pod seaweedfs-0`, then check its logs.
2. After a restart SeaweedFS needs about 20 s before reads succeed again; this is expected.

## crashloop
`CraveStreamPodRestarting`
1. `kubectl -n cravestream describe pod <pod>`: look at "Last State" (OOMKilled? Error? exit code)
2. `kubectl -n cravestream logs <pod> --previous`: the logs from the crashed run
3. Common causes: a missing Secret key (the API exits on a missing `DB_URL`/`JWT_SECRET`), a bad
   config value, the memory limit being too low, or a liveness probe that is too strict.
