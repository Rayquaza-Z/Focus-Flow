/**
 * Bionic Reading Engine for ADHD PDF Reader
 * Converts text into fixation-guided formatting (bolded word prefixes)
 * to accelerate saccadic eye movement and prevent attention drift.
 */

export class BionicEngine {
  /**
   * Convert a single word into bionic HTML representation
   * @param {string} word 
   * @param {number} fixationRatio (e.g., 0.45 or fixed chars)
   */
  static formatWord(word, fixationIntensity = 2) {
    if (!word || word.trim().length === 0) return word;

    // Check if word contains letters
    const match = word.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);
    if (!match) {
      // Fallback for compound or hyphenated words
      return word.replace(/\b([a-zA-Z0-9]+)\b/g, (w) => {
        const fixLen = this.calculateFixationLength(w.length, fixationIntensity);
        const fixation = w.substring(0, fixLen);
        const tail = w.substring(fixLen);
        return `<span class="bionic-word"><b class="bionic-fixation">${fixation}</b><span class="bionic-tail">${tail}</span></span>`;
      });
    }

    const [, leadingPunct, coreWord, trailingPunct] = match;
    const fixLen = this.calculateFixationLength(coreWord.length, fixationIntensity);
    const fixation = coreWord.substring(0, fixLen);
    const tail = coreWord.substring(fixLen);

    return `${leadingPunct}<span class="bionic-word"><b class="bionic-fixation">${fixation}</b><span class="bionic-tail">${tail}</span></span>${trailingPunct}`;
  }

  static calculateFixationLength(len, intensity = 2) {
    if (len <= 1) return 1;
    if (len <= 3) return Math.min(len, intensity >= 2 ? 2 : 1);
    if (len <= 6) return Math.min(len, intensity >= 3 ? 3 : 2);
    if (len <= 9) return Math.min(len, intensity >= 3 ? 4 : 3);
    return Math.max(2, Math.ceil(len * (intensity === 1 ? 0.35 : intensity === 2 ? 0.48 : 0.60)));
  }

  /**
   * Transforms plain text into rich bionic HTML
   */
  static processText(text, intensity = 2) {
    if (!text) return '';
    // Split text into tokens while preserving whitespace & newlines
    const tokens = text.split(/(\s+|\n+)/);
    return tokens.map(token => {
      if (/^\s+$/.test(token)) {
        return token.replace(/\n/g, '<br/>');
      }
      return this.formatWord(token, intensity);
    }).join('');
  }

  /**
   * Applies bionic formatting to a DOM element's text content
   */
  static applyToElement(element, intensity = 2) {
    if (!element) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim().length > 0) {
        nodes.push(walker.currentNode);
      }
    }

    nodes.forEach(textNode => {
      const span = document.createElement('span');
      span.innerHTML = this.processText(textNode.nodeValue, intensity);
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(span, textNode);
      }
    });
  }
}
