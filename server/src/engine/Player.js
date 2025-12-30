// src/engine/Player.js
import { randomUUID } from "crypto";

const DEFAULT_NAME = "Anonymous";
const MAX_NAME_LENGTH = 24;

export class Player {
  constructor({ name, deviceToken = null }) {
    this.id = randomUUID();

    this.name = Player.normalizeName(name);

    // NEW: persistent identity per device/browser
    this.deviceToken = Player.normalizeDeviceToken(deviceToken);

    this.connected = true;
    this.joinedAt = Date.now();
  }

  static normalizeName(input) {
    if (typeof input !== "string") return DEFAULT_NAME;
    const trimmed = input.trim();
    if (!trimmed) return DEFAULT_NAME;
    return trimmed.slice(0, MAX_NAME_LENGTH);
  }

  // NEW
  static normalizeDeviceToken(input) {
    if (typeof input !== "string") return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Keep it loose: allow uuid or any stable token string
    // Hard cap to prevent abuse
    return trimmed.slice(0, 128);
  }

  setConnected(isConnected) {
    this.connected = isConnected;
  }

  rename(newName) {
    this.name = Player.normalizeName(newName);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      connected: this.connected,
      // NOTE: intentionally not exposing deviceToken
    };
  }
}