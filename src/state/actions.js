// High-level state mutations. Components dispatch these instead of poking
// the store directly, so behavior is testable in isolation.

import { store, VIEW_KEYS, emptyView } from './store.js';
import { parseXml, buildModel } from '../xml/parse.js';
import { applyModelToDom, serialize } from '../xml/serialize.js';
import { validate, applyFix } from '../xml/validate.js';
import { detectProfile, detectAllProfiles, getProfile, PROFILES } from '../devices/index.js';

export async function loadFile(file) {
  try {
    const text = await file.text();
    const doc = parseXml(text);
    const detected = detectAllProfiles(doc);
    const detectedProfiles = detected.length ? detected : [getProfile('launchpad-mini-mk3')];
    const activeProfile = detectedProfiles[0];

    // One view (model + selection + clipboard + visibility) per detected profile.
    const views = new Map();
    for (const p of detectedProfiles) {
      views.set(p.id, { ...emptyView(), model: buildModel(doc, p) });
    }
    const activeView = views.get(activeProfile.id);
    const v = validate(doc, PROFILES);

    store.setState({
      document: doc,
      detectedProfiles,
      profile: activeProfile,
      fileName: file.name,
      views,
      ...activeView,
      clipboardLastSlot: null,
      validation: v,
      loadError: null,
    });
  } catch (err) {
    store.setState({ loadError: String(err?.message ?? err) });
    throw err;
  }
}

// Snapshot the current top-level view slots into the outgoing profile's view,
// then hydrate the top-level slots from the incoming profile's stored view.
export function switchActiveProfile(profileId) {
  const state = store.getState();
  if (!state.profile || state.profile.id === profileId) return;
  const incoming = state.detectedProfiles.find((p) => p.id === profileId);
  if (!incoming) return;
  const views = new Map(state.views);
  // Save outgoing.
  const outgoingView = {};
  for (const k of VIEW_KEYS) outgoingView[k] = state[k];
  views.set(state.profile.id, outgoingView);
  // Load incoming (or seed an empty view + a fresh model from doc).
  const next = views.get(incoming.id) ?? { ...emptyView(), model: buildModel(state.document, incoming) };
  views.set(incoming.id, next);
  store.setState({
    profile: incoming,
    views,
    ...next,
  });
}

export function setSelection(selection) {
  store.setState({ selection });
}

import { applySelectionMode } from '../lib/selection.js';

const HISTORY_MAX = 100;

// Snapshot just the LED-state slots of every button. DOM refs and addr metadata
// don't change, so we don't capture them. The clone is shallow per slot — slots
// are tiny { stateId, raw, dirty } objects, never mutated in place.
function snapshotStates(model) {
  if (!model) return null;
  const out = new Map();
  for (const [id, b] of model.buttons) {
    out.set(id, {
      off:  b.states.off  ? { ...b.states.off  } : null,
      on:   b.states.on   ? { ...b.states.on   } : null,
      fade: b.states.fade ? { ...b.states.fade } : null,
    });
  }
  return out;
}

function restoreStates(model, snap) {
  if (!model || !snap) return;
  for (const [id, slots] of snap) {
    const b = model.buttons.get(id);
    if (!b) continue;
    b.states.off  = slots.off  ? { ...slots.off  } : null;
    b.states.on   = slots.on   ? { ...slots.on   } : null;
    b.states.fade = slots.fade ? { ...slots.fade } : null;
  }
}

// Push the current states snapshot to the past stack and clear future.
// Called as the first step of every model-mutating action; future is wiped
// because a new edit branches off whatever the user did last.
function pushHistory() {
  const { model, history } = store.getState();
  if (!model) return;
  const past = [...(history?.past ?? []), snapshotStates(model)];
  if (past.length > HISTORY_MAX) past.shift();
  store.setState({ history: { past, future: [] } });
}

export function undo() {
  const { model, history } = store.getState();
  if (!model || !history?.past?.length) return;
  const past = [...history.past];
  const restoreSnap = past.pop();
  const future = [snapshotStates(model), ...(history.future ?? [])];
  restoreStates(model, restoreSnap);
  store.setState({ model: { ...model }, history: { past, future } });
}

export function redo() {
  const { model, history } = store.getState();
  if (!model || !history?.future?.length) return;
  const future = [...history.future];
  const next = future.shift();
  const past = [...(history.past ?? []), snapshotStates(model)];
  restoreStates(model, next);
  store.setState({ model: { ...model }, history: { past, future } });
}

// Apply a click in the grid: picks a selection mode from the event, computes
// the next selection (and anchor) from the model layout, and writes both.
export function selectFromClick(targetId, mode) {
  const { model, selection, selectionAnchor } = store.getState();
  if (!model) return;
  const validIds = new Set(model.buttons.keys());
  const { selection: nextSelection, anchor: nextAnchor } =
    applySelectionMode(selection, selectionAnchor, targetId, mode, validIds);
  store.setState({ selection: nextSelection, selectionAnchor: nextAnchor });
}

