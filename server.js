import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { buildIndex } from './projects/stripe-ai-doc-assistant/src/indexer.js';
import { askDocumentationAssistant } from './projects/stripe-ai-doc-assistant/src/rag.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Portfolio landing page — mounted at "/"
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Project: Stripe AI Documentation Assistant — mounted at "/stripe"
 * (its frontend calls relative api paths, so it can live at any mount point)
 */
const stripeDir = path.join(__dirname, 'projects/stripe-ai-doc-assistant');
app.use('/stripe', express.static(path.join(stripeDir, 'public')));

const vectorStorePath = path.join(stripeDir, 'data/vector_store.json');
if (!fs.existsSync(vectorStorePath)) {
  console.log('📦 Vector store not found on boot. Building index from stripe-ai-doc-assistant/docs...');
  buildIndex();
}

app.post('/stripe/api/chat', async (req, res) => {
  const { query, apiKey } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  try {
    const result = await askDocumentationAssistant(query, apiKey);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/stripe/api/docs', (req, res) => {
  const docsDir = path.join(stripeDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    return res.json({ files: [] });
  }

  const fileNames = fs.readdirSync(docsDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  const docs = fileNames.map(filename => {
    const filePath = path.join(docsDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    let title = filename;
    let slug = '';
    let description = '';
    let tags = [];
    let rawMarkdown = content;

    if (match) {
      const rawYaml = match[1];
      rawMarkdown = match[2];

      rawYaml.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx !== -1) {
          const k = line.slice(0, idx).trim();
          let v = line.slice(idx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (k === 'title') title = v;
          if (k === 'slug') slug = v;
          if (k === 'description') description = v;
          if (k === 'tags') {
            try { tags = JSON.parse(v); } catch { tags = [v]; }
          }
        }
      });
    }

    return { filename, title, slug, description, tags, rawMarkdown };
  });

  res.json({ files: docs });
});

app.post('/stripe/api/reindex', (req, res) => {
  const store = buildIndex();
  res.json({ message: 'Indexing complete', totalChunks: store.totalChunks });
});

/**
 * Project: ODrive API Docs — static portal mounted at "/odrive"
 */
app.use('/odrive', express.static(path.join(__dirname, 'projects/odrive-api-docs')));

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Portfolio site is running!`);
  console.log(`🏠 Landing page:             http://localhost:${PORT}/`);
  console.log(`💬 Stripe AI Doc Assistant:  http://localhost:${PORT}/stripe/`);
  console.log(`⚙️  ODrive API Docs:          http://localhost:${PORT}/odrive/`);
  console.log(`======================================================\n`);
});
