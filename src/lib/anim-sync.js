// Page-wide synchronization for CSS animations (flash, pulse). Browsers
// start each animation when it attaches to its element, so stripes added
// at different times drift out of phase. We fix that by snapping each
// running animation's currentTime to a shared phase computed from a
// single monotonic epoch.

const epoch = performance.now();

function phase(durationMs) {
  return (performance.now() - epoch) % durationMs;
}

function snap(anim) {
  const t = anim.effect?.getTiming();
  const d = t?.duration;
  if (typeof d !== 'number' || !isFinite(d) || d <= 0) return;
  // playState may be 'idle' until the next frame; setting currentTime is
  // still safe and the browser will use it once the animation runs.
  anim.currentTime = phase(d);
}

/**
 * Walk a root (Element, ShadowRoot, or Document) and align all running
 * CSS animations to the shared phase. Call from updated() / connected().
 *
 * Browsers may not have started the animations yet within the same tick
 * the styles were applied, so we defer to the next animation frame.
 */
export function syncAnimations(root) {
  requestAnimationFrame(() => {
    const anims = root?.getAnimations?.({ subtree: true }) ?? [];
    for (const a of anims) snap(a);
  });
}

// One global listener: when the tab becomes visible again, browsers
// resume throttled animations from wherever they paused. Snap them all
// to the global phase so the visible result is in sync.
let installed = false;
export function installGlobalSync() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    for (const a of document.getAnimations?.() ?? []) snap(a);
  });
}

export const _internal = { epoch, phase, snap };
