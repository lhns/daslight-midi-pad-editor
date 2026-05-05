import { expect } from '@open-wc/testing';
import {
  toggleSelection,
  selectionModeFromEvent,
  rectIds,
  applySelectionMode,
} from '../src/lib/selection.js';

describe('selectionModeFromEvent', () => {
  it('plain click → replace', () => {
    expect(selectionModeFromEvent({})).to.equal('replace');
  });
  it('shift → range-rect (wins over ctrl/meta)', () => {
    expect(selectionModeFromEvent({ shiftKey: true })).to.equal('range-rect');
    expect(selectionModeFromEvent({ shiftKey: true, ctrlKey: true })).to.equal('range-rect');
    expect(selectionModeFromEvent({ shiftKey: true, metaKey: true })).to.equal('range-rect');
  });
  it('ctrl / meta without shift → toggle', () => {
    expect(selectionModeFromEvent({ ctrlKey: true })).to.equal('toggle');
    expect(selectionModeFromEvent({ metaKey: true })).to.equal('toggle');
  });
});

describe('rectIds', () => {
  it('returns the inclusive 2D rectangle for ascending order', () => {
    expect(rectIds('2,3', '5,7').sort()).to.deep.equal([
      '2,3','2,4','2,5','2,6','2,7',
      '3,3','3,4','3,5','3,6','3,7',
      '4,3','4,4','4,5','4,6','4,7',
      '5,3','5,4','5,5','5,6','5,7',
    ].sort());
  });
  it('is direction-independent', () => {
    expect(new Set(rectIds('5,7', '2,3'))).to.deep.equal(new Set(rectIds('2,3', '5,7')));
  });
  it('single cell selects only itself', () => {
    expect(rectIds('3,4', '3,4')).to.deep.equal(['3,4']);
  });
});

describe('applySelectionMode', () => {
  const valid = new Set();
  for (let r = 1; r <= 9; r++) for (let c = 1; c <= 9; c++) valid.add(`${r},${c}`);

  it('replace replaces selection and updates anchor', () => {
    const r = applySelectionMode(new Set(['1,1']), '1,1', '5,5', 'replace', valid);
    expect([...r.selection]).to.deep.equal(['5,5']);
    expect(r.anchor).to.equal('5,5');
  });

  it('toggle flips one and updates anchor', () => {
    const onSet = applySelectionMode(new Set(['1,1','2,2']), '1,1', '2,2', 'toggle', valid);
    expect(onSet.selection.has('2,2')).to.equal(false);
    expect(onSet.anchor).to.equal('2,2');
  });

  it('range-rect adds the bounding box and preserves anchor', () => {
    const r = applySelectionMode(new Set(), '2,3', '4,5', 'range-rect', valid);
    expect(r.selection.size).to.equal(9); // 3 rows × 3 cols
    expect(r.anchor).to.equal('2,3');
  });

  it('range-rect without anchor falls back to plain click', () => {
    const r = applySelectionMode(new Set(['1,1']), null, '5,5', 'range-rect', valid);
    expect([...r.selection]).to.deep.equal(['5,5']);
    expect(r.anchor).to.equal('5,5');
  });

  it('range-rect ignores invalid ids in the rectangle', () => {
    const partial = new Set(['2,3', '2,4']); // only two ids exist in this layout
    const r = applySelectionMode(new Set(), '2,3', '4,5', 'range-rect', partial);
    expect([...r.selection].sort()).to.deep.equal(['2,3', '2,4']);
  });
});

describe('toggleSelection (legacy helper)', () => {
  it('replace mode replaces existing selection', () => {
    const next = toggleSelection(new Set(['a','b']), 'c', 'replace');
    expect([...next]).to.deep.equal(['c']);
  });
  it('toggle mode flips membership', () => {
    expect([...toggleSelection(new Set(['a']), 'a', 'toggle')]).to.deep.equal([]);
    expect([...toggleSelection(new Set(['a']), 'b', 'toggle')]).to.deep.equal(['a','b']);
  });
});
