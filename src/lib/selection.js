// Multi-select helpers driven by mouse modifier keys.

export function toggleSelection(set, id, mode) {
  // mode: 'replace' | 'add' | 'toggle' | 'clear'
  if (mode === 'clear') return new Set();
  if (mode === 'replace') return new Set([id]);
  const next = new Set(set);
  if (mode === 'add') {
    next.add(id);
    return next;
  }
  if (mode === 'toggle') {
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }
  return set;
}

export function selectionModeFromEvent(ev) {
  if (ev.shiftKey || ev.ctrlKey || ev.metaKey) return 'toggle';
  return 'replace';
}
