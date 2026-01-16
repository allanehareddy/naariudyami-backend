// Advanced LLM Integration with Multiple Providers and Fallbacks
import aiConfig from '../../../config/ai-config.js';

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  context?: Record<string, any>;
}

export interface LLMResponse {
  text: string;
  provider: 'openai' | 'gemini' | 'template';
  tokensUsed?: number;
  cost?: number;
}

class LLMService {
  private requestCache: Map<string, { response: LLMResponse; timestamp: number }> = new Map();
  private cacheExpiry = 3600000; // 1 hour

  /**
   * Generate text using available LLM providers with fallback strategy
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try OpenAI first if enabled
      if (aiConfig.openai.enabled && aiConfig.openai.apiKey) {
        const response = await this.generateWithOpenAI(request);
        this.saveToCache(cacheKey, response);
        return response;
      }

      // Fallback to Gemini
      if (aiConfig.gemini.enabled && aiConfig.gemini.apiKey) {
        const response = await this.generateWithGemini(request);
        this.saveToCache(cacheKey, response);
        return response;
      }

      // Ultimate fallback to enhanced templates
      console.warn('All LLM providers unavailable, using enhanced templates');
      return this.generateWithTemplate(request);
    } catch (error) {
      console.error('LLM generation error:', error);
      return this.generateWithTemplate(request);
    }
  }

  /**
   * Generate using OpenAI GPT-4
   */
  private async generateWithOpenAI(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.openai.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.openai.model,
          messages: [
            {
              role: 'system',
              content: request.systemPrompt || 'You are a helpful assistant for rural women entrepreneurs in India.',
            },
            {
              role: 'user',
              content: request.prompt,
            },
          ],
          max_tokens: request.maxTokens || aiConfig.openai.maxTokens,
          temperature: request.temperature || aiConfig.openai.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const text = data.choices?.[0]?.message?.content || '';

      return {
        text,
        provider: 'openai',
        tokensUsed: data.usage?.total_tokens,
        cost: this.calculateOpenAICost(data.usage?.total_tokens || 0),
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate using Google Gemini
   */
  private async generateWithGemini(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.gemini.model}:generateContent?key=${aiConfig.gemini.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${request.systemPrompt || ''}\n\n${request.prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: request.temperature || 0.7,
              maxOutputTokens: request.maxTokens || 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        text,
        provider: 'gemini',
        tokensUsed: data.usageMetadata?.totalTokenCount,
        cost: 0, // Gemini free tier
      };
    } catch (error) {
      console.error('Gemini generation failed:', error);
      throw error;
    }
  }

  /**
   * Fallback: Enhanced template-based generation
   */
  private generateWithTemplate(request: LLMRequest): LLMResponse {
    // Extract context from request
    const context = request.context || {};
    const productName = context.productName || 'product';
    const category = context.category || 'handmade item';

    // Generate based on request type
    let text = '';

    if (request.prompt.includes('reel') || request.prompt.includes('video')) {
      text = this.generateReelTemplate(context);
    } else if (request.prompt.includes('description')) {
      text = this.generateDescriptionTemplate(context);
    } else if (request.prompt.includes('caption') || request.prompt.includes('social')) {
      text = this.generateCaptionTemplate(context);
    } else {
      text = `Here's a professionally crafted content for your ${productName}. This ${category} showcases traditional craftsmanship and supports rural entrepreneurship.`;
    }

    return {
      text,
      provider: 'template',
    };
  }

  private generateReelTemplate(context: any): string {
    const productName = context.productName || 'handcrafted product';
    const category = context.category || 'traditional craft';

    return `🌟 Discover Authentic ${productName}! 🌟

Opening Shot (3s): Close-up of your beautiful ${productName}, natural lighting highlighting the craftsmanship
Voiceover: "Every piece tells a story of tradition and dedication..."

Mid Section (5s): Show the creation process - your skilled hands at work, the raw materials transforming into art
Text Overlay: "Made with Love ❤️ | Tradition Meets Modern | Supporting Rural India"

Highlight (4s): Showcase different angles, uses, and unique features
Voiceover: "When you buy from us, you're not just getting a ${category} - you're preserving a heritage"

Closing (3s): Your smiling face holding the product, warm and authentic
CTA: "Shop now and support local artisans! 🛍️ Link in bio"

Hashtags: #Handmade #SupportLocal #WomenEntrepreneurs #MadeInIndia #${category.replace(/\s+/g, '')} #SustainableLiving #RuralIndia #VocalForLocal

Music Suggestion: Uplifting traditional-modern fusion instrumental
Duration: 15 seconds
Style: Authentic, Emotional, and Inspiring`;
  }

  private generateDescriptionTemplate(context: any): string {
    const productName = context.productName || 'product';
    const category = context.category || 'handmade item';
    const materials = context.materials || 'premium materials';

    return `Discover the beauty and authenticity of our exquisite ${productName}. This stunning ${category} is meticulously handcrafted by skilled rural women artisans who pour their heart and generations of expertise into every piece.

✨ Crafted from ${materials}, each ${productName} is unique and tells its own story of tradition, dedication, and cultural heritage.

💚 Why Choose Our ${productName}:
• 100% Handmade with traditional techniques
• Supports rural women entrepreneurs
• Eco-friendly and sustainable
• Unique piece - no two are exactly alike
• Ships directly from the artisan's village
• Fair trade and ethically sourced

🏡 Every purchase directly impacts a rural family and helps preserve dying traditional crafts.

Perfect for daily use, special occasions, or as a thoughtful gift that carries meaning.

#MadeInIndia #Handcrafted #SupportLocal #WomenEmpowerment #${category.replace(/\s+/g, '')}`;
  }

  private generateCaptionTemplate(context: any): string {
    const platform = context.platform || 'instagram';
    const productName = context.productName || 'creation';
    const occasion = context.occasion ? ` Perfect for ${context.occasion}!` : '';

    if (platform === 'instagram') {
      return `✨ Handcrafted with love and tradition! ✨

Our ${productName} is more than just a product - it's a piece of heritage, a story of empowerment, and a celebration of rural India's incredible talent.${occasion}

👩‍🎨 Behind every piece is a skilled woman artisan
🌱 Eco-friendly and sustainable
💝 Made with pride in rural India

Support local, embrace authenticity. 
Shop now! 🛍️

#WomenEntrepreneurs #Handmade #MadeInIndia #SupportLocal #RuralIndia #TraditionalCraft #Sustainable #EthicalFashion #SmallBusiness #VocalForLocal`;
    }

    return `Discover authentic ${productName} made by skilled rural women artisans!${occasion} Each piece preserves tradition while empowering communities. Shop local, shop meaningful. 🌟`;
  }

  private getCacheKey(request: LLMRequest): string {
    return `llm:${request.prompt.substring(0, 50)}:${JSON.stringify(request.context || {})}`;
  }

  private getFromCache(key: string): LLMResponse | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.response;
    }
    return null;
  }

  private saveToCache(key: string, response: LLMResponse): void {
    this.requestCache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // Cleanup old entries
    if (this.requestCache.size > 1000) {
      const oldestKeys = Array.from(this.requestCache.keys()).slice(0, 100);
      oldestKeys.forEach(k => this.requestCache.delete(k));
    }
  }

  private calculateOpenAICost(tokens: number): number {
    // GPT-4 Turbo pricing (approximate)
    const costPer1KTokens = 0.01; // $0.01 per 1K tokens (input)
    return (tokens / 1000) * costPer1KTokens;
  }
}

export const llmService = new LLMService();

