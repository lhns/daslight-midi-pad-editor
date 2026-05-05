import { LAYOUT } from './layout.js';
import { PALETTE } from './palette.js';
import { MODES } from './modes.js';
import { STATES, codec, stateId, parseStateId } from './out-string.js';

const COLOR_AXIS = PALETTE.map((c) => ({ id: String(c.index), label: c.name, hex: c.hex }));
const MODE_AXIS = MODES.map((m) => ({ id: m.id, label: m.label, animation: m.id }));
const ALL_COLOR_IDS = COLOR_AXIS.map((c) => c.id);

const layout = LAYOUT.map((b) => ({ ...b, allowedColorIds: ALL_COLOR_IDS }));

function compose(colorId, modeId /*, addr */) {
  return stateId(Number(colorId), modeId);
}
function decompose(stateIdValue) {
  const { colorIndex, modeId } = parseStateId(stateIdValue);
  return { colorId: String(colorIndex), modeId };
}

function matchScore(doc) {
  const xml = doc.documentElement?.outerHTML ?? '';
  let hits = 0;
  if (/MIDIOUT2 \(LPMiniMK3 MIDI\)/i.test(xml)) hits += 2;
  if (/MIDIIN2 \(LPMiniMK3 MIDI\)/i.test(xml)) hits += 2;
  if (/LPMiniMK3/i.test(xml)) hits += 1;
  return Math.min(1, hits / 5);
}

export const profile = {
  id: 'launchpad-mini-mk3',
  label: 'Novation Launchpad Mini MK3',
  deviceOut: 'MIDIOUT2 (LPMiniMK3 MIDI)',
  altDeviceOut: ['All'],
  eventPort: 'MIDIIN2 (LPMiniMK3 MIDI)',
  grid: { rows: 9, cols: 9 },
  layout,
  states: STATES,
  colorAxis: COLOR_AXIS,
  modeAxis: MODE_AXIS,
  compose,
  decompose,
  defaultStateId: stateId(0, 'static'),
  defaultColorId: '0',
  defaultModeId: 'static',
  outString: codec,
  matchScore,
  // exposed extras for legacy callers/tests
  palette: PALETTE,
  modes: MODES,
};
