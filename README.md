# FocusFlow — ADHD-friendly PDF reader with AI Study Assistant

FocusFlow is a **browser-only** PDF reader with tools that help with focus: bionic text, a reading ruler, listen-along speech, chunked pages, notes, a timer, and optional background sound.

**New in v1.2:** 🤖 AI Study Assistant powered by Google Generative AI! Get instant summaries, explanations, and quizzes from your reading material.

There is **no account, no backend**. Your PDF is processed in the browser. Notes and settings stay in local storage. For AI features, you provide your own Google AI Studio API key (free tier available) — it's stored locally and only used for direct requests to Google's API from your browser.

---

## Can this be hosted on GitHub Pages?

**Yes.** This is a static site. JavaScript runs in the visitor's browser (opening PDFs, speech, sound, and saving notes). Nothing needs a Node or Python server in production.

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

Then use the simple serve command:

```bash
npm start
```

Or alternatively:

```bash
npx --yes serve .
```

Then open **http://localhost:3000** (or the port printed in the terminal).

### In the app

- **Open PDF** — choose a file from your computer (or drag it onto the window).
- **🤖 AI Assistant** — Click the robot icon to set up your Google AI API key and access AI-powered study tools.
- **💾 Export/Import** — Backup and restore all your notes, settings, and progress.
- **Listen** — reads the current page aloud (Shift + Space).
- **Bionic / Ruler** — easier tracking of words and lines.
- **Chunks** — one small block of text at a time.
- **Notes** — notes, tasks, cards, and a page summary.
- **Focus mode** (Shift + F) — hides extra chrome.

---

## AI Features (Google Generative AI)

FocusFlow now includes an AI Study Assistant that helps you understand and retain what you read:

| Feature | What it does |
| :--- | :--- |
| **Explain Like I'm 5** | Simplifies complex text using analogies |
| **Summarize** | Extracts 3-5 key bullet points |
| **Generate Quiz** | Creates multiple-choice questions to test yourself |
| **Key Concepts** | Identifies and defines the most important ideas |

### Setting up AI

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click the 🤖 button in FocusFlow
3. Paste your API key and click Save
4. Start using AI features on any PDF page!

**Privacy:** Your API key is stored only in your browser's localStorage. Requests go directly from your browser to Google's API — we never see your key or your documents.

---

## Data Export/Import

Never lose your notes! Use the 💾 button to:

- **Export** all your data (notes, settings, progress, gamification) as a JSON file
- **Import** a backup file to restore everything

Recommended before clearing browser cache or switching devices.

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
- [Google Generative AI](https://ai.google.dev/) for AI study features (user-provided API key)
- Local development: `npx serve` (no custom server needed)

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
| :--- | :---: | :---: | :---: | :---: |
| PDF Reading | ✅ | ✅ | ✅ | ✅ |
| Bionic Text | ✅ | ✅ | ✅ | ✅ |
| TTS (Speech) | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ |
| AI Features | ✅ | ✅ | ✅ | ✅ |
| Background Audio | ✅ | ✅ | ⚠️ | ✅ |

**Note:** Web Speech API support varies. For best TTS experience, use Chrome or Edge. AI features work on all modern browsers.
