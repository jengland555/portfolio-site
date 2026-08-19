# Portfolio Site

**Live:** [jennas-portfolio.onrender.com](https://jennas-portfolio.onrender.com/)

The single deployable Express app that serves all of Jenna England's portfolio project demos from one Render web service. Each project keeps its own standalone GitHub repo — this repo just concatenates the deployable pieces of each into one app so they can share a single URL and hosting bill.

The root `/` is a landing page of clickable "window" cards, one per project (with a live scaled-down preview of the actual page), followed by an About Me section and GitHub/LinkedIn links in the footer. Clicking a window opens that project's full UI at its own subpath. New projects get their own card + subpath as they're added — nothing lands directly on any one project's UI.

## Live routes

| Route | Project | Source repo |
| :--- | :--- | :--- |
| `/` | Portfolio landing page (project windows) | this repo (`public/`) |
| `/stripe/` | Stripe AI Documentation Assistant (RAG chat) | [stripe-ai-doc-assistant](https://github.com/jengland555/stripe-ai-doc-assistant) |
| `/odrive/` | ODrive API Docs portal | [odrive-api-docs](https://github.com/jengland555/odrive-api-docs) |

## How this repo is structured

```
public/                          # portfolio landing page (index.html, styles.css)
projects/
├── stripe-ai-doc-assistant/   # copied from the standalone repo: src/, public/, docs/, data/
└── odrive-api-docs/           # copied from the standalone repo: docs.html -> index.html
server.js                        # top-level Express app that mounts the landing page + each project
```

`server.js` owns routing. The landing page is served as static files at root `/`. Every project is mounted under its own subpath (`/stripe`, `/odrive`, ...) via `express.static` (plus API routes for dynamic projects, also namespaced under that subpath). Project frontends must use **relative** paths for their own API calls (e.g. `fetch('api/chat')`, not `fetch('/api/chat')`) so they keep working no matter what subpath they're mounted at.

## Adding a new project

1. Build/finish the project in its own standalone repo first.
2. Copy its deployable output into a new folder here: `projects/<project-slug>/`.
   - Static site → just the HTML/CSS/JS/assets it needs to render.
   - Dynamic app with its own API → copy its server logic too, but strip out `app.listen(...)` (only this repo's top-level `server.js` calls `listen`), and switch any absolute `fetch('/api/...')` calls in its frontend to relative `fetch('api/...')`.
3. Wire it into `server.js`:
   - Static: `app.use('/<project-slug>', express.static(path.join(__dirname, 'projects/<project-slug>')));`
   - Dynamic with its own routes: import its route logic and mount everything (`app.use`, `app.get`, `app.post`, ...) under `/<project-slug>`.
4. Add a new `.project-window` card to `public/index.html` (copy an existing one — chrome bar, live preview `<iframe>`, title, description, tags) pointing at `/<project-slug>/`.
5. Test locally with `npm start`, then commit and push to `main`.

This repo intentionally does **not** modify the individual project repos — it only copies their already-working deployable code. When a project repo changes, re-copy the relevant files here and redeploy.

**Automated version:** this whole process is packaged as a Claude Code skill at `.claude/skills/add-portfolio-project/SKILL.md`. Run `/add-portfolio-project` from the `GitHub_Stuff` root (the parent folder containing this repo and every individual project repo as siblings) after finishing and merging a new project — it scans for un-integrated sibling repos, checks the project is actually technical-writing related and merged to its remote (flagging you instead of guessing if either looks off), and does steps 2–5 itself.

## Local development

```bash
npm install
npm start
```

Visit `http://localhost:3000/` for the landing page, `http://localhost:3000/stripe/`, and `http://localhost:3000/odrive/`.

No API keys are required — the Stripe assistant runs on a local offline semantic-search synthesizer by default. An OpenAI key can optionally be entered client-side in the Assistant's settings panel for live LLM answers.

## Deployment

Deployed on [Render](https://render.com) as a free-tier Web Service named `jennas-portfolio`:
- Build command: `npm install`
- Start command: `npm start`
- No environment variables required.
- URL: `https://jennas-portfolio.onrender.com/` — stable as long as the service keeps this name; changes only if the service is renamed/deleted or a custom domain is added.

**Auto-Deploy caveat:** pushes to `main` are supposed to trigger a redeploy automatically, but this has been unreliable in practice — several pushes sat un-deployed until triggered manually. If a push doesn't go live within a few minutes, check the service's **Events** tab on the Render dashboard to see whether a deploy actually started; if not, go to **Settings → Build & Deploy** and confirm Auto-Deploy is set to **Yes** on branch `main`, or just click **Manual Deploy → Deploy latest commit**.

## License

MIT
