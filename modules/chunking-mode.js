/**
 * Bite-Sized Chunking Mode (Progressive Disclosure) Module for ADHD PDF Reader
 * Deconstructs dense PDF pages into non-overwhelming, single-focus cards
 * with large accessible typography, TTS integration, Pause & Test micro-quiz gating, and progress indicators.
 */

import { BionicEngine } from './bionic-engine.js';
import { ActiveRecallEngine } from './active-recall.js';

export class ChunkingMode {
  constructor(options = {}) {
    this.containerEl = options.container || document.getElementById('chunking-view-container');
    this.bionicEnabled = options.bionicEnabled || false;
    this.ttsEngine = options.ttsEngine || null;
    this.audioSynthesizer = options.audioSynthesizer || null;
    this.activeRecall = options.activeRecall || null;
    this.onChunkComplete = options.onChunkComplete || null;

    this.chunks = [];
    this.currentIndex = 0;
    this.pageNumber = 1;
    this.isTestingMode = false;
    this.completedQuizzes = new Set();
  }

  setChunksFromPageText(pageNumber, text) {
    this.pageNumber = pageNumber;
    this.completedQuizzes.clear();

    // Break page text into paragraphs or logical sections
    const rawParagraphs = text.split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(p => p.length > 20);

    if (rawParagraphs.length === 0 && text.trim().length > 0) {
      const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
      const groups = [];
      let cur = '';
      for (const s of sentences) {
        if ((cur + s).length > 250 && cur.length > 0) {
          groups.push(cur.trim());
          cur = s;
        } else {
          cur += ' ' + s;
        }
      }
      if (cur.trim()) groups.push(cur.trim());
      this.chunks = groups.map((g, idx) => ({ id: idx, text: g }));
    } else {
      this.chunks = rawParagraphs.map((p, idx) => ({ id: idx, text: p }));
    }

    this.currentIndex = 0;
    this.render();
  }

  setBionic(enabled) {
    this.bionicEnabled = enabled;
    this.render();
  }

  nextChunk(bypassQuiz = false) {
    if (this.currentIndex < this.chunks.length - 1) {
      // Check if we should insert a Pause & Test Micro-Quiz every 2 chunks
      const currentChunk = this.chunks[this.currentIndex];
      const shouldQuiz = !bypassQuiz && !this.completedQuizzes.has(this.currentIndex) && (this.currentIndex % 2 === 1 || this.currentIndex === this.chunks.length - 1);

      if (shouldQuiz && this.activeRecall) {
        const quizData = this.activeRecall.generateMicroQuiz(currentChunk.text);
        if (quizData) {
          this.renderQuizInline(quizData);
          return;
        }
      }

      this.currentIndex++;
      if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(680, 'sine');
      this.render();
      if (this.onChunkComplete) this.onChunkComplete(this.currentIndex, this.chunks.length);
    }
  }

  renderQuizInline(quizData) {
    if (!this.containerEl) return;
    const quizWrapper = document.getElementById('inline-quiz-container');
    if (quizWrapper) {
      this.activeRecall.renderQuizCard(quizWrapper, quizData, () => {
        this.completedQuizzes.add(this.currentIndex);
        setTimeout(() => {
          this.nextChunk(true);
        }, 400);
      });
    }
  }

