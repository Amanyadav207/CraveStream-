// Integration tests: run against a real MongoDB (CI uses a service container).
//   DB_URL=mongodb://127.0.0.1:27017/cravestream_test npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.DB_URL ??= "mongodb://127.0.0.1:27017/cravestream_test";
process.env.JWT_SECRET ??= "test-secret";
process.env.STORAGE_DRIVER ??= "s3";

const { default: mongoose } = await import("mongoose");
const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");

const api = request(app);
const user = { name: "Test User", email: "user@test.local", password: "testpass123" };
const partner = { name: "Test Kitchen", email: "partner@test.local", password: "testpass123" };

before(async () => {
    await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 5000 });
    await mongoose.connection.dropDatabase();
});

after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});

test("health, readiness and version endpoints", async () => {
    assert.equal((await api.get("/healthz")).status, 200);
    assert.equal((await api.get("/api/readyz")).body.checks.mongodb, "up");
    const version = await api.get("/version");
    assert.equal(version.status, 200);
    assert.ok(version.body.version);
    assert.ok(version.body.commit);
});

test("register validates input with 400", async () => {
    assert.equal((await api.post("/api/user/register").send({})).status, 400);
    assert.equal((await api.post("/api/user/register").send({ ...user, email: "bad" })).status, 400);
    assert.equal((await api.post("/api/user/register").send({ ...user, password: "123" })).status, 400);
});

test("user can register, verify session, read feed and log out", async () => {
    const agent = request.agent(app);
    assert.equal((await agent.post("/api/user/register").send(user)).status, 201);
    assert.equal((await agent.post("/api/user/register").send(user)).status, 400, "duplicate");

    const verify = await agent.get("/api/verify");
    assert.equal(verify.status, 200);
    assert.equal(verify.body.role, "user");

    const feed = await agent.get("/api/food");
    assert.equal(feed.status, 200);
    assert.ok(Array.isArray(feed.body.foodItems));

    await agent.post("/api/user/logout");
    assert.equal((await agent.get("/api/food")).status, 401);
});

test("wrong password is rejected", async () => {
    const res = await api.post("/api/user/login").send({ email: user.email, password: "wrongpass" });
    assert.equal(res.status, 400);
});

test("wrong account type gets 403, not 401", async () => {
    const userAgent = request.agent(app);
    await userAgent.post("/api/user/login").send(user);
    assert.equal((await userAgent.get("/api/food/partner")).status, 403);

    const partnerAgent = request.agent(app);
    assert.equal((await partnerAgent.post("/api/foodpartner/register").send(partner)).status, 201);
    assert.equal((await partnerAgent.get("/api/food")).status, 403);
    assert.equal((await partnerAgent.get("/api/food/partner")).status, 200);
});

test("upload rejects missing video and non-video files", async () => {
    const agent = request.agent(app);
    await agent.post("/api/foodpartner/login").send(partner);
    assert.equal((await agent.post("/api/food").field("name", "x")).status, 400);
    const res = await agent.post("/api/food").field("name", "x")
        .attach("video", Buffer.from("not a video"), { filename: "a.txt", contentType: "text/plain" });
    assert.equal(res.status, 400);
});

test("media route rejects invalid keys and unknown routes return JSON 404", async () => {
    assert.equal((await api.get("/api/media/..%2f..%2fetc%2fpasswd")).status, 404);
    const res = await api.get("/api/does-not-exist");
    assert.equal(res.status, 404);
    assert.match(res.headers["content-type"], /json/);
});
