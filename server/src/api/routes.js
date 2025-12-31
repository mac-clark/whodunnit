import { Router } from "express";
import {
  createSession,
  listSessions,
  joinSession,
  startSession,
  advancePhase,
  reconnectSession,
  viewSession,
  submitVote,
  submitNightAction,
} from "../controllers/sessionController.js";
import { getNarration } from "../controllers/narrationController.js";
import { devQuickstart } from "../controllers/devController.js";

export function registerRoutes(app) {
  const router = Router();

  if (process.env.DEV_TOOLS === "1") {
    router.post("/dev/quickstart", devQuickstart);
  }

  // ─────────────────────────────
  // Session lifecycle
  // ─────────────────────────────

  router.post("/sessions", createSession);
  router.post("/sessions/:sessionId/start", startSession);
  router.get("/sessions", listSessions);
  router.post("/sessions/:sessionId/vote", submitVote);
  router.post("/sessions/:sessionId/night/action", submitNightAction);

  // ─────────────────────────────
  // Player joins existing session
  // ─────────────────────────────

  router.post("/sessions/:sessionId/join", joinSession);
  router.post("/sessions/:sessionId/reconnect", reconnectSession);
  router.post("/sessions/:sessionId/view", viewSession);

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