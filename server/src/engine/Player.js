// src/engine/Player.js

import { randomUUID } from "crypto";

const DEFAULT_NAME = "Anonymous";
const MAX_NAME_LENGTH = 24;

export class Player {
  constructor({ name }) {
    this.id = randomUUID();

    this.name = Player.normalizeName(name);

    this.connected = true;
    this.joinedAt = Date.now();
  }

  // ---- static helpers (kept here intentionally)
  static normalizeName(input) {
    if (typeof input !== "string") {
      return DEFAULT_NAME;
    }

    const trimmed = input.trim();

    if (!trimmed) {
      return DEFAULT_NAME;
    }

    return trimmed.slice(0, MAX_NAME_LENGTH);
  }

  // ---- future-friendly hooks
  setConnected(isConnected) {
    this.connected = isConnected;
  }

  rename(newName) {
    this.name = Player.normalizeName(newName);
  }

  // ---- transport-safe output
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      connected: this.connected,
    };
  }
}