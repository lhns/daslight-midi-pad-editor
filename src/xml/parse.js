// Parse a Daslight XML file into a model that pairs each <SHORTCUT> element
// with its profile-decoded LED state per control state (off / on / fade).
//
// The parsed XML Document is kept as the source of truth. The model holds
// references to the original elements so we can mutate only the attributes
// we own and serialize back faithfully.

const CONTROL_OUT_ATTR = { off: 'OUT', on: 'OUT1', fade: 'OUT2' };

export class ParseError extends Error {}

export function parseXml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const err = doc.querySelector('parsererror');
  if (err) throw new ParseError(err.textContent || 'XML parse error');
  return doc;
}

/**
 * Build a model from a parsed Document and a device profile.
 * Buttons present in the XML get their state decoded; others stay unbound.
 *
 * Returns:
 *   { buttons: Map<addrId, ButtonModel>, shortcuts: ShortcutEntry[] }
 *
 * ButtonModel = {
 *   addr,
 *   bound: boolean,         // true if the XML has a <SHORTCUT> for this addr
 *   states: { off, on, fade },  // each: { stateId, raw, dirty: false } or null if unbound
 *   shortcutEl, settingsEl, // DOM refs (when bound)
 * }
 */
export function buildModel(doc, profile) {
  const byAddrId = new Map(profile.layout.map((a) => [a.id, a]));
  const buttons = new Map();
  for (const addr of profile.layout) {
    buttons.set(addr.id, {
      addr,
      bound: false,
      states: { off: null, on: null, fade: null },
      shortcutEl: null,
      settingsEl: null,
    });
  }

  const shortcuts = [];
  for (const sc of doc.querySelectorAll('SHORTCUT')) {
    const settings = sc.querySelector('SETTINGS');
    if (!settings) continue;
    const addr = findAddrFor(settings, profile);
    if (!addr) continue;
    const model = buttons.get(addr.id);
    model.bound = true;
    model.shortcutEl = sc;
    model.settingsEl = settings;
    for (const [ctrl, attr] of Object.entries(CONTROL_OUT_ATTR)) {
      const raw = settings.getAttribute(attr);
      if (raw == null) continue;
      let stateId = null;
      try {
        stateId = profile.outString.parse(raw, addr);
      } catch {
        // unparseable — leave stateId null but keep raw for verbatim re-emit
      }
      model.states[ctrl] = { stateId, raw, dirty: false };
    }
    shortcuts.push({ shortcutEl: sc, settingsEl: settings, addr });
  }

  return { buttons, shortcuts };
}

function findAddrFor(settingsEl, profile) {
  // Match against any of OUT/OUT1/OUT2 by status:note.
  for (const attr of ['OUT', 'OUT1', 'OUT2']) {
    const v = settingsEl.getAttribute(attr);
    if (!v) continue;
    const m = /^(\d+):\d+:(\d+):/.exec(v);
    if (!m) continue;
    const status = Number(m[1]);
    const note = Number(m[2]);
    const addr = profile.layout.find((a) => a.midi.status === status && a.midi.note === note);
    if (addr) return addr;
  }
  return null;
}
