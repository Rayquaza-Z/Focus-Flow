# FocusFlow — ADHD Neurodiversity-Optimized PDF Reader

**FocusFlow** is an open-source, neuroscience-grounded PDF reader and study workstation designed specifically for individuals diagnosed with **Inattentive**, **Hyperactive**, and **Combined ADHD**.

Built strictly around the principle of **Engagement Balance**: providing powerful *cognitive scaffolding* that enhances comprehension and working memory without acting as a *dopamine trap*.

---

## 🌟 Enhanced Feature Set

### 1. 🎯 Active Recall & Engagement (Dopamine + Learning)
- **Smart "Pause & Test" Gating**: In Bite-Sized Chunking Mode, automatically generates a non-intrusive 1-question micro-quiz from the chunk text. Correct answers reward **+25 XP** with subtle green glow feedback; incorrect answers auto-highlight the exact source sentence with an amber focus border in the reader.
- **Interactive Margin Scaffolding**: Automatically parses paragraphs into concise 2–4 word concept anchor tags (`📌`) displayed in the margin gutter. Clicking a tag smoothly scrolls to and spotlights that section.
- **Subtle Dopamine Micro-Rewards**: Gentle non-disruptive border pulses (`subtle-dopamine-glow`) and mini-XP toasts awarded upon finishing paragraphs or pages, eliminating intrusive full-screen popups during deep reading.

### 2. ⏳ Time-Awareness & Executive Function Aids
- **Hyper-Realistic Time Estimates**: Displays dynamic **ADHD-Adjusted Reading Time** (e.g. `⏱️ ~2m 40s left (ADHD Pace)`), calibrated to neurodivergent saccadic processing speeds and re-reading buffers (~185 WPM with 1.25x latency multiplier).
- **Frictionless Break Orchestration**: Tracks continuous *active reading interaction* (mouse, keyboard, scroll). After 25 minutes of continuous active reading, gently surfaces a 2-minute movement/eye-rest reset toast with 1-click launch or 5-minute snooze.

### 3. 🛡️ Anti-Distraction & Anti-Play Guardrails
- **Sensory Fidget 90s Session Limit**: The Sensory Fidget Dock features an active countdown timer. After 90 seconds of continuous fidgeting, it gracefully transitions into a calm mindful card (*"Sensory Baseline Recharged! Ready to jump back into page X?"*) with a primary "Back to Reading" button (+10 Focus XP).
- **Focus Drift Detector (Attention Anchor)**: If interaction goes idle for 45 seconds or when returning from another browser tab, the Reading Ruler gently pulses (`attention-pulse-glow`) to guide gaze back to the active line.
- **Minimalist "Deep Work" Mode (`Shift + F`)**: A single hotkey instantly strips away all headers, toolbars, dual workspace drawers, and sidebars, presenting ONLY the pristine document canvas, line ruler, and compact floating TTS controller.

### 4. 🧠 Core Reading & Sensory Tools
- **Synchronized Active TTS**: Real-time word-by-word karaoke highlighting and sentence tracking via Web Speech API.
- **Bionic Reading Fixation**: Bolds initial word prefixes to guide saccadic eye movement.
- **Line Focus Ruler & Mask**: Spotlight mask or laser bar following cursor or scroll position.
- **Neurodivergent Typography & Themes**: OpenDyslexic, Lexend, Atkinson Hyperlegible, and Inter fonts paired with *Warm Cream*, *Dark Velvet*, *Forest Calm*, *Soft Lavender*, and *High-Contrast* color palettes.
- **Procedural Soundscape Synthesizer**: Deep Brown Noise, 40Hz Gamma Focus Beat, 10Hz Alpha Calm Beat, Soft Rain, and Pink Noise synthesized purely via Web Audio API.
- **Dual Focus Workspace**: Side-by-side split screen with Live Markdown Notes, Priority Checklists (High/Med/Low), Auto-Generated Micro-Flashcards, and Page TL;DR summaries.

---

## 🚀 Quick Start

### Option 1: One-Command Launch (Zero Dependencies)
Run the built-in Python server in the project directory:

```bash
python3 server.py
```

Then open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

### Option 2: Direct File Open
Open `index.html` directly in any modern browser (Chrome, Safari, Edge, Firefox).

---

## ⌨️ Comprehensive Keyboard Shortcuts Map

| Shortcut | Action | ADHD Purpose |
| :--- | :--- | :--- |
| `Shift + F` | **Toggle Deep Work Mode** | Instantly strips all UI distractions for pure reading focus |
| `Esc` | **Exit Deep Work / Modals** | Rapid escape back to workspace |
| `Q` | **Instant Pause & Test Quiz** | Generates a 1-question micro-recall test from current page |
| `M` | **Movement Break Card** | Triggers randomized 45s physical/sensory exercise |
| `B` | **Toggle Bionic Reading** | Switches fixation bolding on/off |
| `R` | **Toggle Reading Ruler / Mask** | Activates spotlight mask or laser line |
| `Shift + Space` | **Play / Pause TTS Narration** | Hands-free audio reading control |
| `→` or `PageDown` | **Next Page / Next Chunk** | Advance document |
| `←` or `PageUp` | **Previous Page / Prev Chunk** | Go back |
| `Space` | **Next Bite-Sized Chunk** | Step through cards in Chunking Mode |

---

## 🏗️ Architecture & Stack

- **Zero Heavy Frameworks**: Pure Vanilla ES6+ Modules, HTML5 Canvas, CSS3 Custom Properties.
- **PDF Engine**: [PDF.js v3.11](https://mozilla.github.io/pdf.js/) with high-DPI canvas & text layer rendering.
- **Audio Synthesis**: Native Web Audio API (`AudioContext`, `BiquadFilterNode`, `ChannelMergerNode`, `OscillatorNode`).
- **Voice Engine**: Native Web Speech API (`speechSynthesis`).
- **Icons & Effects**: Lucide Icons & Canvas-Confetti.
- **Persistence**: LocalStorage (auto-saved notes, checklists, streaks, XP, settings).
