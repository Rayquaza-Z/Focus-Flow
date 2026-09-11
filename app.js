/**
 * Main Application Orchestrator for ADHD PDF Reader (FocusFlow)
 * Integrates all modules into a fluid, accessible, neurodiversity-optimized experience
 * with Active Recall, Time-Awareness, and Anti-Distraction Guardrails.
 */

import { StorageManager } from './modules/storage.js';
import { AudioSynthesizer } from './modules/audio-synthesizer.js';
import { TTSEngine } from './modules/tts-engine.js';
import { BionicEngine } from './modules/bionic-engine.js';
import { SensoryDock } from './modules/sensory-dock.js';
import { FocusTimer } from './modules/focus-timer.js';
import { ChunkingMode } from './modules/chunking-mode.js';
import { DualWorkspace } from './modules/dual-workspace.js';
import { GamificationSystem } from './modules/gamification.js';
import { PDFViewer } from './modules/pdf-viewer.js';
import { ActiveRecallEngine } from './modules/active-recall.js';
import { TimeAwarenessEngine } from './modules/time-awareness.js';
import { AntiDistractionGuardrails } from './modules/anti-distraction.js';
import { AIAssistant } from './modules/ai-assistant.js';

class App {
  constructor() {
    this.settings = StorageManager.getSettings();
    this.audio = new AudioSynthesizer();
    this.tts = new TTSEngine();
    this.gamification = new GamificationSystem({ audioSynthesizer: this.audio });

    this.viewerMode = 'standard'; // 'standard', 'chunking'
    this.dualWorkspaceOpen = true;
    this.currentDocumentName = 'Sample ADHD Research Report.pdf';

    this.init();
  }

  init() {
    this.applyTheme(this.settings.theme);
    this.applyTypography();

    // 1. Active Recall Engine
    this.activeRecall = new ActiveRecallEngine({
      audioSynthesizer: this.audio,
      gamification: this.gamification
    });

    // 2. PDF Viewer with High-DPI Canvas & Margin Scaffolding
    this.pdfViewer = new PDFViewer({
      container: document.getElementById('pdf-viewport'),
      rulerOverlay: document.getElementById('reading-ruler-overlay'),
      audioSynthesizer: this.audio,
      onPageChange: (info) => this.handlePageChange(info),
      onDocumentLoaded: (docInfo) => this.handleDocumentLoaded(docInfo)
    });

    // 3. Bite-Sized Chunking Mode with Inline Micro-Quiz Gating
    this.chunkingMode = new ChunkingMode({
      container: document.getElementById('chunking-view-container'),
      bionicEnabled: this.settings.bionicReading,
      ttsEngine: this.tts,
      audioSynthesizer: this.audio,
      activeRecall: this.activeRecall,
      onChunkComplete: (idx, total) => {
        if (idx === total - 1) {
          this.gamification.addXP(25, 'Chunk Section Finished');
        }
      }
    });

    // 4. Dual Focus Split-Screen Workspace
    this.dualWorkspace = new DualWorkspace({
      container: document.getElementById('dual-workspace-container'),
      audioSynthesizer: this.audio,
      onTaskCompleted: () => {
        this.gamification.addXP(20, 'Task Done');
        this.gamification.unlockBadge('task_finisher');
      }
    });

    // 5. Sensory Fidget Dock
    this.sensoryDock = new SensoryDock('sensory-dock-modal-content', this.audio);

    // 6. Focus Sprint & Movement Break Timer
    this.focusTimer = new FocusTimer({
      focusDuration: this.settings.focusTimerDuration || 20,
      breakDuration: this.settings.breakTimerDuration || 5,
      audioSynthesizer: this.audio,
      onFocusComplete: (mins) => {
        this.gamification.addXP(40, `${mins}m Focus Sprint`);
      },
      onBreakTriggered: (card) => {
        this.gamification.unlockBadge('movement_hero');
      }
    });

    // 7. Time Awareness & ADHD Reading Pace Engine
    this.timeAwareness = new TimeAwarenessEngine({
      audioSynthesizer: this.audio,
      focusTimer: this.focusTimer,
      onBreakPrompt: () => {
        // Handled by UI toast
      }
    });

    // 8. Anti-Distraction & Anti-Play Guardrails (90s Fidget limit, 45s drift pulse, Deep Work)
    this.antiDistraction = new AntiDistractionGuardrails({
      audioSynthesizer: this.audio,
      gamification: this.gamification,
      pdfViewer: this.pdfViewer
    });

    // 9. FocusFlow AI Study Assistant & Copilot
    this.aiAssistant = new AIAssistant({
      container: document.getElementById('ai-assistant-container'),
      sidebarWrapper: document.getElementById('ai-assistant-sidebar'),
      audio: this.audio,
      gamification: this.gamification,
      pdfViewer: this.pdfViewer
    });

    this.setupTTSHandlers();
    this.setupUIEventListeners();
    this.setupAudioSoundscapeSliders();
    this.setupFrictionlessBreakPrompt();
    this.loadInitialDocument();
  }

