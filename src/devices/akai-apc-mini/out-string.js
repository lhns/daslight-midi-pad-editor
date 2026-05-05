import { STATE_BY_ID, STATE_BY_VELOCITY } from './states.js';

const PORT = 'APC MINI';

// "STATUS:CHANNEL:NOTE:VELOCITY:PORT"
const RE = /^(\d+):(\d+):(\d+):(\d+):(.+)$/;

export function parseOut(s, addr) {
  const m = RE.exec(s);
  if (!m) throw new Error(`invalid OUT string: ${s}`);
  const status = Number(m[1]);
  const channel = Number(m[2]);
  const note = Number(m[3]);
  const velocity = Number(m[4]);
  if (note !== addr.midi.note) {
    throw new Error(`OUT addr mismatch: expected note ${addr.midi.note}, got ${note}`);
  }
  if (status !== 144 && status !== 128) {
    throw new Error(`unexpected status byte for APC mini: ${status}`);
  }
  if (channel !== 0) {
    throw new Error(`unexpected channel for APC mini (must be 0): ${channel}`);
  }
  const state = STATE_BY_VELOCITY[velocity];
  if (!state) throw new Error(`unknown APC mini velocity: ${velocity}`);
  return state.id;
}

// We emit Note On (status 144) on encode; the APC mini hardware uses Note On
// velocity to set LEDs. Daslight files in the wild contain both 128 and 144,
// but on round-trip we keep the original raw string verbatim if the user did
// not change the state — see xml/serialize.js.
export function encodeOut(stateIdValue, addr /*, controlState */) {
  const state = STATE_BY_ID[stateIdValue];
  if (!state) throw new Error(`unknown APC mini state id: ${stateIdValue}`);
  return `144:0:${addr.midi.note}:${state.velocity}:${PORT}`;
}

export const codec = { parse: parseOut, encode: encodeOut };
