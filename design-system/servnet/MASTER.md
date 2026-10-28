# SERVNET visual system

## Product context

The SERVNET portal lets members retrieve a digital membership card. The CPD team manages member records. The current build is a local demonstration, not a secure production system.

## Direction

Use the association's requested black, gray, and military green identity. In working screens, keep the canvas quiet and put green on the primary action, the active navigation item, and small status marks. Use pale green as the active surface. Keep the member card as the principal brand object, with a flat dark green-black face.

The CPD list uses the Accent ladder app pattern: open canvas, light sidebar, neutral list surface, quiet rows, and no charts or invented metrics. The member dashboard prioritizes the card and its two download actions. The login screen may use a dark brand panel as the one large visual field.

## Tokens

| Role | Token | Value |
| --- | --- | --- |
| Ink | `--color-servnet-ink` | `#262a25` |
| Muted text | `--color-servnet-muted` | `#676d63` |
| Page | `--color-servnet-paper` | `#fafbf9` |
| Surface | `--color-servnet-surface` | `#ffffff` |
| Brand green | `--color-servnet-green` | `#64734c` |
| Green ink | `--color-servnet-green-dark` | `#4e5c3a` |
| Green tint | `--color-servnet-green-pale` | `#edf0e8` |
| Rule | `--color-servnet-line` | `#e8eae5` |
| Typeface | `--font-servnet` | DM Sans |

## Layout and interaction

- Body copy is 16px by default; helper text is at least 11px, and key data is 13–14px or larger.
- Keep the desktop sidebar at 230–256px and use 16px mobile gutters.
- On phones, stack member data, keep actions visible, and preserve access to sign out.
- Interactive buttons have at least 44px height. Keyboard focus uses a visible green ring.
- Honor `prefers-reduced-motion` and avoid layout-shifting hover effects.
- Form controls have visible labels; failed login shows an inline, screen-reader announced message.
- Use Lucide SVG icons, hide decorative icons from assistive technology, and label icon-only controls.
