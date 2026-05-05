import { LAYOUT } from './layout.js';
import { STATES } from './states.js';
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
  layout: LAYOUT,
  states: STATES,
  defaultStateId: 'off',
  pickerHint: { kind: 'flat' },
  outString: codec,
  matchScore,
};
