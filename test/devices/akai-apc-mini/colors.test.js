import { expect } from '@open-wc/testing';
import { compose, decompose, COLORS, MODES } from '../../../src/devices/akai-apc-mini/colors.js';

describe('APC mini colors compose/decompose', () => {
  it('compose covers all 4×2 axes combinations', () => {
    expect(compose('off', 'static')).to.equal('off');
    expect(compose('off', 'flash')).to.equal('off');
    expect(compose('green', 'static')).to.equal('green');
    expect(compose('green', 'flash')).to.equal('green-blink');
    expect(compose('red', 'static')).to.equal('red');
    expect(compose('red', 'flash')).to.equal('red-blink');
    expect(compose('yellow', 'static')).to.equal('yellow');
    expect(compose('yellow', 'flash')).to.equal('yellow-blink');
  });

  it('decompose is the inverse for non-off states', () => {
    for (const stateId of ['green', 'green-blink', 'red', 'red-blink', 'yellow', 'yellow-blink']) {
      const { colorId, modeId } = decompose(stateId);
      expect(compose(colorId, modeId)).to.equal(stateId);
    }
  });

  it('decompose("off") returns colorId off, default mode static', () => {
    expect(decompose('off')).to.deep.equal({ colorId: 'off', modeId: 'static' });
  });

  it('exports the expected axes', () => {
    expect(COLORS.map((c) => c.id)).to.deep.equal(['off', 'green', 'red', 'yellow']);
    expect(MODES.map((m) => m.id)).to.deep.equal(['static', 'flash']);
  });
});
