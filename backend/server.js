import crypto from "node:crypto";
import process from "node:process";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 3600);
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 604800);
const JWT_SECRET = process.env.JWT_SECRET ?? "leadflow-local-demo-secret";
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "admin@leadflow.ai";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "123456";
const APP_PORT = Number(process.env.AUTH_PORT ?? process.env.PORT ?? 3000);
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const simulatedFailures = {
  invalid_credentials: { status: 401, body: { error: "invalid_credentials", message: "Credenciais demo invalidas." } },
  rate_limit: { status: 429, body: { error: "rate_limit", message: "Muitas tentativas consecutivas." } },
  server_error: { status: 503, body: { error: "auth_unavailable", message: "Servico de autenticacao indisponivel." } },
  malformed_response: { status: 200, body: { ok: false } }
};

function createJwt(payload, expiresInSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    iss: "leadflow-auth",
    aud: "leadflow-web"
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Token ausente");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Formato de token invalido");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  if (signature !== expectedSignature) {
    throw new Error("Assinatura invalida");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Token expirado");
  }

  return payload;
}

function buildUser(email = DEMO_EMAIL) {
  return {
    id: "demo-admin",
    name: "Admin Demo",
    email,
    role: "admin"
  };
}

function buildAuthResponse(email) {
  const user = buildUser(email);
  return {
    access_token: createJwt(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: "access",
        mode: "demo"
      },
      ACCESS_TOKEN_TTL_SECONDS
    ),
    refresh_token: createJwt(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        type: "refresh",
        mode: "demo"
      },
      REFRESH_TOKEN_TTL_SECONDS
    ),
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    auth_mode: "demo",
    database_required: false,
    user
  };
}

function logEvent(level, event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: "leadflow-auth",
    ...details
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

function createApp() {
  const app = express();

  app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
  app.use(express.json());

  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader("x-request-id", req.requestId);
    next();
  });

  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      logEvent("info", "http_request", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        ip: req.ip
      });
    });
    next();
  });

  app.get("/", (req, res) => {
    res.json({
      service: "leadflow-auth",
      status: "ok",
      requestId: req.requestId
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "leadflow-auth",
      database_required: false,
      demo_credentials: {
        email: DEMO_EMAIL,
        password_hint: DEMO_PASSWORD.replace(/./g, "*")
      },
      requestId: req.requestId
    });
  });

  app.get("/api/auth/demo-capabilities", (req, res) => {
    res.json({
      auth_mode: "demo",
      supports_offline_fallback: true,
      supports_database_free_login: true,
      supported_failure_simulations: [...Object.keys(simulatedFailures), "timeout"],
      requestId: req.requestId
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const simulate = req.header("x-demo-simulate");
    const { email, password } = req.body ?? {};

    if (simulate === "timeout") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return res.status(504).json({
        error: "timeout",
        message: "Tempo limite excedido durante autenticacao demo.",
        requestId: req.requestId
      });
    }

    if (simulate && simulatedFailures[simulate]) {
      const failure = simulatedFailures[simulate];
      return res.status(failure.status).json({
        ...failure.body,
        requestId: req.requestId
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        error: "validation_error",
        message: "Email e senha sao obrigatorios.",
        requestId: req.requestId
      });
    }

    if (String(email).toLowerCase() !== DEMO_EMAIL.toLowerCase() || password !== DEMO_PASSWORD) {
      logEvent("warn", "login_failed", {
        requestId: req.requestId,
        reason: "invalid_credentials",
        email
      });
      return res.status(401).json({
        error: "invalid_credentials",
        message: "Credenciais demo invalidas.",
        requestId: req.requestId
      });
    }

    const auth = buildAuthResponse(email);
    logEvent("info", "login_succeeded", {
      requestId: req.requestId,
      email,
      authMode: auth.auth_mode
    });

    return res.json({
      ...auth,
      requestId: req.requestId
    });
  });

  app.post("/api/auth/refresh", (req, res) => {
    const { refresh_token: refreshToken } = req.body ?? {};

    try {
      const payload = verifyJwt(refreshToken);
      if (payload.type !== "refresh") {
        throw new Error("Tipo de token invalido");
      }

      const auth = buildAuthResponse(payload.email);
      return res.json({
        ...auth,
        refresh_token: refreshToken,
        requestId: req.requestId
      });
    } catch (error) {
      return res.status(401).json({
        error: "invalid_refresh_token",
        message: error instanceof Error ? error.message : "Refresh token invalido.",
        requestId: req.requestId
      });
    }
  });

  function requireAuth(req, res, next) {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    try {
      const payload = verifyJwt(token);
      if (payload.type !== "access") {
        throw new Error("Token de acesso invalido");
      }
      req.auth = payload;
      next();
    } catch (error) {
      return res.status(401).json({
        error: "unauthorized",
        message: error instanceof Error ? error.message : "Token invalido.",
        requestId: req.requestId
      });
    }
  }

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({
      user: {
        id: req.auth.sub,
        name: req.auth.name,
        email: req.auth.email,
        role: req.auth.role
      },
      auth_mode: req.auth.mode,
      requestId: req.requestId
    });
  });

  app.use((error, req, res, _next) => {
    logEvent("error", "unhandled_error", {
      requestId: req.requestId,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    res.status(500).json({
      error: "internal_server_error",
      message: "Falha interna no servidor de autenticacao.",
      requestId: req.requestId
    });
  });

  return app;
}

const app = createApp();
const isDirectExecution = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectExecution) {
  app.listen(APP_PORT, () => {
    logEvent("info", "server_started", {
      port: APP_PORT,
      corsOrigins: CORS_ORIGINS
    });
  });
}

export { createApp, createJwt, verifyJwt };
export default app;
