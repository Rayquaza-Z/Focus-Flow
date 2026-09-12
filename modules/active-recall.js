/**
 * Active Recall & Engagement Module for ADHD PDF Reader
 * Features:
 * 1. Smart "Pause & Test" Micro-Quiz Gating (with source sentence highlighting)
 * 2. Interactive Margin Scaffolding (2-4 word concept anchors)
 * 3. Subtle Dopamine Micro-Rewards (non-intrusive border glows and micro-XP)
 */

export class ActiveRecallEngine {
  constructor(options = {}) {
    this.audioSynthesizer = options.audioSynthesizer || null;
    this.gamification = options.gamification || null;
    this.onQuizPass = options.onQuizPass || null;
  }

  /**
   * Generates a 1-question multiple-choice micro-quiz from chunk/paragraph text
   * using rule-based syntactic extraction (definitions, cause-and-effect, lists)
   */
  generateMicroQuiz(text) {
    if (!text || text.length < 40) return null;

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let candidateSentence = '';
    let questionType = 'definition';
    let term = '';
    let fact = '';

    // Look for definitions or key concepts: "X is Y", "X includes Y", "X: Y"
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.includes(' is ') || trimmed.includes(' are ') || trimmed.includes(' refers to ') || trimmed.includes(' defined as ')) {
        const parts = trimmed.split(/\s+is\s+|\s+are\s+|\s+refers to\s+|\s+defined as\s+/);
        if (parts.length >= 2 && parts[0].length < 45 && parts[1].length > 15) {
          term = parts[0].replace(/^[-•*0-9.\s]+/, '').trim();
          fact = parts[1].replace(/[.!?]+$/, '').trim();
          candidateSentence = trimmed;
          questionType = 'definition';
          break;
        }
      } else if (trimmed.includes(':') && trimmed.split(':')[0].length < 40) {
        const parts = trimmed.split(':');
        term = parts[0].replace(/^[-•*0-9.\s]+/, '').trim();
        fact = parts.slice(1).join(':').trim();
        candidateSentence = trimmed;
        questionType = 'definition';
        break;
      }
    }

    // Fallback to cloze key phrase extraction
    if (!term) {
      for (const s of sentences) {
        const words = s.trim().split(/\s+/);
        if (words.length >= 6) {
          candidateSentence = s.trim();
          // Pick a significant content word (length >= 5)
          const contentWords = words.filter(w => w.length >= 5 && !['which', 'their', 'there', 'about', 'these', 'those', 'could', 'would', 'should'].includes(w.toLowerCase()));
          if (contentWords.length > 0) {
            term = contentWords[0].replace(/[^a-zA-Z0-9]/g, '');
            fact = candidateSentence;
            questionType = 'cloze';
            break;
          }
        }
      }
    }

    if (!term || !candidateSentence) return null;

    let question = '';
    let correctAnswer = '';
    let distractors = [];

    if (questionType === 'definition') {
      question = `What is the primary role or definition associated with "${term}"?`;
      correctAnswer = fact.length > 90 ? fact.substring(0, 85) + '...' : fact;
      distractors = [
        'It increases cognitive load and causes task avoidance.',
        'A redundant mechanism with no clinical significance in ADHD.',
        'An isolated symptom unrelated to executive functioning.'
      ];
    } else {
      question = `Complete the concept from this section: "${candidateSentence.replace(new RegExp('\\b' + term + '\\b', 'i'), '______')}"`;
      correctAnswer = term;
      distractors = ['Inhibition', 'Working Memory', 'Saccadic Pacing', 'Neural Routing'].filter(w => w.toLowerCase() !== term.toLowerCase()).slice(0, 3);
    }

    // Shuffle options
    const optionsList = [
      { text: correctAnswer, correct: true },
      ...distractors.slice(0, 3).map(d => ({ text: d, correct: false }))
    ].sort(() => Math.random() - 0.5);

    return {
      question,
      options: optionsList,
      sourceSentence: candidateSentence,
      term
    };
  }

  /**
   * Renders the interactive micro-quiz component into a target DOM node
   */
  renderQuizCard(containerEl, quizData, onAnswered) {
    if (!containerEl || !quizData) return;

    containerEl.innerHTML = `
      <div class="micro-quiz-box p-4 bg-[var(--hw-bg-inset)] border-3 border-[var(--hw-border)] rounded-[4px] shadow-[var(--hw-shadow-hard)] space-y-3 my-3">
        <div class="flex items-center justify-between border-b border-[var(--hw-border)] pb-2">
          <div class="flex items-center space-x-2">
            <span class="hw-led hw-led-orange active"></span>
            <span class="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--hw-text-secondary)]">ACTIVE RECALL // MICRO-CHECK</span>
          </div>
          <span class="font-mono text-[10px] font-bold text-[var(--hw-amber)] bg-[var(--hw-bg-panel)] px-2 py-0.5 border border-[var(--hw-border)] rounded-[2px]">+25 XP</span>
        </div>

        <p class="font-mono text-xs font-bold text-[var(--hw-text-primary)] leading-snug">
          ${quizData.question}
        </p>

        <div class="space-y-1.5" id="micro-quiz-options">
          ${quizData.options.map((opt, idx) => `
            <button class="quiz-option-btn hw-btn w-full text-left p-2.5 bg-[var(--hw-bg-panel)] text-xs font-mono font-medium text-[var(--hw-text-primary)] flex items-center justify-between group" data-correct="${opt.correct}">
              <span class="flex-1">${opt.text}</span>
              <span class="w-4 h-4 rounded-[2px] border border-[var(--hw-border)] bg-[var(--hw-bg-inset)] flex items-center justify-center font-mono text-[10px] ml-2 font-bold">
                ${String.fromCharCode(65 + idx)}
              </span>
            </button>
          `).join('')}
        </div>

        <div id="quiz-feedback-area" class="hidden font-mono text-[11px] rounded-[2px] p-2.5 border-2"></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const optionsButtons = containerEl.querySelectorAll('.quiz-option-btn');
    const feedbackArea = containerEl.querySelector('#quiz-feedback-area');

    optionsButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.correct === 'true';
        optionsButtons.forEach(b => b.disabled = true);

        if (isCorrect) {
          btn.classList.add('bg-emerald-500/20', 'border-emerald-500', 'text-emerald-700', 'dark:text-emerald-300');
          feedbackArea.className = 'text-xs rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between';
          feedbackArea.innerHTML = `
            <span>✨ <strong>Spot on!</strong> Active recall strengthens your working memory circuits.</span>
            <span class="font-bold">+25 XP</span>
          `;
          feedbackArea.classList.remove('hidden');

          if (this.audioSynthesizer) this.audioSynthesizer.playRewardChime();
          if (this.gamification) this.gamification.addXP(25, 'Micro-Quiz Passed');

          setTimeout(() => {
            if (onAnswered) onAnswered(true);
          }, 900);
        } else {
          btn.classList.add('bg-rose-500/20', 'border-rose-500', 'text-rose-700', 'dark:text-rose-300');
          feedbackArea.className = 'text-xs rounded-xl p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 space-y-2';
          feedbackArea.innerHTML = `
            <div>
              <p>🔍 <strong>Key Context:</strong> "${quizData.sourceSentence}"</p>
            </div>
            <button id="quiz-retry-btn" class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition">
              Try Again
            </button>
          `;
          feedbackArea.classList.remove('hidden');

          if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(400, 'square', 0.08);

          // Highlight source text in reader
          ActiveRecallEngine.highlightSourceInReader(quizData.sourceSentence);

          const retryBtn = feedbackArea.querySelector('#quiz-retry-btn');
          if (retryBtn) {
            retryBtn.addEventListener('click', () => {
              optionsButtons.forEach(b => {
                b.disabled = false;
                b.classList.remove('bg-rose-500/20', 'border-rose-500', 'text-rose-700', 'dark:text-rose-300');
              });
              feedbackArea.classList.add('hidden');
            });
          }
        }
      });
    });
  }

  static highlightSourceInReader(sentenceText) {
    const textLayer = document.querySelector('.text-layer') || document.getElementById('chunking-view-container');
    if (!textLayer) return;

    // Remove any previous highlight
    document.querySelectorAll('.active-recall-highlight').forEach(el => {
      el.classList.remove('active-recall-highlight');
    });

    // Add gentle pulse border to reader container
    const pageWrapper = document.querySelector('.pdf-page-wrapper') || textLayer;
    if (pageWrapper) {
      pageWrapper.classList.add('source-attention-pulse');
      setTimeout(() => pageWrapper.classList.remove('source-attention-pulse'), 3500);
    }
  }

  /**
   * Parses page text into concise 2-4 word margin scaffolding tags
   */
  static extractMarginScaffolds(pageText) {
    if (!pageText || pageText.length < 50) return [];

    const paragraphs = pageText.split(/\n\s*\n|\.\s{2,}/).map(p => p.trim()).filter(p => p.length > 30);
    const scaffolds = [];

    paragraphs.forEach((p, idx) => {
      // Find headings or leading key terms
      const match = p.match(/^([A-Z0-9\s:—-]{3,35})(?::|\.|\n|-)/);
      let anchor = '';

      if (match && match[1].trim().split(/\s+/).length <= 4) {
        anchor = match[1].trim();
      } else {
        // Extract top 3 content words
        const words = p.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => 
          w.length >= 4 && !['this', 'that', 'with', 'from', 'have', 'were', 'which', 'their', 'other', 'these'].includes(w.toLowerCase())
        );
        anchor = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      if (anchor) {
        scaffolds.push({
          id: `scaffold-${idx}`,
          text: anchor,
          snippet: p.substring(0, 80) + '...',
          paragraphIndex: idx
        });
      }
    });

    return scaffolds.slice(0, 6);
  }

  /**
   * Subtle Dopamine Feedback: Triggers gentle non-intrusive glow ring on completion
   */
  static triggerSubtleReward(element, xpGained = 15) {
    if (!element) return;
    element.classList.add('subtle-dopamine-glow');
    setTimeout(() => {
      element.classList.remove('subtle-dopamine-glow');
    }, 1800);
  }
}
