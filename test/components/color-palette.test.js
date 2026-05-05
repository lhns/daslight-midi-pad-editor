import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/color-palette.js';
import { profile as lpMk3 } from '../../src/devices/launchpad-mini-mk3/profile.js';
import { profile as apcMini } from '../../src/devices/akai-apc-mini/profile.js';

describe('<color-palette> swatch sizing', () => {
  it('LP MK3 renders 64 swatches at the fixed 26px size', async () => {
    const wrap = await fixture(html`
      <div style="width: 800px;">
        <color-palette
          .profile=${lpMk3}
          .allowedColorIds=${lpMk3.colorAxis.map((c) => c.id)}
        ></color-palette>
      </div>
    `);
    const palette = wrap.querySelector('color-palette');
    await palette.updateComplete;
    const swatches = palette.shadowRoot.querySelectorAll('.swatch');
    expect(swatches.length).to.equal(64);
    for (const s of swatches) {
      const r = s.getBoundingClientRect();
      expect(Math.round(r.width)).to.equal(26);
      expect(Math.round(r.height)).to.equal(26);
    }
  });

  it('APC mini renders 4 swatches, also at 26px regardless of container width', async () => {
    const wrap = await fixture(html`
      <div style="width: 800px;">
        <color-palette
          .profile=${apcMini}
          .allowedColorIds=${apcMini.colorAxis.map((c) => c.id)}
        ></color-palette>
      </div>
    `);
    const palette = wrap.querySelector('color-palette');
    await palette.updateComplete;
    const swatches = palette.shadowRoot.querySelectorAll('.swatch');
    expect(swatches.length).to.equal(4);
    for (const s of swatches) {
      const r = s.getBoundingClientRect();
      expect(Math.round(r.width)).to.equal(26);
    }
  });

  it('the colors grid never exceeds the 8-column max-width', async () => {
    const wrap = await fixture(html`
      <div style="width: 1200px;">
        <color-palette
          .profile=${lpMk3}
          .allowedColorIds=${lpMk3.colorAxis.map((c) => c.id)}
        ></color-palette>
      </div>
    `);
    const palette = wrap.querySelector('color-palette');
    await palette.updateComplete;
    const colors = palette.shadowRoot.querySelector('.colors');
    const max = parseFloat(getComputedStyle(colors).maxWidth);
    // 8*26 + 7*4 = 236
    expect(max).to.equal(236);
  });
});
