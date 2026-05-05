/**
 * @typedef {'off'|'on'|'fade'} ControlState
 *
 * @typedef {Object} LedState
 * @property {string} id            Stable ID (e.g. 'lp:5:static', 'red-blink').
 * @property {string} label         Display label.
 * @property {string} hex           Display color in the UI.
 * @property {'static'|'flash'|'pulse'} animation
 *
 * @typedef {Object} ColorAxisEntry
 * @property {string} id
 * @property {string} label
 * @property {string} hex
 *
 * @typedef {Object} ModeAxisEntry
 * @property {string} id
 * @property {string} label
 * @property {'static'|'flash'|'pulse'} animation
 *
 * @typedef {Object} ButtonAddr
 * @property {string} id            "row,col"
 * @property {number} row           1..N (1 = bottom)
 * @property {number} col           1..N (1 = left)
 * @property {'grid'|'round'} kind
 * @property {string[]} allowedColorIds   Whitelist of color axis ids this button supports.
 * @property {Object} midi          Profile-specific MIDI fields (UI ignores).
 *
 * @typedef {Object} OutCodec
 * @property {(s: string, addr: ButtonAddr) => string} parse
 *   Parse an OUT/OUT1/OUT2 string and return an LedState id.
 * @property {(stateId: string, addr: ButtonAddr, controlState: ControlState) => string} encode
 *
 * @typedef {Object} DeviceProfile
 * @property {string} id
 * @property {string} label
 * @property {string} deviceOut             // expected DEVICEOUT value
 * @property {string[]} altDeviceOut        // alternates that should be auto-fixed
 * @property {string} eventPort             // port suffix in EVENT DATA / OUT
 * @property {{rows:number, cols:number}} grid
 * @property {ButtonAddr[]} layout
 * @property {LedState[]} states
 * @property {ColorAxisEntry[]} colorAxis    // user-facing color choices
 * @property {ModeAxisEntry[]} modeAxis      // user-facing mode choices
 * @property {(colorId: string, modeId: string, addr: ButtonAddr) => string} compose
 * @property {(stateId: string) => {colorId: string, modeId: string}} decompose
 * @property {string} defaultStateId
 * @property {string} defaultColorId
 * @property {string} defaultModeId
 * @property {OutCodec} outString
 * @property {(doc: Document) => number} matchScore   // 0..1 heuristic for auto-detection
 */
export const PROFILE = {};
