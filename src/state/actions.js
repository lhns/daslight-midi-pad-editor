// High-level state mutations. Components dispatch these instead of poking
// the store directly, so behavior is testable in isolation.

import { store } from './store.js';
import { parseXml, buildModel } from '../xml/parse.js';
import { applyModelToDom, serialize } from '../xml/serialize.js';
import { validate, applyFix } from '../xml/validate.js';
import { detectProfile, getProfile } from '../devices/index.js';

export async function loadFile(file) {
  const text = await file.text();
  const doc = parseXml(text);
  const profile = detectProfile(doc) ?? getProfile('launchpad-mini-mk3');
  const model = buildModel(doc, profile);
  const v = validate(doc, profile);
  store.setState({
    document: doc,
    profile,
    fileName: file.name,
    model,
    selection: new Set(),
    selectionAnchor: null,
    validation: v,
    clipboard: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
  });
}

export function setSelection(selection) {
  store.setState({ selection });
}

import { applySelectionMode } from '../lib/selection.js';

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
// clipboard. Replaces the clipboard entirely.
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
  });
}

// Copy just one control state from a single button into the clipboard,
// preserving any other slots already in the clipboard.
export function copyMode(addrId, controlState) {
  const { model, clipboard } = store.getState();
  const m = model.buttons.get(addrId);
  if (!m?.bound) return;
  const stateId = m.states[controlState]?.stateId ?? null;
  store.setState({
    clipboard: { ...(clipboard ?? {}), [controlState]: stateId },
  });
}

// Paste every populated clipboard slot to every selected button.
export function pasteAll() {
  const { model, selection, clipboard } = store.getState();
  if (!clipboard) return;
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

// Paste just one slot to every selected button.
export function pasteMode(controlState) {
  const { model, selection, clipboard } = store.getState();
  if (!clipboard || clipboard[controlState] == null) return;
  for (const id of selection) {
    const m = model.buttons.get(id);
    if (!m?.bound) continue;
    m.states[controlState] = {
      stateId: clipboard[controlState],
      raw: m.states[controlState]?.raw ?? null,
      dirty: true,
    };
  }
  store.setState({ model: { ...model } });
}

// Backwards-compat aliases for callers that still reference the old names.
export const copyFromButton = copyAll;
export const pasteToSelection = pasteAll;

export function fixDeviceOut() {
  const { document: doc, profile, validation } = store.getState();
  if (!doc || !profile || !validation) return;
  applyFix(validation, profile);
  const v2 = validate(doc, profile);
  store.setState({ validation: v2 });
}

export function downloadCurrent() {
  const { document: doc, profile, model, fileName } = store.getState();
  if (!doc || !profile || !model) return;
  applyModelToDom(model, profile);
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
    profile: null,
    fileName: null,
    model: null,
    selection: new Set(),
    selectionAnchor: null,
    validation: null,
    clipboard: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
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
