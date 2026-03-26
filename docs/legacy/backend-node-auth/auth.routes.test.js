import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Duplex } from "node:stream";
import { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server.js";

class MockSocket extends Duplex {
  constructor() {
    super();
    this.remoteAddress = "127.0.0.1";
    this.writable = true;
  }

  _read() {}

  _write(_chunk, _encoding, callback) {
    callback();
  }

  setTimeout() {}

  cork() {}

  uncork() {}
}

async function invokeApp(app, { method, path, headers = {}, body }) {
  const socket = new MockSocket();
  const rawBody = body ? JSON.stringify(body) : "";
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = path;
  req.headers = {
    host: "localhost",
    ...(rawBody
      ? {
          "content-type": "application/json",
          "content-length": String(Buffer.byteLength(rawBody))
        }
      : {}),
    ...headers
  };

  const res = new ServerResponse(req);
  res.assignSocket(socket);

  const chunks = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = ((chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === "string" ? encoding : undefined));
    }
    return originalWrite(chunk, encoding, callback);
  });

  res.end = ((chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === "string" ? encoding : undefined));
    }
    return originalEnd(chunk, encoding, callback);
  });

  const responseFinished = once(res, "finish").then(() => {
    const text = Buffer.concat(chunks).toString("utf8");
    return {
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      text,
      json: text ? JSON.parse(text) : null
    };
  });

  app.handle(req, res);

  if (rawBody) {
    req.push(rawBody);
  }
  req.push(null);

  return responseFinished;
}

test("GET /api/health returns auth health", async () => {
  const app = createApp();
  const response = await invokeApp(app, { method: "GET", path: "/api/health" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.status, "ok");
  assert.equal(response.json.database_required, false);
});

test("POST /api/auth/login returns JWTs for demo credentials", async () => {
  const app = createApp();
  const response = await invokeApp(app, {
    method: "POST",
    path: "/api/auth/login",
    body: { email: "admin@leadflow.ai", password: "123456" }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json.auth_mode, "demo");
  assert.ok(response.json.access_token);
  assert.ok(response.json.refresh_token);
  assert.equal(response.json.database_required, false);
});

test("POST /api/auth/login rejects invalid credentials", async () => {
  const app = createApp();
  const response = await invokeApp(app, {
    method: "POST",
    path: "/api/auth/login",
    body: { email: "admin@leadflow.ai", password: "wrong" }
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.json.error, "invalid_credentials");
});

test("GET /api/auth/me requires access token", async () => {
  const app = createApp();
  const response = await invokeApp(app, {
    method: "GET",
    path: "/api/auth/me"
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.json.error, "unauthorized");
});

test("GET /api/auth/me returns authenticated user", async () => {
  const app = createApp();
  const login = await invokeApp(app, {
    method: "POST",
    path: "/api/auth/login",
    body: { email: "admin@leadflow.ai", password: "123456" }
  });

  const me = await invokeApp(app, {
    method: "GET",
    path: "/api/auth/me",
    headers: {
      authorization: `Bearer ${login.json.access_token}`
    }
  });

  assert.equal(me.statusCode, 200);
  assert.equal(me.json.user.email, "admin@leadflow.ai");
  assert.equal(me.json.auth_mode, "demo");
});

test("POST /api/auth/refresh rotates access token", async () => {
  const app = createApp();
  const login = await invokeApp(app, {
    method: "POST",
    path: "/api/auth/login",
    body: { email: "admin@leadflow.ai", password: "123456" }
  });

  const refresh = await invokeApp(app, {
    method: "POST",
    path: "/api/auth/refresh",
    body: { refresh_token: login.json.refresh_token }
  });

  assert.equal(refresh.statusCode, 200);
  assert.ok(refresh.json.access_token);
  assert.equal(refresh.json.refresh_token, login.json.refresh_token);
});
