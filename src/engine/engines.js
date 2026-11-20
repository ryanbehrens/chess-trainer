import { Engine } from './Engine';

// Shared engine instances, created lazily and kept alive across tab switches.
const engines = {};

export function getEngine(name) {
  if (!engines[name]) engines[name] = new Engine();
  return engines[name];
}
