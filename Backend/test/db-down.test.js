// Runs in its own process and never connects to MongoDB, to prove the API
// fails fast with 503 instead of hanging and returning a misleading 401.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DB_URL ??= "mongodb://127.0.0.1:27017/cravestream_test";
process.env.JWT_SECRET ??= "test-secret";
process.env.NODE_ENV ??= "test";

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");

test("API returns 503 quickly when MongoDB is not connected", async () => {
    const started = Date.now();
    const res = await request(app).get("/api/food");
    assert.equal(res.status, 503);
    assert.ok(Date.now() - started < 1000, "should not wait for a DB timeout");
});

test("readiness fails but liveness passes when MongoDB is down", async () => {
    assert.equal((await request(app).get("/readyz")).status, 503);
    assert.equal((await request(app).get("/healthz")).status, 200);
});
