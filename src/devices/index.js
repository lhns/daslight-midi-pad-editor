import { profile as launchpadMiniMk3 } from './launchpad-mini-mk3/profile.js';
import { profile as akaiApcMini } from './akai-apc-mini/profile.js';

export const PROFILES = [launchpadMiniMk3, akaiApcMini];

export function getProfile(id) {
  return PROFILES.find((p) => p.id === id) ?? null;
}

/**
 * Pick the highest-scoring profile for a parsed XML document.
 * Returns null if no profile scores above 0.
 */
export function detectProfile(doc) {
  let best = null;
  let bestScore = 0;
  for (const p of PROFILES) {
    const score = p.matchScore(doc);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore > 0 ? best : null;
}
