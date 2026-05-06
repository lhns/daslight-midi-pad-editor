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

/**
 * Return every profile whose markers appear in the document at all, sorted by
 * descending score. A mixed-device file yields more than one entry; a single
 * device file yields one. The current `matchScore` is essentially binary
 * (1 if the profile's port/device strings are present, else 0); a > 0 cutoff
 * is therefore a clean "is this profile in the file" check.
 */
export function detectAllProfiles(doc) {
  return PROFILES
    .map((p) => ({ profile: p, score: p.matchScore(doc) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.profile);
}
