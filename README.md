# English Units (3/4/5) — Elevated UI (Non-Destructive Add-on)

**Goal:** add this folder to your repo as-is (no need to delete existing files).  
All pages are standalone and can live under a subpath (e.g., `/english/`).

## Files
- `index.html` — home (pick Unit 3/4/5 + categories)
- `unit.html` — per-unit landing (reads `?u=3|4|5`)
- `browse.html` — topic list per unit/category (reads `?u=..&cat=..`)
- `exercise.html` — interactive practice (reads `?id=..`)
- `styles.css` — design system + elevation tokens
- `js/app.js` — minimal router/helpers + MCQ/Cloze components
- `data/sample/` — sample content (non-official placeholders)

## Usage
- Open `index.html` locally or deploy under your site.
- Add more exercises by appending to `data/sample/index.json` and creating matching `{id}.json` files.
- Keep RTL and accessibility (`dir="rtl"`, focus styles, ARIA roles).

## Integration (safe)
- Put the entire `english-site-elevated/` folder next to your existing app.
- Link to it from your current nav (e.g., add a menu item pointing to `english-site-elevated/index.html`).
- No global JS/CSS collisions: selectors are scoped; colors & fonts via CSS vars.

## Notes
- Content here is processed for learning only; replace with MOE-sourced items as needed.
- To enable "Exam mode": toggle the switch in `exercise.html` (hides immediate feedback).
