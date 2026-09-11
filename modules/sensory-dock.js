/**
 * Sensory Dock Module for ADHD PDF Reader (Cassette Futurism Pocket Synthesizer)
 * Provides tactile sensory toys to channel hyperactive motor restlessness:
 * 1. Bubble Wrap Popper with audio feedback
 * 2. Mechanical Tactile Switch Clicker (Braun / TE inspired)
 * 3. Kinetic Gravity Particle Flow Canvas
 * 4. Guided 4-7-8 Breathing Circle
 */

export class SensoryDock {
  constructor(containerId, audioSynthesizer) {
    this.container = document.getElementById(containerId);
    this.audio = audioSynthesizer;
    this.activeTool = 'bubbles'; // 'bubbles', 'switch', 'particles', 'breathing'
    this.particleAnimationId = null;
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    this.mouse = { x: 0, y: 0, isDown: false };
    this.clickCount = 0;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.renderDockUI();
    this.setupEventListeners();
  }

  renderDockUI() {
    this.container.innerHTML = `
      <div class="flex items-center justify-between p-3 border-b-2 border-[var(--hw-border)] bg-[var(--hw-bg-inset)]">
        <div class="flex items-center space-x-2">
          <span class="hw-led hw-led-orange active"></span>
          <span class="font-mono font-bold text-xs uppercase tracking-wider text-[var(--hw-text-primary)]">TACTILE SYNTH DOCK</span>
          <span id="fidget-session-timer" class="px-2 py-0.5 rounded-[2px] bg-[var(--hw-bg-panel)] font-mono text-[10px] font-bold text-[var(--hw-text-secondary)] border border-[var(--hw-border)]" title="90s Sensory Reset Timer">90s</span>
        </div>
        <div class="flex items-center space-x-1 bg-[var(--hw-bg-panel)] p-0.5 rounded-[3px] border-2 border-[var(--hw-border)]">
          <button id="sensory-tab-bubbles" class="hw-btn hw-btn-sm ${this.activeTool === 'bubbles' ? 'hw-btn-orange' : ''}">POP-IT</button>
          <button id="sensory-tab-switch" class="hw-btn hw-btn-sm ${this.activeTool === 'switch' ? 'hw-btn-orange' : ''}">SWITCH</button>
          <button id="sensory-tab-particles" class="hw-btn hw-btn-sm ${this.activeTool === 'particles' ? 'hw-btn-orange' : ''}">ZEN FLOW</button>
          <button id="sensory-tab-breathing" class="hw-btn hw-btn-sm ${this.activeTool === 'breathing' ? 'hw-btn-orange' : ''}">BREATHE</button>
        </div>
      </div>

      <div id="sensory-tool-container" class="p-4 flex flex-col items-center justify-center min-h-[220px] bg-[var(--hw-bg-panel)]">
        <!-- Active tool rendered here -->
      </div>
    `;

    this.renderActiveTool();
    if (window.lucide) window.lucide.createIcons();
  }

  renderActiveTool() {
    const target = document.getElementById('sensory-tool-container');
    if (!target) return;

    if (this.particleAnimationId) {
      cancelAnimationFrame(this.particleAnimationId);
      this.particleAnimationId = null;
    }

    if (this.activeTool === 'bubbles') {
      const colors = ['bg-[#e0531c]', 'bg-[#d97706]', 'bg-[#16a34a]', 'bg-[#0284c7]', 'bg-[#7c3aed]', 'bg-[#db2777]'];
      let bubblesHtml = '<div class="grid grid-cols-6 gap-2 max-w-[280px] p-3 bg-[var(--hw-bg-inset)] rounded-[3px] border-2 border-[var(--hw-border)] shadow-[var(--hw-shadow-inset-sm)]">';
      for (let i = 0; i < 18; i++) {
        const color = colors[i % colors.length];
        bubblesHtml += `<button class="bubble-pop-cell w-9 h-9 ${color} flex items-center justify-center text-white/90 font-mono text-[9px] font-bold" data-bubble-id="${i}">${i+1}</button>`;
      }
      bubblesHtml += `</div>
        <div class="mt-3 flex items-center justify-between w-full max-w-[280px] font-mono text-xs text-[var(--hw-text-secondary)]">
          <span>POPPED: <strong id="bubble-count" class="text-[var(--hw-text-primary)]">0</strong>/18</span>
          <button id="reset-bubbles-btn" class="hw-btn hw-btn-sm">RESET ALL</button>
        </div>`;
      target.innerHTML = bubblesHtml;
      this.attachBubbleEvents();
    } else if (this.activeTool === 'switch') {
      target.innerHTML = `
        <div class="flex flex-col items-center justify-center py-2 space-y-3">
          <div class="p-5 bg-[var(--hw-bg-inset)] rounded-[4px] border-3 border-[var(--hw-border)] shadow-[var(--hw-shadow-hard)] flex flex-col items-center">
            <button id="mech-clicker-button" class="synth-key w-24 h-24 rounded-[4px] bg-[var(--hw-orange)] border-2 border-[var(--hw-border)] flex flex-col items-center justify-center cursor-pointer select-none">
              <span class="text-white font-mono font-extrabold text-base tracking-wider pointer-events-none">CLICK</span>
              <span class="text-white/80 text-[9px] font-mono pointer-events-none">TACTILE</span>
            </button>
          </div>
          <div class="flex items-center space-x-2 font-mono text-xs text-[var(--hw-text-secondary)]">
            <span>TALLY: <strong id="mech-click-counter" class="text-[var(--hw-orange)] text-sm font-bold">0</strong></span>
          </div>
        </div>
      `;
      this.attachSwitchEvents();
    } else if (this.activeTool === 'particles') {
      target.innerHTML = `
        <div class="relative w-full h-[200px] rounded-[3px] overflow-hidden bg-[var(--hw-bg-inset)] border-2 border-[var(--hw-border)] shadow-[var(--hw-shadow-inset-sm)]">
          <canvas id="zen-particle-canvas" class="w-full h-full cursor-crosshair"></canvas>
          <div class="absolute bottom-2 left-3 font-mono text-[10px] text-[var(--hw-text-muted)] pointer-events-none bg-[var(--hw-bg-panel)] px-1.5 py-0.5 border border-[var(--hw-border)]">
            POINTER GRAVITY OSCILLATOR
          </div>
        </div>
      `;
      this.initParticleCanvas();
    } else if (this.activeTool === 'breathing') {
      target.innerHTML = `
        <div class="flex flex-col items-center justify-center py-2 space-y-4">
          <div class="relative w-32 h-32 flex items-center justify-center">
            <div class="breathing-orb absolute inset-0 rounded-full bg-[var(--hw-orange)] opacity-60 border-2 border-[var(--hw-border)]"></div>
            <div class="relative z-10 text-center font-mono font-bold text-white text-xs drop-shadow">
              <div id="breath-stage-text">4s Inhale</div>
              <div class="text-[9px] font-normal text-white/80">4-7-8 CADENCE</div>
            </div>
          </div>
          <p class="font-mono text-[11px] text-[var(--hw-text-secondary)] text-center max-w-xs uppercase">
            Sync respiration to regulate autonomic nervous system.
          </p>
        </div>
      `;
      this.initBreathingTimer();
    }
  }

