# FocusFlow — ADHD-friendly PDF reader

FocusFlow is a **browser-only** PDF reader with tools that help with focus: bionic text, a reading ruler, listen-along speech, chunked pages, notes, a timer, and optional background sound.

There is **no account, no backend, and no generated-study chat**. Your PDF is processed in the browser and notes stay in local storage.

---

## Can this be hosted on GitHub Pages?

**Yes.** This is a static site. JavaScript runs in the visitor’s browser (opening PDFs, speech, sound, and saving notes). Nothing needs a Node or Python server in production.

GitHub Pages works. After you push the repo:

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` (or `master`), folder: `/` (root)
4. The live app is then at `https://<your-username>.github.io/<repo-name>/`

A `.nojekyll` file is included so GitHub does not skip files it thinks belong to Jekyll.

**Do not** open `index.html` as a `file://` URL. Browsers block ES modules and PDF loading that way. Use GitHub Pages or a local server.

---

## How a visitor uses the web app

### From the GitHub repo

1. Open the repository on GitHub.
2. If Pages is enabled, click the **Pages** URL (often shown in the repo About box or under Settings → Pages).
3. Click **Open PDF** (or drop a file on the page) and read.

If Pages is not enabled yet, they can still run it locally:

```bash
git clone <this-repo-url>
cd "<repo-folder>"
```

Then pick one:

```bash
npm start
```

or

```bash
python3 server.py
```

or

```bash
npx --yes serve .
```

Then open **http://localhost:8000** (or the port printed in the terminal).

### In the app

- **Open PDF** — choose a file from your computer (or drag it onto the window).
- **Listen** — reads the current page aloud (Shift + Space).
- **Bionic / Ruler** — easier tracking of words and lines.
- **Chunks** — one small block of text at a time.
- **Notes** — notes, tasks, cards, and a page summary.
- **Focus mode** (Shift + F) — hides extra chrome.

---

## Keyboard shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Shift + F` | Focus mode |
| `Esc` | Close dialogs |
| `Q` | Quick recall quiz from the current page |
| `M` | Movement break card |
| `B` | Bionic reading |
| `R` | Reading ruler |
| `Shift + Space` | Play / pause speech |
| `→` or `PageDown` | Next page or chunk |
| `←` or `PageUp` | Previous page or chunk |

---

## Stack

- Vanilla HTML, CSS, and ES modules (no build step)
- [PDF.js](https://mozilla.github.io/pdf.js/) from a CDN
- Web Speech API and Web Audio API
- Optional local servers: `server.js` (Node, no packages) or `server.py`
