import { LAYOUT } from './layout.js';
import { STATES } from './states.js';
import { COLORS, MODES, compose, decompose } from './colors.js';
import { codec } from './out-string.js';

function matchScore(doc) {
  const xml = doc.documentElement?.outerHTML ?? '';
  let hits = 0;
  if (/DEVICEOUT="APC MINI"/i.test(xml)) hits += 3;
  if (/:APC MINI"/i.test(xml)) hits += 2; // port suffix in OUT/EVENT
  return Math.min(1, hits / 5);
}

export const profile = {
  id: 'akai-apc-mini',
  label: 'Akai APC Mini MK1',
  deviceOut: 'APC MINI',
  altDeviceOut: ['All'],
  eventPort: 'APC MINI',
  grid: { rows: 9, cols: 9 },
  // Clip grid (cols 1..8) is wider than tall on the real device; col 9 stays
  // square-sized for the round scene/shift buttons.
  gridTemplate: {
    columns: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1],
    rows:    [1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  layout: LAYOUT,
  states: STATES,
  colorAxis: COLORS,
  modeAxis: MODES,
  compose,
  decompose,
  defaultStateId: 'off',
  defaultColorId: 'off',
  defaultModeId: 'static',
  flashStrategy: 'black',
  outString: codec,
  matchScore,
};
