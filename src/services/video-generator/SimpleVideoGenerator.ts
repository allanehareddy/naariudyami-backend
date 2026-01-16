// Simplified Video Generator (Windows Compatible - No Canvas Required!)
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface VideoConfig {
  productName: string;
  category: string;
  prompt: string;
  script: string;
  duration?: number;
}

export interface GeneratedVideo {
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  filePath: string;
  thumbnailPath: string;
}

/**
 * Simplified Video Generator
 * Returns mock video URLs for now - can be enhanced with cloud-based video generation
 */
export class SimpleVideoGenerator {
  private publicDir: string;

  constructor() {
    // Create public directory for videos
    this.publicDir = path.join(process.cwd(), 'public', 'videos');
    
    if (!fs.existsSync(this.publicDir)) {
      fs.mkdirSync(this.publicDir, { recursive: true });
    }

    // Create a sample video file if it doesn't exist
    this.createSampleVideo();
  }

  /**
   * Generate video (simplified version)
   */
  async generateVideo(config: VideoConfig): Promise<GeneratedVideo> {
    const videoId = uuidv4();
    const duration = config.duration || 15;
    
    console.log(`🎬 Generating video for: ${config.productName}`);
    
    // Simulate video generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For now, use a sample video template
    // In production, this would call a cloud-based video API like:
    // - Synthesia.io
    // - Pictory.ai
    // - InVideo API
    // - Runway ML
    // - Or generate using Python service with MoviePy
    
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Create metadata file
    const metadata = {
      id: videoId,
      productName: config.productName,
      category: config.category,
      prompt: config.prompt,
      script: config.script,
      duration: `${duration}s`,
      createdAt: new Date().toISOString(),
    };
    
    const metadataPath = path.join(this.publicDir, `${videoId}-metadata.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    return {
      videoUrl: `${baseUrl}/videos/sample-reel.mp4`,
      thumbnailUrl: `${baseUrl}/videos/sample-thumbnail.jpg`,
      duration: `${duration}s`,
      filePath: path.join(this.publicDir, 'sample-reel.mp4'),
      thumbnailPath: path.join(this.publicDir, 'sample-thumbnail.jpg'),
    };
  }

  /**
   * Create a sample video file for demonstration
   */
  private createSampleVideo(): void {
    const sampleVideoPath = path.join(this.publicDir, 'sample-reel.mp4');
    const sampleThumbnailPath = path.join(this.publicDir, 'sample-thumbnail.jpg');
    
    // Create placeholder files if they don't exist
    if (!fs.existsSync(sampleVideoPath)) {
      // Create an HTML file that redirects to a sample video
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Sample Reel - NARIUDYAMI</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: Arial, sans-serif;
    }
    .container {
      text-align: center;
      color: white;
      padding: 40px;
      max-width: 600px;
    }
    h1 {
      font-size: 48px;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    p {
      font-size: 20px;
      margin-bottom: 30px;
    }
    .features {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    .feature {
      margin: 10px 0;
      font-size: 18px;
    }
    .note {
      font-size: 14px;
      margin-top: 30px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎬 NARIUDYAMI</h1>
    <h2>AI Video Generation</h2>
    <p>Your AI-powered reel is ready!</p>
    
    <div class="features">
      <div class="feature">✨ Vertical Format (1080x1920)</div>
      <div class="feature">🎨 Beautiful Animations</div>
      <div class="feature">📱 Perfect for Social Media</div>
      <div class="feature">⚡ AI-Generated Content</div>
    </div>
    
    <p class="note">
      Note: This is a demonstration. In production, real videos will be generated<br>
      using cloud-based AI video generation APIs.
    </p>
  </div>
</body>
</html>`;
      
      fs.writeFileSync(sampleVideoPath.replace('.mp4', '.html'), htmlContent);
    }
    
    if (!fs.existsSync(sampleThumbnailPath)) {
      // Create a simple SVG thumbnail
      const svgContent = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect fill="url(#grad1)" width="1080" height="1920"/>
  <text x="540" y="960" font-size="80" fill="white" text-anchor="middle" font-family="Arial" font-weight="bold">
    NARIUDYAMI
  </text>
  <text x="540" y="1060" font-size="50" fill="white" text-anchor="middle" font-family="Arial">
    AI Video Reel
  </text>
</svg>`;
      
      fs.writeFileSync(sampleThumbnailPath.replace('.jpg', '.svg'), svgContent);
    }
  }

  /**
   * Get video file path for download
   */
  getVideoPath(videoId: string): string {
    return path.join(this.publicDir, 'sample-reel.mp4');
  }

  /**
   * Clean up old videos
   */
  async cleanupOldVideos(daysOld: number = 7): Promise<void> {
    const files = fs.readdirSync(this.publicDir);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      if (file.endsWith('-metadata.json')) {
        const filePath = path.join(this.publicDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old metadata: ${file}`);
        }
      }
    });
  }
}

export const videoGenerator = new SimpleVideoGenerator();

