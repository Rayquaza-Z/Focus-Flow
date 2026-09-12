/**
 * Anti-Distraction & Anti-Play Guardrails Module for ADHD PDF Reader
 * Features:
 * 1. Fidget Session 90-Second Cooldown (Prevents fidget tools from becoming a dopamine trap)
 * 2. Focus Drift Detector (45s idle & tab-switch attention pulse to re-anchor gaze)
 * 3. Minimalist "Deep Work" Mode (Shift + F full UI simplification)
 */

export class AntiDistractionGuardrails {
  constructor(options = {}) {
    this.audioSynthesizer = options.audioSynthesizer || null;
    this.gamification = options.gamification || null;
    this.pdfViewer = options.pdfViewer || null;

    this.fidgetTimeLimitSeconds = 90; // 90-second maximum fidget session
    this.fidgetActiveSeconds = 0;
    this.fidgetInterval = null;
    this.isFidgetOpen = false;

    this.idleDriftSeconds = 0;
    this.driftThresholdSeconds = 45; // 45s idle triggers attention pulse
    this.driftInterval = null;
    this.isDeepWorkMode = false;

    this.initDriftDetector();
    this.initDeepWorkShortcuts();
  }

  // --- 1. Sensory Fidget 90-Second Cooldown ---
  startFidgetSession(containerEl, onReturnToRead) {
    this.isFidgetOpen = true;
    this.fidgetActiveSeconds = 0;
    if (this.fidgetInterval) clearInterval(this.fidgetInterval);

    this.fidgetInterval = setInterval(() => {
      if (!this.isFidgetOpen) return;
      this.fidgetActiveSeconds++;

      // Update timer indicator inside fidget dock if element exists
      const timerBadge = document.getElementById('fidget-session-timer');
      if (timerBadge) {
        const remaining = Math.max(0, this.fidgetTimeLimitSeconds - this.fidgetActiveSeconds);
        timerBadge.textContent = `${remaining}s`;
        if (remaining <= 15) {
          timerBadge.classList.add('text-amber-500', 'animate-pulse');
        }
      }

      if (this.fidgetActiveSeconds >= this.fidgetTimeLimitSeconds) {
        this.triggerFidgetCooldown(containerEl, onReturnToRead);
      }
    }, 1000);
  }

  stopFidgetSession() {
    this.isFidgetOpen = false;
    if (this.fidgetInterval) {
      clearInterval(this.fidgetInterval);
      this.fidgetInterval = null;
    }
  }

  triggerFidgetCooldown(containerEl, onReturnToRead) {
    this.stopFidgetSession();

    if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(520, 'sine', 0.12);

    const target = document.getElementById('sensory-dock-modal-content');
    if (target) {
      target.innerHTML = `
        <div class="p-8 text-center flex flex-col items-center justify-center space-y-5 animate-fade-in">
          <div class="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-3xl shadow-inner">
            🧘
          </div>
          <div class="space-y-2 max-w-sm">
            <h3 class="text-base font-bold text-[var(--text-primary)]">Sensory Baseline Recharged!</h3>
            <p class="text-xs text-[var(--text-secondary)] leading-relaxed">
              Your motor restlessness has been calibrated. Ready to channel this fresh cognitive clarity back into your reading?
            </p>
          </div>
          <button id="fidget-return-btn" class="px-6 py-3 rounded-2xl bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition flex items-center space-x-2 transform hover:scale-105">
            <span>Jump Back to Reading</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      const returnBtn = target.querySelector('#fidget-return-btn');
      if (returnBtn) {
        returnBtn.addEventListener('click', () => {
          if (this.gamification) this.gamification.addXP(10, 'Mindful Sensory Reset');
          if (onReturnToRead) onReturnToRead();
        });
      }
    }
  }

  // --- 2. Focus Drift Detector ---
  initDriftDetector() {
    const resetIdle = () => {
      this.idleDriftSeconds = 0;
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });

    // Window / Tab Visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // User returned to tab - pulse ruler to re-anchor attention
        this.pulseAttentionAnchor('Welcome back! Anchor your gaze here 👁️');
      }
    });

    if (this.driftInterval) clearInterval(this.driftInterval);
    this.driftInterval = setInterval(() => {
      this.idleDriftSeconds++;
      if (this.idleDriftSeconds === this.driftThresholdSeconds) {
        this.pulseAttentionAnchor('Gentle focus pulse · Resume your place');
      }
    }, 1000);
  }

  pulseAttentionAnchor(message = '') {
    const ruler = document.getElementById('reading-ruler-overlay');
    const viewport = document.getElementById('main-content-scroll');

    if (ruler) {
      ruler.classList.add('attention-pulse-glow');
      setTimeout(() => ruler.classList.remove('attention-pulse-glow'), 2600);
    }

    if (viewport) {
      const anchorToast = document.createElement('div');
      anchorToast.className = 'fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-indigo-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-sm pointer-events-none transition-opacity duration-500';
      anchorToast.textContent = message;
      document.body.appendChild(anchorToast);

      setTimeout(() => {
        anchorToast.style.opacity = '0';
        setTimeout(() => anchorToast.remove(), 500);
      }, 2200);
    }
  }

  // --- 3. Minimalist "Deep Work" Mode ---
  initDeepWorkShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if ((e.key === 'F' || e.key === 'f') && e.shiftKey) {
        e.preventDefault();
        this.toggleDeepWorkMode();
      } else if (e.key === 'Escape' && this.isDeepWorkMode) {
        e.preventDefault();
        this.toggleDeepWorkMode(false);
      }
    });
  }

  toggleDeepWorkMode(forceState = null) {
    this.isDeepWorkMode = forceState !== null ? forceState : !this.isDeepWorkMode;

    if (this.isDeepWorkMode) {
      document.body.classList.add('deep-work-active');
      if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(780, 'sine', 0.05);
      if (this.gamification) this.gamification.showMiniToast('Focus mode on — Shift + F to exit');
      this.renderDeepWorkExitBadge();
    } else {
      document.body.classList.remove('deep-work-active');
      if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(560, 'sine', 0.05);
      this.removeDeepWorkExitBadge();
    }

    const toggleBtn = document.getElementById('deep-work-toggle-btn');
    if (toggleBtn) {
      toggleBtn.classList.toggle('bg-indigo-600', this.isDeepWorkMode);
      toggleBtn.classList.toggle('text-white', this.isDeepWorkMode);
    }
  }

  renderDeepWorkExitBadge() {
    this.removeDeepWorkExitBadge();
    const badge = document.createElement('button');
    badge.id = 'deep-work-exit-pill';
    badge.className = 'hw-btn fixed top-3 right-4 z-50';
    badge.innerHTML = `<span>Exit focus mode</span><kbd class="text-[10px]">Shift+F</kbd>`;
    badge.addEventListener('click', () => this.toggleDeepWorkMode(false));
    document.body.appendChild(badge);
  }

  removeDeepWorkExitBadge() {
    const badge = document.getElementById('deep-work-exit-pill');
    if (badge) badge.remove();
  }
}
