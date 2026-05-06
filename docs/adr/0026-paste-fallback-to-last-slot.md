# 26. Per-section Paste falls back to the most recently copied slot

## Status
Accepted.

## Context
The clipboard is a partial `{ off?, on?, fade? }` map (ADR 0014). Each
per-section Paste button used to read its own slot only — `Paste On`
looked at `clipboard.on` and did nothing if that slot was empty. The
real-life consequence: a user couldn't copy the Off color of a button
into the same button's On slot, because the only path required first
copying *into* On somehow. The user explicitly asked for that
within-button cross-state copy, without adding new buttons.

## Decision

### Resolver
A new state field `clipboardLastSlot: 'off' | 'on' | 'fade' | null`
tracks the most recent **single-slot** copy. `pasteMode(ctrl)` uses
`resolvePasteSlot(clipboard, lastSlot, ctrl)` which tries:

1. `clipboard[ctrl]` (same-slot — preferred when available).
2. `clipboard[lastSlot]` (most recent single-slot copy).
3. First non-empty slot in canonical order **'on' → 'off' → 'fade'**
   (defensive backstop for stale lastSlot — should rarely trigger in
   practice).
4. Otherwise null → no-op.

### Update rules

| Action | clipboard | clipboardLastSlot |
| --- | --- | --- |
| `copyMode(addr, ctrl)` | sets `clipboard[ctrl]` | `lastSlot = ctrl` |
| `copyAll(addr)` | sets all three slots | `lastSlot = null`* |
| `copyVisible()` | sets visible slots | `ctrl` if exactly one slot was written; otherwise `null` |
| `loadFile`, `reset` | clears clipboard | `lastSlot = null` |

\*After `copyAll`, every slot is filled, so the resolver never reaches
the fallback path. Setting `lastSlot = null` is the honest
representation ("no specific most-recent source").

### Paste-button enable rule
Per-section Paste is enabled when `resolvePasteSlot(...) != null` —
i.e. when the resolver finds *any* slot to paste from, not just the
same-slot one. Combined with `title="Paste from <Source>"` for
fallback paths, the user sees what's about to happen on hover before
clicking.

### What stays unchanged

- `copyMode`, `copyAll`, `copyVisible` keep their slot-write
  semantics; they only also update `lastSlot`.
- Clipboard data structure (`{ off?, on?, fade? }`) is unchanged.
- `pasteAll` (top-level "Paste all") and `pasteVisible` (Ctrl+V) **do
  not** use the resolver — they iterate the populated clipboard slots
  and write into matching target slots only. Bulk paste should never
  extrapolate from one source slot to other targets.
- Per-profile views: `clipboardLastSlot` joins `VIEW_KEYS`, so
  switching tabs preserves each tab's last-slot independently.
- Undo/redo: `pasteMode` still wraps `pushHistory()` — every paste
  click is one undo step regardless of the resolved source.

## Consequences

- The originally requested workflow works in two clicks: in Off
  section click `Copy`, then in On section click `Paste` — On takes
  on Off's color. Same-button or cross-button.
- After `copyAll`, every section paste behaves exactly as before
  (same-slot wins; resolver never reaches step 2).
- After Ctrl+C with a pill filter that exposed exactly one section,
  per-section Paste in any other section now writes that single
  copied value (previously a silent no-op). The tooltip ("Paste from
  X") makes this visible.
- The order of single-slot copies matters for the fallback (last one
  wins). Canonical order is the backstop, used only when lastSlot is
  null — a state that's only reachable through `copyAll`,
  multi-pill `copyVisible`, or the initial empty state.

### Why lastSlot over canonical-only

A canonical-order-only fallback (no lastSlot) is simpler but counter-
intuitive: after `copyMode('on')` then `copyMode('off')`, a paste
fallback would always pick 'on' regardless of which the user copied
*last*. lastSlot respects copy order, which is what users expect.

### Why canonical 'on' first as defensive

On is the LED's primary trigger state (the color when the button is
pressed). Among ambiguous choices, that's the most likely intended
source.

## Updates to other ADRs

- **0014 (Settings-Panel-Accordion):** notes the new fallback resolver
  and the tooltip pattern.
- **0019 (Keyboard Shortcuts):** clarifies that Ctrl+V (`pasteVisible`)
  intentionally does **not** use the resolver — it's a bulk operation,
  not a per-section one.
