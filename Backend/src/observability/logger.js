import { randomUUID } from "node:crypto";
import pino from "pino";
import { pinoHttp } from "pino-http";

// Structured JSON logs (one object per line) so they can be filtered with
// kubectl logs | jq, or shipped to Loki/ELK without parsing free text.
const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "silent" : "info"),
    base: {
        service: "cravestream-api",
        version: process.env.APP_VERSION || "dev",
        env: process.env.APP_ENV || process.env.NODE_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: ["req.headers.cookie", "req.headers.authorization", 'res.headers["set-cookie"]'],
});

const QUIET_PATHS = new Set(["/healthz", "/readyz", "/metrics", "/api/healthz", "/api/readyz"]);

// One log line per request with a request ID. The ID is taken from the
// X-Request-Id header if a proxy set one, and echoed back to the client, so a
// user-visible error can be matched to its log line. Controllers use req.log,
// which carries the same reqId.
const httpLogger = pinoHttp({
    logger,
    genReqId: (req, res) => {
        const id = req.headers["x-request-id"] || randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
    },
    autoLogging: { ignore: (req) => QUIET_PATHS.has(req.url) },
    customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },
    serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
    },
});

export { logger, httpLogger };
