# SERVNET visual system

## Product context

The SERVNET portal lets members access a digital membership card. The CPD team manages member records. Keep the existing React component structure, authentication flows, and member-management behavior intact while improving the visual system.

## Direction

Use **Minimalism & Swiss Style**: a clear typographic hierarchy, disciplined grid, generous whitespace, square geometry, fine rules, and only the information needed to complete each task. Keep the association identity in charcoal, warm white, neutral gray, and military green. Use one accent for primary actions and selected states. Avoid gradients, decorative texture, ornamental rings, excess shadows, and rounded card stacks.

The login may use one solid dark brand field beside a quiet form surface. Keep the membership card flat and dark as the main brand object. Keep the admin directory open and table-first, with clear row dividers and compact status indicators.

## Tokens

### Light mode

| Role | Token | Value |
| --- | --- | --- |
| Ink | `--color-servnet-ink` | `#171916` |
| Muted text | `--color-servnet-muted` | `#4f554d` |
| Page | `--color-servnet-paper` | `#f6f7f3` |
| Surface | `--color-servnet-surface` | `#ffffff` |
| Subtle surface | `--color-servnet-surface-subtle` | `#eff1ea` |
| Brand green | `--color-servnet-green` | `#4f5d39` |
| On brand green | `--color-servnet-on-green` | `#ffffff` |
| Green text | `--color-servnet-green-dark` | `#3d492c` |
| Green tint | `--color-servnet-green-pale` | `#e9eddf` |
| Border | `--color-servnet-border` | `#d7dad2` |
| Strong border | `--color-servnet-border-strong` | `#8c9287` |
| Focus ring | `--color-servnet-focus` | `#53613d` |
| Error | `--color-servnet-danger` | `#a13025` |

### Brand object tokens

| Role | Token | Value |
| --- | --- | --- |
| Dark brand panel | `--color-servnet-brand-panel` | `#171916` |
| Dark brand surface | `--color-servnet-brand-surface` | `#20231f` |
| Brand text | `--color-servnet-brand-text` | `#ffffff` |
| Brand secondary text | `--color-servnet-brand-muted` | `#d4d8ce` |
| Brand divider | `--color-servnet-brand-border` | `#59604f` |
| Brand highlight | `--color-servnet-brand-accent` | `#aebf84` |
| Brand highlight text | `--color-servnet-brand-accent-soft` | `#d2ddb8` |

### Dark mode overrides

The interface follows the operating system `prefers-color-scheme` setting. Dark mode uses ink `#f0f1ec`, muted text `#c1c6bc`, page `#171916`, surface `#20231f`, subtle surface `#252923`, green action `#aebf84` with ink `#171916`, green text `#c5ceaa`, selected tint `#30382a`, border `#454b41`, strong border `#8c9387`, focus ring `#c5ceaa`, and error `#ff9c8e`. The dark login brand field shifts slightly to `#11130f` to preserve separation from the form surface.

### Type, spacing, shape, and interaction

| Role | Token | Value |
| --- | --- | --- |
| Typeface | `--font-servnet` | DM Sans, Arial, sans-serif |
| Radius | `--radius-servnet` | 4px |
| Spacing | `--space-1` through `--space-16` | 4, 8, 12, 16, 24, 32, 48, 64px |
| Content width | `--content-width` | 1152px |
| Sidebar width | `--sidebar-width` | 240px |
| Overlay shadow | `--shadow-overlay` | Single restrained modal shadow |
| Fast transition | `--duration-fast` | 140ms |
| Standard transition | `--duration-normal` | 220ms |

Use a 16px body base, 1.5 line-height, and at least 12px for helper text. Use 44px minimum controls. Focus is visible with a 3px green outline. Respect `prefers-reduced-motion`.

## Layout and interaction

- Use a clear column grid on desktop and a single flow on mobile; avoid horizontal overflow at 375px.
- Login access modes are explicit buttons with an announced pressed state; do not hide the mode switch in helper copy.
- Keep labels visible, errors beside their fields, and icon-only actions named.
- In dark mode, preserve text contrast and distinct control boundaries; do not infer dark values from light colors.
- Avoid nonessential transitions and remove them under reduced motion.
- The authenticated member view prioritizes the card and its download actions. The admin view prioritizes member search, list, and management actions.
