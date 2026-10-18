# End-to-end chain for one tested version (02e8825ce83d)

## 1. Commit
$ git show --no-patch --format='%H %an %ad %s' 02e8825ce83d
02e8825ce83de61428b021ac4f2ed12a14af3034 | Amanyadav207 | Sun Oct 18 16:43:20 2026 +0530 | Remove npm/yarn from API runtime image; add release/rollback evidence
https://github.com/Amanyadav207/CraveStream-/commit/02e8825ce83de61428b021ac4f2ed12a14af3034

## 2. CI pipeline run for that commit
run: https://github.com/Amanyadav207/CraveStream-/actions/runs/39122361582
headSha: 02e8825ce83de61428b021ac4f2ed12a14af3034  branch: devops  event: push  conclusion: success
jobs:
  - Secret scan + Helm lint: success
  - Frontend - lint, build, audit: success
  - Backend - lint, test, audit: success
  - Image - build, scan, push (api): success
  - Image - build, scan, push (frontend): success
  - Deploy to a fresh kind cluster and smoke test: success
  - Promote to dev (GitOps commit): success

## 3. Image tag pushed by that run (tag = first 12 chars of the commit SHA)
$ docker buildx imagetools inspect ghcr.io/amanyadav207/cravestream-api:02e8825ce83d
Name:      ghcr.io/amanyadav207/cravestream-api:02e8825ce83d
Digest:    sha256:8cfe0cdb06065dd975602383516bc2fa59c082be5f6095c4767e81086b6de3b8
$ docker buildx imagetools inspect ghcr.io/amanyadav207/cravestream-frontend:02e8825ce83d
Name:      ghcr.io/amanyadav207/cravestream-frontend:02e8825ce83d
Digest:    sha256:3061fde9a2c8ce9d294d22d76f18b311c3d5c1f25e84c80e25250ccd4d3993e1
OCI label on the image: org.opencontainers.image.revision=02e8825ce83de61428b021ac4f2ed12a14af3034

## 4. Deployed in the cluster (prod: manual promotion with Helm; dev: Argo CD from git)
$ helm -n cravestream history cravestream --max 1
REVISION	UPDATED                 	STATUS  	CHART            	APP VERSION	DESCRIPTION     
7       	Sun Oct 18 16:55:56 2026	deployed	cravestream-0.1.0	0.1.0      	Upgrade complete
$ kubectl -n cravestream get pods -l app.kubernetes.io/name=api -o custom-columns=POD:.metadata.name,IMAGE:.spec.containers[0].image,DIGEST:.status.containerStatuses[0].imageID
POD                               IMAGE                                               DIGEST
cravestream-api-67fbcbb74-4thvn   ghcr.io/amanyadav207/cravestream-api:02e8825ce83d   ghcr.io/amanyadav207/cravestream-api@sha256:8cfe0cdb06065dd975602383516bc2fa59c082be5f6095c4767e81086b6de3b8
cravestream-api-67fbcbb74-tlp2p   ghcr.io/amanyadav207/cravestream-api:02e8825ce83d   ghcr.io/amanyadav207/cravestream-api@sha256:8cfe0cdb06065dd975602383516bc2fa59c082be5f6095c4767e81086b6de3b8
$ kubectl -n argocd get application cravestream-dev -o jsonpath='{.status.summary.images}'
["chrislusf/seaweedfs:4.48","ghcr.io/amanyadav207/cravestream-api:02e8825ce83d","ghcr.io/amanyadav207/cravestream-frontend:02e8825ce83d","mongo:7"]

## 5. Successful user request (prod, through Traefik Ingress + TLS)
$ curl -sk https://cravestream.localhost/api/version
{"version":"02e8825ce83d","commit":"02e8825ce83de61428b021ac4f2ed12a14af3034","storageDriver":"s3"}
$ curl -sk -H 'X-Request-Id: evidence-1792322868' -c jar -d '{login}' https://cravestream.localhost/api/user/login ; curl -sk -H 'X-Request-Id: evidence-1792322868-feed' -b jar https://cravestream.localhost/api/food
HTTP/2 200 
x-request-id: evidence-1792322868
HTTP/2 200 
x-request-id: evidence-1792322868-feed
feed items: ['Taco']

## 6. The same request in the logs (structured JSON, matched by request id)
$ kubectl -n cravestream logs -l app.kubernetes.io/name=api --tail=-1 | grep evidence-1792322868
{"level":30,"time":"2026-10-18T11:27:59.350Z","service":"cravestream-api","version":"02e8825ce83d","env":"prod","req":{"id":"evidence-1792322868-feed","method":"GET","url":"/api/food"},"res":{"statusCode":200},"responseTime":23,"msg":"request completed"}
{"level":30,"time":"2026-10-18T11:27:59.309Z","service":"cravestream-api","version":"02e8825ce83d","env":"prod","req":{"id":"evidence-1792322868","method":"POST","url":"/api/user/login"},"res":{"statusCode":200},"responseTime":1892,"msg":"request completed"}

## 7. The same version and traffic in Prometheus metrics
(scraped every 15s by the ServiceMonitor; counters are per running pod since the deploy)

$ promql: count by (version, commit) (app_build_info{namespace="cravestream"})
    {'commit': '02e8825ce83de61428b021ac4f2ed12a14af3034', 'version': '02e8825ce83d'} => 2
$ promql: sum by (route, status_code) (http_requests_total{namespace="cravestream"})
    {'route': '/api/user/login', 'status_code': '200'} => 1
    {'route': '/api/version', 'status_code': '200'} => 81
    {'route': '/api/food', 'status_code': '200'} => 81
    {'route': '/api/media/:key', 'status_code': '200'} => 10
$ promql: histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{namespace="cravestream"}[5m])))
    {} => 0.00474999
$ promql: cravestream:error_ratio:rate5m
    (no data)
$ promql: max(mongodb_up{namespace="cravestream"})
    {} => 1

Grafana dashboard: http://grafana.localhost/d/cravestream (screenshot: docs/evidence/grafana-dashboard.jpg)
