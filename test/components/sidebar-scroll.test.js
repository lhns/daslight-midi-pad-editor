import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/launchpad-grid.js';
import '../../src/components/settings-panel.js';
import { store } from '../../src/state/store.js';
import { profile as apcMini } from '../../src/devices/akai-apc-mini/profile.js';

// Reproduces the layout chain that <app-root> renders, but inside a
// fixed-size container so we can assert the sidebar scrolls internally
// instead of growing the page or shrinking the pad.

function loadModel() {
  const buttons = new Map();
  for (const addr of apcMini.layout) {
    const isFirstGrid = addr.id === '5,3';
    buttons.set(addr.id, {
      addr,
      bound: isFirstGrid,
      states: isFirstGrid
        ? {
            off: { stateId: 'off', raw: '', dirty: false },
            on: { stateId: 'green', raw: '', dirty: false },
            fade: { stateId: 'red-blink', raw: '', dirty: false },
          }
        : { off: null, on: null, fade: null },
      shortcutEl: null, settingsEl: null,
    });
  }
  store.setState({
    document: {}, profile: apcMini, fileName: 'fake.xml',
    model: { buttons, shortcuts: [] },
    selection: new Set(['5,3']),
    selectionAnchor: null,
    validation: { ok: true, offenders: [] },
    clipboard: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
  });
}

function reset() {
  store.setState({
    document: null, profile: null, fileName: null, model: null,
    selection: new Set(), selectionAnchor: null, validation: null, clipboard: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
  });
}

async function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('sidebar scrolls without resizing the board', () => {
  afterEach(() => reset());

  it('panel scrolls internally; pad-area keeps its height when accordions expand', async () => {
    loadModel();
    const wrap = await fixture(html`
      <div style="height: 600px; width: 1024px; overflow: hidden;
                  display: grid; grid-template-rows: auto 1fr;">
        <header style="height: 50px;"></header>
        <main style="display: grid; grid-template-columns: 1fr auto;
                     min-height: 0; height: 100%; overflow: hidden;">
          <div class="pad-area"
               style="overflow: auto; min-height: 0; min-width: 0;
                      display: grid; place-items: center;">
            <launchpad-grid></launchpad-grid>
          </div>
          <settings-panel></settings-panel>
        </main>
      </div>
    `);

    const padArea = wrap.querySelector('.pad-area');
    const panel = wrap.querySelector('settings-panel');
    const grid = wrap.querySelector('launchpad-grid');
    await grid.updateComplete;
    await panel.updateComplete;
    await nextFrame();

    const beforePadHeight = padArea.clientHeight;
    const beforePanelHeight = panel.clientHeight;

    // Open all three accordion sections.
    const detailsEls = panel.shadowRoot.querySelectorAll('details');
    expect(detailsEls.length).to.equal(3);
    for (const d of detailsEls) d.open = true;
    await panel.updateComplete;
    await nextFrame();
    await nextFrame();

    // Panel content should overflow now.
    expect(panel.scrollHeight).to.be.greaterThan(panel.clientHeight);
    // Panel didn't grow.
    expect(panel.clientHeight).to.equal(beforePanelHeight);
    // Pad-area didn't shrink (and didn't grow either).
    expect(padArea.clientHeight).to.equal(beforePadHeight);
    // Container has no page scroll.
    expect(wrap.scrollHeight).to.equal(wrap.clientHeight);
  });
});
