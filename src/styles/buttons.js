import { css } from 'lit';

// Shared button styles. Components that render <button> include this in their
// `static styles` array so the buttons look consistent across shadow DOMs.
//
// Translucent rgba tints (rather than fixed --panel-X variables) keep buttons
// elevated against any underlying surface — the same button reads "raised" on
// the page background, on a panel, and inside a <details>[open].
export const buttonStyles = css`
  button {
    font: inherit;
    color: var(--fg, #e7e9ee);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: var(--radius, 6px);
    padding: 6px 12px;
    font-size: 0.875rem;
    line-height: 1.2;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }
  button:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.24);
  }
  button:active {
    background: rgba(255, 255, 255, 0.14);
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  button.primary {
    background: color-mix(in srgb, var(--accent, #3b82f6) 22%, transparent);
    border-color: color-mix(in srgb, var(--accent, #3b82f6) 65%, transparent);
  }
  button.primary:hover {
    background: color-mix(in srgb, var(--accent, #3b82f6) 32%, transparent);
    border-color: var(--accent, #3b82f6);
  }

  button.pill {
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 0.85rem;
  }

  button[aria-pressed='true'],
  button.selected {
    background: color-mix(in srgb, var(--accent, #3b82f6) 22%, transparent);
    border-color: var(--accent, #3b82f6);
    color: var(--fg, #e7e9ee);
  }
`;
