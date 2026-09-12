/**
 * FocusFlow app orchestrator — static, browser-only PDF reader.
 */

import { StorageManager } from './modules/storage.js';
import { AudioSynthesizer } from './modules/audio-synthesizer.js';
import { TTSEngine } from './modules/tts-engine.js';
import { SensoryDock } from './modules/sensory-dock.js';
import { FocusTimer } from './modules/focus-timer.js';
import { ChunkingMode } from './modules/chunking-mode.js';
import { DualWorkspace } from './modules/dual-workspace.js';
import { GamificationSystem } from './modules/gamification.js';
import { PDFViewer } from './modules/pdf-viewer.js';
import { ActiveRecallEngine } from './modules/active-recall.js';
import { TimeAwarenessEngine } from './modules/time-awareness.js';
import { AntiDistractionGuardrails } from './modules/anti-distraction.js';
import { AIStudyAssistant } from './modules/ai-study-assistant.js';

const SOUND_IDS = ['brown', 'pink', 'binaural40', 'binaural10', 'rain'];

function $(id) {
  return document.getElementById(id);
}

function on(el, event, handler) {
  if (el) el.addEventListener(event, handler);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function readPdfFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

class App {
  constructor() {
    this.settings = StorageManager.getSettings();
    this.audio = new AudioSynthesizer();
    this.tts = new TTSEngine();
    this.gamification = new GamificationSystem({ audioSynthesizer: this.audio });
    this.viewerMode = 'standard';
    this.dualWorkspaceOpen = window.innerWidth >= 1100;
    this.currentDocumentName = '';
    this.aiAssistant = new AIStudyAssistant({
      apiKey: StorageManager.getAIKey(),
      onStatusChange: (status) => this.updateAIStatus(status),
      onError: (err) => this.handleAIError(err)
    });
    this.init();
  }

  init() {
    this.applyTheme(this.settings.theme);
    this.applyTypography();

    this.activeRecall = new ActiveRecallEngine({
      audioSynthesizer: this.audio,
      gamification: this.gamification
    });

    this.pdfViewer = new PDFViewer({
      container: $('pdf-viewport'),
      rulerOverlay: $('reading-ruler-overlay'),
      audioSynthesizer: this.audio,
      onPageChange: (info) => this.handlePageChange(info),
      onDocumentLoaded: (docInfo) => this.handleDocumentLoaded(docInfo)
    });

    this.chunkingMode = new ChunkingMode({
      container: $('chunking-view-container'),
      bionicEnabled: this.settings.bionicReading,
      ttsEngine: this.tts,
      audioSynthesizer: this.audio,
      activeRecall: this.activeRecall,
      onChunkComplete: (idx, total) => {
        if (idx === total - 1) this.gamification.addXP(25, 'Section finished');
      }
    });

    this.dualWorkspace = new DualWorkspace({
      container: $('dual-workspace-container'),
      audioSynthesizer: this.audio,
      onTaskCompleted: () => {
        this.gamification.addXP(20, 'Task done');
        this.gamification.unlockBadge('task_finisher');
      }
    });

    this.sensoryDock = new SensoryDock('sensory-dock-modal-content', this.audio);

    this.focusTimer = new FocusTimer({
      focusDuration: this.settings.focusTimerDuration || 20,
      breakDuration: this.settings.breakTimerDuration || 5,
      audioSynthesizer: this.audio,
      onFocusComplete: (mins) => this.gamification.addXP(40, `${mins}m focus`),
      onBreakTriggered: () => this.gamification.unlockBadge('movement_hero')
    });

    this.timeAwareness = new TimeAwarenessEngine({
      audioSynthesizer: this.audio,
      focusTimer: this.focusTimer
    });

    this.antiDistraction = new AntiDistractionGuardrails({
      audioSynthesizer: this.audio,
      gamification: this.gamification,
      pdfViewer: this.pdfViewer
    });

    this.setupTTSHandlers();
    this.setupUIEventListeners();
    this.setupAudioSoundscapeSliders();
    this.setupFrictionlessBreakPrompt();
    this.setDualWorkspace(this.dualWorkspaceOpen);
    this.loadInitialDocument();
    refreshIcons();
  }

  applyTheme(theme) {
    this.settings.theme = theme;
    document.body.setAttribute('data-theme', theme);
    StorageManager.updateSetting('theme', theme);
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.theme === theme);
    });
  }

  applyTypography() {
    const root = document.documentElement;
    root.style.setProperty('--user-font-size', `${this.settings.fontSize}px`);
    root.style.setProperty('--user-line-height', `${this.settings.lineHeight}`);
    root.style.setProperty('--user-letter-spacing', `${this.settings.letterSpacing}px`);
    document.body.classList.remove('font-lexend', 'font-atkinson', 'font-opendyslexic', 'font-inter');
    document.body.classList.add(`font-${this.settings.fontFamily}`);
    StorageManager.saveSettings(this.settings);
  }

  applyADHDPreset(preset) {
    this.settings.adhdPreset = preset;
    if (this.audio) this.audio.playRewardChime();

    if (preset === 'inattentive') {
      this.settings.bionicReading = true;
      this.settings.readingRuler = true;
      this.settings.rulerMode = 'mask';
      this.settings.fontFamily = 'opendyslexic';
      this.settings.theme = 'cream';
      this.settings.fontSize = 20;
      this.settings.lineHeight = 1.9;
      this.gamification.unlockBadge('bionic_reader');
      this.gamification.showMiniToast('Focus preset: bionic words, ruler, OpenDyslexic');
    } else if (preset === 'hyperactive') {
      this.settings.theme = 'forest-calm';
      this.settings.fontFamily = 'lexend';
      this.settings.soundVolumes.brown = 0.55;
      this.audio.startSound('brown', 0.55);
      const brownSlider = $('sound-slider-brown');
      if (brownSlider) brownSlider.value = 55;
      this.openSensoryDockWithCooldown();
      this.gamification.unlockBadge('zen_master');
      this.gamification.showMiniToast('Energy preset: brown noise and fidget tools');
    } else if (preset === 'combined') {
      this.settings.theme = 'dark-velvet';
      this.settings.fontFamily = 'atkinson';
      this.settings.bionicReading = true;
      this.setViewerMode('chunking');
      this.setDualWorkspace(true);
      this.settings.soundVolumes.binaural40 = 0.4;
      this.audio.startSound('binaural40', 0.4);
      const binSlider = $('sound-slider-binaural40');
      if (binSlider) binSlider.value = 40;
      this.gamification.showMiniToast('Split preset: chunks, notes, and 40 Hz tone');
    }

    this.applyTheme(this.settings.theme);
    this.applyTypography();
    this.syncControlsWithSettings();
    this.pdfViewer.setBionicMode(this.settings.bionicReading, this.settings.bionicFixation);
    this.pdfViewer.setReadingRuler(this.settings.readingRuler, this.settings.rulerMode, this.settings.rulerHeight);
    this.chunkingMode.setBionic(this.settings.bionicReading);
  }

  syncControlsWithSettings() {
    $('bionic-toggle-btn')?.classList.toggle('active-toggle', this.settings.bionicReading);
    $('ruler-toggle-btn')?.classList.toggle('active-toggle', this.settings.readingRuler);
    const fontSelect = $('font-select');
    if (fontSelect) fontSelect.value = this.settings.fontFamily;
    const fontSizeSlider = $('font-size-slider');
    if (fontSizeSlider) fontSizeSlider.value = this.settings.fontSize;
  }

  setViewerMode(mode) {
    this.viewerMode = mode;
    const standardView = $('pdf-viewport');
    const chunkingView = $('chunking-view-container');
    const standardTab = $('mode-btn-standard');
    const chunkingTab = $('mode-btn-chunking');

    if (mode === 'chunking') {
      standardView?.classList.add('hidden');
      chunkingView?.classList.remove('hidden');
      chunkingTab?.classList.add('hw-btn-orange');
      standardTab?.classList.remove('hw-btn-orange');
      this.chunkingMode.setChunksFromPageText(this.pdfViewer.currentPage, this.pdfViewer.getCurrentPageText());
    } else {
      standardView?.classList.remove('hidden');
      chunkingView?.classList.add('hidden');
      standardTab?.classList.add('hw-btn-orange');
      chunkingTab?.classList.remove('hw-btn-orange');
      if (this.pdfViewer.pdfDoc) this.pdfViewer.renderPage(this.pdfViewer.currentPage);
    }
  }

  setDualWorkspace(open) {
    this.dualWorkspaceOpen = open;
    $('dual-workspace-wrapper')?.classList.toggle('hidden', !open);
    $('toggle-workspace-btn')?.classList.toggle('active-toggle', open);
  }

  handlePageChange({ pageNumber, totalPages, pageText }) {
    const pageDisplay = $('current-page-indicator');
    const totalDisplay = $('total-pages-indicator');
    if (pageDisplay) pageDisplay.textContent = pageNumber;
    if (totalDisplay) totalDisplay.textContent = totalPages;

    this.dualWorkspace.setPageContent(pageNumber, pageText);
    if (this.viewerMode === 'chunking') {
      this.chunkingMode.setChunksFromPageText(pageNumber, pageText);
    }
    this.tts.setText(pageText);
    this.gamification.recordPageRead();
    const words = pageText ? pageText.trim().split(/\s+/).length : 0;
    this.timeAwareness.updatePageWords(words);
  }

  handleDocumentLoaded({ name, totalPages, firstPageText }) {
    this.currentDocumentName = name;
    const titleEl = $('document-title-display');
    if (titleEl) {
      titleEl.textContent = name;
      titleEl.title = name;
    }
    this.dualWorkspace.setDocument(name);
    this.dualWorkspace.setPageContent(1, firstPageText);
    this.gamification.unlockBadge('first_read');
    this.gamification.showMiniToast(`Opened “${name}” (${totalPages} pages)`);
    const firstWords = firstPageText ? firstPageText.trim().split(/\s+/).length : 0;
    this.timeAwareness.setDocumentStats(firstWords * totalPages, firstWords);
  }

  async openPdfFile(file) {
    if (!file) return;
    const bytes = await readPdfFile(file);
    this.pdfViewer.loadDocument(bytes, file.name);
  }

  setupTTSHandlers() {
    this.tts.onStateChange = ({ isPlaying, isPaused, currentChunkIndex, totalChunks }) => {
      const playIcon = $('tts-play-icon');
      const textStatus = $('tts-status-text');
      if (playIcon) {
        playIcon.setAttribute('data-lucide', isPlaying && !isPaused ? 'pause' : 'play');
        refreshIcons();
      }
      if (textStatus) {
        textStatus.textContent = isPlaying
          ? `${isPaused ? 'Paused' : 'Playing'} (${currentChunkIndex + 1}/${totalChunks})`
          : 'Ready';
      }
      if (isPlaying) this.gamification.unlockBadge('tts_explorer');
    };

    this.tts.onWordBoundary = ({ word }) => {
      const wordBadge = $('tts-current-word');
      if (wordBadge) wordBadge.textContent = word;
    };
  }

  setupAudioSoundscapeSliders() {
    SOUND_IDS.forEach((soundId) => {
      on($(`sound-slider-${soundId}`), 'input', (e) => {
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
    });

    on($('stop-all-sounds-btn'), 'click', () => {
      this.audio.stopAll();
      SOUND_IDS.forEach((id) => {
        const slider = $(`sound-slider-${id}`);
        if (slider) slider.value = 0;
        this.settings.soundVolumes[id] = 0;
      });
      StorageManager.saveSettings(this.settings);
    });
  }

  setupFrictionlessBreakPrompt() {
    on($('break-prompt-start-btn'), 'click', () => {
      this.timeAwareness.dismissBreakPrompt(0);
      this.focusTimer.showRandomBreakCard();
    });
    on($('break-prompt-snooze-btn'), 'click', () => {
      this.timeAwareness.dismissBreakPrompt(5);
      this.gamification.showMiniToast('Break snoozed for 5 minutes');
    });
  }

  openSensoryDockWithCooldown() {
    const modalContent = $('sensory-dock-modal-content');
    this.sensoryDock.renderDockUI();
    this.openModal('sensory-dock-modal');
    this.antiDistraction.startFidgetSession(modalContent, () => {
      this.closeModal('sensory-dock-modal');
    });
  }

  setupUIEventListeners() {
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      on(btn, 'click', () => this.applyTheme(btn.dataset.theme));
    });

    ['inattentive', 'hyperactive', 'combined'].forEach((preset) => {
      on($(`preset-btn-${preset}`), 'click', () => this.applyADHDPreset(preset));
    });

    on($('deep-work-toggle-btn'), 'click', () => this.antiDistraction.toggleDeepWorkMode());
    on($('scanlines-toggle-btn'), 'click', () => {
      document.body.classList.toggle('crt-scanlines-active');
      const isActive = document.body.classList.contains('crt-scanlines-active');
      $('scanlines-toggle-btn').classList.toggle('active', isActive);
      if (this.audio) this.audio.playTactileClick(680, 'square', 0.04);
    });

    on($('prev-page-btn'), 'click', () => this.pdfViewer.prevPage());
    on($('next-page-btn'), 'click', () => this.pdfViewer.nextPage());
    on($('zoom-in-btn'), 'click', () => this.pdfViewer.zoomIn());
    on($('zoom-out-btn'), 'click', () => this.pdfViewer.zoomOut());

    const bionicToggle = $('bionic-toggle-btn');
    on(bionicToggle, 'click', () => {
      this.settings.bionicReading = !this.settings.bionicReading;
      StorageManager.updateSetting('bionicReading', this.settings.bionicReading);
      this.pdfViewer.setBionicMode(this.settings.bionicReading, this.settings.bionicFixation);
      this.chunkingMode.setBionic(this.settings.bionicReading);
      this.syncControlsWithSettings();
      if (this.settings.bionicReading) this.gamification.unlockBadge('bionic_reader');
    });

    const rulerToggle = $('ruler-toggle-btn');
    on(rulerToggle, 'click', () => {
      this.settings.readingRuler = !this.settings.readingRuler;
      StorageManager.updateSetting('readingRuler', this.settings.readingRuler);
      this.pdfViewer.setReadingRuler(this.settings.readingRuler, this.settings.rulerMode, this.settings.rulerHeight);
      this.syncControlsWithSettings();
    });

    on($('ruler-mode-select'), 'change', (e) => {
      this.settings.rulerMode = e.target.value;
      StorageManager.updateSetting('rulerMode', this.settings.rulerMode);
      this.pdfViewer.setReadingRuler(this.settings.readingRuler, this.settings.rulerMode, this.settings.rulerHeight);
    });

    on($('font-select'), 'change', (e) => {
      this.settings.fontFamily = e.target.value;
      this.applyTypography();
    });

    on($('font-size-slider'), 'input', (e) => {
      this.settings.fontSize = parseInt(e.target.value, 10);
      this.applyTypography();
    });

    on($('mode-btn-standard'), 'click', () => this.setViewerMode('standard'));
    on($('mode-btn-chunking'), 'click', () => this.setViewerMode('chunking'));
    on($('toggle-workspace-btn'), 'click', () => this.setDualWorkspace(!this.dualWorkspaceOpen));

    on($('tts-main-play-btn'), 'click', () => this.tts.togglePlayPause());
    on($('tts-next-sentence-btn'), 'click', () => this.tts.nextSentence());
    on($('tts-prev-sentence-btn'), 'click', () => this.tts.prevSentence());
    on($('tts-speed-select'), 'change', (e) => this.tts.setRate(parseFloat(e.target.value)));

    const fileInput = $('pdf-file-input');
    on($('upload-pdf-btn'), 'click', () => fileInput?.click());
    document.querySelectorAll('[data-trigger-upload]').forEach((btn) => {
      on(btn, 'click', () => fileInput?.click());
    });
    on(fileInput, 'change', (e) => {
      const file = e.target.files?.[0];
      if (file) this.openPdfFile(file);
    });

    const overlay = $('drop-overlay');
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (overlay) overlay.hidden = false;
    });
    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null && overlay) overlay.hidden = true;
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (overlay) overlay.hidden = true;
      const file = e.dataTransfer.files?.[0];
      if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
        this.openPdfFile(file);
      }
    });

    this.setupModalTrigger('open-soundscape-btn', 'soundscape-modal');
    on($('open-sensory-btn'), 'click', () => this.openSensoryDockWithCooldown());
    on(document.querySelector('#sensory-dock-modal .close-modal-btn'), 'click', () => {
      this.antiDistraction.stopFidgetSession();
      this.closeModal('sensory-dock-modal');
    });
    this.setupModalTrigger('open-badges-btn', 'gamification-modal', () => this.gamification.openBadgesModal());
    this.setupModalTrigger('open-ai-settings-btn', 'ai-settings-modal');
    this.setupModalTrigger('open-data-mgmt-btn', 'data-management-modal');

    this.setupAIHandlers();
    this.setupDataManagementHandlers();

    document.querySelectorAll('.modal-backdrop').forEach((modal) => {
      on(modal, 'click', (e) => {
        if (e.target === modal) {
          if (modal.id === 'sensory-dock-modal') this.antiDistraction.stopFidgetSession();
          this.closeModal(modal.id);
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.flex').forEach((modal) => this.closeModal(modal.id));
        return;
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

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
        bionicToggle?.click();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rulerToggle?.click();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.focusTimer.showRandomBreakCard();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        const quiz = this.activeRecall.generateMicroQuiz(this.pdfViewer.getCurrentPageText());
        const mount = $('inline-quiz-container') || $('pdf-viewport');
        if (quiz && mount) this.activeRecall.renderQuizCard(mount, quiz);
      }
    });
  }

  setupModalTrigger(btnId, modalId, onOpen) {
    const modal = $(modalId);
    on($(btnId), 'click', () => {
      if (onOpen) onOpen();
      this.openModal(modalId);
    });
    modal?.querySelectorAll('.close-modal-btn').forEach((btn) => {
      on(btn, 'click', () => this.closeModal(modalId));
    });
  }

  setupAIHandlers() {
    const apiKeyInput = $('ai-api-key-input');
    const saveBtn = $('ai-save-key-btn');
    const clearBtn = $('ai-clear-key-btn');
    const statusBadge = $('ai-status-badge');
    const responseContainer = $('ai-response-container');
    const responseContent = $('ai-response-content');

    const savedKey = this.aiAssistant.getApiKey();
    if (apiKeyInput) apiKeyInput.value = savedKey;
    this.updateAIStatus({ hasKey: !!savedKey });

    on(saveBtn, 'click', () => {
      const key = apiKeyInput?.value?.trim();
      if (key && key.length > 20) {
        this.aiAssistant.setApiKey(key);
        this.updateAIStatus({ hasKey: true });
        this.gamification.showMiniToast('API key saved locally ✓');
      } else {
        this.gamification.showMiniToast('Please enter a valid API key');
      }
    });

    on(clearBtn, 'click', () => {
      this.aiAssistant.clearApiKey();
      if (apiKeyInput) apiKeyInput.value = '';
      this.updateAIStatus({ hasKey: false });
      this.gamification.showMiniToast('API key cleared');
    });

    const featureHandlers = {
      'ai-explain-btn': async () => {
        const text = this.pdfViewer.getCurrentPageText();
        if (!text) return this.gamification.showMiniToast('Open a PDF first');
        try {
          const result = await this.aiAssistant.explainLikeFive(text.substring(0, 3000));
          this.showAIResponse(result);
        } catch (e) { this.handleAIError(e); }
      },
      'ai-summarize-btn': async () => {
        const text = this.pdfViewer.getCurrentPageText();
        if (!text) return this.gamification.showMiniToast('Open a PDF first');
        try {
          const result = await this.aiAssistant.summarize(text.substring(0, 3000));
          this.showAIResponse(result);
        } catch (e) { this.handleAIError(e); }
      },
      'ai-quiz-btn': async () => {
        const text = this.pdfViewer.getCurrentPageText();
        if (!text) return this.gamification.showMiniToast('Open a PDF first');
        try {
          const result = await this.aiAssistant.generateQuiz(text.substring(0, 3000));
          this.showAIResponse(JSON.stringify(result, null, 2));
        } catch (e) { this.handleAIError(e); }
      },
      'ai-concepts-btn': async () => {
        const text = this.pdfViewer.getCurrentPageText();
        if (!text) return this.gamification.showMiniToast('Open a PDF first');
        try {
          const result = await this.aiAssistant.extractKeyConcepts(text.substring(0, 3000));
          this.showAIResponse(result);
        } catch (e) { this.handleAIError(e); }
      }
    };

    Object.entries(featureHandlers).forEach(([btnId, handler]) => {
      on($(btnId), 'click', handler);
    });

    on($('ai-close-response-btn'), 'click', () => {
      responseContainer?.classList.add('hidden');
    });
  }

  updateAIStatus(status) {
    const badge = $('ai-status-badge');
    if (badge) {
      badge.classList.toggle('hidden', !status.hasKey);
    }
  }

  showAIResponse(text) {
    const container = $('ai-response-container');
    const content = $('ai-response-content');
    if (content) content.textContent = text;
    if (container) container.classList.remove('hidden');
  }

  handleAIError(error) {
    let message = 'AI request failed';
    if (error.message === 'API_KEY_REQUIRED') {
      message = 'Please add your Google AI API key first';
      this.openModal('ai-settings-modal');
    } else if (error.message === 'INVALID_API_KEY') {
      message = 'Invalid API key. Check your Google AI Studio key.';
    } else if (error.message === 'QUIZ_PARSE_ERROR') {
      message = 'Could not parse quiz. Try again.';
    }
    this.gamification.showMiniToast(`⚠️ ${message}`);
  }

  setupDataManagementHandlers() {
    on($('export-data-btn'), 'click', () => {
      try {
        const json = StorageManager.exportAllData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.gamification.showMiniToast('Data exported successfully ✓');
      } catch (e) {
        this.gamification.showMiniToast('Export failed');
      }
    });

    on($('import-data-btn'), 'click', () => {
      $('import-file-input')?.click();
    });

    on($('import-file-input'), 'change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          StorageManager.importAllData(evt.target.result);
          this.gamification.showMiniToast('Data imported successfully ✓');
          this.settings = StorageManager.getSettings();
          this.applyTheme(this.settings.theme);
          this.applyTypography();
          this.aiAssistant.setApiKey(StorageManager.getAIKey());
          this.updateAIStatus({ hasKey: this.aiAssistant.hasValidKey() });
        } catch (err) {
          this.gamification.showMiniToast('Import failed: Invalid file');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  openModal(modalId) {
    const modal = $(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (this.audio) this.audio.playTactileClick(650, 'sine');
    refreshIcons();
  }

  closeModal(modalId) {
    const modal = $(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async loadInitialDocument() {
    try {
      const response = await fetch('sample.pdf');
      if (response.ok) {
        this.pdfViewer.loadDocument(await response.arrayBuffer(), 'sample.pdf');
      }
    } catch {
      /* Welcome card stays until the visitor opens a file. */
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
