/**
 * Focus Timer & Movement Break Cards Module for ADHD PDF Reader
 * Implements micro-focus sprint intervals (15-25m) and sensory movement break decks
 * recommended by ADDitude & CDC to reset executive function.
 */

export const MOVEMENT_BREAKS = [
  {
    id: 'shoulder_roll',
    title: 'Shoulder Rolls & Chest Opener',
    type: 'physical',
    durationSeconds: 45,
    icon: 'activity',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    instruction: 'Roll your shoulders backward 10 times in wide circles, then forward 10 times. Interlace your fingers behind your back and gently open your chest.',
    neuroBenefit: 'Releases upper spinal tension and boosts cerebral blood flow.'
  },
  {
    id: 'eye_reset',
    title: '20-20-20 Visual Rest',
    type: 'sensory',
    durationSeconds: 30,
    icon: 'eye',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    instruction: 'Look away from your screen at an object at least 20 feet (6 meters) away for 20-30 seconds. Blink slowly 10 times.',
    neuroBenefit: 'Relaxes the ciliary eye muscles, reducing visual processing fatigue.'
  },
  {
    id: 'water_hydration',
    title: 'Hydration & Brain Fuel',
    type: 'habit',
    durationSeconds: 60,
    icon: 'droplet',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    instruction: 'Stand up, walk to the kitchen or water bottle, and drink a full glass of cool water. Do 3 deep belly breaths while drinking.',
    neuroBenefit: 'Even 1-2% dehydration impairs working memory and focus in ADHD brains.'
  },
  {
    id: 'desk_shakeout',
    title: 'Kinesthetic Shakeout & Jumps',
    type: 'physical',
    durationSeconds: 45,
    icon: 'zap',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    instruction: 'Stand up and gently shake your hands, arms, and legs for 20 seconds. Do 10 light bouncing toe taps or star jumps.',
    neuroBenefit: 'Channels accumulated motor restlessness into dopamine release.'
  },
  {
    id: 'spine_twist',
    title: 'Seated Torso Spiral Stretch',
    type: 'stretch',
    durationSeconds: 45,
    icon: 'move',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    instruction: 'Sit tall. Place your right hand on your left knee and gently twist to look over your left shoulder for 15s. Switch sides.',
    neuroBenefit: 'Stimulates the central nervous system and realigns posture.'
  }
];

export class FocusTimer {
  constructor(options = {}) {
    this.focusDurationMinutes = options.focusDuration || 20;
    this.breakDurationMinutes = options.breakDuration || 5;
    this.audioSynthesizer = options.audioSynthesizer || null;
    this.onBreakTriggered = options.onBreakTriggered || null;
    this.onFocusComplete = options.onFocusComplete || null;

    this.mode = 'idle'; // 'focus', 'break', 'idle'
    this.timeLeftSeconds = this.focusDurationMinutes * 60;
    this.intervalId = null;
    this.activeBreakCard = null;

    this.initElements();
  }

  initElements() {
    this.displayEl = document.getElementById('focus-timer-display');
    this.toggleBtn = document.getElementById('focus-timer-toggle-btn');
    this.modalEl = document.getElementById('movement-break-modal');

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    const breakModalClose = document.getElementById('close-break-modal-btn');
    if (breakModalClose) {
      breakModalClose.addEventListener('click', () => this.dismissBreakModal());
    }

    const nextBreakBtn = document.getElementById('next-break-card-btn');
    if (nextBreakBtn) {
      nextBreakBtn.addEventListener('click', () => this.cycleBreakCard());
    }

    this.updateDisplay();
  }

  toggle() {
    if (this.mode === 'focus') {
      this.pause();
    } else {
      this.startFocus();
    }
  }

  startFocus(minutes = this.focusDurationMinutes) {
    this.clearInterval();
    this.mode = 'focus';
    this.timeLeftSeconds = minutes * 60;
    if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(640, 'sine');
    this.updateUIState();

    this.intervalId = setInterval(() => {
      this.timeLeftSeconds--;
      this.updateDisplay();

      if (this.timeLeftSeconds <= 0) {
        this.completeFocusSprint();
      }
    }, 1000);
  }

  pause() {
    this.clearInterval();
    this.mode = 'idle';
    this.updateUIState();
  }

  clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  completeFocusSprint() {
    this.clearInterval();
    this.mode = 'break';
    if (this.audioSynthesizer) {
      this.audioSynthesizer.playRewardChime();
    }

    if (this.onFocusComplete) {
      this.onFocusComplete(this.focusDurationMinutes);
    }

    this.showRandomBreakCard();
  }

  showRandomBreakCard() {
    const randomIndex = Math.floor(Math.random() * MOVEMENT_BREAKS.length);
    this.activeBreakCard = MOVEMENT_BREAKS[randomIndex];
    this.renderBreakModal(this.activeBreakCard);

    if (this.onBreakTriggered) {
      this.onBreakTriggered(this.activeBreakCard);
    }
  }

  cycleBreakCard() {
    const currentId = this.activeBreakCard ? this.activeBreakCard.id : '';
    const pool = MOVEMENT_BREAKS.filter(b => b.id !== currentId);
    this.activeBreakCard = pool[Math.floor(Math.random() * pool.length)];
    this.renderBreakModal(this.activeBreakCard);
    if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(700, 'triangle');
  }

  renderBreakModal(card) {
    if (!this.modalEl) return;

    const titleEl = document.getElementById('break-card-title');
    const badgeEl = document.getElementById('break-card-badge');
    const instructionEl = document.getElementById('break-card-instruction');
    const benefitEl = document.getElementById('break-card-benefit');
    const durationEl = document.getElementById('break-card-duration');

    if (titleEl) titleEl.textContent = card.title;
    if (badgeEl) {
      badgeEl.className = `px-2.5 py-1 rounded-full text-xs font-semibold border ${card.badgeColor}`;
      badgeEl.textContent = card.type.toUpperCase();
    }
    if (instructionEl) instructionEl.textContent = card.instruction;
    if (benefitEl) benefitEl.textContent = card.neuroBenefit;
    if (durationEl) durationEl.textContent = `${card.durationSeconds}s Break`;

    this.modalEl.classList.remove('hidden');
    this.modalEl.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  }

  dismissBreakModal() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
      this.modalEl.classList.remove('flex');
    }
    this.startFocus(this.focusDurationMinutes);
  }

  updateDisplay() {
    const mins = Math.floor(this.timeLeftSeconds / 60);
    const secs = this.timeLeftSeconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (this.displayEl) {
      this.displayEl.textContent = formatted;
    }
  }

  updateUIState() {
    if (this.toggleBtn) {
      if (this.mode === 'focus') {
        this.toggleBtn.innerHTML = `<i data-lucide="pause" class="w-4 h-4 text-amber-500"></i><span class="ml-1 text-xs">Pause</span>`;
      } else {
        this.toggleBtn.innerHTML = `<i data-lucide="play" class="w-4 h-4 text-emerald-500"></i><span class="ml-1 text-xs">Focus</span>`;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }
}
