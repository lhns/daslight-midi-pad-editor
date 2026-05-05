import { expect } from '@open-wc/testing';
import { profile } from '../../../src/devices/launchpad-mini-mk3/profile.js';
import { parseOut, encodeOut, stateId, STATES } from '../../../src/devices/launchpad-mini-mk3/out-string.js';

const addrFor = (note, status = 144) => profile.layout.find((b) => b.midi.note === note && b.midi.status === status);

describe('LP MK3 OUT-string codec', () => {
  it('parses static color', () => {
    const addr = addrFor(81);
    expect(parseOut('144:0:81:5:MIDIIN2 (LPMiniMK3 MIDI)', addr)).to.equal(stateId(5, 'static'));
  });

  it('parses flash mode', () => {
    const addr = addrFor(81);
    expect(parseOut('144:1:81:5:MIDIIN2 (LPMiniMK3 MIDI)', addr)).to.equal(stateId(5, 'flash'));
  });

  it('parses pulse mode', () => {
    const addr = addrFor(81);
    expect(parseOut('144:2:81:5:MIDIIN2 (LPMiniMK3 MIDI)', addr)).to.equal(stateId(5, 'pulse'));
  });

  it('encodes pulse mode to channel 2', () => {
    const addr = addrFor(81);
    expect(encodeOut(stateId(13, 'pulse'), addr, 'on')).to.equal('144:2:81:13:MIDIIN2 (LPMiniMK3 MIDI)');
  });

  it('roundtrips for note-on grid buttons', () => {
    const addr = addrFor(42);
    for (const s of STATES) {
      const enc = encodeOut(s.id, addr, 'on');
      expect(parseOut(enc, addr)).to.equal(s.id);
    }
  });

  it('roundtrips for CC round buttons (status 176)', () => {
    const addr = addrFor(89, 176);
    expect(addr).to.exist;
    for (const s of STATES.slice(0, 10)) {
      const enc = encodeOut(s.id, addr, 'on');
      expect(parseOut(enc, addr)).to.equal(s.id);
    }
  });

  it('rejects invalid OUT strings', () => {
    const addr = addrFor(81);
    expect(() => parseOut('garbage', addr)).to.throw();
  });

  it('rejects out-of-range color', () => {
    const addr = addrFor(81);
    expect(() => parseOut('144:0:81:99:MIDIIN2 (LPMiniMK3 MIDI)', addr)).to.throw();
  });

  it('rejects unknown channel as mode', () => {
    const addr = addrFor(81);
    expect(() => parseOut('144:5:81:5:MIDIIN2 (LPMiniMK3 MIDI)', addr)).to.throw();
  });
});

describe('LP MK3 layout', () => {
  it('has 80 buttons (8×8 grid + 8 right + 8 top, missing logo corner)', () => {
    expect(profile.layout).to.have.length(80);
  });

  it('has unique button ids', () => {
    const ids = new Set(profile.layout.map((b) => b.id));
    expect(ids.size).to.equal(profile.layout.length);
  });

  it('all states allowed everywhere (no per-button constraints on LP MK3)', () => {
    for (const b of profile.layout) {
      expect(b.allowedStateIds).to.have.length(STATES.length);
    }
  });
});
