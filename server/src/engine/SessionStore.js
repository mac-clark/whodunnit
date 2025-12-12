// src/engine/SessionStore.js

class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  create(session) {
    this.sessions.set(session.id, session);
    return session;
  }

  get(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  remove(sessionId) {
    return this.sessions.delete(sessionId);
  }

  list() {
    return Array.from(this.sessions.values());
  }
}

export const sessionStore = new SessionStore();
