import express from "express";
import mongoose from "mongoose";
import config from "../config.js";

const healthRoutes = express.Router();

// Liveness: the process is up and the event loop responds. Deliberately does
// NOT check the database, so a DB outage does not make Kubernetes restart
// every API pod (restarting would not fix the DB).
healthRoutes.get("/healthz", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// Readiness: only receive traffic when the database connection is usable.
healthRoutes.get("/readyz", (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({
        status: dbReady ? "ready" : "not ready",
        checks: { mongodb: dbReady ? "up" : "down" },
    });
});

// Which build is running (set from the image tag / commit SHA at build time).
healthRoutes.get("/version", (req, res) => {
    res.status(200).json({
        version: config.appVersion,
        commit: config.gitSha,
        storageDriver: config.storage.driver,
    });
});

export default healthRoutes;
