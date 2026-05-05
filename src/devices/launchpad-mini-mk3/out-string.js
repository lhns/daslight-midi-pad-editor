import { PALETTE } from './palette.js';
import { MODES, MODE_BY_CHANNEL, MODE_BY_ID } from './modes.js';

const PORT = 'MIDIIN2 (LPMiniMK3 MIDI)';

// State id format: 'lp:<colorIndex>:<modeId>'
export function stateId(colorIndex, modeId) {
  return `lp:${colorIndex}:${modeId}`;
}

export function parseStateId(id) {
  const m = /^lp:(\d+):(static|flash|pulse)$/.exec(id);
  if (!m) throw new Error(`invalid LP MK3 state id: ${id}`);
  return { colorIndex: Number(m[1]), modeId: m[2] };
}

export const STATES = (() => {
  const out = [];
  for (const c of PALETTE) {
    for (const m of MODES) {
      out.push({
        id: stateId(c.index, m.id),
        label: `${c.name} (${m.label})`,
        hex: c.hex,
        animation: m.id,
      });
    }
  }
  return out;
})();

const STATE_BY_ID = Object.fromEntries(STATES.map((s) => [s.id, s]));
export function getState(id) { return STATE_BY_ID[id]; }

// "STATUS:CHANNEL:NOTE:COLOR:PORT"
const RE = /^(\d+):(\d+):(\d+):(\d+):(.+)$/;

export function parseOut(s, addr) {
  const m = RE.exec(s);
  if (!m) throw new Error(`invalid OUT string: ${s}`);
  const status = Number(m[1]);
  const channel = Number(m[2]);
  const note = Number(m[3]);
  const color = Number(m[4]);
  if (status !== addr.midi.status || note !== addr.midi.note) {
    throw new Error(`OUT addr mismatch: expected ${addr.midi.status}:${addr.midi.note}, got ${status}:${note}`);
  }
  if (color < 0 || color > 63) {
    throw new Error(`color index out of range (0..63): ${color}`);
  }
  const mode = MODE_BY_CHANNEL[channel];
  if (!mode) throw new Error(`unknown LP mode channel: ${channel}`);
  return stateId(color, mode.id);
}

export function encodeOut(stateIdValue, addr /*, controlState */) {
  const { colorIndex, modeId } = parseStateId(stateIdValue);
  const mode = MODE_BY_ID[modeId];
  return `${addr.midi.status}:${mode.channel}:${addr.midi.note}:${colorIndex}:${PORT}`;
}

export const codec = { parse: parseOut, encode: encodeOut };
