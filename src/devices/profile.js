/**
 * @typedef {'off'|'on'|'fade'} ControlState
 *
 * @typedef {Object} LedState
 * @property {string} id            Stable ID (e.g. 'static:5', 'red-blink').
 * @property {string} label         Display label.
 * @property {string} hex           Display color in the UI.
 * @property {'static'|'flash'|'pulse'} animation
 *
 * @typedef {Object} ButtonAddr
 * @property {string} id            "row,col"
 * @property {number} row           1..N (1 = bottom)
 * @property {number} col           1..N (1 = left)
 * @property {'grid'|'round'} kind
 * @property {string[]} allowedStateIds  Whitelist of LED states this button supports.
 * @property {Object} midi          Profile-specific MIDI fields (UI ignores).
 *
 * @typedef {Object} OutCodec
 * @property {(s: string, addr: ButtonAddr) => string} parse
 *   Parse an OUT/OUT1/OUT2 string and return an LedState id.
 * @property {(stateId: string, addr: ButtonAddr, controlState: ControlState) => string} encode
 *   Encode an LedState id back to an OUT/OUT1/OUT2 string for the given control state.
 *
 * @typedef {Object} PickerHint
 * @property {'orthogonal'|'flat'} kind
 * @property {string=} colorAxisLabel
 * @property {string=} modeAxisLabel
 * @property {(state: LedState) => {color: string, mode: string}=} split
 *   For 'orthogonal' pickers: split a state into (colorKey, modeKey) for grid layout.
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
 * @property {string} defaultStateId
 * @property {PickerHint} pickerHint
 * @property {OutCodec} outString
 * @property {(doc: Document) => number} matchScore   // 0..1 heuristic for auto-detection
 */
export const PROFILE = {};
