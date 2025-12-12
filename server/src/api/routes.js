import { Router } from "express";
import {
  createSession,
  listSessions,
  joinSession,
  startSession,
} from "../controllers/sessionController.js";

export function registerRoutes(app) {
  const router = Router();

  // session lifecycle
  router.post("/sessions", createSession);
  router.post("/sessions/:sessionId/start", startSession);
  router.get("/sessions", listSessions);

  // player joins existing session
  router.post("/sessions/:sessionId/join", joinSession);

  // health check
  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use(router);
}