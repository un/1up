import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { betterAuth } from "better-auth";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { authOptions } from "@1up/auth";
import { db } from "@1up/db";
import { appRouter } from "@1up/trpc";

export const auth = betterAuth({
  ...authOptions,
});

const app = new Hono<{
  Variables: {
    db: typeof db;
    auth: {
      user: typeof auth.$Infer.Session.user | null;
      session: typeof auth.$Infer.Session.session | null;
    };
  };
}>();

app.use("*", async (c, next) => {
  c.set("db", db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("auth", { user: null, session: null });
    return next();
  }

  c.set("auth", { user: session.user, session: session.session });
  return next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
app.use(
  "/auth/*",
  cors({
    origin: [process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-trpc-source",
      "trpc-batch",
      "trpc-accept",
    ],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// TRPC Handler

app.use(
  "/trpc/*",
  cors({
    origin: ["http://localhost:3000", "https://your-production-domain.com"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-trpc-source",
      "trpc-batch",
      "trpc-accept",
    ],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => ({
      db: c.get("db"),
      auth: c.get("auth"),
    }),
  }),
);

// Health Check

app.get("/", (c) => {
  return c.json({ message: "im alive!" });
});
export default app;

const server = serve({
  fetch: app.fetch,
  port: 3100,
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT signal, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force close after 5 seconds if server doesn't close gracefully
  setTimeout(() => {
    console.log("Forcing server shutdown after timeout");
    process.exit(1);
  }, 5000);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM signal, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force close after 5 seconds if server doesn't close gracefully
  setTimeout(() => {
    console.log("Forcing server shutdown after timeout");
    process.exit(1);
  }, 5000);
});

// Handle uncaught exceptions to prevent crashes
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});
