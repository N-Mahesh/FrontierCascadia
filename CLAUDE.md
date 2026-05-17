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
- **Forms** use Netlify Forms (`data-netlify="true"` attributes). Three forms: `notify` (hero email capture), `contact` (contact section), and `register` (registration modal; see Registration data flow below). The notify/contact forms are wired via `setupNetlifyForm()` in `main.js`; the register form has its own bespoke submit handler inside `setupRegisterModal()` because it drives a multi-step wizard with an in-modal success state.
- **Fonts:** Inter (body) and Space Grotesk (headings) loaded from Google Fonts.
- **CSS variables** are defined in `:root` of `style.css` for the color system (dark theme: `--deep`, `--surface`, `--card`, `--accent`, etc.).
- **Deployment:** Netlify (implied by form handling). The `dist/` folder is the build output.

## Conventions

- All content lives in `index.html` as semantic sections (`#hero`, `#about`, `#schedule`, `#faq`, `#apply`, `#contact`).
- No component framework — edits to page content go directly in `index.html`.
- CSS uses BEM-like class naming and CSS custom properties for theming.

## Registration data flow

The `register` form (defined inside the `<dialog id="register-modal">` in `index.html`) posts to Netlify Forms with `data-netlify="true"`. Netlify captures the submission and stores it in the project dashboard under **Forms → register**. From there, the live pipeline is:

1. **Netlify Forms** receives the POST. Submissions land in the Netlify UI and email notifications (if configured) go to the team.
2. **Zapier** watches the form via a "New Form Submission" trigger on the Netlify integration.
3. The Zap fans out:
   - **Append row** to the Registrations Google Sheet (columns: `timestamp, name, email, grade, grade_explanation, school, team_status, teammate_1_name, teammate_1_email, teammate_2_name, teammate_2_email, teammate_3_name, teammate_3_email, skills, experience, parent_name, parent_email, dietary, consent`).
   - **Send confirmation email** to the applicant (Gmail action, template recaps date/location and notes the parental consent email is incoming).
   - **Conditional**: if `parent_email` is non-empty, send a separate consent confirmation email to that address.
   - **Conditional**: for each non-empty `teammate_N_email`, send that teammate an "your teammate registered you for the team, finish your own signup here" invite linking back to `/#register`. Their own submission still has to land for them to be a counted attendee (parental consent and dietary info must be on file per person).
   - (Optional) Slack/Discord webhook to notify the organizing team on each registration.

No backend code or serverless functions are involved. Netlify Forms plus Zapier handles everything. Live capacity counters are intentionally **not** implemented (no API to query); the apply section uses static "Spots are limited" copy.

To verify after deploy: submit a test entry, then check the Netlify dashboard (form must show "register" after the first build that contains the form HTML), the Google Sheet for the new row, and both inboxes (applicant + parent) for emails.
