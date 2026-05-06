import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/settings-panel.js';
import { store } from '../../src/state/store.js';
import { copyAll, copyMode, pasteAll, pasteMode } from '../../src/state/actions.js';
import { profile as apcMini } from '../../src/devices/akai-apc-mini/profile.js';

function loadModel(seed) {
  const buttons = new Map();
  for (const addr of apcMini.layout) {
    const init = seed.get(addr.id);
    buttons.set(addr.id, {
      addr,
      bound: !!init,
      states: {
        off:  init?.off  ? { stateId: init.off,  raw: '', dirty: false } : null,
        on:   init?.on   ? { stateId: init.on,   raw: '', dirty: false } : null,
        fade: init?.fade ? { stateId: init.fade, raw: '', dirty: false } : null,
      },
      shortcutEl: null, settingsEl: null,
    });
  }
  store.setState({
    document: {}, profile: apcMini, fileName: 'fake.xml',
    model: { buttons, shortcuts: [] },
    selection: new Set([...seed.keys()]),
    selectionAnchor: null, validation: null, clipboard: null,
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

describe('<settings-panel>', () => {
  afterEach(() => reset());

  it('renders three accordion details (off/on/fade)', async () => {
    loadModel(new Map([['5,3', { off: 'off', on: 'green', fade: 'red-blink' }]]));
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const details = el.shadowRoot.querySelectorAll('details');
    expect(details.length).to.equal(3);
    const labels = [...details].map((d) => d.querySelector('.summary-label').textContent.trim());
    expect(labels).to.deep.equal(['Off', 'On', 'Fade']);
  });

  it('per-mode copy seeds only that slot in the clipboard', async () => {
    const id = '5,3';
    loadModel(new Map([[id, { off: 'off', on: 'green', fade: 'red-blink' }]]));
    copyMode(id, 'on');
    expect(store.getState().clipboard).to.deep.equal({ on: 'green' });
    expect(store.getState().clipboard.off).to.equal(undefined);
  });

  it('paste all writes every populated clipboard slot', async () => {
    const a = '5,3', b = '5,4';
    loadModel(new Map([
      [a, { off: 'off', on: 'green', fade: 'red-blink' }],
      [b, { off: 'off', on: 'off', fade: 'off' }],
    ]));
    copyAll(a);
    store.setState({ selection: new Set([b]) });
    pasteAll();
    const m = store.getState().model.buttons.get(b);
    expect(m.states.on.stateId).to.equal('green');
    expect(m.states.fade.stateId).to.equal('red-blink');
  });

  it('paste mode writes only that slot, leaving the others untouched', async () => {
    const a = '5,3', b = '5,4';
    loadModel(new Map([
      [a, { off: 'red', on: 'green', fade: 'yellow' }],
      [b, { off: 'off', on: 'off', fade: 'off' }],
    ]));
    copyMode(a, 'on'); // clipboard = { on: 'green' }
    store.setState({ selection: new Set([b]) });
    pasteMode('on');
    const m = store.getState().model.buttons.get(b);
    expect(m.states.on.stateId).to.equal('green');
    expect(m.states.off.stateId).to.equal('off');
    expect(m.states.fade.stateId).to.equal('off');
  });

  it('paste mode is a no-op when the clipboard slot is empty', async () => {
    const id = '5,3';
    loadModel(new Map([[id, { off: 'off', on: 'green', fade: 'off' }]]));
    pasteMode('on'); // no clipboard yet
    expect(store.getState().model.buttons.get(id).states.on.stateId).to.equal('green');
  });

  it('shows the unbound warning banner when selection contains unmapped buttons', async () => {
    loadModel(new Map([['5,3', null]])); // bound:false because seed value is null
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const warn = el.shadowRoot.querySelector('.unbound-warn');
    expect(warn).to.exist;
  });

  it('only renders accordion sections for visible control states (canonical order)', async () => {
    loadModel(new Map([['5,3', { off: 'off', on: 'green', fade: 'red-blink' }]]));
    store.setState({ visibleControlStates: new Set(['off', 'fade']) });
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const labels = [...el.shadowRoot.querySelectorAll('.summary-label')].map((s) => s.textContent.trim());
    expect(labels).to.deep.equal(['Off', 'Fade']);
  });

  it('renders accordion bodies with picker-row + side-col layout', async () => {
    loadModel(new Map([['5,3', { off: 'off', on: 'green', fade: 'red-blink' }]]));
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const firstBody = el.shadowRoot.querySelector('details .body');
    const row = firstBody.querySelector('.picker-row');
    expect(row).to.exist;
    expect(row.firstElementChild.tagName.toLowerCase()).to.equal('color-palette');
    const sideCol = row.querySelector('.side-col');
    expect(sideCol).to.exist;
  });

  it('side-col contains modes + Copy + Paste for a single APC mini selection', async () => {
    // APC mini has 2 modes (static, flash); single button is selected.
    loadModel(new Map([['5,3', { off: 'off', on: 'green', fade: 'off' }]]));
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const sideCol = el.shadowRoot.querySelector('details .side-col');
    const buttons = sideCol.querySelectorAll('button');
    // 2 modes + Copy + Paste
    expect(buttons.length).to.equal(4);
    const labels = [...buttons].map((b) => b.textContent.trim());
    expect(labels).to.include('Copy');
    expect(labels).to.include('Paste');
    expect(labels).to.include('Static');
    expect(labels).to.include('Flash');
  });

  it('side-col drops Copy when more than one button is selected', async () => {
    loadModel(new Map([
      ['5,3', { on: 'green' }],
      ['5,4', { on: 'red' }],
    ]));
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const sideCol = el.shadowRoot.querySelector('details .side-col');
    const labels = [...sideCol.querySelectorAll('button')].map((b) => b.textContent.trim());
    expect(labels).to.not.include('Copy');
    expect(labels).to.include('Paste');
  });

  it('Paste buttons show plain text (no "(empty)" suffix) when clipboard is empty', async () => {
    loadModel(new Map([['5,3', { on: 'green' }]]));
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const allText = el.shadowRoot.textContent;
    expect(allText).not.to.contain('(empty)');
    const pasteAll = [...el.shadowRoot.querySelectorAll('.actions button')].find((b) => b.textContent.trim() === 'Paste all');
    expect(pasteAll).to.exist;
    expect(pasteAll.disabled).to.equal(true);
  });

  it('side-col has a "Mode" axis label above the mode buttons', async () => {
    loadModel(new Map([['5,3', { on: 'green' }]]));
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const sideCol = el.shadowRoot.querySelector('details .side-col');
    const label = sideCol.querySelector('.axis-label');
    expect(label).to.exist;
    expect(label.textContent.trim()).to.equal('Mode');
    // Label sits before the first mode button in DOM order.
    const firstButton = sideCol.querySelector('button');
    expect(label.compareDocumentPosition(firstButton) & Node.DOCUMENT_POSITION_FOLLOWING).to.be.greaterThan(0);
  });

  it('clicking a side-col mode button updates the model via setAxisOnSelection', async () => {
    loadModel(new Map([['5,3', { on: 'green' }]]));
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    // Find the "On" details and the Flash button inside its side-col.
    const allDetails = el.shadowRoot.querySelectorAll('details');
    const onDetails = [...allDetails].find((d) => d.querySelector('.summary-label').textContent.trim() === 'On');
    const flash = [...onDetails.querySelectorAll('.side-col button')].find((b) => b.textContent.trim() === 'Flash');
    expect(flash).to.exist;
    flash.click();
    await el.updateComplete;
    expect(store.getState().model.buttons.get('5,3').states.on.stateId).to.equal('green-blink');
  });

  it('scrolls internally rather than growing past its container', async () => {
    loadModel(new Map([['5,3', { off: 'red', on: 'green', fade: 'yellow' }]]));
    // Mount inside a 400px-tall container with overflow:hidden, mimicking <main>.
    const wrap = await fixture(html`
      <div style="height: 400px; overflow: hidden; display: grid; grid-template-rows: 100%;">
        <settings-panel></settings-panel>
      </div>
    `);
    const panel = wrap.querySelector('settings-panel');
    await panel.updateComplete;
    expect(getComputedStyle(panel).overflowY).to.equal('auto');
    // The panel must not exceed the container height.
    expect(panel.clientHeight).to.be.at.most(400);
  });
});
