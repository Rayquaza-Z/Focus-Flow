/**
 * AI Study Assistant Module for FocusFlow
 * Integrates Google Generative AI for personalized study help.
 * Users provide their own API key - no data leaves the browser except AI requests.
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
    this.model = options.model || 'gemini-1.5-flash';
    this.isLoading = false;
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

  async callAI(prompt) {
    if (!this.hasValidKey()) {
      throw new Error('API_KEY_REQUIRED');
    }

    this.isLoading = true;
    this.onStatusChange({ loading: true });

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.getApiKey()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 || response.status === 403) {
          throw new Error('INVALID_API_KEY');
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
      this.onError(error);
      throw error;
    } finally {
      this.isLoading = false;
      this.onStatusChange({ loading: false });
    }
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
