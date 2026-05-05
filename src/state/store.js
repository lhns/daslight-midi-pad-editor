// Tiny reactive store. The XML Document is held as the source of truth;
// derived per-button state is recomputed on demand by the device profile.

const initialState = {
  document: null,        // parsed XML Document
  profile: null,         // active DeviceProfile
  fileName: null,        // original upload filename
  buttons: [],           // [{ addr, off, on, fade, shortcutEl }]
  selection: new Set(),  // set of button ids ("row,col")
  selectionAnchor: null, // last plain-clicked button id (for shift-rect range)
  validation: null,      // { ok, offenders: [...] } from validate.js
  clipboard: null,       // { off?, on?, fade? } — slots are optional
  visibleControlStates: new Set(['off', 'on', 'fade']), // pad+panel visibility filter
};

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
