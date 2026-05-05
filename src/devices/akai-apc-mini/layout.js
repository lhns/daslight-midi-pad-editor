import { ALL_STATE_IDS, GREEN_STATE_IDS, RED_STATE_IDS, NO_LED_STATE_IDS } from './states.js';

// APC mini MK1 physical layout mapped to a 9×9 grid:
//   row 1 (bottom)        cols 1..8 = track buttons (notes 64..71, red only)
//                         col 9    = shift button   (note 98, no LED)
//   rows 2..9 (bottom→top) cols 1..8 = main 8×8 clip grid (note = (row-2)*8 + (col-1))
//                          col 9    = scene launch  (notes 82..89, green only)
//
// Note ordering on the device: row 2 = bottom of clip grid (notes 0..7),
// row 9 = top of clip grid (notes 56..63). col 1 = leftmost.

function btn(row, col, kind, status, note, allowedStateIds) {
  return { id: `${row},${col}`, row, col, kind, allowedStateIds, midi: { status, note } };
}

const layout = [];

// track row (physical bottom): row 1 cols 1..8 = notes 64..71
for (let col = 1; col <= 8; col++) {
  layout.push(btn(1, col, 'round', 144, 64 + (col - 1), RED_STATE_IDS));
}
// shift button: row 1 col 9 = note 98, no LED
layout.push(btn(1, 9, 'round', 144, 98, NO_LED_STATE_IDS));

// main 8×8 clip grid: rows 2..9, cols 1..8, note = (row-2)*8 + (col-1)
for (let row = 2; row <= 9; row++) {
  for (let col = 1; col <= 8; col++) {
    const note = (row - 2) * 8 + (col - 1);
    layout.push(btn(row, col, 'grid', 144, note, ALL_STATE_IDS));
  }
}
// scene launch column: rows 2..9 col 9 = notes 82..89
for (let row = 2; row <= 9; row++) {
  const note = 82 + (row - 2);
  layout.push(btn(row, 9, 'round', 144, note, GREEN_STATE_IDS));
}

export const LAYOUT = layout;
