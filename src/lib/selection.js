// Selection helpers driven by mouse modifier keys.
//
// modes:
//   'replace'    — plain click. Replaces the selection and updates the anchor.
//   'toggle'     — Ctrl/Cmd-click. Toggles one button; updates the anchor.
//   'range-rect' — Shift-click. Adds the 2D rectangle (anchor↔target) to the
//                  current selection; the anchor is preserved.

export function selectionModeFromEvent(ev) {
  if (ev.shiftKey) return 'range-rect';
  if (ev.ctrlKey || ev.metaKey) return 'toggle';
  return 'replace';
}

function parseId(id) {
  const [r, c] = id.split(',').map(Number);
  return { row: r, col: c };
}

/**
 * All button ids inside the inclusive rectangle from anchor to target.
 * Direction-independent — the bounding box is normalized.
 */
export function rectIds(anchorId, targetId) {
  const a = parseId(anchorId);
  const b = parseId(targetId);
  const r1 = Math.min(a.row, b.row), r2 = Math.max(a.row, b.row);
  const c1 = Math.min(a.col, b.col), c2 = Math.max(a.col, b.col);
  const ids = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) ids.push(`${r},${c}`);
  }
  return ids;
}

/**
 * Compute the next selection given the previous one, the anchor, the click
 * target, the mode, and the set of *valid* button ids in the current layout.
 *
 * Returns { selection, anchor }. The anchor for 'range-rect' is preserved;
 * for 'replace' / 'toggle' it becomes the click target.
 */
export function applySelectionMode(prev, anchorId, targetId, mode, validIds) {
  const valid = validIds instanceof Set ? validIds : new Set(validIds);

  if (mode === 'range-rect' && anchorId && valid.has(anchorId)) {
    const next = new Set(prev);
    for (const id of rectIds(anchorId, targetId)) {
      if (valid.has(id)) next.add(id);
    }
    return { selection: next, anchor: anchorId };
  }

  if (mode === 'toggle') {
    const next = new Set(prev);
    if (next.has(targetId)) next.delete(targetId); else next.add(targetId);
    return { selection: next, anchor: targetId };
  }

  // 'replace' or 'range-rect' without anchor → behave as plain click.
  return { selection: new Set([targetId]), anchor: targetId };
}

// Legacy single-id helper, still used in a few places. Will be retired once
// all call sites migrate to applySelectionMode.
export function toggleSelection(set, id, mode) {
  if (mode === 'clear') return new Set();
  if (mode === 'replace') return new Set([id]);
  if (mode === 'add') {
    const next = new Set(set); next.add(id); return next;
  }
  if (mode === 'toggle') {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }
  return set;
}