  prevChunk() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(560, 'sine');
      this.render();
    }
  }

  readActiveChunk() {
    if (this.ttsEngine && this.chunks[this.currentIndex]) {
      this.ttsEngine.setText(this.chunks[this.currentIndex].text);
      this.ttsEngine.playFrom(0);
    }
  }

  render() {
    if (!this.containerEl) return;
    if (this.chunks.length === 0) {
      this.containerEl.innerHTML = `
        <div class="flex flex-col items-center justify-center p-12 text-center text-[var(--text-secondary)]">
          <i data-lucide="layers" class="w-12 h-12 mb-3 opacity-40"></i>
          <p class="text-sm font-medium">No chunks available. Load a document to start Bite-Sized Reading.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const chunk = this.chunks[this.currentIndex];
    const total = this.chunks.length;
    const progressPercent = Math.round(((this.currentIndex + 1) / total) * 100);

    const formattedText = this.bionicEnabled
      ? BionicEngine.processText(chunk.text, 2)
      : chunk.text;

    this.containerEl.innerHTML = `
      <div class="max-w-2xl w-full mx-auto flex flex-col space-y-4">
        <!-- Progress Header -->
        <div class="flex items-center justify-between bg-[var(--hw-bg-inset)] px-4 py-2 rounded-[3px] border-2 border-[var(--hw-border)] shadow-[var(--hw-shadow-inset-sm)]">
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 bg-[var(--hw-orange)] text-white font-mono text-[10px] font-bold rounded-[2px]">
              PG 0${this.pageNumber}
            </span>
            <span class="font-mono text-xs font-bold text-[var(--hw-text-secondary)] uppercase">
              CARD <strong class="text-[var(--hw-text-primary)]">0${this.currentIndex + 1}</strong>/0${total}
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-24 bg-[var(--hw-bg-panel)] h-2 border border-[var(--hw-border)] rounded-[1px] overflow-hidden">
              <div class="bg-[var(--hw-orange)] h-full transition-all duration-200" style="width: ${progressPercent}%"></div>
            </div>
            <span class="font-mono text-[10px] font-extrabold text-[var(--hw-text-secondary)]">${progressPercent}%</span>
          </div>
        </div>

        <!-- Main Card Content with tactile border -->
        <div id="active-chunk-card" class="p-6 sm:p-8 bg-[var(--hw-bg-card)] rounded-[4px] border-3 border-[var(--hw-border)] shadow-[var(--hw-shadow-hard)] relative min-h-[220px] flex flex-col justify-between">
          <div class="prose max-w-none text-xl sm:text-2xl leading-relaxed text-[var(--hw-text-primary)] font-medium font-lexend select-text">
            ${formattedText}
          </div>

          <!-- Bottom Actions inside card -->
          <div class="mt-6 pt-3 border-t-2 border-[var(--hw-border)] flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <button id="chunk-tts-btn" class="hw-btn hw-btn-sm">
                <i data-lucide="volume-2" class="w-3.5 h-3.5 text-[var(--hw-orange)]"></i>
                <span>LISTEN</span>
              </button>
              <button id="chunk-test-now-btn" class="hw-btn hw-btn-sm" title="Test retention immediately">
                <i data-lucide="help-circle" class="w-3.5 h-3.5 text-[var(--hw-cyan)]"></i>
                <span>PAUSE & TEST</span>
              </button>
            </div>
            <span class="font-mono text-[10px] text-[var(--hw-text-muted)]">PRESS <kbd class="px-1 py-0.5 bg-[var(--hw-bg-inset)] border border-[var(--hw-border)] rounded-[2px] font-bold">SPACE</kbd> TO STEP</span>
          </div>
        </div>

        <!-- Inline Quiz Mount -->
        <div id="inline-quiz-container"></div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between space-x-3">
          <button id="chunk-prev-btn" class="flex-1 hw-btn py-2.5" ${this.currentIndex === 0 ? 'disabled' : ''}>
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
            <span>PREV CARD</span>
          </button>

          <button id="chunk-next-btn" class="flex-1 hw-btn hw-btn-orange py-2.5" ${this.currentIndex === total - 1 ? 'disabled' : ''}>
            <span>${this.currentIndex === total - 1 ? 'SECTION COMPLETED' : 'NEXT CARD'}</span>
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Trigger subtle dopamine glow
    const cardEl = document.getElementById('active-chunk-card');
    ActiveRecallEngine.triggerSubtleReward(cardEl);

    // Bind event listeners
    const nextBtn = document.getElementById('chunk-next-btn');
    const prevBtn = document.getElementById('chunk-prev-btn');
    const ttsBtn = document.getElementById('chunk-tts-btn');
    const testNowBtn = document.getElementById('chunk-test-now-btn');

    if (nextBtn) nextBtn.addEventListener('click', () => this.nextChunk(false));
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevChunk());
    if (ttsBtn) ttsBtn.addEventListener('click', () => this.readActiveChunk());
    if (testNowBtn && this.activeRecall) {
      testNowBtn.addEventListener('click', () => {
        const quiz = this.activeRecall.generateMicroQuiz(chunk.text);
        if (quiz) this.renderQuizInline(quiz);
      });
    }
  }
}
