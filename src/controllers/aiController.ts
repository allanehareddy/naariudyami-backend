import { Response } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// Generate reel script using AI (mock implementation)
export const generateReelScript = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { prompt, productName, category } = req.body;

    if (!prompt && !productName) {
      throw new AppError('Prompt or product name is required', 400);
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a contextual reel script based on the prompt
    const scripts = [
      {
        title: 'Product Showcase',
        script: `🌟 Discover Authentic ${productName || 'Handcrafted Products'}! 🌟

Opening Shot (3s): Close-up of your beautiful ${productName || 'product'}, natural lighting
Voiceover: "Every piece tells a story..."

Mid Section (5s): Show the crafting process, your hands at work
Text Overlay: "Made with Love ❤️ Tradition Meets Modern"

Highlight (4s): Show different angles, uses, or colors
Voiceover: "Supporting local artisans, one purchase at a time"

Closing (3s): Your smiling face, product in hand
CTA: "Shop now! Link in bio 🛍️"

Hashtags: #Handmade #SupportLocal #WomenEntrepreneurs #MadeInIndia #${category || 'Crafts'} #SustainableLiving`,
        duration: '15 seconds',
        style: 'Authentic & Emotional'
      },
      {
        title: 'Behind The Scenes',
        script: `💫 The Magic Behind ${productName || 'Our Products'} 💫

Start (2s): "Hi, I'm [Your Name] from [Village]"
Show your workspace/home setup

Process (6s): Quick time-lapse of making the product
Text: "Hours of work" → "Generations of skill" → "One beautiful piece"

Story (4s): Share your journey
"I started this to support my family and preserve our traditions"

Product Close-up (2s): Final beautiful product shot

End (1s): "Every purchase changes a life. Thank you! 🙏"

Music: Upbeat traditional fusion
Hashtags: #WomenEmpowerment #RuralIndia #Handcrafted #SmallBusiness`,
        duration: '15 seconds',
        style: 'Personal & Inspiring'
      },
      {
        title: 'Quick Transformation',
        script: `✨ From Raw to Beautiful ✨

Opening (1s): Hold up raw materials
Text: "Watch this transformation!"

Transformation (8s): Fast-paced montage
- Material selection
- Crafting process
- Adding details
- Final touches

Reveal (4s): Slow motion product reveal with sparkle effects
Text: "Hours of work in 15 seconds"

CTA (2s): Point to camera
"Yours for just ₹[Price]! Order now!"

Music: Energetic, trending audio
Hashtags: #Transformation #Satisfying #Handmade #ShopSmall #${category || 'Crafts'}`,
        duration: '15 seconds',
        style: 'Trendy & Fast-paced'
      }
    ];

    // Select a random script or customize based on prompt
    const selectedScript = scripts[Math.floor(Math.random() * scripts.length)];

    // Add tips for better engagement
    const tips = [
      '🎥 Film in natural light, preferably morning or evening',
      '📱 Keep your phone steady or use a tripod',
      '🎵 Use trending audio from Instagram/YouTube for more reach',
      '👥 Tag relevant accounts and use location tags',
      '⏰ Post during peak hours (7-9 AM, 12-2 PM, 7-9 PM)',
      '💬 Respond to comments within the first hour',
      '🔄 Share to your story and ask friends to share',
      '📊 Use Instagram Insights to track what works'
    ];

    res.status(200).json({
      success: true,
      data: {
        script: selectedScript,
        additionalScripts: scripts.filter(s => s !== selectedScript),
        tips,
        suggestedHashtags: [
          '#WomenEntrepreneurs',
          '#MadeInIndia',
          '#HandmadeWithLove',
          '#SupportLocal',
          '#SmallBusiness',
          '#RuralIndia',
          `#${category || 'Handcrafted'}`,
          '#Graminyog',
          '#VocalForLocal'
        ],
        musicSuggestions: [
          'Uplifting traditional instrumental',
          'Trending Bollywood remix',
          'Soft acoustic background',
          'Energetic dhol beats'
        ]
      }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error generating reel script'
    });
  }
};

