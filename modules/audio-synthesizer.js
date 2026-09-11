/**
 * Audio Synthesizer Module for ADHD PDF Reader
 * Zero-dependency Web Audio API procedural sound engine:
 * - Deep Brown Noise (masks distractions, calms hyperactive ADHD restless nervous system)
 * - Pink & White Noise
 * - 40Hz Gamma & 10Hz Alpha Binaural Beats (stereo panned)
 * - Synthesized Soft Rain & Lo-Fi focus pulse
 */

export class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.nodes = {};
    this.isPlaying = false;
    this.masterGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Noise Generators (Brown, Pink, White) ---
  createNoiseBuffer(type = 'brown', seconds = 5) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastOutL = 0.0;
    let lastOutR = 0.0;

    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0;
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      if (type === 'brown') {
        // Brownian noise (integrate white noise)
        lastOutL = (lastOutL + 0.02 * whiteL) / 1.02;
        lastOutR = (lastOutR + 0.02 * whiteR) / 1.02;
        left[i] = lastOutL * 3.5;
        right[i] = lastOutR * 3.5;
      } else if (type === 'pink') {
        // Paul Kellet's filtered pink noise algorithm
        b0L = 0.99886 * b0L + whiteL * 0.0555179;
        b1L = 0.99332 * b1L + whiteL * 0.0750759;
        b2L = 0.96900 * b2L + whiteL * 0.1538520;
        b3L = 0.86650 * b3L + whiteL * 0.3104856;
        b4L = 0.55000 * b4L + whiteL * 0.5329522;
        b5L = -0.7616 * b5L - whiteL * 0.0168980;
        left[i] = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.11;
        b6L = whiteL * 0.115926;

        b0R = 0.99886 * b0R + whiteR * 0.0555179;
        b1R = 0.99332 * b1R + whiteR * 0.0750759;
        b2R = 0.96900 * b2R + whiteR * 0.1538520;
        b3R = 0.86650 * b3R + whiteR * 0.3104856;
        b4R = 0.55000 * b4R + whiteR * 0.5329522;
        b5R = -0.7616 * b5R - whiteR * 0.0168980;
        right[i] = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.11;
        b6R = whiteR * 0.115926;
      } else {
        // White noise
        left[i] = whiteL * 0.15;
        right[i] = whiteR * 0.15;
      }
    }
    return buffer;
  }

  startSound(soundId, volume = 0.5) {
    this.init();
    if (this.nodes[soundId]) {
      this.setVolume(soundId, volume);
      return;
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    gainNode.connect(this.masterGain);

    if (soundId === 'brown' || soundId === 'pink' || soundId === 'white') {
      const buffer = this.createNoiseBuffer(soundId);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Add gentle low-pass filter for smooth warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(soundId === 'brown' ? 450 : 2500, this.ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      source.start(0);

      this.nodes[soundId] = { source, gainNode, filter };
    } else if (soundId === 'binaural40' || soundId === 'binaural10') {
      // Binaural Beats: Base frequency + difference frequency sent to L/R channels
      const diff = soundId === 'binaural40' ? 40 : 10;
      const baseFreq = 200; // Carrier pitch

      const merger = this.ctx.createChannelMerger(2);

      // Left Channel
      const oscL = this.ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      const gainL = this.ctx.createGain();
      gainL.gain.setValueAtTime(0.3, this.ctx.currentTime);
      oscL.connect(gainL);
      gainL.connect(merger, 0, 0);

      // Right Channel
      const oscR = this.ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(baseFreq + diff, this.ctx.currentTime);
      const gainR = this.ctx.createGain();
      gainR.gain.setValueAtTime(0.3, this.ctx.currentTime);
      oscR.connect(gainR);
      gainR.connect(merger, 0, 1);

      merger.connect(gainNode);
      oscL.start(0);
      oscR.start(0);

      this.nodes[soundId] = { oscL, oscR, gainNode };
    } else if (soundId === 'rain') {
      // Gentle rain: pink noise through bandpass modulated by gentle LFO
      const buffer = this.createNoiseBuffer('pink', 4);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1000, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(0.8, this.ctx.currentTime);

      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(bandpass.frequency);

      source.connect(bandpass);
      bandpass.connect(gainNode);
      source.start(0);
      lfo.start(0);

      this.nodes[soundId] = { source, lfo, bandpass, gainNode };
    }
  }

  setVolume(soundId, volume) {
    if (this.nodes[soundId] && this.nodes[soundId].gainNode) {
      this.nodes[soundId].gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  stopSound(soundId) {
    if (this.nodes[soundId]) {
      try {
        const item = this.nodes[soundId];
        if (item.source) item.source.stop();
        if (item.oscL) item.oscL.stop();
        if (item.oscR) item.oscR.stop();
        if (item.lfo) item.lfo.stop();
        if (item.gainNode) item.gainNode.disconnect();
      } catch (e) {
        console.warn('Error stopping sound node', e);
      }
      delete this.nodes[soundId];
    }
  }

  stopAll() {
    Object.keys(this.nodes).forEach(id => this.stopSound(id));
  }

  // Play satisfying UI tactile click sound
  playTactileClick(pitch = 800, type = 'sine', duration = 0.04) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Play bubble pop sound
  playBubblePop() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    const startFreq = 400 + Math.random() * 300;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, now + 0.06);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Play level-up / achievement celebration chime
  playRewardChime() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.09;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }
}
