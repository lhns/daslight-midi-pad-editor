import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/pad-button.js';

const lpRed = { id: 'lp:5:static', hex: '#FF0000', animation: 'static', label: 'red' };
const lpRedFlash = { ...lpRed, id: 'lp:5:flash', animation: 'flash' };

describe('<pad-button>', () => {
  it('renders three stripes', async () => {
    const el = await fixture(html`<pad-button .addr=${{ id: '1,1', kind: 'grid' }} .states=${{ off: lpRed, on: lpRed, fade: lpRed }}></pad-button>`);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    expect(stripes.length).to.equal(3);
  });

  it('applies flash animation class for flash state', async () => {
    const el = await fixture(html`<pad-button .addr=${{ id: '1,1', kind: 'grid' }} .states=${{ off: null, on: lpRedFlash, fade: null }}></pad-button>`);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    expect(stripes[1].classList.contains('flash')).to.equal(true);
  });

  it('renders only the visible control states', async () => {
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: lpRed, on: lpRed, fade: lpRed }}
        .visibleControlStates=${['on']}
      ></pad-button>
    `);
    expect(el.shadowRoot.querySelectorAll('.stripe').length).to.equal(1);
  });

  it('renders two stripes in canonical order when off and fade are visible', async () => {
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: lpRed, on: null, fade: lpRedFlash }}
        .visibleControlStates=${['off','fade']}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    expect(stripes.length).to.equal(2);
    // Top stripe = off (static red), bottom stripe = fade (flash).
    expect(stripes[0].classList.contains('flash')).to.equal(false);
    expect(stripes[1].classList.contains('flash')).to.equal(true);
  });

  it('renders the unmapped marker SVG when bound=false', async () => {
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: null, on: null, fade: null }}
      ></pad-button>
    `);
    // Lit boolean property defaulting: ?bound omitted → undefined → host.bound === false after reflect.
    el.bound = false;
    await el.updateComplete;
    const svg = el.shadowRoot.querySelector('svg.unmapped');
    expect(svg).to.exist;
    expect(svg.getAttribute('aria-hidden')).to.equal('true');
  });

  it('does not render the marker when bound=true', async () => {
    const el = await fixture(html`
      <pad-button
        bound
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: null, on: null, fade: null }}
      ></pad-button>
    `);
    expect(el.shadowRoot.querySelector('svg.unmapped')).to.equal(null);
  });

  it('LP MK3: off pulse stripe animates against black', async () => {
    const offPulse = { id: 'lp:5:pulse', hex: '#FF0000', animation: 'pulse', label: 'red pulse' };
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: offPulse, on: null, fade: null }}
        .flashStrategy=${'off-state'}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    const offStripe = stripes[0];
    expect(offStripe.style.getPropertyValue('--alt-color').trim()).to.equal('#000');
  });

  it('LP MK3: on pulse stripe animates against the static off-state color', async () => {
    const offRed = { id: 'lp:5:static', hex: '#FF0000', animation: 'static', label: 'red' };
    const onGreenPulse = { id: 'lp:21:pulse', hex: '#00FF00', animation: 'pulse', label: 'green pulse' };
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: offRed, on: onGreenPulse, fade: null }}
        .flashStrategy=${'off-state'}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    expect(stripes[1].style.getPropertyValue('--alt-color').trim()).to.equal('#FF0000');
  });

  it('LP MK3 edge: when off is itself animated, on falls back to black', async () => {
    const offPulse = { id: 'lp:5:pulse', hex: '#FF0000', animation: 'pulse', label: 'red pulse' };
    const onGreenPulse = { id: 'lp:21:pulse', hex: '#00FF00', animation: 'pulse', label: 'green pulse' };
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: offPulse, on: onGreenPulse, fade: null }}
        .flashStrategy=${'off-state'}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    // off stripe still pulses against black
    expect(stripes[0].style.getPropertyValue('--alt-color').trim()).to.equal('#000');
    // on stripe falls back to black because off is animated
    expect(stripes[1].style.getPropertyValue('--alt-color').trim()).to.equal('#000');
  });

  it('LP MK3: fade pulse with off=flash also falls back to black', async () => {
    const offFlash = { id: 'lp:5:flash', hex: '#FF0000', animation: 'flash', label: 'red flash' };
    const fadeBluePulse = { id: 'lp:45:pulse', hex: '#0000FF', animation: 'pulse', label: 'blue pulse' };
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: offFlash, on: null, fade: fadeBluePulse }}
        .flashStrategy=${'off-state'}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    // fade stripe at index 2 — off animated → black
    expect(stripes[2].style.getPropertyValue('--alt-color').trim()).to.equal('#000');
  });

  it('APC mini: red-blink stripe animates against black regardless of off-state', async () => {
    const offRed = { id: 'red', hex: '#ef4444', animation: 'static', label: 'red' };
    const onRedBlink = { id: 'red-blink', hex: '#ef4444', animation: 'flash', label: 'red blink' };
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: offRed, on: onRedBlink, fade: null }}
        .flashStrategy=${'black'}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    expect(stripes[1].style.getPropertyValue('--alt-color').trim()).to.equal('#000');
  });

  it('static stripe carries the color but no animation class', async () => {
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: null, on: lpRed, fade: null }}
        .flashStrategy=${'off-state'}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelectorAll('.stripe');
    expect(stripes[1].classList.contains('flash')).to.equal(false);
    expect(stripes[1].classList.contains('pulse')).to.equal(false);
    expect(stripes[1].style.getPropertyValue('--stripe-color').trim()).to.equal('#FF0000');
  });

  it('shape="circle" rounds the .stripes corners', async () => {
    const el = await fixture(html`
      <pad-button
        bound shape="circle"
        .addr=${{ id: '1,1', kind: 'round' }}
        .states=${{ off: null, on: null, fade: null }}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelector('.stripes');
    // 50% of computed width — browsers report it as a px value matching the radius.
    const r = getComputedStyle(stripes).borderRadius;
    expect(r).to.match(/%|50%/);
  });

  it('shape="square" applies aspect-ratio 1 without circle border-radius', async () => {
    const el = await fixture(html`
      <pad-button
        bound shape="square"
        .addr=${{ id: '1,9', kind: 'round' }}
        .states=${{ off: null, on: null, fade: null }}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelector('.stripes');
    const cs = getComputedStyle(stripes);
    expect(cs.aspectRatio).to.equal('1 / 1');
    // Must not be the circle's 50% — the regular 6px corner radius is fine.
    expect(cs.borderRadius).not.to.match(/^50%$|^50% 50% 50% 50%$/);
  });

  it('shape="rect" .stripes fills both axes (no aspect-ratio override)', async () => {
    const el = await fixture(html`
      <pad-button
        bound shape="rect"
        .addr=${{ id: '5,3', kind: 'grid' }}
        .states=${{ off: null, on: null, fade: null }}
      ></pad-button>
    `);
    const stripes = el.shadowRoot.querySelector('.stripes');
    expect(getComputedStyle(stripes).aspectRatio).to.equal('auto');
  });

  it('unmapped marker renders inside .stripes when bound is unset (undefined-safe)', async () => {
    const el = await fixture(html`
      <pad-button
        .addr=${{ id: '1,1', kind: 'grid' }}
        .states=${{ off: null, on: null, fade: null }}
      ></pad-button>
    `);
    // bound never set explicitly → undefined; the marker should still render.
    const svg = el.shadowRoot.querySelector('svg.unmapped');
    expect(svg).to.exist;
  });

  it('unmapped marker stays square on elongated buttons', async () => {
    const wrap = await fixture(html`
      <div style="display: grid; grid-template-columns: 90px; grid-template-rows: 60px; --pad-size: 60px;">
        <pad-button
          shape="rect"
          .addr=${{ id: '5,3', kind: 'grid' }}
          .states=${{ off: null, on: null, fade: null }}
        ></pad-button>
      </div>
    `);
    const pad = wrap.querySelector('pad-button');
    await pad.updateComplete;
    const svg = pad.shadowRoot.querySelector('svg.unmapped');
    expect(svg).to.exist;
    const r = svg.getBoundingClientRect();
    expect(Math.round(r.width)).to.equal(Math.round(r.height));
    // Sized to 70% of the smaller axis (60px) → ~42px.
    expect(Math.round(r.width)).to.be.closeTo(42, 2);
  });

  it('unmapped marker is square and sized correctly on a square button', async () => {
    const wrap = await fixture(html`
      <div style="display: grid; grid-template-columns: 60px; grid-template-rows: 60px; --pad-size: 60px;">
        <pad-button
          shape="rect"
          .addr=${{ id: '5,3', kind: 'grid' }}
          .states=${{ off: null, on: null, fade: null }}
        ></pad-button>
      </div>
    `);
    const pad = wrap.querySelector('pad-button');
    await pad.updateComplete;
    const svg = pad.shadowRoot.querySelector('svg.unmapped');
    const r = svg.getBoundingClientRect();
    expect(Math.round(r.width)).to.equal(Math.round(r.height));
    expect(Math.round(r.width)).to.be.closeTo(42, 2);
  });

  it('reflects selected attribute', async () => {
    const el = await fixture(html`<pad-button selected .addr=${{ id: '1,1', kind: 'grid' }} .states=${{ off: null, on: null, fade: null }}></pad-button>`);
    expect(el.hasAttribute('selected')).to.equal(true);
  });
});
