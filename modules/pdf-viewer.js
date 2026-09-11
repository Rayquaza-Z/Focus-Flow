/**
 * PDF Viewer Module for ADHD PDF Reader
 * Powered by PDF.js with high-DPI canvas rendering, synchronized text layers,
 * bionic reading overlays, and reading ruler alignment.
 */

import { BionicEngine } from './bionic-engine.js';
import { ActiveRecallEngine } from './active-recall.js';

export class PDFViewer {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('pdf-viewport');
    this.rulerOverlay = options.rulerOverlay || document.getElementById('reading-ruler-overlay');
    this.audioSynthesizer = options.audioSynthesizer || null;

    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.scale = 1.25;
    this.bionicMode = false;
    this.bionicIntensity = 2;
    this.rulerMode = 'mask'; // 'mask' (spotlight), 'line' (laser bar)
    this.rulerEnabled = false;
    this.rulerHeight = 54;

    this.pageTextMap = new Map(); // pageNum -> string
    this.renderedPages = new Map();

    this.onPageChange = options.onPageChange || null;
    this.onDocumentLoaded = options.onDocumentLoaded || null;

    this.initPDFJS();
    this.setupRulerListeners();
  }

  initPDFJS() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  async loadDocument(source, docName = 'document.pdf') {
    try {
      if (this.container) {
        this.container.innerHTML = `
          <div class="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
            <div class="w-10 h-10 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-sm font-semibold">Loading and optimizing PDF for focus...</p>
          </div>
        `;
      }

      const loadingTask = window.pdfjsLib.getDocument(source);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      this.pageTextMap.clear();
      this.renderedPages.clear();

      // Pre-extract text from all pages
      for (let i = 1; i <= this.totalPages; i++) {
        const page = await this.pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');
        this.pageTextMap.set(i, text);
      }

      if (this.onDocumentLoaded) {
        const fullText = Array.from(this.pageTextMap.values()).join('\n\n');
        this.onDocumentLoaded({
          name: docName,
          totalPages: this.totalPages,
          firstPageText: this.pageTextMap.get(1) || '',
          fullText: fullText
        });
      }

      await this.renderPage(1);
    } catch (err) {
      console.error('Error loading PDF:', err);
      if (this.container) {
        this.container.innerHTML = `
          <div class="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-md mx-auto my-12 text-rose-600">
            <h3 class="font-bold text-base mb-1">Failed to load PDF</h3>
            <p class="text-xs">${err.message || 'Please verify the PDF file format.'}</p>
          </div>
        `;
      }
    }
  }

  async renderPage(pageNumber) {
    if (!this.pdfDoc || pageNumber < 1 || pageNumber > this.totalPages) return;
    this.currentPage = pageNumber;

    if (!this.container) return;
    this.container.innerHTML = '';

    const page = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.scale });

    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'pdf-page-wrapper relative mx-auto my-4 transition-transform';
    pageWrapper.style.width = `${viewport.width}px`;
    pageWrapper.style.height = `${viewport.height}px`;
    pageWrapper.dataset.pageNumber = pageNumber;

    // High-DPI Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const outputScale = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const renderContext = {
      canvasContext: ctx,
      transform: transform,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    pageWrapper.appendChild(canvas);

    // Render Text Layer
    const textContent = await page.getTextContent();
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'text-layer';
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;

    try {
      if (window.pdfjsLib && window.pdfjsLib.renderTextLayer) {
        window.pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          textContent: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: []
        });
      }
    } catch (textErr) {
      console.warn('Text layer render notice:', textErr);
    }

    pageWrapper.appendChild(textLayerDiv);

    // Margin Scaffolding Gutter (Interactive 3-word bullet anchors)
    const pageText = this.pageTextMap.get(pageNumber) || '';
    const scaffolds = ActiveRecallEngine.extractMarginScaffolds(pageText);
    if (scaffolds.length > 0) {
      const gutter = document.createElement('div');
      gutter.className = 'margin-scaffold-gutter';
      gutter.innerHTML = scaffolds.map(s => `
        <button class="margin-scaffold-pill" data-scaffold-idx="${s.paragraphIndex}" title="${s.snippet}">
          📌 ${s.text}
        </button>
      `).join('');

      gutter.querySelectorAll('.margin-scaffold-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(700, 'sine', 0.04);
          pageWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (this.rulerOverlay) {
            this.rulerOverlay.classList.add('attention-pulse-glow');
            setTimeout(() => this.rulerOverlay.classList.remove('attention-pulse-glow'), 1800);
          }
        });
      });

      pageWrapper.appendChild(gutter);
    }

    // Bionic Overlay if enabled
    if (this.bionicMode) {
      const bionicDiv = document.createElement('div');
      bionicDiv.className = 'bionic-overlay absolute inset-0 p-8 bg-[var(--bg-card)] overflow-y-auto text-[var(--text-primary)] text-lg leading-relaxed font-lexend select-text rounded-lg';
      bionicDiv.style.zIndex = '5';
      bionicDiv.innerHTML = BionicEngine.processText(pageText, this.bionicIntensity);
      pageWrapper.appendChild(bionicDiv);
    }

    this.container.appendChild(pageWrapper);
    this.renderedPages.set(pageNumber, pageWrapper);

    if (this.onPageChange) {
      this.onPageChange({
        pageNumber: this.currentPage,
        totalPages: this.totalPages,
        pageText: this.pageTextMap.get(pageNumber) || ''
      });
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.renderPage(this.currentPage + 1);
      if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(620, 'sine');
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.renderPage(this.currentPage - 1);
      if (this.audioSynthesizer) this.audioSynthesizer.playTactileClick(540, 'sine');
    }
  }

  zoomIn() {
    this.scale = Math.min(2.5, this.scale + 0.15);
    this.renderPage(this.currentPage);
  }

  zoomOut() {
    this.scale = Math.max(0.7, this.scale - 0.15);
    this.renderPage(this.currentPage);
  }

  setBionicMode(enabled, intensity = 2) {
    this.bionicMode = enabled;
    this.bionicIntensity = intensity;
    this.renderPage(this.currentPage);
  }

  setReadingRuler(enabled, mode = 'mask', height = 54) {
    this.rulerEnabled = enabled;
    this.rulerMode = mode;
    this.rulerHeight = height;

    if (!this.rulerOverlay) return;

    if (enabled) {
      this.rulerOverlay.classList.add('active');
      this.renderRulerStructure();
    } else {
      this.rulerOverlay.classList.remove('active');
    }
  }

  renderRulerStructure() {
    if (!this.rulerOverlay) return;
    if (this.rulerMode === 'mask') {
      this.rulerOverlay.innerHTML = `
        <div id="ruler-top-mask" class="ruler-mask-top" style="top: 0; height: 35vh;"></div>
        <div id="ruler-window" class="ruler-focus-window" style="top: 35vh; height: ${this.rulerHeight}px;"></div>
        <div id="ruler-bottom-mask" class="ruler-mask-bottom" style="top: calc(35vh + ${this.rulerHeight}px); bottom: 0;"></div>
      `;
    } else {
      this.rulerOverlay.innerHTML = `
        <div id="ruler-laser-bar" class="ruler-single-bar" style="top: 40vh;"></div>
      `;
    }
  }

  setupRulerListeners() {
    window.addEventListener('mousemove', (e) => {
      if (!this.rulerEnabled || !this.rulerOverlay) return;
      const y = e.clientY;

      if (this.rulerMode === 'mask') {
        const topMask = document.getElementById('ruler-top-mask');
        const focusWindow = document.getElementById('ruler-window');
        const bottomMask = document.getElementById('ruler-bottom-mask');

        const windowTop = Math.max(0, y - this.rulerHeight / 2);
        if (topMask) topMask.style.height = `${windowTop}px`;
        if (focusWindow) focusWindow.style.top = `${windowTop}px`;
        if (bottomMask) bottomMask.style.top = `${windowTop + this.rulerHeight}px`;
      } else {
        const bar = document.getElementById('ruler-laser-bar');
        if (bar) bar.style.top = `${y}px`;
      }
    });
  }

  getCurrentPageText() {
    return this.pageTextMap.get(this.currentPage) || '';
  }
}