// Generate product description using AI
export const generateProductDescription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { productName, category, materials, features } = req.body;

    if (!productName || !category) {
      throw new AppError('Product name and category are required', 400);
    }

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 800));

    const descriptions = [
      `Discover the beauty of authentic ${category}! Our ${productName} is handcrafted with love and care by skilled artisans. ${materials ? `Made from ${materials}, ` : ''}each piece is unique and tells a story of tradition and craftsmanship. ${features || 'Perfect for daily use or as a thoughtful gift.'}`,
      
      `Embrace tradition with our exquisite ${productName}. This ${category} piece represents hours of dedicated work and generations of expertise. ${materials ? `Crafted from premium ${materials}, ` : ''}it brings the warmth of rural India to your home. ${features || 'A perfect blend of tradition and functionality.'}`,
      
      `Introducing our hand-made ${productName} - where art meets utility! This beautiful ${category} item is more than just a product; it's a piece of heritage. ${materials ? `Using traditional ${materials} and techniques, ` : ''}our artisans pour their heart into every detail. ${features || 'Support local artisans while owning something truly special.'}`
    ];

    const selectedDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

    res.status(200).json({
      success: true,
      data: {
        description: selectedDescription,
        alternativeDescriptions: descriptions.filter(d => d !== selectedDescription),
        seoKeywords: [
          `handmade ${category}`,
          `authentic ${productName}`,
          'rural artisan',
          'traditional crafts',
          'made in India',
          materials || category
        ].filter(Boolean)
      }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error generating product description'
    });
  }
};

// Generate marketing captions for social media
export const generateCaption = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    let { platform, productName, occasion } = req.body;

    // Default to instagram when platform not provided to be tolerant
    if (!platform) {
      platform = 'instagram';
    }

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 500));

    const captions: any = {
      instagram: [
        `✨ Handcrafted with love! ${productName ? `Our ${productName} is` : 'Each piece is'} a celebration of tradition and artistry. ${occasion ? `Perfect for ${occasion}! ` : ''}Support local artisans, embrace authenticity. 🌸\n\n#WomenEntrepreneurs #Handmade #MadeInIndia #SupportLocal`,
        
        `Behind every product is a story of empowerment 💪\n${productName ? `This ${productName} represents` : 'This represents'} hours of dedication, generations of skill, and dreams of a better tomorrow. ${occasion ? `Make your ${occasion} special! ` : ''}\n\nShop now and be part of our journey! 🛍️✨`,
        
        `From our hands to your heart ❤️\n${productName ? `${productName} -` : ''} Authentic, sustainable, and made with pride. ${occasion ? `Celebrating ${occasion} the traditional way! ` : ''}\n\nEvery purchase changes a life. Thank you for supporting rural women entrepreneurs! 🙏`
      ],
      facebook: [
        `🌟 New Arrival! 🌟\n\n${productName ? `Check out our beautiful ${productName}! ` : 'Check out our latest creation! '}Handcrafted by skilled women artisans from rural India. ${occasion ? `Perfect gift for ${occasion}! ` : ''}\n\nWhen you buy from us, you're not just getting a product - you're supporting a family, preserving a tradition, and empowering a community.\n\nOrder now! 🛒`,
        
        `Hello friends! 👋\n\nI'm excited to share ${productName ? `my ${productName}` : 'my latest work'} with you. ${occasion ? `Special ${occasion} collection now available! ` : ''}Each piece is made with love and traditional techniques passed down through generations.\n\nYour support means the world to us. Share this post to help us reach more people! 💕`,
      ],
      twitter: [
        `✨ Handmade ${productName || 'treasures'} from rural India! ${occasion ? `Perfect for ${occasion}. ` : ''}Supporting local artisans, one product at a time. 🛍️\n\n#WomenEntrepreneurs #Handcrafted #VocalForLocal`,
        
        `Behind every product: A story of empowerment 💪\n${productName ? `${productName} -` : ''} Made with pride by rural women entrepreneurs. ${occasion ? `${occasion} special! ` : ''}\n\nShop & support: [link]\n#SupportLocal #MadeInIndia`
      ]
    };

    const platformKey = String(platform).toLowerCase();
    const platformCaptions = captions[platformKey] || captions.instagram;

    const hashtagsMap: Record<string, string[]> = {
      instagram: ['#WomenEntrepreneurs', '#Handmade', '#MadeInIndia', '#SupportLocal', '#RuralIndia'],
      facebook: ['WomenEmpowerment', 'HandmadeInIndia', 'SupportSmallBusiness'],
      twitter: ['#WomenEntrepreneurs', '#VocalForLocal', '#MadeInIndia']
    };

    res.status(200).json({
      success: true,
      data: {
        captions: platformCaptions,
        hashtags: hashtagsMap[platform.toLowerCase()] || hashtagsMap.instagram,
        tips: [
          `Post during peak hours for ${platform}`,
          'Use relevant hashtags (5-10 for Instagram)',
          'Include clear product photos',
          'Add a call-to-action (Shop now, Link in bio, etc.)',
          'Engage with comments within first hour'
        ]
      }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error generating caption'
    });
  }
};

