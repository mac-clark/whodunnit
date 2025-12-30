// client/src/lib/deviceToken.js

const KEY = "whodunnit_deviceToken";
const DEV_OVERRIDE_KEY = "whodunnit_dev_deviceToken";

function uuidv4() {
  // modern browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // fallback (good enough for LAN party identity)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Primary identity resolver.
 * In DEV, allows overriding via localStorage for view-switching.
 */
export function getDeviceToken() {
  // 🔧 DEV override (used by quickstart / view switching)
  const override = localStorage.getItem(DEV_OVERRIDE_KEY);
  if (override) {
    return override;
  }

  let token = localStorage.getItem(KEY);
  if (!token) {
    token = uuidv4();
    localStorage.setItem(KEY, token);
  }

  return token;
}

/**
 * DEV ONLY: force a specific deviceToken
 */
export function setDevDeviceToken(token) {
  if (!token) return;
  localStorage.setItem(DEV_OVERRIDE_KEY, token);
}

/**
 * DEV ONLY: clear forced identity
 */
export function clearDevDeviceToken() {
  localStorage.removeItem(DEV_OVERRIDE_KEY);
}
