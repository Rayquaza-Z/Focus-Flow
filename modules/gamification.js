/**
 * Gamification & Dopamine Reward System for ADHD PDF Reader
 * Provides micro-rewards, XP points, reading streaks, and milestone celebration badges
 * to activate executive function and sustain reader motivation.
 */

import { StorageManager } from './storage.js';

export const BADGES = [
  { id: 'first_read', name: 'First Flight', desc: 'Opened your first study document', icon: 'book-open', xp: 20 },
  { id: 'bionic_reader', name: 'Bionic Eye', desc: 'Activated Bionic fixation reading', icon: 'zap', xp: 30 },
  { id: 'tts_explorer', name: 'Dual Earner', desc: 'Listened with synchronous TTS audio', icon: 'headphones', xp: 30 },
  { id: 'movement_hero', name: 'Rest Champion', desc: 'Completed a healthy movement break', icon: 'activity', xp: 50 },
  { id: 'task_finisher', name: 'Task Crusher', desc: 'Completed a priority reading goal', icon: 'check-circle-2', xp: 40 },
  { id: 'zen_master', name: 'Flow State', desc: 'Played Brown Noise / Binaural Beats', icon: 'sparkles', xp: 30 },
  { id: 'streak_master', name: 'Consistency King', desc: 'Maintained a 3-day focus streak', icon: 'flame', xp: 100 }
];

export class GamificationSystem {
  constructor(options = {}) {
    this.audioSynthesizer = options.audioSynthesizer || null;
    this.onReward = options.onReward || null;
    this.data = StorageManager.getGamification();

    this.checkDailyStreak();
    this.updateHeaderUI();
  }

  checkDailyStreak() {
    const today = new Date().toDateString();
    if (this.data.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (this.data.lastActiveDate === yesterday) {
        this.data.streak += 1;
      } else {
        this.data.streak = 1;
      }
      this.data.lastActiveDate = today;
      this.save();
    }
  }

  addXP(amount, reason = '') {
    const oldLevel = this.getLevel();
    this.data.xp += amount;
    const newLevel = this.getLevel();

    this.save();
    this.updateHeaderUI();

    if (newLevel > oldLevel) {
      this.celebrateLevelUp(newLevel);
    } else {
      this.showMiniToast(`+${amount} XP ${reason ? '· ' + reason : ''}`);
    }
  }

  getLevel() {
    return Math.floor(Math.sqrt(this.data.xp / 50)) + 1;
  }

  getLevelTitle(level) {
    const titles = [
      'Focus Novice',
      'Cognitive Explorer',
      'Bionic Reader',
      'Hyperfocus Dynamo',
      'Master of Flow',
      'Neuro Sovereign'
    ];
    return titles[Math.min(level - 1, titles.length - 1)] || 'Focus Grandmaster';
  }

  unlockBadge(badgeId) {
    if (!this.data.badges.includes(badgeId)) {
      this.data.badges.push(badgeId);
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) {
        this.addXP(badge.xp, `Badge: ${badge.name}`);
        this.celebrateBadge(badge);
      }
      this.save();
    }
  }

  recordPageRead() {
    this.data.pagesRead += 1;
    this.addXP(15, 'Page Completed');
    if (this.data.pagesRead >= 5) {
      this.unlockBadge('first_read');
    }
    this.save();
  }

  save() {
    StorageManager.saveGamification(this.data);
  }

  updateHeaderUI() {
    const xpDisplay = document.getElementById('header-xp-counter');
    const streakDisplay = document.getElementById('header-streak-counter');
    const levelDisplay = document.getElementById('header-level-badge');

    if (xpDisplay) xpDisplay.textContent = `${this.data.xp} XP`;
    if (streakDisplay) streakDisplay.textContent = `${this.data.streak}d`;
    if (levelDisplay) levelDisplay.textContent = `Lvl ${this.getLevel()}`;
  }

  showMiniToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-amber-400 text-xs font-bold shadow-2xl border border-amber-500/30 transform transition-all duration-300 translate-y-4 opacity-0';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  celebrateBadge(badge) {
    if (this.audioSynthesizer) this.audioSynthesizer.playRewardChime();
    if (window.confetti) {
      window.confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
    this.showMiniToast(`🏆 Unlocked: ${badge.name}!`);
  }

  celebrateLevelUp(level) {
    if (this.audioSynthesizer) this.audioSynthesizer.playRewardChime();
    if (window.confetti) {
      window.confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
    this.showMiniToast(`🎉 Leveled Up to Level ${level}: ${this.getLevelTitle(level)}!`);
  }

  openBadgesModal() {
    const modal = document.getElementById('gamification-modal');
    if (!modal) return;

    const listEl = document.getElementById('badges-list-container');
    if (listEl) {
      listEl.innerHTML = BADGES.map(b => {
        const unlocked = this.data.badges.includes(b.id);
        return `
          <div class="flex items-center space-x-3 p-2.5 rounded-[2px] border-2 border-[var(--hw-border)] ${unlocked ? 'bg-[var(--hw-bg-inset)] shadow-[var(--hw-shadow-hard-sm)]' : 'bg-[var(--hw-bg-panel)] opacity-40'}">
            <div class="w-8 h-8 rounded-[2px] flex items-center justify-center border border-[var(--hw-border)] ${unlocked ? 'bg-[var(--hw-orange)] text-white' : 'bg-[var(--hw-bg-inset)] text-[var(--hw-text-muted)]'}">
              <i data-lucide="${b.icon}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="font-mono text-xs font-bold text-[var(--hw-text-primary)] uppercase">${b.name}</h4>
                <span class="font-mono text-[10px] font-bold text-[var(--hw-amber)]">+${b.xp} XP</span>
              </div>
              <p class="font-mono text-[10px] text-[var(--hw-text-secondary)]">${b.desc}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  }
}
