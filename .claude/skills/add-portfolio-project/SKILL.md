---
name: add-portfolio-project
description: Aggregate a new, completed, technical-writing-related project from the GitHub_Stuff root folder into the master portfolio-site repo — copies its deployable code into projects/<slug>, wires it into server.js, adds a landing-page window card, and pushes. Flags the project instead of proceeding if it doesn't look technical-writing related or doesn't look finished/merged. Run from the GitHub_Stuff root.
argument-hint: "[project-folder-name]"
---

# Add Portfolio Project

You're aggregating one project living as a sibling folder under `GitHub_Stuff/` into `Portfolio_Site/` (GitHub repo `jengland555/portfolio-site`), the single Express app deployed to Render at `https://jennas-portfolio.onrender.com/`. Every sibling folder under `GitHub_Stuff/` is its own standalone git repo with a public GitHub remote — never modify those repos. `Portfolio_Site/` only ever receives **copies** of their already-finished deployable code.

Treat `Portfolio_Site/README.md`, `Portfolio_Site/server.js`, and `Portfolio_Site/public/index.html` as the living spec for the pattern — read all three before doing anything else, since the exact conventions (routing style, card markup, how many projects exist) may have evolved since this skill was written. Everything below describes the pattern as of the last project added; verify it still holds.

## Step 1 — Identify the target project(s)

If an argument was given (a folder name), use that one project. Otherwise, scan every direct subdirectory of `GitHub_Stuff/` that:
- is a git repo (has `.git/`)
- is not `Portfolio_Site/`
- has a `github.com` remote (`git remote get-url origin`)

For each candidate, extract the repo slug from its remote URL (the `owner/repo` → `repo` part, e.g. `stripe-ai-doc-assistant`). A project is **already integrated** if `Portfolio_Site/projects/<that-slug>/` already exists — skip those. What's left is the set of new projects to onboard. If there's more than one new project, handle them one at a time, fully, before moving to the next (each gets its own commit).

If nothing new is found, say so and stop — don't invent work.

## Step 2 — Sanity-check it's actually ready to aggregate

For the candidate project's repo:
- `git status` must be clean (no uncommitted changes). If dirty, stop and tell the user what's uncommitted — don't aggregate a work-in-progress.
- `git fetch` then compare local branch to `origin/<branch>`. If local is ahead of or diverged from origin, stop and flag it — the whole point of this skill is integrating what's **merged to remote**, not local-only work.

If either check fails, report it clearly and do not proceed to the steps below for that project.

## Step 3 — Confirm it's technical-writing related

Read the project's README (and CLAUDE.md/GEMINI.md if present) to judge whether it's genuinely related to technical writing in some way — docs-as-code tooling, API documentation, content linting/governance, documentation RAG/AI assistants, style/taxonomy systems, developer-facing writing, etc. (the existing two projects — an ODrive docs-as-code pipeline and a Stripe RAG doc assistant — are the calibration examples).

If it's a plausible fit, proceed. If it's clearly unrelated (e.g. a generic to-do app, a game, an unrelated data-science notebook with no docs/writing angle), **stop and flag it to the user** with a one-line explanation of why it doesn't look like a fit, and ask whether to add it anyway before doing any further work. Don't silently skip it and don't silently add it — ask.

## Step 4 — Determine what "deployable code" means for this project

Look at the project's structure and figure out, using judgment (this varies per project — don't assume a fixed shape):
- **Static**: a single self-contained HTML file (or a small folder of HTML/CSS/JS with no server) meant to be viewed directly. → copy just those files.
- **Dynamic**: has its own `package.json` + server entrypoint (e.g. Express) with API routes. → copy its `src`/route logic, `public` frontend, and any data files its routes read (vector stores, JSON, docs corpora) — but never copy `node_modules`, `.env`, `.git`, or anything gitignored in the source repo.

If it's genuinely ambiguous which files are the "deployable" surface, use `AskUserQuestion` rather than guessing.

## Step 5 — Copy into `Portfolio_Site/projects/<slug>/`

Create `Portfolio_Site/projects/<slug>/` and copy the deployable files in, preserving the internal relative structure the code expects (e.g. if a module does `path.join(__dirname, '../data')`, keep `src/` and `data/` siblings under the same subtree, same as the existing projects).

## Step 6 — Wire it into `server.js`

Open `Portfolio_Site/server.js` and follow the exact pattern already used for the existing mounted projects:
- Static: `app.use('/<slug>', express.static(path.join(__dirname, 'projects/<slug>')));`
- Dynamic: import its route logic and mount everything under `/<slug>` (e.g. `/<slug>/api/...`), matching how the Stripe assistant's routes are namespaced today.

If it's a dynamic project, grep its copied frontend JS for absolute-path `fetch('/api/...')`-style calls and rewrite them to relative paths (`fetch('api/...')`) so they resolve correctly under whatever subpath they're mounted at — this was necessary for the Stripe assistant and will be necessary again for anything with its own frontend JS hitting its own API.

Also check the copied project's own HTML for any hardcoded absolute links back to other projects or to `/` — point those at `/` (portfolio home) per the existing convention, not at a guessed path.

## Step 7 — Add a landing-page window card

In `Portfolio_Site/public/index.html`, copy the markup structure of an existing `.project-window` card (chrome bar with the three dots + address bar, a live-preview `<iframe src="/<slug>/">`, and a title/description/tags block) and add a new one for this project, placed before the "more projects coming soon" placeholder card. Write the title/description from the project's own README so it accurately describes what it does. Update the address-bar text to `yoursite.com/<slug>/`.

## Step 8 — Update the README

In `Portfolio_Site/README.md`, add a row to the "Live routes" table (route, project name, link to its source repo) and update the "Local development" section's list of routes to visit if needed.

## Step 9 — Test locally before pushing

Run `npm install` if new dependencies were introduced, then start the server on a scratch port (e.g. `PORT=3999 node server.js`, backgrounded) and verify with `curl`:
- The landing page (`/`) still returns 200.
- The new project's route returns 200 (and its static assets/API, if dynamic, respond correctly).
- The previously-existing projects' routes still work — this is the regression check that matters most, since a routing mistake here can silently break an already-working demo.

Kill the test server afterward.

## Step 10 — Commit and push

Stage everything, write a commit message describing what was added (new project name + route), and push to `origin main` on `portfolio-site`. This is the whole point of the skill running — no need to ask permission to push, since invoking this skill is itself the go-ahead. Do stop and ask first if anything in Steps 2–4 raised a flag.

## Step 11 — Report back

Summarize: what was added, its new route, and remind the user Render will auto-redeploy on push (free tier — first hit after idle may be slow to wake up).
