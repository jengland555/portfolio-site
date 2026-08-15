# Portfolio Site

The single deployable Express app that serves all of Jenna England's portfolio project demos from one Render web service. Each project keeps its own standalone GitHub repo — this repo just concatenates the deployable pieces of each into one app so they can share a single URL and hosting bill.

## Live routes

| Route | Project | Source repo |
| :--- | :--- | :--- |
| `/` | Stripe AI Documentation Assistant (RAG chat) | [stripe-ai-doc-assistant](https://github.com/jengland555/stripe-ai-doc-assistant) |
| `/odrive/` | ODrive API Docs portal | [odrive-api-docs](https://github.com/jengland555/odrive-api-docs) |

## How this repo is structured

```
projects/
├── stripe-ai-doc-assistant/   # copied from the standalone repo: src/, public/, docs/, data/
└── odrive-api-docs/           # copied from the standalone repo: docs.html -> index.html
server.js                      # top-level Express app that mounts each project
```

`server.js` owns routing. The Stripe assistant's frontend calls absolute paths (`/api/chat`, `/api/docs`), so it's mounted at the root `/`. Static-only demos (like the ODrive docs portal) are mounted under their own subpath (`/odrive`) via `express.static`.

## Adding a new project

1. Build/finish the project in its own standalone repo first.
2. Copy its deployable output into a new folder here: `projects/<project-slug>/`.
   - Static site → just the HTML/CSS/JS/assets it needs to render.
   - Dynamic app with its own API → copy its server logic too, but strip out `app.listen(...)` since only this repo's top-level `server.js` calls `listen`.
3. Wire it into `server.js`:
   - Static: `app.use('/<project-slug>', express.static(path.join(__dirname, 'projects/<project-slug>')));`
   - Dynamic with its own routes: import its route logic and `app.use('/<project-slug>', ...)`, making sure its frontend calls relative or `/project-slug`-prefixed paths (not root-absolute ones) so it doesn't collide with other mounted projects.
4. Test locally with `npm start`, then commit and push — Render auto-redeploys on push to `main`.

This repo intentionally does **not** modify the individual project repos — it only copies their already-working deployable code. When a project repo changes, re-copy the relevant files here and redeploy.

## Local development

```bash
npm install
npm start
```

Visit `http://localhost:3000/` and `http://localhost:3000/odrive/`.

No API keys are required — the Stripe assistant runs on a local offline semantic-search synthesizer by default. An OpenAI key can optionally be entered client-side in the Assistant's settings panel for live LLM answers.

## Deployment

Deployed on [Render](https://render.com) as a free-tier Web Service:
- Build command: `npm install`
- Start command: `npm start`
- No environment variables required.

## License

MIT
