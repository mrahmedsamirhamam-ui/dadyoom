import { registerXpListener } from "./listeners/xp.listener";

let initialized = false;

export function initializeEventSystem() {
  if (initialized) return;

  initialized = true;

  registerXpListener();
}
