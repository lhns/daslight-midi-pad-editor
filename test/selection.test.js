import { expect } from '@open-wc/testing';
import { toggleSelection, selectionModeFromEvent } from '../src/lib/selection.js';

describe('selection helpers', () => {
  it('replace mode replaces existing selection', () => {
    const next = toggleSelection(new Set(['a','b']), 'c', 'replace');
    expect([...next]).to.deep.equal(['c']);
  });

  it('toggle mode flips membership', () => {
    expect([...toggleSelection(new Set(['a']), 'a', 'toggle')]).to.deep.equal([]);
    expect([...toggleSelection(new Set(['a']), 'b', 'toggle')]).to.deep.equal(['a','b']);
  });

  it('add mode unions', () => {
    expect([...toggleSelection(new Set(['a']), 'b', 'add')]).to.deep.equal(['a','b']);
  });

  it('selectionModeFromEvent: shift/ctrl/meta → toggle, plain click → replace', () => {
    expect(selectionModeFromEvent({ shiftKey: true })).to.equal('toggle');
    expect(selectionModeFromEvent({ ctrlKey: true })).to.equal('toggle');
    expect(selectionModeFromEvent({ metaKey: true })).to.equal('toggle');
    expect(selectionModeFromEvent({})).to.equal('replace');
  });
});
