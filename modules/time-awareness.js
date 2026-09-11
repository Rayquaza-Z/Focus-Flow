/**
 * Time-Awareness & Executive Function Aids Module for ADHD PDF Reader
 * Features:
 * 1. Hyper-Realistic ADHD-Adjusted Reading Time Estimator
 * 2. Frictionless Continuous Interaction Break Orchestrator (25m Active Reading)
 */

export class TimeAwarenessEngine {
  constructor(options = {}) {
    this.audioSynthesizer = options.audioSynthesizer || null;
    this.focusTimer = options.focusTimer || null;
    this.onBreakPrompt = options.onBreakPrompt || null;

    // Standard ADHD average reading speed with executive processing latency (words per minute)
    this.baseWPM = 185;
    this.adhdLatencyMultiplier = 1.25; // 25% extra buffer for re-reading & working memory checks

    this.activeReadingSeconds = 0;
    this.idleSeconds = 0;
    this.maxIdleThresholdSeconds = 45; // 45 seconds without interaction counts as idle
    this.continuousActiveLimitSeconds = 25 * 60; // 25 minutes of continuous active reading

    this.timerInterval = null;
    this.isTracking = true;
    this.lastInteractionTimestamp = Date.now();

    this.currentPageWords = 0;
    this.totalDocumentWords = 0;
    this.readWords = 0;

    this.initInteractionListeners();
    this.startTrackingLoop();
  }

  initInteractionListeners() {
    const registerInteraction = () => {
      this.lastInteractionTimestamp = Date.now();
      this.idleSeconds = 0;
    };

    window.addEventListener('mousemove', registerInteraction, { passive: true });
    window.addEventListener('scroll', registerInteraction, { passive: true });
    window.addEventListener('keydown', registerInteraction, { passive: true });
    window.addEventListener('click', registerInteraction, { passive: true });
    window.addEventListener('touchstart', registerInteraction, { passive: true });
  }

  startTrackingLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (!this.isTracking) return;

      const now = Date.now();
      const secondsSinceLastInteraction = Math.floor((now - this.lastInteractionTimestamp) / 1000);

      if (secondsSinceLastInteraction <= this.maxIdleThresholdSeconds) {
        this.activeReadingSeconds++;
        this.idleSeconds = 0;

        // Check if 25 minutes of continuous active reading reached
        if (this.activeReadingSeconds > 0 && this.activeReadingSeconds % this.continuousActiveLimitSeconds === 0) {
          this.triggerFrictionlessBreakPrompt();
        }
      } else {
        this.idleSeconds++;
      }

      this.updateDisplayUI();
    }, 1000);
  }

  setDocumentStats(totalWords, pageWords) {
    this.totalDocumentWords = totalWords || 0;
    this.currentPageWords = pageWords || 0;
    this.updateDisplayUI();
  }

  updatePageWords(words) {
    this.currentPageWords = words || 0;
    this.updateDisplayUI();
  }

  calculateTimeMinutes(wordCount) {
    if (!wordCount || wordCount <= 0) return 0;
    const effectiveWPM = this.baseWPM / this.adhdLatencyMultiplier;
    return (wordCount / effectiveWPM);
  }

  formatTimeEstimate(minutes) {
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${Math.max(15, seconds)}s`;
    }
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  triggerFrictionlessBreakPrompt() {
    if (this.audioSynthesizer) this.audioSynthesizer.playRewardChime();

    const toast = document.getElementById('frictionless-break-prompt');
    if (toast) {
      toast.classList.remove('hidden');
      toast.classList.add('flex');
    }

    if (this.onBreakPrompt) {
      this.onBreakPrompt({
        activeMinutes: Math.floor(this.activeReadingSeconds / 60)
      });
    }
  }

  dismissBreakPrompt(snoozeMinutes = 0) {
    const toast = document.getElementById('frictionless-break-prompt');
    if (toast) {
      toast.classList.add('hidden');
      toast.classList.remove('flex');
    }

    if (snoozeMinutes > 0) {
      // Deduct seconds so prompt fires again after snooze duration
      this.activeReadingSeconds = this.continuousActiveLimitSeconds - (snoozeMinutes * 60);
    }
  }

  updateDisplayUI() {
    const badge = document.getElementById('adhd-time-estimate-badge');
    if (!badge) return;

    const pageMins = this.calculateTimeMinutes(this.currentPageWords);
    const formatted = this.formatTimeEstimate(pageMins);

    badge.innerHTML = `
      <i data-lucide="hourglass" class="w-3.5 h-3.5 text-indigo-500 animate-pulse"></i>
      <span class="font-bold text-[var(--text-primary)]">~${formatted} left</span>
      <span class="text-[10px] text-[var(--text-secondary)] hidden sm:inline">(ADHD Pace)</span>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  resetActiveCounter() {
    this.activeReadingSeconds = 0;
    this.idleSeconds = 0;
  }
}
