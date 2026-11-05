# Naturfag theme fixes, November 2026

Nutrition's dark palette was applied to `body`, while the text color and page background were computed on `:root` using the light palette. Dark controls therefore inherited dark text and sat on a light canvas. Root and body now follow the same theme, including the initial embedded/standalone load. Theme messages retain the existing same-origin and parent-window checks.

Controls use palette surfaces instead of literal white backgrounds. Removing broad dark-mode overrides also preserves selected, correct and incorrect states. Neutral feedback and placeholders follow the palette. Scientific SVGs retain a light drawing surface and their original colors, with captions on the themed background; no inversion changes the meaning of diagrams.

Chemistry's filled buttons and atom core now retain contrast with white labels. Periodic-table symbols, atomic numbers and answer states remain readable with and without category colors. Muted reference cells remain legible. Light-mode styles and learning logic are preserved.

Validation:

- `node --test --test-isolation=none tests/ernaering.test.mjs`: 32 curriculum/schema/evaluation checks.
- `node tests/naturfag-dark-mode.cjs`: all 192 nutrition exercises before selection, selected and revealed; dark desktop/mobile and light desktop; wrong feedback, flashcards, glossary, bank, help, saved standalone theme, chemistry pages and periodic-table answer/color states. No visible HTML text contrast failures or JavaScript errors.
- `node tests/naturfag-modules.cjs`: shared navigation, saved progress, route history, theme switching and responsive layout across five viewport sizes.

The contrast test measures rendered HTML text against composited surfaces, settles transitions before measuring, and excludes inactive controls. It is a regression check, not a complete accessibility certification. Scientific figures were also visually inspected. Reports and screenshots are written to `DARK_QA_DIR`, defaulting to `/workspace/artifacts/naturfag-dark-mode`.
