import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';
const DATA_DIR = path.join(process.cwd(), 'data');

const app = express();
app.use(express.json());

// API routes first (before Vite middleware)

// Redirect / to PROJECT_PAGE_URL when set
app.get('/', (req, res, next) => {
  const url = process.env.PROJECT_PAGE_URL?.trim();
  if (url) return res.redirect(302, url);
  next();
});

// Health check (no API key required)
app.get('/api/health', async (_req, res) => {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkgRaw = await fs.promises.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw) as { version?: string };

    res.json({
      status: 'healthy',
      timestamp: Math.floor(Date.now() / 1000),
      version: pkg.version ?? 'unknown',
    });
  } catch (error) {
    console.error('Error in /api/health:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: Math.floor(Date.now() / 1000),
      version: 'unknown',
    });
  }
});

// API: config (env vars for client)
app.get('/api/config', (_req, res) => {
  res.json({
    companyName: process.env.COMPANY_NAME || process.env.VITE_COMPANY_NAME || 'Company',
    redirectUrl: process.env.REDIRECT_URL || process.env.VITE_REDIRECT_URL || '/',
  });
});

// API: list documents
app.get('/api/documents', (_req, res) => {
  if (!fs.existsSync(DATA_DIR)) {
    return res.json([]);
  }
  const slugs = fs.readdirSync(DATA_DIR).filter((name) => {
    const fullPath = path.join(DATA_DIR, name);
    return fs.statSync(fullPath).isDirectory();
  });
  const docs = slugs.map((slug) => {
    const docPath = path.join(DATA_DIR, slug);
    const languages = fs
      .readdirSync(docPath)
      .filter((n) => n.endsWith('.md'))
      .map((n) => n.replace('.md', ''));
    return { slug, languages };
  });
  res.json(docs);
});

// API: get document content
app.get('/api/documents/:slug/:lang', (req, res) => {
  const { slug, lang } = req.params;
  const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '');
  const safeLang = lang.replace(/[^a-zA-Z0-9-_]/g, '');
  const filePath = path.join(DATA_DIR, safeSlug, `${safeLang}.md`);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({ error: 'Not found' });
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = fs.statSync(filePath);
  res.json({ content, lastModified: stats.mtime.toISOString() });
});

// API: proxy external image
app.get('/api/proxy-image', async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: 'url required' });
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: 'Invalid protocol' });
  }
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Docs-Stash/1.0' },
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch image' });
    }
    const contentType = response.headers.get('Content-Type') || 'image/png';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Not an image' });
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'max-age=0, must-revalidate' });
    res.send(buffer);
  } catch (err) {
    console.error('Proxy image error:', err);
    res.status(502).json({ error: 'Failed to fetch' });
  }
});

// API: document image (local files from data/)
app.get('/api/document-image/:slug/*', (req, res) => {
  const slug = req.params.slug?.replace(/[^a-zA-Z0-9-_]/g, '') ?? '';
  const pathSegments = (req.params[0] as string)?.split('/').filter(Boolean) ?? [];
  const filename = pathSegments.join('/').replace(/\.\./g, '');
  if (!slug || !filename) {
    return res.status(404).json({ error: 'Not found' });
  }
  const filePath = path.join(DATA_DIR, slug, filename);
  if (!filePath.startsWith(path.join(DATA_DIR, slug))) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({ error: 'Not found' });
  }
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  res.type(mimeTypes[ext] || 'application/octet-stream');
  res.sendFile(filePath);
});

// API: manage documents (POST) - requires API_KEY
function validateApiKey(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.API_KEY;
  if (!apiKey) return false;
  return authHeader === `Bearer ${apiKey}` || authHeader === apiKey;
}

app.post('/api/documents', (req, res) => {
  if (!validateApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { action, slug, language, content } = req.body;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'slug required' });
    }

    const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '');
    if (!safeSlug) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const docPath = path.join(DATA_DIR, safeSlug);

    switch (action) {
      case 'create_folder': {
        if (fs.existsSync(docPath)) {
          return res.status(409).json({ error: 'Folder already exists' });
        }
        fs.mkdirSync(docPath, { recursive: true });
        return res.json({ success: true, slug: safeSlug });
      }

      case 'create_file':
      case 'update_file': {
        if (!language || typeof language !== 'string') {
          return res.status(400).json({ error: 'language required' });
        }
        const safeLang = language.replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase();
        if (!safeLang) {
          return res.status(400).json({ error: 'Invalid language' });
        }
        if (!fs.existsSync(docPath)) {
          fs.mkdirSync(docPath, { recursive: true });
        }
        const filePath = path.join(docPath, `${safeLang}.md`);
        fs.writeFileSync(filePath, content ?? '', 'utf-8');
        return res.json({ success: true, slug: safeSlug, language: safeLang });
      }

      case 'delete_file': {
        if (!language || typeof language !== 'string') {
          return res.status(400).json({ error: 'language required' });
        }
        const safeLang = language.replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase();
        const filePath = path.join(docPath, `${safeLang}.md`);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'File not found' });
        }
        fs.unlinkSync(filePath);
        const remaining = fs.readdirSync(docPath);
        if (remaining.length === 0) {
          fs.rmdirSync(docPath);
        }
        return res.json({ success: true });
      }

      case 'delete_folder': {
        if (!fs.existsSync(docPath)) {
          return res.status(404).json({ error: 'Folder not found' });
        }
        fs.rmSync(docPath, { recursive: true });
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
});

// Vite middleware (dev) or static (prod) - after API routes
const preferredPort = Number(process.env.PORT) || 3000;

if (isDev) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: {
        port: preferredPort,
        clientPort: preferredPort,
        protocol: 'ws',
        host: 'localhost',
      },
    },
  });
  // Обрабатываем HTML и favicon ДО Vite — иначе WebSocket-слой отвечает 426
  const viteRequest = /^\/(src|@vite|_vite|node_modules|@id|@react-refresh)\//;
  const isStaticAsset = /\.(js|tsx?|css|json|map|ico|png|jpg|svg|woff2?)(\?.*)?$/;
  app.use(async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const p = req.path;
    if (p === '/icon.ico' || p === '/favicon.ico') {
      const ico = path.join(process.cwd(), 'public', 'icon.ico');
      if (fs.existsSync(ico)) return res.sendFile(ico);
      return next();
    }
    if (viteRequest.test(p) || isStaticAsset.test(p)) return next();
    try {
      const template = await vite.transformIndexHtml(
        req.originalUrl,
        await fs.promises.readFile(path.resolve(process.cwd(), 'index.html'), 'utf-8')
      );
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      next(e);
    }
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(__dirname));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

function tryListen(p: number) {
  const server = app.listen(p, () => {
    console.log(`Server running at http://localhost:${p}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      server.close();
      console.warn(`Port ${p} in use, trying ${p + 1}...`);
      tryListen(p + 1);
    } else {
      throw err;
    }
  });
}

tryListen(preferredPort);
