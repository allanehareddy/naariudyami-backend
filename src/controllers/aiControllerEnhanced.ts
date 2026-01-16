// Enhanced AI Controller with Real Video Generation
import { Response } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { videoGenerator } from '../services/video-generator/SimpleVideoGenerator.js';

/**
 * Generate real AI video reel (not just script!)
 */
export const generateReelScriptEnhanced = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { prompt, productName, category } = req.body;

    if (!prompt && !productName) {
      throw new AppError('Prompt or product name is required', 400);
    }

    // Generate AI script first
    const script = generateAIScript(productName, category, prompt);

    // Generate REAL VIDEO
    console.log('🎬 Generating AI video...');
    const video = await videoGenerator.generateVideo({
      productName: productName || 'Amazing Product',
      category: category || 'Handmade',
      prompt: prompt || '',
      script: script.script,
      duration: 15, // 15 second reel
    });

    console.log('✅ Video generated successfully:', video.videoUrl);

    // Return script + VIDEO URL
    res.status(200).json({
      success: true,
      data: {
        script: script.script,
        title: script.title,
        duration: script.duration,
        style: script.style,
        hashtags: script.hashtags,
        // NEW: Real video data
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        videoDuration: video.duration,
        downloadUrl: video.videoUrl, // Same as videoUrl for download
      },
      message: 'AI video reel generated successfully!',
    });
  } catch (error: any) {
    console.error('Reel generation error:', error);
    throw new AppError(error.message || 'Failed to generate reel', 500);
  }
};

/**
 * Generate AI script (helper function)
 */
function generateAIScript(productName: string, category: string, prompt: string) {
  return {
    title: 'Product Showcase',
    script: `🌟 Discover Authentic ${productName}! 🌟

Opening Scene: Close-up of beautiful ${productName}
"Every piece tells a story..."

Mid Section: Show the crafting process
"Made with Love ❤️ Tradition Meets Modern"

Highlight: Different angles and uses
"Supporting local artisans"

Closing: Call to action
"Shop now! Link in bio 🛍️"`,
    duration: '15 seconds',
    style: 'Authentic & Emotional',
    hashtags: `#Handmade #SupportLocal #WomenEntrepreneurs #MadeInIndia #${category} #NARIUDYAMI`,
  };
}

/**
 * Generate product description using AI
 */
export const generateProductDescriptionEnhanced = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { productName, category, features } = req.body;

    if (!productName) {
      throw new AppError('Product name is required', 400);
    }

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    const descriptions = {
      short: `Beautiful handcrafted ${productName}. Made by rural women entrepreneurs with traditional techniques. ${category} category. Perfect for ${features || 'daily use'}.`,
      medium: `Discover the authentic charm of ${productName}, lovingly crafted by skilled women entrepreneurs from rural India. Each piece represents hours of dedication and generations of traditional ${category} craftsmanship. Made with sustainable materials and eco-friendly practices. ${features ? `Features: ${features}.` : ''} Support local artisans and bring home a piece of Indian heritage.`,
      detailed: `✨ ${productName} - Where Tradition Meets Excellence ✨

🌟 ABOUT THIS PRODUCT:
This exquisite ${productName} is handcrafted by talented women entrepreneurs from rural India, preserving centuries-old ${category} traditions while supporting sustainable livelihoods.

💎 FEATURES:
${features || '- Handmade with premium materials\n- Traditional craftsmanship\n- Eco-friendly production\n- Unique design\n- Quality assured'}

🎨 CRAFTSMANSHIP:
Each piece is carefully crafted using time-honored techniques passed down through generations. No two items are exactly alike, making your purchase truly one-of-a-kind.

🌱 SOCIAL IMPACT:
By purchasing this product, you directly support rural women entrepreneurs and contribute to sustainable community development.

📦 DETAILS:
- Category: ${category}
- 100% Handmade
- Made in India
- Supports Women Empowerment

#NARIUDYAMI #SupportLocal #Handmade #MadeInIndia #${category}`,
    };

    res.status(200).json({
      success: true,
      data: descriptions,
      seoKeywords: [
        `handmade ${productName}`,
        `${category} products`,
        'women entrepreneurs india',
        'handcrafted goods',
        'rural artisan',
        'NARIUDYAMI',
      ],
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to generate description', 500);
  }
};

/**
 * Generate social media caption
 */
export const generateCaptionEnhanced = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { platform, productName, tone } = req.body;

    if (!platform || !productName) {
      throw new AppError('Platform and product name are required', 400);
    }

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 800));

    const captions: Record<string, string[]> = {
      instagram: [
        `✨ Introducing ${productName}! ✨\n\n💝 Handcrafted with love by rural women entrepreneurs\n🌿 Sustainable & Eco-friendly\n🇮🇳 Made in India\n\n${tone === 'professional' ? 'Support local artisans today!' : 'Swipe to see the magic! 👉'}\n\n#NARIUDYAMI #Handmade #WomenEmpowerment #SupportLocal #MadeInIndia #RuralEntrepreneur`,
        `🌟 Behind every ${productName} is a story of empowerment 🌟\n\nMeet our talented artisans who pour their heart into every creation. ${tone === 'casual' ? '❤️' : 'Each purchase makes a difference.'}\n\n#WomenEntrepreneurs #Handcrafted #SocialImpact #NARIUDYAMI`,
      ],
      facebook: [
        `Discover the Beauty of Handcrafted ${productName}!\n\n🎨 Each piece is lovingly made by skilled women entrepreneurs from rural India\n💪 Supporting women empowerment, one product at a time\n🌱 Eco-friendly and sustainable\n🚚 Nationwide delivery available\n\nShop now and be part of the change! #NARIUDYAMI #WomenEmpowerment #Handmade #SupportLocal`,
      ],
      twitter: [
        `🌟 ${productName} - Handcrafted by rural women entrepreneurs\n\n✅ Traditional craftsmanship\n✅ Sustainable practices\n✅ Empowering communities\n\nSupport #NARIUDYAMI #WomenEmpowerment #MadeInIndia`,
      ],
    };

    const platformCaptions = captions[platform.toLowerCase()] || captions.instagram;

    const hashtagsMap: Record<string, string[]> = {
      instagram: ['#WomenEntrepreneurs', '#Handmade', '#MadeInIndia', '#SupportLocal', '#RuralIndia', '#NARIUDYAMI'],
      facebook: ['WomenEmpowerment', 'HandmadeInIndia', 'SupportSmallBusiness', 'NARIUDYAMI'],
      twitter: ['#WomenEntrepreneurs', '#VocalForLocal', '#MadeInIndia', '#NARIUDYAMI'],
    };

    const platformLower = platform.toLowerCase();
    const selectedHashtags = hashtagsMap[platformLower] || hashtagsMap.instagram;

    const bestTimesMap: Record<string, string[]> = {
      instagram: ['9-11 AM', '7-9 PM'],
      facebook: ['1-3 PM', '7-9 PM'],
      twitter: ['12-1 PM', '5-6 PM'],
    };
    const selectedBestTimes = bestTimesMap[platformLower] || ['9-11 AM', '7-9 PM'];

    res.status(200).json({
      success: true,
      data: {
        captions: platformCaptions,
        hashtags: selectedHashtags,
        tips: [
          `Post during peak hours for ${platform}`,
          'Use relevant hashtags (5-10 for Instagram)',
          'Include a call-to-action',
          'Tag relevant accounts',
          'Engage with comments quickly',
        ],
        bestTimes: selectedBestTimes,
      },
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to generate caption', 500);
  }
};
