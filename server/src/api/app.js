import express from "express";
import cors from "cors";

import { registerGames } from "../loaders/registerGames.js";
import { registerRoutes } from "./routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  registerGames();
  registerRoutes(app);

  return app;
}
