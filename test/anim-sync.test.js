import { expect, fixture, html, aTimeout } from '@open-wc/testing';
import '../src/components/pad-button.js';

const lpRedFlash = { id: 'lp:5:flash', hex: '#FF0000', animation: 'flash', label: 'red flash' };
const lpRedPulse = { id: 'lp:5:pulse', hex: '#FF0000', animation: 'pulse', label: 'red pulse' };

async function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function flashAnimsOf(el) {
  return el.shadowRoot.getAnimations({ subtree: true }).filter((a) => a.animationName === 'flash');
}
function pulseAnimsOf(el) {
  return el.shadowRoot.getAnimations({ subtree: true }).filter((a) => a.animationName === 'pulse');
}

describe('animation sync', () => {
  it('flash animations on stripes mounted at different times share phase', async () => {
    const a = await fixture(html`
      <pad-button .addr=${{ id: '1,1', kind: 'grid' }} .states=${{ off: null, on: lpRedFlash, fade: null }}></pad-button>
    `);
    await aTimeout(400); // let some real time pass
    const b = await fixture(html`
      <pad-button .addr=${{ id: '1,2', kind: 'grid' }} .states=${{ off: null, on: lpRedFlash, fade: null }}></pad-button>
    `);
    // anim-sync defers via requestAnimationFrame; wait two frames so both
    // pad-buttons have run their snap.
    await nextFrame();
    await nextFrame();

    const aAnim = flashAnimsOf(a)[0];
    const bAnim = flashAnimsOf(b)[0];
    expect(aAnim, 'a flash anim').to.exist;
    expect(bAnim, 'b flash anim').to.exist;
    const drift = Math.abs(Number(aAnim.currentTime) - Number(bAnim.currentTime));
    // Allow ~one frame of drift.
    expect(drift, `drift ${drift}ms`).to.be.lessThan(20);
  });

  it('pulse animations stay in phase across late mounts', async () => {
    const a = await fixture(html`
      <pad-button .addr=${{ id: '2,1', kind: 'grid' }} .states=${{ off: null, on: lpRedPulse, fade: null }}></pad-button>
    `);
    await aTimeout(350);
    const b = await fixture(html`
      <pad-button .addr=${{ id: '2,2', kind: 'grid' }} .states=${{ off: null, on: lpRedPulse, fade: null }}></pad-button>
    `);
    await nextFrame();
    await nextFrame();

    const aAnim = pulseAnimsOf(a)[0];
    const bAnim = pulseAnimsOf(b)[0];
    expect(aAnim).to.exist;
    expect(bAnim).to.exist;
    const drift = Math.abs(Number(aAnim.currentTime) - Number(bAnim.currentTime));
    expect(drift, `drift ${drift}ms`).to.be.lessThan(20);
  });
});
