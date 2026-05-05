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

  it('reflects selected attribute', async () => {
    const el = await fixture(html`<pad-button selected .addr=${{ id: '1,1', kind: 'grid' }} .states=${{ off: null, on: null, fade: null }}></pad-button>`);
    expect(el.hasAttribute('selected')).to.equal(true);
  });
});
