import { expect } from '@open-wc/testing';
import { profile } from '../../../src/devices/akai-apc-mini/profile.js';
import { parseOut, encodeOut } from '../../../src/devices/akai-apc-mini/out-string.js';

const addrFor = (note) => profile.layout.find((b) => b.midi.note === note);

describe('APC mini OUT-string codec', () => {
  it('parses off / green / green-blink', () => {
    const a = addrFor(56);
    expect(parseOut('144:0:56:0:APC MINI', a)).to.equal('off');
    expect(parseOut('144:0:56:1:APC MINI', a)).to.equal('green');
    expect(parseOut('144:0:56:2:APC MINI', a)).to.equal('green-blink');
  });

  it('parses red / red-blink / yellow / yellow-blink', () => {
    const a = addrFor(56);
    expect(parseOut('144:0:56:3:APC MINI', a)).to.equal('red');
    expect(parseOut('144:0:56:4:APC MINI', a)).to.equal('red-blink');
    expect(parseOut('144:0:56:5:APC MINI', a)).to.equal('yellow');
    expect(parseOut('144:0:56:6:APC MINI', a)).to.equal('yellow-blink');
  });

  it('accepts status 128 on parse (Daslight emits both 128 and 144)', () => {
    const a = addrFor(56);
    expect(parseOut('128:0:56:0:APC MINI', a)).to.equal('off');
  });

  it('always emits status 144 on encode', () => {
    const a = addrFor(56);
    expect(encodeOut('green', a, 'on')).to.equal('144:0:56:1:APC MINI');
  });

  it('rejects non-zero channel', () => {
    const a = addrFor(56);
    expect(() => parseOut('144:1:56:0:APC MINI', a)).to.throw();
  });
});

describe('APC mini layout', () => {
  it('has 81 buttons (64 grid + 8 track + 8 scene + shift)', () => {
    expect(profile.layout).to.have.length(81);
  });

  it('track row (row 1, cols 1..8) only allows red colors', () => {
    for (let col = 1; col <= 8; col++) {
      const b = profile.layout.find((x) => x.row === 1 && x.col === col);
      expect(b.allowedColorIds).to.deep.equal(['off', 'red']);
    }
  });

  it('scene column (col 9, rows 2..9) only allows green colors', () => {
    for (let row = 2; row <= 9; row++) {
      const b = profile.layout.find((x) => x.row === row && x.col === 9);
      expect(b.allowedColorIds).to.deep.equal(['off', 'green']);
    }
  });

  it('shift button (1,9) has no LED', () => {
    const b = profile.layout.find((x) => x.row === 1 && x.col === 9);
    expect(b.midi.note).to.equal(98);
    expect(b.allowedColorIds).to.deep.equal(['off']);
  });

  it('main grid maps note correctly', () => {
    // (2,1) → note 0; (9,8) → note 63
    expect(profile.layout.find((b) => b.row === 2 && b.col === 1).midi.note).to.equal(0);
    expect(profile.layout.find((b) => b.row === 9 && b.col === 8).midi.note).to.equal(63);
  });
});
