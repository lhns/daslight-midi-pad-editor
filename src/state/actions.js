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
    validation: v,
    clipboard: null,
  });
}

export function setSelection(selection) {
  store.setState({ selection });
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

export function applyToSelection(controlState, stateId) {
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

export function copyFromButton(addrId) {
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

export function pasteToSelection() {
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
    validation: null,
    clipboard: null,
  });
}
