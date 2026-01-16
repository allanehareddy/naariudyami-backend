// AI/ML Services Configuration
export const aiConfig = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.7,
    enabled: process.env.OPENAI_ENABLED === 'true',
  },

  // Google Gemini Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    enabled: process.env.GEMINI_ENABLED === 'true',
  },

  // Stability AI Configuration (for video generation)
  stabilityAI: {
    apiKey: process.env.STABILITY_API_KEY || '',
    enabled: process.env.STABILITY_ENABLED === 'true',
  },

  // Video Generation Configuration
  video: {
    enabled: process.env.VIDEO_GENERATION_ENABLED === 'true',
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    outputFormat: 'mp4',
    resolution: '1080x1920', // Vertical format for reels
    fps: 30,
    duration: 15, // seconds
  },

  // Cloud Storage Configuration (Cloudinary)
  storage: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      enabled: process.env.CLOUDINARY_ENABLED === 'true',
    },
  },

  // Price Prediction Configuration
  pricePrediction: {
    governmentAPIs: {
      agmarknet: {
        baseUrl: 'https://api.data.gov.in/resource',
        apiKey: process.env.DATA_GOV_IN_API_KEY || '',
        enabled: process.env.AGMARKNET_ENABLED === 'true',
      },
    },
    caching: {
      enabled: true,
      ttl: 3600, // 1 hour cache
    },
    forecasting: {
      enabled: true,
      horizonDays: 90,
    },
  },

  // Fallback Strategy
  fallback: {
    useEnhancedTemplates: true,
    useMockData: true,
    logFailures: true,
  },

  // Feature Flags
  features: {
    videoGeneration: process.env.FEATURE_VIDEO_GENERATION === 'true',
    realTimePrices: process.env.FEATURE_REALTIME_PRICES === 'true',
    llmIntegration: process.env.FEATURE_LLM_INTEGRATION === 'true',
    socialMediaStrategy: true,
    marketForecasting: process.env.FEATURE_MARKET_FORECASTING === 'true',
  },
};

// Validation function
export function validateAIConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!aiConfig.openai.apiKey && aiConfig.openai.enabled) {
    warnings.push('OpenAI API key missing - will use fallback');
  }

  if (!aiConfig.gemini.apiKey && aiConfig.gemini.enabled) {
    warnings.push('Gemini API key missing - will use fallback');
  }

  if (aiConfig.features.videoGeneration && !aiConfig.storage.cloudinary.enabled) {
    warnings.push('Video generation enabled but Cloudinary not configured');
  }

  return {
    valid: true,
    warnings,
  };
}

export default aiConfig;