export function setButtonState(addrId, controlState, stateId) {
  const { model } = store.getState();
  const m = model.buttons.get(addrId);
  if (!m) return;
  if (!m.bound) return; // can't edit a button Daslight didn't map
  const slot = m.states[controlState];
  m.states[controlState] = {
    stateId,
    raw: slot?.raw ?? null,
    dirty: true,
  };
  store.setState({ model: { ...model } });
}

// Apply a fully-formed stateId to the given control state on every selected
// button. Used by paste paths; not for picker clicks (those edit per-axis).
export function applyStateToSelection(controlState, stateId) {
  pushHistory();
  const { model, selection } = store.getState();
  for (const id of selection) {
    const m = model.buttons.get(id);
    if (!m?.bound) continue;
    m.states[controlState] = {
      stateId,
      raw: m.states[controlState]?.raw ?? null,
      dirty: true,
    };
  }
  store.setState({ model: { ...model } });
}

// Edit just one axis (color or mode) on every selected button, preserving
// the other axis per-button. Skips buttons whose allowedColorIds rejects the
// new color rather than forcing a constraint break.
export function setAxisOnSelection(controlState, axis, value) {
  pushHistory();
  const { model, selection, profile } = store.getState();
  if (!profile) return;
  for (const id of selection) {
    const m = model.buttons.get(id);
    if (!m?.bound) continue;
    const cur = m.states[controlState]?.stateId ?? profile.defaultStateId;
    let { colorId, modeId } = profile.decompose(cur);
    if (axis === 'color') colorId = value;
    else if (axis === 'mode') modeId = value;
    if (!m.addr.allowedColorIds.includes(colorId)) continue;
    const next = profile.compose(colorId, modeId, m.addr);
    m.states[controlState] = {
      stateId: next,
      raw: m.states[controlState]?.raw ?? null,
      dirty: true,
    };
  }
  store.setState({ model: { ...model } });
}

// Backwards-compat shim used by current pasteToSelection / older callers.
export const applyToSelection = applyStateToSelection;

// Copy all three control states (off/on/fade) from a single button into the
// clipboard. Replaces the clipboard entirely. clipboardLastSlot is cleared:
// after copyAll, every slot is filled, so the paste fallback can never be
// reached — the value is irrelevant.
export function copyAll(addrId) {
  const { model } = store.getState();
  const m = model.buttons.get(addrId);
  if (!m?.bound) return;
  store.setState({
    clipboard: {
      off: m.states.off?.stateId ?? null,
      on: m.states.on?.stateId ?? null,
      fade: m.states.fade?.stateId ?? null,
    },
    clipboardLastSlot: null,
  });
}

// Copy just one control state from a single button into the clipboard,
// preserving any other slots already in the clipboard. Tracks this as the
// most recent single-slot copy so per-section paste in another slot can
// fall back to it.
export function copyMode(addrId, controlState) {
  const { model, clipboard } = store.getState();
  const m = model.buttons.get(addrId);
  if (!m?.bound) return;
  const stateId = m.states[controlState]?.stateId ?? null;
  store.setState({
    clipboard: { ...(clipboard ?? {}), [controlState]: stateId },
    clipboardLastSlot: controlState,
  });
}

// Resolve which clipboard slot a per-section paste should read from, given
// the target control state. Same-slot wins, then the most recent single
// copy, then the first non-empty slot in canonical 'on' → 'off' → 'fade'
// order as a defensive backstop. Returns null if the clipboard is empty.
export function resolvePasteSlot(clipboard, lastSlot, ctrl) {
  if (!clipboard) return null;
  if (clipboard[ctrl] != null) return ctrl;
  if (lastSlot != null && clipboard[lastSlot] != null) return lastSlot;
  for (const c of ['on', 'off', 'fade']) {
    if (clipboard[c] != null) return c;
  }
  return null;
}

// Paste every populated clipboard slot to every selected button.
export function pasteAll() {
  const { clipboard } = store.getState();
  if (!clipboard) return;
  pushHistory();
  const { model, selection } = store.getState();
  for (const id of selection) {
    const m = model.buttons.get(id);
    if (!m?.bound) continue;
    for (const ctrl of ['off', 'on', 'fade']) {
      if (clipboard[ctrl] == null) continue;
      m.states[ctrl] = {
        stateId: clipboard[ctrl],
        raw: m.states[ctrl]?.raw ?? null,
        dirty: true,
      };
    }
  }
  store.setState({ model: { ...model } });
}

