/**
 * Dual Focus Workspace Module for ADHD PDF Reader (Cassette Futurism Index-Card Filing Tray)
 * Supports Combined ADHD multitasking reduction by providing a synchronized side-by-side workspace:
 * - Smart Notes with Markdown & Local Storage persistence
 * - Priority-tagged Action Item Checklist (High/Med/Low)
 * - Micro-Flashcard generator & Comprehension Check
 * - Automated Page Summary & Key Takeaways
 */

import { StorageManager } from './storage.js';

export class DualWorkspace {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('dual-workspace-container');
    this.audioSynthesizer = options.audioSynthesizer || null;
    this.onTaskCompleted = options.onTaskCompleted || null;

    this.activeTab = 'notes'; // 'notes', 'checklist', 'flashcards', 'summary'
    this.docId = 'default';
    this.currentPageText = '';
    this.currentPageNumber = 1;

    this.notes = '';
    this.checklist = [];
    this.flashcards = [];

    this.init();
  }

  init() {
    this.loadData();
    this.render();
  }

  setDocument(docId) {
    this.docId = docId;
    this.loadData();
    this.render();
  }

  setPageContent(pageNum, text) {
    this.currentPageNumber = pageNum;
    this.currentPageText = text;
    this.generateFlashcardsAndSummary(text);
    if (this.activeTab === 'flashcards' || this.activeTab === 'summary') {
      this.render();
    }
  }

  loadData() {
    const loadedNotes = StorageManager.getNotes(this.docId);
    this.notes = Array.isArray(loadedNotes) ? loadedNotes.join('\n') : (loadedNotes || '');
    this.checklist = StorageManager.getChecklist(this.docId);
  }

  saveNotes(text) {
    this.notes = text;
    StorageManager.saveNotes(this.docId, text);
  }

  generateFlashcardsAndSummary(text) {
    if (!text || text.length < 50) {
      this.flashcards = [];
      this.summary = 'No content available on this page to summarize.';
      return;
    }

    // Extract key sentences and concept pairs
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const cards = [];

    sentences.forEach((s) => {
      const trimmed = s.trim();
      if (trimmed.includes(':') || trimmed.includes(' - ') || trimmed.includes(' is ') || trimmed.includes(' are ')) {
        const parts = trimmed.split(/:\s*|\s+-\s+|\s+is\s+|\s+are\s+/);
        if (parts.length >= 2 && parts[0].length < 60 && parts[1].length > 15) {
          cards.push({
            front: parts[0].trim(),
            back: parts.slice(1).join(' ').trim(),
            flipped: false
          });
        }
      }
    });

    if (cards.length === 0) {
      cards.push({
        front: `Key Concept on Page ${this.currentPageNumber}`,
        back: sentences[0] || text.substring(0, 150),
        flipped: false
      });
    }

    this.flashcards = cards.slice(0, 6);

    const cleanSentences = sentences.map(s => s.trim()).filter(s => s.length > 25);
    this.summary = cleanSentences.slice(0, 4).map(s => `• ${s}`).join('\n\n');
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="flex flex-col h-full bg-[var(--hw-bg-panel)]">
        <!-- Physical Index Card Filing Tabs Header -->
        <div class="index-card-header">
          <button id="ws-tab-notes" class="index-tab ${this.activeTab === 'notes' ? 'active' : ''}">Notes</button>
          <button id="ws-tab-checklist" class="index-tab ${this.activeTab === 'checklist' ? 'active' : ''}">Tasks</button>
          <button id="ws-tab-flashcards" class="index-tab ${this.activeTab === 'flashcards' ? 'active' : ''}">Cards</button>
          <button id="ws-tab-summary" class="index-tab ${this.activeTab === 'summary' ? 'active' : ''}">Summary</button>
        </div>

        <!-- Filing Tray Body -->
        <div id="ws-tab-content" class="flex-1 p-3 overflow-y-auto bg-[var(--hw-bg-panel)]">
          <!-- Dynamic Content -->
        </div>
      </div>
    `;

    this.renderActiveTabContent();
    this.bindTabEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  bindTabEvents() {
    ['notes', 'checklist', 'flashcards', 'summary'].forEach(tab => {
      const btn = document.getElementById(`ws-tab-${tab}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.activeTab = tab;
          if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(600, 'triangle');
          this.render();
        });
      }
    });
  }

  renderActiveTabContent() {
    const target = document.getElementById('ws-tab-content');
    if (!target) return;

    if (this.activeTab === 'notes') {
      target.innerHTML = `
        <div class="flex flex-col h-full space-y-2.5">
          <div class="flex items-center justify-between font-mono text-[11px] text-[var(--hw-text-secondary)]">
            <span>Notes (saved in this browser)</span>
            <button id="copy-notes-btn" class="hw-btn hw-btn-sm text-[10px] py-0.5 px-1.5">
              <i data-lucide="copy" class="w-3 h-3"></i>
              <span>COPY</span>
            </button>
          </div>
          <textarea id="ws-notes-editor" placeholder="Jot quotes, questions, or reminders..." class="flex-1 w-full p-3 bg-[var(--hw-bg-inset)] border-2 border-[var(--hw-border)] rounded-[2px] text-[var(--hw-text-primary)] text-sm focus:outline-none focus:border-[var(--hw-orange)] resize-none leading-relaxed min-h-[300px] shadow-[var(--hw-shadow-inset-sm)]">${this.notes}</textarea>
          <div class="text-[10px] text-[var(--hw-text-muted)] flex items-center justify-between">
            <span>Stays on this device</span>
            <button id="insert-quote-btn" class="text-[var(--hw-orange)] hover:underline font-bold">+ Quote page ${this.currentPageNumber}</button>
          </div>
        </div>
      `;

      const editor = document.getElementById('ws-notes-editor');
      if (editor) {
        editor.addEventListener('input', (e) => this.saveNotes(e.target.value));
      }

      const copyBtn = document.getElementById('copy-notes-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(this.notes);
          copyBtn.innerHTML = `<span>COPIED</span>`;
          setTimeout(() => { this.render(); }, 1500);
        });
      }

      const insertBtn = document.getElementById('insert-quote-btn');
      if (insertBtn) {
        insertBtn.addEventListener('click', () => {
          const selection = window.getSelection().toString().trim();
          const quote = selection || (this.currentPageText.substring(0, 120) + '...');
          editor.value += `\n\n> [PG ${this.currentPageNumber}]: "${quote}"\n`;
          this.saveNotes(editor.value);
        });
      }
    } else if (this.activeTab === 'checklist') {
      let itemsHtml = this.checklist.map((item, idx) => {
        return `
          <div class="flex items-start space-x-2.5 p-2.5 bg-[var(--hw-bg-inset)] border-2 border-[var(--hw-border)] rounded-[2px] shadow-[var(--hw-shadow-hard-sm)] transition ${item.completed ? 'opacity-50 line-through' : ''}">
            <input type="checkbox" data-task-idx="${idx}" class="task-checkbox mt-0.5 w-3.5 h-3.5 rounded-[1px] accent-[var(--hw-orange)] cursor-pointer" ${item.completed ? 'checked' : ''} />
            <div class="flex-1">
              <p class="font-mono text-xs font-semibold text-[var(--hw-text-primary)] leading-tight">${item.text}</p>
              <div class="flex items-center space-x-2 mt-1">
                <span class="font-mono text-[9px] font-bold px-1 py-0.2 border border-[var(--hw-border)] rounded-[1px] bg-[var(--hw-bg-panel)]">${item.priority.toUpperCase()}</span>
              </div>
            </div>
            <button data-delete-idx="${idx}" class="delete-task-btn text-[var(--hw-text-muted)] hover:text-rose-500 p-0.5">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
            </button>
          </div>
        `;
      }).join('');

      target.innerHTML = `
        <div class="flex flex-col h-full space-y-3">
          <form id="add-task-form" class="flex space-x-1.5">
            <input id="new-task-input" type="text" placeholder="Add a task..." class="flex-1 px-2.5 py-1.5 bg-[var(--hw-bg-inset)] border-2 border-[var(--hw-border)] rounded-[2px] text-xs text-[var(--hw-text-primary)] focus:outline-none focus:border-[var(--hw-orange)] shadow-[var(--hw-shadow-inset-sm)]" required />
            <select id="new-task-priority" class="hw-select text-[11px] py-1 px-1.5">
              <option value="high">HI</option>
              <option value="medium" selected>MED</option>
              <option value="low">LO</option>
            </select>
            <button type="submit" class="hw-btn hw-btn-sm hw-btn-orange">
              ADD
            </button>
          </form>

          <div class="space-y-2 flex-1 overflow-y-auto">
            ${itemsHtml || '<p class="text-sm text-[var(--hw-text-muted)] text-center py-6">No tasks yet.</p>'}
          </div>
        </div>
      `;

      const form = document.getElementById('add-task-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = document.getElementById('new-task-input');
          const priority = document.getElementById('new-task-priority');
          if (input.value.trim()) {
            this.checklist.unshift({
              id: Date.now().toString(),
              text: input.value.trim(),
              priority: priority.value,
              completed: false
            });
            StorageManager.saveChecklist(this.docId, this.checklist);
            input.value = '';
            this.render();
          }
        });
      }

      target.querySelectorAll('.task-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.taskIdx);
          this.checklist[idx].completed = e.target.checked;
          StorageManager.saveChecklist(this.docId, this.checklist);
          if (e.target.checked) {
            if (this.audioSynthesizer) this.audioSynthesizer.playRewardChime();
            if (this.onTaskCompleted) this.onTaskCompleted();
          }
          this.render();
        });
      });

      target.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.deleteIdx);
          this.checklist.splice(idx, 1);
          StorageManager.saveChecklist(this.docId, this.checklist);
          this.render();
        });
      });
    } else if (this.activeTab === 'flashcards') {
      if (this.flashcards.length === 0) {
        target.innerHTML = `
          <div class="text-center py-12 font-mono text-[11px] text-[var(--hw-text-muted)]">
            <p>No cards for this page yet. Open a PDF with more text.</p>
          </div>
        `;
      } else {
        const cardsHtml = this.flashcards.map((card, idx) => `
          <div class="flashcard-item p-3.5 bg-[var(--hw-bg-inset)] border-2 border-[var(--hw-border)] rounded-[2px] cursor-pointer shadow-[var(--hw-shadow-hard-sm)] transition select-none" data-card-idx="${idx}">
            <div class="flex items-center justify-between font-mono text-[10px] font-bold text-[var(--hw-orange)] mb-1.5">
              <span>CARD 0${idx + 1}</span>
              <span class="text-[9px] text-[var(--hw-text-muted)]">${card.flipped ? '[SHOW FRONT]' : '[REVEAL ANSWER]'}</span>
            </div>
            <div class="font-mono text-xs font-semibold text-[var(--hw-text-primary)] leading-snug">
              ${card.flipped ? `<span class="text-emerald-600 dark:text-emerald-400">💡 ${card.back}</span>` : `❓ ${card.front}`}
            </div>
          </div>
        `).join('');

        target.innerHTML = `
          <div class="space-y-2.5">
            <div class="text-[10px] font-bold text-[var(--hw-text-muted)] uppercase">Cards from page ${this.currentPageNumber}</div>
            ${cardsHtml}
          </div>
        `;

        target.querySelectorAll('.flashcard-item').forEach(cardEl => {
          cardEl.addEventListener('click', () => {
            const idx = parseInt(cardEl.dataset.cardIdx);
            this.flashcards[idx].flipped = !this.flashcards[idx].flipped;
            if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(750, 'sine', 0.04);
            this.render();
          });
        });
      }
    } else if (this.activeTab === 'summary') {
      target.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-[var(--hw-text-muted)] uppercase">Page ${this.currentPageNumber} summary</span>
          </div>
          <div class="p-3 bg-[var(--hw-bg-inset)] border-2 border-[var(--hw-border)] rounded-[2px] font-mono text-xs text-[var(--hw-text-primary)] leading-relaxed whitespace-pre-line shadow-[var(--hw-shadow-inset-sm)]">
            ${this.summary || 'Nothing to summarize on this page.'}
          </div>
        </div>
      `;
    }
  }
}
