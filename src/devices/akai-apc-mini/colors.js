// User-facing color and mode axes for the APC mini MK1.
// The internal 7-state velocity table lives in states.js; this module exposes
// the orthogonal (color × mode) view that the UI renders, and the codec maps
// the two axes to a state id via compose() in profile.js.
export const COLORS = [
  { id: 'off',    label: 'Off',    hex: '#000000' },
  { id: 'green',  label: 'Green',  hex: '#22c55e' },
  { id: 'red',    label: 'Red',    hex: '#ef4444' },
  { id: 'yellow', label: 'Yellow', hex: '#eab308' },
];

export const MODES = [
  { id: 'static', label: 'Static', animation: 'static' },
  { id: 'flash',  label: 'Flash',  animation: 'flash'  },
];

const TABLE = {
  'off:static': 'off',
  'off:flash': 'off',
  'green:static': 'green',
  'green:flash': 'green-blink',
  'red:static': 'red',
  'red:flash': 'red-blink',
  'yellow:static': 'yellow',
  'yellow:flash': 'yellow-blink',
};

const INVERSE = {
  off: { colorId: 'off', modeId: 'static' },
  green: { colorId: 'green', modeId: 'static' },
  'green-blink': { colorId: 'green', modeId: 'flash' },
  red: { colorId: 'red', modeId: 'static' },
  'red-blink': { colorId: 'red', modeId: 'flash' },
  yellow: { colorId: 'yellow', modeId: 'static' },
  'yellow-blink': { colorId: 'yellow', modeId: 'flash' },
};

export function compose(colorId, modeId /*, addr */) {
  const stateId = TABLE[`${colorId}:${modeId}`];
  if (!stateId) throw new Error(`APC mini compose: unknown axes ${colorId}/${modeId}`);
  return stateId;
}

export function decompose(stateId) {
  const v = INVERSE[stateId];
  if (!v) throw new Error(`APC mini decompose: unknown state ${stateId}`);
  return { ...v };
}