// Paste just one slot to every selected button. Uses resolvePasteSlot so
// the source can fall back to clipboardLastSlot or the canonical defensive
// order when the target slot is empty in the clipboard — that's how
// cross-state copy (Off → On in the same button) works.
export function pasteMode(controlState) {
  const pre = store.getState();
  const slot = resolvePasteSlot(pre.clipboard, pre.clipboardLastSlot, controlState);
  if (slot == null) return;
  pushHistory();
  const { model, selection, clipboard } = store.getState();
  for (const id of selection) {
    const m = model.buttons.get(id);
    if (!m?.bound) continue;
    m.states[controlState] = {
      stateId: clipboard[slot],
      raw: m.states[controlState]?.raw ?? null,
      dirty: true,
    };
  }
  store.setState({ model: { ...model } });
}

// Backwards-compat aliases for callers that still reference the old names.
export const copyFromButton = copyAll;
export const pasteToSelection = pasteAll;

// Copy only the visible-control-state slots from the (first bound) selected
// button — for keyboard Ctrl+C, where the user's intent is filtered by what
// they have on screen via the pills. Slots not in visibleControlStates are
// not written to the clipboard.
export function copyVisible() {
  const { selection, model, visibleControlStates } = store.getState();
  if (!model) return;
  const id = [...selection].find((x) => model.buttons.get(x)?.bound);
  if (!id) return;
  const m = model.buttons.get(id);
  const clip = {};
  let written = [];
  for (const ctrl of visibleControlStates) {
    const v = m.states[ctrl]?.stateId ?? null;
    clip[ctrl] = v;
    if (v != null) written.push(ctrl);
  }
  // Track lastSlot only when exactly one slot got an actual value; otherwise
  // there's no unambiguous "most recent single source" to fall back to.
  const lastSlot = written.length === 1 ? written[0] : null;
  store.setState({ clipboard: clip, clipboardLastSlot: lastSlot });
}

// Paste only the slots in the intersection of the clipboard and the current
// pill filter. Slots present in the clipboard but currently hidden are
// ignored; visible slots not in the clipboard are skipped. Inlined (rather
// than calling pasteMode in a loop) so the operation lands as a single undo
// step.
export function pasteVisible() {
  const pre = store.getState();
  if (!pre.clipboard) return;
  const { clipboard, visibleControlStates } = pre;
  let hasAny = false;
  for (const ctrl of visibleControlStates) {
    if (clipboard[ctrl] != null) { hasAny = true; break; }
  }
  if (!hasAny) return;
  pushHistory();
  const { model, selection } = store.getState();
  for (const id of selection) {
    const m = model.buttons.get(id);
    if (!m?.bound) continue;
    for (const ctrl of visibleControlStates) {
      if (clipboard[ctrl] == null) continue;
      m.states[ctrl] = {
        stateId: clipboard[ctrl],
        raw: m.states[ctrl]?.raw ?? null,
        dirty: true,
      };
    }
  }
  store.setState({ model: { ...model } });
}

export function fixDeviceOut() {
  const { document: doc, validation } = store.getState();
  if (!doc || !validation) return;
  applyFix(validation);
  const v2 = validate(doc, PROFILES);
  store.setState({ validation: v2 });
}

export function downloadCurrent() {
  const state = store.getState();
  const { document: doc, profile, views, fileName } = state;
  if (!doc || !profile) return;
  // Save the active view back into the map first, then flush every view's
  // model so edits made on any tab make it into the exported XML.
  const allViews = new Map(views);
  const activeSnapshot = {};
  for (const k of VIEW_KEYS) activeSnapshot[k] = state[k];
  allViews.set(profile.id, activeSnapshot);
  for (const p of state.detectedProfiles) {
    const view = allViews.get(p.id);
    if (view?.model) applyModelToDom(view.model, p);
  }
  const xml = serialize(doc);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName ?? 'daslight.xml';
  a.click();
  URL.revokeObjectURL(url);
}

export function reset() {
  store.setState({
    document: null,
    detectedProfiles: [],
    profile: null,
    fileName: null,
    views: new Map(),
    model: null,
    selection: new Set(),
    selectionAnchor: null,
    validation: null,
    clipboard: null,
    clipboardLastSlot: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
    loadError: null,
  });
}

// Toggle whether a control state's stripe is visible on the pad and its
// accordion section is rendered in the settings panel. The filter is purely
// a UI concern — the model still carries all three slots.
//
// At least one control state must remain visible; the last toggle-off is a
// no-op so the user can never reach an empty pad.
export function toggleControlStateVisibility(controlState) {
  const { visibleControlStates } = store.getState();
  const next = new Set(visibleControlStates);
  if (next.has(controlState)) {
    if (next.size === 1) return; // would empty the set
    next.delete(controlState);
  } else {
    next.add(controlState);
  }
  store.setState({ visibleControlStates: next });
}
