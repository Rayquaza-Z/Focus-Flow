/**
 * Text-to-Speech (TTS) Engine for ADHD PDF Reader
 * Powered by Web Speech API with real-time word and sentence boundary tracking.
 */

export class TTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 1.0;

    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;

    this.textChunks = [];
    this.currentChunkIndex = 0;
    this.currentWordIndex = 0;

    this.onWordBoundary = null;     // callback(wordInfo)
    this.onSentenceStart = null;    // callback(sentenceIndex, sentenceText)
    this.onStateChange = null;      // callback({ isPlaying, isPaused, currentChunkIndex, totalChunks })
    this.onEnd = null;

    this.initVoices();
  }

  initVoices() {
    const loadVoices = () => {
      this.voices = this.synth.getVoices().filter(v => v.lang.startsWith('en') || v.lang.startsWith('fr') || v.lang.startsWith('es') || v.lang.startsWith('de'));
      if (this.voices.length === 0) {
        this.voices = this.synth.getVoices();
      }
      // Prioritize natural or premium voices if available
      const preferred = this.voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Karen') || v.name.includes('Serena')) && v.lang.startsWith('en')
      );
      this.selectedVoice = preferred || this.voices[0] || null;
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  getAvailableVoices() {
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  setVoice(voiceURI) {
    const voice = this.voices.find(v => v.voiceURI === voiceURI || v.name === voiceURI);
    if (voice) {
      this.selectedVoice = voice;
    }
  }

  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(3.0, rate));
  }

  setText(fullText) {
    this.stop();
    // Clean and split text into manageable sentence-level chunks
    const cleaned = fullText.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) {
      this.textChunks = [];
      return;
    }

    // Split by sentence terminators (. ! ? \n)
    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    this.textChunks = sentences.map((s, idx) => ({
      index: idx,
      text: s.trim(),
      words: s.trim().split(/\s+/).filter(w => w.length > 0)
    })).filter(c => c.text.length > 0);

    this.currentChunkIndex = 0;
  }

  playFrom(chunkIndex = 0) {
    if (this.textChunks.length === 0) return;
    this.stop();

    this.currentChunkIndex = Math.max(0, Math.min(chunkIndex, this.textChunks.length - 1));
    this.isPlaying = true;
    this.isPaused = false;
    this.notifyState();
    this.speakCurrentChunk();
  }

  speakCurrentChunk() {
    if (!this.isPlaying || this.currentChunkIndex >= this.textChunks.length) {
      this.stop();
      if (this.onEnd) this.onEnd();
      return;
    }

    const chunk = this.textChunks[this.currentChunkIndex];
    if (this.onSentenceStart) {
      this.onSentenceStart(this.currentChunkIndex, chunk.text);
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    this.currentUtterance = utterance;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        // Determine which word index is being spoken
        const textUpToChar = chunk.text.substring(0, charIndex + (event.charLength || 1));
        const wordsUpToChar = textUpToChar.trim().split(/\s+/);
        const currentWordIdx = Math.max(0, wordsUpToChar.length - 1);
        const spokenWord = chunk.words[currentWordIdx] || '';

        if (this.onWordBoundary) {
          this.onWordBoundary({
            chunkIndex: this.currentChunkIndex,
            wordIndex: currentWordIdx,
            word: spokenWord,
            charIndex: charIndex,
            charLength: event.charLength || spokenWord.length
          });
        }
      }
    };

    utterance.onend = () => {
      if (this.isPlaying && !this.isPaused) {
        this.currentChunkIndex++;
        this.notifyState();
        this.speakCurrentChunk();
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('TTS error:', e);
      }
    };

    this.synth.speak(utterance);
  }

  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.notifyState();
    }
  }

  resume() {
    if (this.isPlaying && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.notifyState();
    }
  }

  togglePlayPause() {
    if (!this.isPlaying) {
      this.playFrom(this.currentChunkIndex || 0);
    } else if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  stop() {
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.notifyState();
  }

  nextSentence() {
    if (this.currentChunkIndex < this.textChunks.length - 1) {
      this.playFrom(this.currentChunkIndex + 1);
    }
  }

  prevSentence() {
    if (this.currentChunkIndex > 0) {
      this.playFrom(this.currentChunkIndex - 1);
    }
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        currentChunkIndex: this.currentChunkIndex,
        totalChunks: this.textChunks.length
      });
    }
  }
}
