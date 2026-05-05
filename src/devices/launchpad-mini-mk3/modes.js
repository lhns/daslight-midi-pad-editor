// Launchpad Mini MK3 LED modes are encoded as the MIDI channel byte.
// Channel 0 = static, 1 = flash, 2 = pulse.
export const MODES = [
  { id: 'static', label: 'Static', channel: 0 },
  { id: 'flash',  label: 'Flash',  channel: 1 },
  { id: 'pulse',  label: 'Pulse',  channel: 2 },
];

export const MODE_BY_CHANNEL = Object.fromEntries(MODES.map((m) => [m.channel, m]));
export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m]));
