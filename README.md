# Docs Stash

Open-source documents site (Terms of Privacy, Terms of Service, etc.) with dark theme and multi-language support. Built with Vite + React + Express.

## Features

- **Multi-language** — Languages auto-detected from `LANGUAGE.md` files in each document folder
- **Markdown content** — Full markdown support with code blocks, lists, images (local + external via proxy)
- **Last updated date** — Displayed at the top of each page (from file mtime)
- **API** — Add, edit, delete documents via REST API with `API_KEY` authentication
- **Dark theme** — Clean, minimal design

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your COMPANY_NAME, REDIRECT_URL, API_KEY, PORT
npm run dev
```

Open http://localhost:PORT

## Project Structure

```
data/                    # Document content (folder name = URL path)
  terms-of-privacy/
    EN.md
    RU.md
  terms-of-service/
    EN.md
public/
  icon.svg               # Favicon / header logo (see below)
  icon.ico               # Browser tab favicon (optional)
src/
  main.tsx               # App entry
  App.tsx                # Routes
  pages/
  components/
server/
  index.ts               # Express server (API + static)
```

## Favicon

Place `icon.svg` and/or `icon.ico` in `public/` — they appear in the header and browser tab.

## Data Structure

Each document is a folder in `data/`. The folder name becomes the URL path.

```
data/
  terms-of-privacy/      → /terms-of-privacy
    EN.md
    RU.md
  another-doc/           → /another-doc
    EN.md
    DE.md
```

- **Folder name** = URL slug (use lowercase, hyphens for spaces)
- **Files** = `LANGUAGE.md` (e.g. `EN.md`, `RU.md`, `DE.md`)
- **Images** — Put in the document folder and reference: `![alt](image.png)`
- **External images** — `![alt](https://example.com/img.png)` — proxied automatically

## Environment Variables

| Variable       | Description                                        |
| -------------- | -------------------------------------------------- |
| `COMPANY_NAME` | Company name in header (next to favicon)           |
| `REDIRECT_URL` | URL to redirect when clicking favicon/company name |
| `API_KEY`      | Secret key for document management API             |
| `PORT`         | Server port (default: 3000)                        |

Copy `.env.example` to `.env` and fill in the values.

## API

- `GET /api/documents` — List all documents and languages
- `GET /api/documents/:slug/:lang` — Get markdown content
- `POST /api/documents` — Manage documents (requires `Authorization: Bearer API_KEY`)

  | Action             | Body                                                                                                     |
  | ------------------ | -------------------------------------------------------------------------------------------------------- |
  | Create folder      | `{ "action": "create_folder", "slug": "terms-of-service" }`                                              |
  | Create/update file | `{ "action": "create_file", "slug": "terms-of-privacy", "language": "EN", "content": "# Title\n\n..." }` |
  | Delete file        | `{ "action": "delete_file", "slug": "terms-of-privacy", "language": "EN" }`                              |
  | Delete folder      | `{ "action": "delete_folder", "slug": "terms-of-privacy" }`                                              |

- `GET /api/proxy-image?url=...` — Proxy external images
- `GET /api/document-image/:slug/*` — Serve images from document folder
