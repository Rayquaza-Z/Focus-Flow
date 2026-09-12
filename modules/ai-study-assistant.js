/**
 * AI Study Assistant Module for FocusFlow
 * Integrates Google Generative AI for personalized study help.
 * Users provide their own API key - no data leaves the browser except AI requests.
 * 
 * SECURITY NOTE: API key is sent in POST body, not URL, to avoid exposure in browser history/server logs.
 * Model: gemini-1.5-flash (check https://ai.google.dev/models/gemini for updates if deprecated)
 */

const AI_STUDY_PROMPTS = {
  EXPLAIN_LIKE_5: (text) => `Explain this text like I'm 5 years old. Keep it simple and use analogies:\n\n${text}`,
  SUMMARIZE: (text) => `Summarize this text in 3-5 bullet points, highlighting the most important concepts:\n\n${text}`,
  GENERATE_QUIZ: (text) => `Based on this text, generate 3 multiple-choice questions with answers. Format as JSON array with question, options (array), and correctAnswer (index):\n\n${text}`,
  KEY_CONCEPTS: (text) => `Extract the 5 most important key concepts from this text. For each, provide a one-sentence definition:\n\n${text}`,
  STUDY_TIPS: (text) => `Based on this text, suggest 3 specific study techniques or mnemonics that would help someone memorize and understand these concepts:\n\n${text}`
};

export class AIStudyAssistant {
  constructor(options = {}) {
    this.apiKey = options.apiKey || '';
    // Increased token limit for quiz generation to avoid JSON truncation
    this.model = options.model || 'gemini-1.5-flash';
    this.maxTokens = options.maxTokens || 1024;
    this.isLoading = false;
    this.currentAbortController = null;
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onError = options.onError || ((err) => console.error('AI Error:', err));
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('focusflow_ai_apikey', key);
  }

  getApiKey() {
    return this.apiKey || localStorage.getItem('focusflow_ai_apikey') || '';
  }

  hasValidKey() {
    const key = this.getApiKey();
    return key && key.length > 20;
  }

  /**
   * Validates input before making API call
   * @param {string} text - Text to validate
   * @returns {{valid: boolean, reason?: string}}
   */
  validateInput(text) {
    if (!text || typeof text !== 'string') {
      return { valid: false, reason: 'EMPTY_INPUT' };
    }
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return { valid: false, reason: 'WHITESPACE_ONLY' };
    }
    // Check if text appears to be extractable (not just images)
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < 3) {
      return { valid: false, reason: 'INSUFFICIENT_TEXT' };
    }
    return { valid: true };
  }

  async callAI(prompt, maxRetries = 2) {
    if (!this.hasValidKey()) {
      throw new Error('API_KEY_REQUIRED');
    }

    // Validate prompt before making API call
    const validation = this.validateInput(prompt);
    if (!validation.valid) {
      throw new Error(`INVALID_INPUT_${validation.reason}`);
    }

    // Cancel any in-flight request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.currentAbortController = new AbortController();

    this.isLoading = true;
    this.onStatusChange({ loading: true });

    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
          {
            method: 'POST',
            signal: this.currentAbortController.signal,
            headers: {
              'Content-Type': 'application/json',
              // API key in header instead of URL to prevent exposure in logs/history
              'x-goog-api-key': this.getApiKey(),
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: this.maxTokens,
              }
            })
          }
        );

        if (!response.ok) {
          await response.json().catch(() => ({}));
          
          // Handle rate limiting with exponential backoff
          if (response.status === 429) {
            if (attempt < maxRetries) {
              const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
              await new Promise(resolve => setTimeout(resolve, delayMs));
              continue;
            }
            throw new Error('RATE_LIMIT_EXCEEDED');
          }
          
          if (response.status === 400 || response.status === 403) {
            throw new Error('INVALID_API_KEY');
          }
          if (response.status === 404) {
            throw new Error('MODEL_NOT_FOUND');
          }
          throw new Error(`API_ERROR_${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (!text) {
          throw new Error('NO_RESPONSE');
        }

        return text;
      } catch (error) {
        // Don't retry abort errors
        if (error.name === 'AbortError') {
          throw new Error('REQUEST_CANCELLED');
        }
        lastError = error;
        
        // If not a retryable error, throw immediately
        if (['API_KEY_REQUIRED', 'INVALID_API_KEY', 'INVALID_INPUT_EMPTY_INPUT', 
             'INVALID_INPUT_WHITESPACE_ONLY', 'INVALID_INPUT_INSUFFICIENT_TEXT'].includes(error.message)) {
          throw error;
        }
      }
    }
    
    // All retries exhausted
    throw lastError || new Error('MAX_RETRIES_EXCEEDED');
  }

  async explainLikeFive(text) {
    return this.callAI(AI_STUDY_PROMPTS.EXPLAIN_LIKE_5(text));
  }

  async summarize(text) {
    return this.callAI(AI_STUDY_PROMPTS.SUMMARIZE(text));
  }

  async generateQuiz(text) {
    const response = await this.callAI(AI_STUDY_PROMPTS.GENERATE_QUIZ(text));
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      throw new Error('QUIZ_PARSE_ERROR');
    }
  }

  async extractKeyConcepts(text) {
    return this.callAI(AI_STUDY_PROMPTS.KEY_CONCEPTS(text));
  }

  async getStudyTips(text) {
    return this.callAI(AI_STUDY_PROMPTS.STUDY_TIPS(text));
  }

  clearApiKey() {
    localStorage.removeItem('focusflow_ai_apikey');
    this.apiKey = '';
  }
}
