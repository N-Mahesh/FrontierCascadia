# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Frontier Cascadia is a static marketing/landing page for a high school hackathon (September 19, 2026, Seattle). It is a single-page site with no framework — vanilla HTML, CSS, and JS bundled with Vite.

## Commands

- **Dev server:** `npm run dev` (Vite dev server with HMR)
- **Build:** `npm run build` (outputs to `dist/`)
- **Preview production build:** `npm run preview`

No test runner, linter, or formatter is configured.

## Architecture

This is a single-page site with two separate entry points:

- **`index.html` + `style.css` + `main.js`** (root) — The actual hackathon landing page. `index.html` contains all page content as static HTML. `style.css` holds all styles. `main.js` handles interactivity (mobile menu, scroll-based nav, stats count-up animation, countdown timer, Netlify form submissions).
- **`src/main.js` + `src/style.css`** — Vite's default scaffold (counter demo). This is unused boilerplate and not part of the live site.

Key details:
- **GSAP + ScrollTrigger** is the only runtime dependency, used for scroll-triggered animations in `main.js`.
- **Forms** use Netlify Forms (`data-netlify="true"` attributes). There are three: email notification, application, and contact. Submissions are handled client-side in `main.js` via `setupNetlifyForm()`.
- **Fonts:** Inter (body) and Space Grotesk (headings) loaded from Google Fonts.
- **CSS variables** are defined in `:root` of `style.css` for the color system (dark theme: `--deep`, `--surface`, `--card`, `--accent`, etc.).
- **Deployment:** Netlify (implied by form handling). The `dist/` folder is the build output.

## Conventions

- All content lives in `index.html` as semantic sections (`#hero`, `#about`, `#schedule`, `#faq`, `#apply`, `#contact`).
- No component framework — edits to page content go directly in `index.html`.
- CSS uses BEM-like class naming and CSS custom properties for theming.
