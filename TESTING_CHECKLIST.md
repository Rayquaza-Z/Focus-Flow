# FocusFlow Testing Checklist

## Pre-Demo Verification

### 1. AI Integration (Google AI Studio)
- [ ] Get free API key from https://aistudio.google.com/app/apikey
- [ ] Click 🤖 button in header
- [ ] Enter API key and save
- [ ] Open a PDF document
- [ ] Test "Explain Like I'm 5" on a paragraph
- [ ] Test "Summarize" feature
- [ ] Test "Generate Quiz" feature
- [ ] Verify API key persists after page reload
- [ ] Test error handling with invalid key

### 2. Data Export/Import
- [ ] Add some notes to a PDF
- [ ] Change some settings (theme, font, etc.)
- [ ] Click 💾 button → Export Data
- [ ] Verify JSON file downloads
- [ ] Clear browser localStorage (DevTools → Application → Clear storage)
- [ ] Click 💾 button → Import Data
- [ ] Select the exported JSON file
- [ ] Verify notes and settings are restored

### 3. Core Features Demo (Focus on these 3)
- [ ] **Bionic Reading**: Toggle on/off, verify word highlighting
- [ ] **Chunking Mode**: Switch to chunks, navigate between chunks
- [ ] **AI Assistant**: Show all 4 AI features working

### 4. Browser Compatibility
- [ ] **Chrome** (Recommended): Test all features, especially TTS
- [ ] **Firefox**: Verify PDF reading, Bionic, AI work (TTS may be limited)
- [ ] **Safari**: Verify PDF reading, Bionic, AI work (TTS may be limited)
- [ ] **Edge**: Test all features like Chrome

### 5. Server/Linting
- [ ] Run `npm start` - verify app loads at localhost:3000
- [ ] Run `npm run lint` - verify no errors (warnings OK)
- [ ] Verify no server.js or server.py files exist

### 6. GitHub Pages Deployment
- [ ] Push code to GitHub repository
- [ ] Enable GitHub Pages (Settings → Pages → Deploy from main branch)
- [ ] Verify live URL works (https://username.github.io/repo-name/)
- [ ] Test PDF upload on deployed version
- [ ] Test AI features on deployed version

## Known Limitations (Be Prepared to Mention)

1. **TTS in Safari/Firefox**: Web Speech API support is limited. Recommend Chrome/Edge for best TTS experience.

2. **AI Features Require User API Key**: Each user must get their own free Google AI Studio key. This is intentional for privacy - we never see their key or documents.

3. **LocalStorage Data**: Without export, clearing browser cache loses data. That's why we added the export/import feature.

## Demo Script (3 Minutes)

1. **Opening (30s)**: "FocusFlow is an ADHD-friendly PDF reader with AI-powered study tools that runs entirely in your browser."

2. **Core Feature 1 - Bionic Reading (30s)**: Show bionic text toggle, explain how it helps with focus.

3. **Core Feature 2 - Chunking (30s)**: Switch to chunk mode, show how it breaks down dense text.

4. **Core Feature 3 - AI Assistant (90s)**: 
   - Show API key setup (privacy-first approach)
   - Generate a summary from current page
   - Create a quiz question
   - Explain how this addresses the hackathon theme

5. **Data Safety (30s)**: Quick mention of export/import for backup.

6. **Closing**: "All features work without any backend - perfect for GitHub Pages deployment."

## Troubleshooting

| Issue | Solution |
|-------|----------|
| AI features don't work | Check if API key is saved (🤖 → check status badge) |
| TTS doesn't play | Use Chrome/Edge, check browser permissions |
| PDF won't load | Don't open as file:// - use npm start or GitHub Pages |
| Notes disappear | Use export before clearing cache, then import |
| Lint errors | Run `npm run lint`, fix any errors (warnings OK) |