  applyTheme(theme) {
    this.settings.theme = theme;
    document.body.setAttribute('data-theme', theme);
    StorageManager.updateSetting('theme', theme);

    // Update active state in theme selector
    document.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('ring-2', 'ring-[var(--accent-color)]');
      } else {
        btn.classList.remove('ring-2', 'ring-[var(--accent-color)]');
      }
    });
  }

  applyTypography() {
    const root = document.documentElement;
    root.style.setProperty('--user-font-size', `${this.settings.fontSize}px`);
    root.style.setProperty('--user-line-height', `${this.settings.lineHeight}`);
    root.style.setProperty('--user-letter-spacing', `${this.settings.letterSpacing}px`);

    const fontClasses = ['font-lexend', 'font-atkinson', 'font-opendyslexic', 'font-inter'];
    document.body.classList.remove(...fontClasses);
    document.body.classList.add(`font-${this.settings.fontFamily}`);

    StorageManager.saveSettings(this.settings);
  }

  applyADHDPreset(preset) {
    this.settings.adhdPreset = preset;
    if (this.audio) this.audio.playRewardChime();

    if (preset === 'inattentive') {
      // Bionic reading, Lexend/OpenDyslexic font, Reading Ruler mask on, warm cream
      this.settings.bionicReading = true;
      this.settings.readingRuler = true;
      this.settings.rulerMode = 'mask';
      this.settings.fontFamily = 'opendyslexic';
      this.settings.theme = 'cream';
      this.settings.fontSize = 20;
      this.settings.lineHeight = 1.9;
      this.gamification.unlockBadge('bionic_reader');
      this.gamification.showMiniToast('🧠 Inattentive ADHD Preset applied: Bionic + Ruler + OpenDyslexic');
    } else if (preset === 'hyperactive') {
      // Brown noise audio on, sensory dock open, 15m focus timer, Forest calm theme
      this.settings.theme = 'forest-calm';
      this.settings.fontFamily = 'lexend';
      this.settings.soundVolumes.brown = 0.55;
      this.audio.startSound('brown', 0.55);
      const brownSlider = document.getElementById('sound-slider-brown');
      if (brownSlider) brownSlider.value = 55;
      this.openSensoryDockWithCooldown();
      this.gamification.unlockBadge('zen_master');
      this.gamification.showMiniToast('⚡ Hyperactive Preset applied: Deep Brown Noise + Fidget Dock');
    } else if (preset === 'combined') {
      // Dual split screen workspace, Bite-Sized chunking mode, 40Hz focus binaural beat
      this.settings.theme = 'dark-velvet';
      this.settings.fontFamily = 'atkinson';
      this.settings.bionicReading = true;
      this.setViewerMode('chunking');
      this.setDualWorkspace(true);
      this.settings.soundVolumes.binaural40 = 0.4;
      this.audio.startSound('binaural40', 0.4);
      const binSlider = document.getElementById('sound-slider-binaural40');
      if (binSlider) binSlider.value = 40;
      this.gamification.showMiniToast('🔀 Combined Preset applied: Dual Split + Chunking + 40Hz Beat');
    }

    this.applyTheme(this.settings.theme);
    this.applyTypography();
    this.syncControlsWithSettings();
    this.pdfViewer.setBionicMode(this.settings.bionicReading, this.settings.bionicFixation);
    this.pdfViewer.setReadingRuler(this.settings.readingRuler, this.settings.rulerMode, this.settings.rulerHeight);
    this.chunkingMode.setBionic(this.settings.bionicReading);
  }

  syncControlsWithSettings() {
    const bionicToggle = document.getElementById('bionic-toggle-btn');
    if (bionicToggle) {
      bionicToggle.classList.toggle('active-toggle', this.settings.bionicReading);
    }
    const rulerToggle = document.getElementById('ruler-toggle-btn');
    if (rulerToggle) {
      rulerToggle.classList.toggle('active-toggle', this.settings.readingRuler);
    }
    const fontSelect = document.getElementById('font-select');
    if (fontSelect) fontSelect.value = this.settings.fontFamily;
    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) fontSizeSlider.value = this.settings.fontSize;
  }

  setViewerMode(mode) {
    this.viewerMode = mode;
    const standardView = document.getElementById('pdf-viewport');
    const chunkingView = document.getElementById('chunking-view-container');
    const standardTab = document.getElementById('mode-btn-standard');
    const chunkingTab = document.getElementById('mode-btn-chunking');

    if (mode === 'chunking') {
      if (standardView) standardView.classList.add('hidden');
      if (chunkingView) chunkingView.classList.remove('hidden');
      if (chunkingTab) chunkingTab.classList.add('bg-[var(--accent-color)]', 'text-white');
      if (standardTab) standardTab.classList.remove('bg-[var(--accent-color)]', 'text-white');
      this.chunkingMode.setChunksFromPageText(this.pdfViewer.currentPage, this.pdfViewer.getCurrentPageText());
    } else {
      if (standardView) standardView.classList.remove('hidden');
      if (chunkingView) chunkingView.classList.add('hidden');
      if (standardTab) standardTab.classList.add('bg-[var(--accent-color)]', 'text-white');
      if (chunkingTab) chunkingTab.classList.remove('bg-[var(--accent-color)]', 'text-white');
      this.pdfViewer.renderPage(this.pdfViewer.currentPage);
    }
  }

  setDualWorkspace(open) {
    this.dualWorkspaceOpen = open;
    const wsContainer = document.getElementById('dual-workspace-wrapper');
    const toggleBtn = document.getElementById('toggle-workspace-btn');

    if (open) {
      if (wsContainer) wsContainer.classList.remove('hidden');
      if (toggleBtn) toggleBtn.classList.add('bg-[var(--accent-light)]', 'text-[var(--accent-color)]');
    } else {
      if (wsContainer) wsContainer.classList.add('hidden');
      if (toggleBtn) toggleBtn.classList.remove('bg-[var(--accent-light)]', 'text-[var(--accent-color)]');
    }
  }

  handlePageChange({ pageNumber, totalPages, pageText }) {
    const pageDisplay = document.getElementById('current-page-indicator');
    const totalDisplay = document.getElementById('total-pages-indicator');
    if (pageDisplay) pageDisplay.textContent = pageNumber;
    if (totalDisplay) totalDisplay.textContent = totalPages;

    this.dualWorkspace.setPageContent(pageNumber, pageText);

    if (this.viewerMode === 'chunking') {
      this.chunkingMode.setChunksFromPageText(pageNumber, pageText);
    }

    this.tts.setText(pageText);
    this.gamification.recordPageRead();

    // Update ADHD reading time calculation
    const words = pageText ? pageText.trim().split(/\s+/).length : 0;
    this.timeAwareness.updatePageWords(words);
  }

  handleDocumentLoaded({ name, totalPages, firstPageText }) {
    this.currentDocumentName = name;
    const titleEl = document.getElementById('document-title-display');
    if (titleEl) titleEl.textContent = name;

    this.dualWorkspace.setDocument(name);
    this.dualWorkspace.setPageContent(1, firstPageText);
    this.gamification.unlockBadge('first_read');
    this.gamification.showMiniToast(`📄 Loaded "${name}" (${totalPages} pages)`);

    const firstWords = firstPageText ? firstPageText.trim().split(/\s+/).length : 0;
    this.timeAwareness.setDocumentStats(firstWords * totalPages, firstWords);
  }

  setupTTSHandlers() {
    this.tts.onStateChange = ({ isPlaying, isPaused, currentChunkIndex, totalChunks }) => {
      const playIcon = document.getElementById('tts-play-icon');
      const textStatus = document.getElementById('tts-status-text');

      if (playIcon) {
        playIcon.setAttribute('data-lucide', isPlaying && !isPaused ? 'pause' : 'play');
        if (window.lucide) window.lucide.createIcons();
      }

      if (textStatus) {
        textStatus.textContent = isPlaying
          ? `${isPaused ? 'Paused' : 'Playing'} (${currentChunkIndex + 1}/${totalChunks})`
          : 'Ready';
      }

      if (isPlaying) {
        this.gamification.unlockBadge('tts_explorer');
      }
    };

    this.tts.onWordBoundary = ({ word, wordIndex, chunkIndex }) => {
      const wordBadge = document.getElementById('tts-current-word');
      if (wordBadge) {
        wordBadge.textContent = word;
      }
    };
  }

  setupAudioSoundscapeSliders() {
    ['brown', 'pink', 'binaural40', 'binaural10', 'rain'].forEach(soundId => {
      const slider = document.getElementById(`sound-slider-${soundId}`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value) / 100;
          this.settings.soundVolumes[soundId] = val;
          if (val > 0) {
            this.audio.startSound(soundId, val);
            this.gamification.unlockBadge('zen_master');
          } else {
            this.audio.stopSound(soundId);
          }
          StorageManager.saveSettings(this.settings);
        });
      }
    });

    const stopAllBtn = document.getElementById('stop-all-sounds-btn');
    if (stopAllBtn) {
      stopAllBtn.addEventListener('click', () => {
        this.audio.stopAll();
        ['brown', 'pink', 'binaural40', 'binaural10', 'rain'].forEach(id => {
          const s = document.getElementById(`sound-slider-${id}`);
          if (s) s.value = 0;
          this.settings.soundVolumes[id] = 0;
        });
        StorageManager.saveSettings(this.settings);
      });
    }
  }

  setupFrictionlessBreakPrompt() {
    const startBtn = document.getElementById('break-prompt-start-btn');
    const snoozeBtn = document.getElementById('break-prompt-snooze-btn');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.timeAwareness.dismissBreakPrompt(0);
        this.focusTimer.showRandomBreakCard();
      });
    }

    if (snoozeBtn) {
      snoozeBtn.addEventListener('click', () => {
        this.timeAwareness.dismissBreakPrompt(5);
        this.gamification.showMiniToast('⏰ Movement break snoozed for 5 minutes');
      });
    }
  }

  openSensoryDockWithCooldown() {
    const modalContent = document.getElementById('sensory-dock-modal-content');
    this.sensoryDock.renderDockUI();
    this.openModal('sensory-dock-modal');
    this.antiDistraction.startFidgetSession(modalContent, () => {
      this.closeModal('sensory-dock-modal');
    });
  }

  setupUIEventListeners() {
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyTheme(btn.dataset.theme));
    });

    // ADHD Preset buttons
    ['inattentive', 'hyperactive', 'combined'].forEach(preset => {
      const btn = document.getElementById(`preset-btn-${preset}`);
      if (btn) {
        btn.addEventListener('click', () => this.applyADHDPreset(preset));
      }
    });

    // Minimalist Deep Work Mode Button
    const deepWorkBtn = document.getElementById('deep-work-toggle-btn');
    if (deepWorkBtn) {
      deepWorkBtn.addEventListener('click', () => this.antiDistraction.toggleDeepWorkMode());
    }

    // CRT Anti-Glare Scanlines Toggle
    const scanlineBtn = document.getElementById('scanlines-toggle-btn');
    if (scanlineBtn) {
      scanlineBtn.addEventListener('click', () => {
        document.body.classList.toggle('crt-scanlines-active');
        const isActive = document.body.classList.contains('crt-scanlines-active');
        scanlineBtn.classList.toggle('active', isActive);
        if (this.audio) this.audio.playTactileClick(680, 'square', 0.04);
        if (this.gamification) this.gamification.showMiniToast(isActive ? '📺 CRT Scanlines Mode Active' : '📺 Scanlines Disabled');
      });
    }

    // Page navigation
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => this.pdfViewer.prevPage());
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => this.pdfViewer.nextPage());

    // Zoom controls
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.pdfViewer.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.pdfViewer.zoomOut());

    // Bionic toggle
    const bionicToggle = document.getElementById('bionic-toggle-btn');
    if (bionicToggle) {
      bionicToggle.addEventListener('click', () => {
        this.settings.bionicReading = !this.settings.bionicReading;
        StorageManager.updateSetting('bionicReading', this.settings.bionicReading);
        this.pdfViewer.setBionicMode(this.settings.bionicReading, this.settings.bionicFixation);
        this.chunkingMode.setBionic(this.settings.bionicReading);
        this.syncControlsWithSettings();
        if (this.settings.bionicReading) {
          this.gamification.unlockBadge('bionic_reader');
        }
      });
    }

    // Reading Ruler toggle
    const rulerToggle = document.getElementById('ruler-toggle-btn');
    if (rulerToggle) {
      rulerToggle.addEventListener('click', () => {
        this.settings.readingRuler = !this.settings.readingRuler;
        StorageManager.updateSetting('readingRuler', this.settings.readingRuler);
        this.pdfViewer.setReadingRuler(this.settings.readingRuler, this.settings.rulerMode, this.settings.rulerHeight);
        this.syncControlsWithSettings();
      });
    }

    // Ruler mode selector
    const rulerModeSelect = document.getElementById('ruler-mode-select');
    if (rulerModeSelect) {
      rulerModeSelect.addEventListener('change', (e) => {
        this.settings.rulerMode = e.target.value;
        StorageManager.updateSetting('rulerMode', this.settings.rulerMode);
        this.pdfViewer.setReadingRuler(this.settings.readingRuler, this.settings.rulerMode, this.settings.rulerHeight);
      });
    }

    // Font family selector
    const fontSelect = document.getElementById('font-select');
    if (fontSelect) {
      fontSelect.addEventListener('change', (e) => {
        this.settings.fontFamily = e.target.value;
        this.applyTypography();
      });
    }

    // Font size slider
    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) {
      fontSizeSlider.addEventListener('input', (e) => {
        this.settings.fontSize = parseInt(e.target.value);
        this.applyTypography();
      });
    }

    // View modes
    const modeStandard = document.getElementById('mode-btn-standard');
    const modeChunking = document.getElementById('mode-btn-chunking');
    if (modeStandard) modeStandard.addEventListener('click', () => this.setViewerMode('standard'));
    if (modeChunking) modeChunking.addEventListener('click', () => this.setViewerMode('chunking'));

    // Dual workspace toggle
    const wsToggle = document.getElementById('toggle-workspace-btn');
    if (wsToggle) {
      wsToggle.addEventListener('click', () => this.setDualWorkspace(!this.dualWorkspaceOpen));
    }

    // TTS Controls
    const ttsPlayBtn = document.getElementById('tts-main-play-btn');
    const ttsNextBtn = document.getElementById('tts-next-sentence-btn');
    const ttsPrevBtn = document.getElementById('tts-prev-sentence-btn');
    const ttsSpeedSelect = document.getElementById('tts-speed-select');

    if (ttsPlayBtn) ttsPlayBtn.addEventListener('click', () => this.tts.togglePlayPause());
    if (ttsNextBtn) ttsNextBtn.addEventListener('click', () => this.tts.nextSentence());
    if (ttsPrevBtn) ttsPrevBtn.addEventListener('click', () => this.tts.prevSentence());
    if (ttsSpeedSelect) {
      ttsSpeedSelect.addEventListener('change', (e) => {
        const rate = parseFloat(e.target.value);
        this.tts.setRate(rate);
      });
    }

    // File Upload / Picker
    const fileInput = document.getElementById('pdf-file-input');
    const uploadBtn = document.getElementById('upload-pdf-btn');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const fileReader = new FileReader();
          fileReader.onload = () => {
            const typedArray = new Uint8Array(fileReader.result);
            this.pdfViewer.loadDocument(typedArray, file.name);
          };
          fileReader.readAsArrayBuffer(file);
        }
      });
    }

    // Drag and drop support
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const fileReader = new FileReader();
          fileReader.onload = () => {
            const typedArray = new Uint8Array(fileReader.result);
            this.pdfViewer.loadDocument(typedArray, file.name);
          };
          fileReader.readAsArrayBuffer(file);
        }
      }
    });

    // Modals: Audio Soundscapes, Sensory Fidget Dock (with 90s session limiter), Badges
    this.setupModalTrigger('open-soundscape-btn', 'soundscape-modal');
    
    const sensoryBtn = document.getElementById('open-sensory-btn');
    if (sensoryBtn) {
      sensoryBtn.addEventListener('click', () => this.openSensoryDockWithCooldown());
    }

    const closeSensoryBtn = document.querySelector('#sensory-dock-modal .close-modal-btn');
    if (closeSensoryBtn) {
      closeSensoryBtn.addEventListener('click', () => {
        this.antiDistraction.stopFidgetSession();
        this.closeModal('sensory-dock-modal');
      });
    }

    this.setupModalTrigger('open-badges-btn', 'gamification-modal', () => this.gamification.openBadgesModal());

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (this.viewerMode === 'chunking') this.chunkingMode.nextChunk();
        else this.pdfViewer.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (this.viewerMode === 'chunking') this.chunkingMode.prevChunk();
        else this.pdfViewer.prevPage();
      } else if (e.key === ' ' && e.shiftKey) {
        e.preventDefault();
        this.tts.togglePlayPause();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        bionicToggle.click();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rulerToggle.click();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.focusTimer.showRandomBreakCard();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        const activeText = this.pdfViewer.getCurrentPageText();
        const quiz = this.activeRecall.generateMicroQuiz(activeText);
        if (quiz) {
          const mount = document.getElementById('inline-quiz-container') || document.getElementById('pdf-viewport');
          if (mount) this.activeRecall.renderQuizCard(mount, quiz);
        }
      }
    });
  }

  setupModalTrigger(btnId, modalId, onOpen) {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const closeBtn = modal ? modal.querySelector('.close-modal-btn') : null;

    if (btn && modal) {
      btn.addEventListener('click', () => {
        if (onOpen) onOpen();
        this.openModal(modalId);
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => this.closeModal(modalId));
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (this.audio) this.audio.playTactileClick(650, 'sine');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  async loadInitialDocument() {
    try {
      const response = await fetch('sample.pdf');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        this.pdfViewer.loadDocument(arrayBuffer, 'ADHD Research & Assistive Software Report.pdf');
        return;
      }
    } catch (e) {
      console.warn('Loading fallback PDF path:', e);
    }

    const pdfFilename = 'How students and employees diagnoised with ADHD face difficulties in learning from normal pdf\'s, and other e material , .._.pdf';
    this.pdfViewer.loadDocument(pdfFilename, 'ADHD Research & Assistive Software Report.pdf');
  }
}

// Bootstrap on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
