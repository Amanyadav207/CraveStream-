# Fault and recovery demo: MongoDB outage (prod, version 02e8825ce83d)

Format: symptom → hypothesis → evidence → fix → verification. A client loop requested
`GET /api/food` every 0.5 s for the whole demo.

```
Healthy baseline at 17:00:23:
{"status":"ready","checks":{"mongodb":"up"}}  readyz [200]
    (no CraveStream alerts)

## Inject fault at 17:01:08: kubectl -n cravestream scale statefulset mongo --replicas=0
statefulset.apps/mongo scaled

## Symptom at 17:02:48 (what users and operators see)
$ curl -sk https://cravestream.localhost/api/food
no available server
  [503 in 0.013424s]
$ curl -sk https://cravestream.localhost/api/readyz
no available server
  [503]
$ kubectl -n cravestream get pods
    cravestream-api-67fbcbb74-4thvn 0/1 Running 0
    cravestream-api-67fbcbb74-tlp2p 0/1 Running 0
    cravestream-frontend-78b9c8f977-f86tl 1/1 Running 0
    cravestream-frontend-78b9c8f977-wpxzs 1/1 Running 0
    mongo-backup-manual-66ffm 0/1 Completed 0
    seaweedfs-0 1/1 Running 0
Prometheus alerts:
    firing/pending: [('CraveStreamMongoDBDown', 'firing')]

## Hypothesis: API is fine (liveness ok, no restarts) but its dependency MongoDB is gone
$ kubectl -n cravestream logs deploy/cravestream-api --tail=200 | grep -E "MongoDB|503"  (last 3)
Found 2 pods, using pod/cravestream-api-67fbcbb74-tlp2p
{"level":50,"time":"2026-10-18T11:31:17.144Z","service":"cravestream-api","version":"02e8825ce83d","env":"prod","req":{"id":"4bd88717-8390-41e4-8df1-b0f9ffcc7c8a","method":"GET","url":"/api/food"},"res":{"statusCode":503},"err":{"
{"level":50,"time":"2026-10-18T11:31:17.685Z","service":"cravestream-api","version":"02e8825ce83d","env":"prod","req":{"id":"0bad3e14-d7fd-438f-89a6-91311c46e9bc","method":"GET","url":"/api/food"},"res":{"statusCode":503},"err":{"
{"level":50,"time":"2026-10-18T11:31:18.223Z","service":"cravestream-api","version":"02e8825ce83d","env":"prod","req":{"id":"0a37e350-02a4-43da-9886-e490ea267757","method":"GET","url":"/api/food"},"res":{"statusCode":503},"err":{"
$ kubectl -n cravestream get statefulset mongo
NAME    READY   AGE
mongo   0/0     74m

## Fix at 17:02:48: kubectl -n cravestream scale statefulset mongo --replicas=1
statefulset.apps/mongo scaled
partitioned roll out complete: 1 new pods have been updated...

## Verify at 17:02:59
{"status":"ready","checks":{"mongodb":"up"}}  readyz [200]
  feed [200] (same login session, data intact)
Prometheus alerts after recovery:
    firing/pending: none
```

**Traffic during the demo:** {'200': 407, '503': 207} (HTTP status → count); slowest response 0.18s.

## What this shows
- **Fail fast, not hang:** every failed request returned in under 0.18s. Before this
  project, a MongoDB outage made requests hang for about 30 s and then return 401, which logged users out.
- **Detection:** `CraveStreamMongoDBDown` fired from the API's `mongodb_up` metric, and the 503s
  appear in the structured logs with their request ids. The dashboard shows the error spike.
- **Liveness vs readiness:** the API pods were **not restarted** (0 restarts). Liveness does not check
  the DB, because restarting the API cannot fix MongoDB. Readiness does check it, so both pods
  went NotReady.
- **Recovery is automatic:** once `mongo-0` was back, the API reconnected and readiness returned 200
  within about 10 s, with data intact (the same login session kept working: PVC-backed StatefulSet).

## Lesson learned / trade-off
Because readiness depends on MongoDB, *all* API pods left the Service at once, and Traefik
answered `503 no available server` itself instead of the API's JSON message
("Service temporarily unavailable, please retry"). For a dependency shared by every replica,
the alternative is to keep readiness to "process can serve" and rely on the app's own fast 503
from `requireDb`. That gives users a friendlier error and keeps `/api/media` (which does not need
MongoDB) working during a DB outage. The cost is that a pod with a broken DB connection keeps
receiving traffic. With more time I would make readiness check only local state and alert on
`mongodb_up` (which already exists).