  setupEventListeners() {
    ['bubbles', 'switch', 'particles', 'breathing'].forEach(tool => {
      const btn = document.getElementById(`sensory-tab-${tool}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.activeTool = tool;
          this.renderDockUI();
        });
      }
    });
  }

  attachBubbleEvents() {
    let poppedCount = 0;
    const countDisplay = document.getElementById('bubble-count');
    const bubbles = document.querySelectorAll('.bubble-pop-cell');

    bubbles.forEach(b => {
      b.addEventListener('click', () => {
        b.classList.toggle('popped');
        if (this.audio) this.audio.playBubblePop();
        poppedCount = document.querySelectorAll('.bubble-pop-cell.popped').length;
        if (countDisplay) countDisplay.textContent = poppedCount;

        if (poppedCount === bubbles.length && this.audio) {
          this.audio.playRewardChime();
        }
      });
    });

    const resetBtn = document.getElementById('reset-bubbles-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        bubbles.forEach(b => b.classList.remove('popped'));
        if (countDisplay) countDisplay.textContent = '0';
        if (this.audio) this.audio.playTactileClick(600, 'triangle');
      });
    }
  }

  attachSwitchEvents() {
    const btn = document.getElementById('mech-clicker-button');
    const countEl = document.getElementById('mech-click-counter');
    let clicks = 0;

    if (btn) {
      btn.addEventListener('mousedown', () => {
        clicks++;
        if (countEl) countEl.textContent = clicks;
        if (this.audio) {
          const pitches = [720, 840, 960, 1100];
          const pitch = pitches[Math.floor(Math.random() * pitches.length)];
          this.audio.playTactileClick(pitch, 'square', 0.035);
        }
      });

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.dispatchEvent(new MouseEvent('mousedown'));
      });
    }
  }

  initParticleCanvas() {
    const canvas = document.getElementById('zen-particle-canvas');
    if (!canvas) return;

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio || 300;
    canvas.height = rect.height * window.devicePixelRatio || 200;

    const numParticles = 55;
    this.particles = [];
    for (let i = 0; i < numParticles; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2 + 1.5,
        color: '#eb5e28'
      });
    }

    const handlePointer = (e) => {
      const bounds = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - bounds.left) * (canvas.width / bounds.width);
      this.mouse.y = (e.clientY - bounds.top) * (canvas.height / bounds.height);
    };

    canvas.addEventListener('mousemove', handlePointer);
    canvas.addEventListener('mousedown', (e) => {
      this.mouse.isDown = true;
      handlePointer(e);
      if (this.audio) this.audio.playTactileClick(520, 'sine', 0.08);
      // Impulse burst
      this.particles.forEach(p => {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        p.vx += (dx / dist) * 7;
        p.vy += (dy / dist) * 7;
      });
    });

    window.addEventListener('mouseup', () => { this.mouse.isDown = false; });

    const animate = () => {
      this.ctx.fillStyle = 'rgba(20, 22, 26, 0.28)';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.particles.forEach(p => {
        if (this.mouse.x > 0 && this.mouse.y > 0) {
          const dx = this.mouse.x - p.x;
          const dy = this.mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160 && dist > 5) {
            p.vx += (dx / dist) * 0.15;
            p.vy += (dy / dist) * 0.15;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > canvas.width) { p.x = canvas.width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -1; }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      });

      this.particleAnimationId = requestAnimationFrame(animate);
    };

    animate();
  }

  initBreathingTimer() {
    const textEl = document.getElementById('breath-stage-text');
    if (!textEl) return;

    let cycle = 0;
    const stages = [
      { text: 'Inhale (4s)', duration: 4000 },
      { text: 'Hold (7s)', duration: 7000 },
      { text: 'Exhale (8s)', duration: 8000 }
    ];

    const runStage = () => {
      if (this.activeTool !== 'breathing') return;
      const cur = stages[cycle % stages.length];
      if (textEl) {
        textEl.textContent = cur.text;
      }
      cycle++;
      setTimeout(runStage, cur.duration);
    };

    runStage();
  }
}
