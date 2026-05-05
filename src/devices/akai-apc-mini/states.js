// Akai APC mini MK1 has a fixed LED palette of 7 states. Mode and color are
// packed together into the velocity byte of a note message. Channel is always 0.
//
// Per spec the velocity → LED mapping is:
//   0 = off, 1 = green, 2 = green blink, 3 = red, 4 = red blink, 5 = yellow, 6 = yellow blink.
// Some sources list these doubled (0/2/4/...); Daslight's XML uses the single
// values 0..6, which we mirror here.
export const STATES = [
  { id: 'off',          label: 'Off',          hex: '#000000', animation: 'static', velocity: 0 },
  { id: 'green',        label: 'Green',        hex: '#22c55e', animation: 'static', velocity: 1 },
  { id: 'green-blink',  label: 'Green blink',  hex: '#22c55e', animation: 'flash',  velocity: 2 },
  { id: 'red',          label: 'Red',          hex: '#ef4444', animation: 'static', velocity: 3 },
  { id: 'red-blink',    label: 'Red blink',    hex: '#ef4444', animation: 'flash',  velocity: 4 },
  { id: 'yellow',       label: 'Yellow',       hex: '#eab308', animation: 'static', velocity: 5 },
  { id: 'yellow-blink', label: 'Yellow blink', hex: '#eab308', animation: 'flash',  velocity: 6 },
];

export const STATE_BY_ID = Object.fromEntries(STATES.map((s) => [s.id, s]));
export const STATE_BY_VELOCITY = Object.fromEntries(STATES.map((s) => [s.velocity, s]));

export const ALL_STATE_IDS = STATES.map((s) => s.id);
export const GREEN_STATE_IDS = ['off', 'green', 'green-blink'];
export const RED_STATE_IDS = ['off', 'red', 'red-blink'];
export const NO_LED_STATE_IDS = ['off'];
