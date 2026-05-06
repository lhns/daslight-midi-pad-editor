// Tiny reactive store. The XML Document is held as the source of truth;
// derived per-button state is recomputed on demand by the device profile.

// The active view's per-profile slots are kept at the top level so components
// can read state.model / state.selection / etc. without knowing about views.
// switchActiveProfile in actions.js hot-swaps these slots from a Map keyed by
// profile id, preserving each tab's state across switches.
const initialState = {
  document: null,        // parsed XML Document
  detectedProfiles: [],  // every device detected in the loaded file
  profile: null,         // active DeviceProfile
  views: new Map(),      // profileId → snapshot of the per-profile view slots
  fileName: null,        // original upload filename
  // Active-view slots (mirror of views.get(profile.id)):
  model: null,
  selection: new Set(),
  selectionAnchor: null,
  clipboard: null,
  clipboardLastSlot: null,  // 'off' | 'on' | 'fade' | null — most recent single-slot copy
  visibleControlStates: new Set(['off', 'on', 'fade']),
  history: { past: [], future: [] },
  validation: null,      // { ok, offenders: [...] } from validate.js
  loadError: null,       // last loadFile error (string), shown under the drop hint
};

export const VIEW_KEYS = ['model', 'selection', 'selectionAnchor', 'clipboard', 'clipboardLastSlot', 'visibleControlStates', 'history'];

export function emptyView() {
  return {
    model: null,
    selection: new Set(),
    selectionAnchor: null,
    clipboard: null,
    clipboardLastSlot: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
    history: { past: [], future: [] },
  };
}

function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    getState: () => state,
    setState: (patchOrFn) => {
      const patch = typeof patchOrFn === 'function' ? patchOrFn(state) : patchOrFn;
      state = { ...state, ...patch };
      listeners.forEach((l) => l(state));
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const store = createStore(initialState);
