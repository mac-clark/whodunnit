import { Router } from "express";
import {
  createSession,
  listSessions,
  joinSession,
  startSession,
  advancePhase,
} from "../controllers/sessionController.js";
import { getNarration } from "../controllers/narrationController.js";

export function registerRoutes(app) {
  const router = Router();

  // ─────────────────────────────
  // Session lifecycle
  // ─────────────────────────────

  router.post("/sessions", createSession);
  router.post("/sessions/:sessionId/start", startSession);
  router.get("/sessions", listSessions);

  // ─────────────────────────────
  // Player joins existing session
  // ─────────────────────────────

  router.post("/sessions/:sessionId/join", joinSession);

  // ─────────────────────────────
  // Game phase control (narrator-only)
  // ─────────────────────────────

  router.post(
    "/sessions/:sessionId/phase/advance",
    advancePhase
  );

  // ─────────────────────────────
  // Narration (read-only)
  // ─────────────────────────────

  router.get(
    "/sessions/:sessionId/narration",
    getNarration
  );

  // ─────────────────────────────
  // Health check
  // ─────────────────────────────

  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use(router);
}