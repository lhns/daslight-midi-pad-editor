import { LAYOUT } from './layout.js';
import { PALETTE } from './palette.js';
import { MODES } from './modes.js';
import { STATES, codec, stateId, parseStateId } from './out-string.js';

const ALL_STATE_IDS = STATES.map((s) => s.id);

const layout = LAYOUT.map((b) => ({ ...b, allowedStateIds: ALL_STATE_IDS }));

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
  defaultStateId: stateId(0, 'static'),
  pickerHint: {
    kind: 'orthogonal',
    colorAxisLabel: 'Color',
    modeAxisLabel: 'Mode',
    split(state) {
      const { colorIndex, modeId } = parseStateId(state.id);
      return { color: String(colorIndex), mode: modeId };
    },
  },
  outString: codec,
  matchScore,
  // exposed extras for UI/tests
  palette: PALETTE,
  modes: MODES,
};
