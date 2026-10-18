import client from "prom-client";
import mongoose from "mongoose";

// Prometheus metrics, scraped from GET /metrics (not exposed via the Ingress).
// RED method: Rate + Errors (http_requests_total by status) and Duration
// (http_request_duration_seconds histogram).
const register = new client.Registry();
register.setDefaultLabels({ service: "cravestream-api" });
client.collectDefaultMetrics({ register }); // CPU, memory, event loop lag, GC

const httpRequests = new client.Counter({
    name: "http_requests_total",
    help: "HTTP requests handled, by method, route and status code",
    labelNames: ["method", "route", "status_code"],
    registers: [register],
});

const httpDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request latency in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
});

const uploads = new client.Counter({
    name: "video_uploads_total",
    help: "Video uploads by result (success | storage_error | db_error)",
    labelNames: ["result"],
    registers: [register],
});

const dbUp = new client.Gauge({
    name: "mongodb_up",
    help: "1 if the API's MongoDB connection is ready",
    registers: [register],
});

// Which build is running, as a metric: app_build_info{version,commit} 1
const buildInfo = new client.Gauge({
    name: "app_build_info",
    help: "Build information for the running API",
    labelNames: ["version", "commit"],
    registers: [register],
});
buildInfo.set({ version: process.env.APP_VERSION || "dev", commit: process.env.GIT_SHA || "unknown" }, 1);

const SKIP = new Set(["/metrics", "/healthz", "/readyz"]);

// Use the matched route pattern (e.g. /api/media/:key), never the raw URL,
// so label cardinality stays bounded.
const routeOf = (req) => {
    if (req.route?.path) return `${req.baseUrl}${req.route.path === "/" ? "" : req.route.path}` || "/";
    return "unmatched";
};

const metricsMiddleware = (req, res, next) => {
    if (SKIP.has(req.path)) return next();
    const end = httpDuration.startTimer();
    res.on("finish", () => {
        const labels = { method: req.method, route: routeOf(req), status_code: String(res.statusCode) };
        httpRequests.inc(labels);
        end(labels);
    });
    next();
};

const metricsHandler = async (req, res) => {
    dbUp.set(mongoose.connection.readyState === 1 ? 1 : 0);
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
};

export { metricsMiddleware, metricsHandler, uploads };
