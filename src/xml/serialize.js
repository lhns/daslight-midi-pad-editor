// Apply the model's edits back onto the parsed Document and serialize to XML.
// Only attributes the user actually changed are rewritten; everything else
// (including original status bytes for APC mini, attribute order, comments)
// stays as Daslight wrote it.

const CONTROL_OUT_ATTR = { off: 'OUT', on: 'OUT1', fade: 'OUT2' };

export function applyModelToDom(model, profile) {
  for (const m of model.buttons.values()) {
    if (!m.bound) continue;
    for (const [ctrl, attr] of Object.entries(CONTROL_OUT_ATTR)) {
      const slot = m.states[ctrl];
      if (!slot || !slot.dirty || !slot.stateId) continue;
      const next = profile.outString.encode(slot.stateId, m.addr, ctrl);
      m.settingsEl.setAttribute(attr, next);
      slot.raw = next;
      slot.dirty = false;
    }
  }
}

export function serialize(doc) {
  return new XMLSerializer().serializeToString(doc);
}
