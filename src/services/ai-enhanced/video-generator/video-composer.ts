// Video Generation Pipeline for Reels
import aiConfig from '../../../config/ai-config.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execPromise = promisify(exec);

export interface VideoGenerationRequest {
  script: string;
  productName: string;
  category: string;
  productImages?: string[];
  duration?: number;
}

export interface VideoGenerationResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  format: string;
  resolution: string;
  size: number;
  status: 'completed' | 'processing' | 'failed';
}

class VideoComposer {
  private readonly outputDir = path.join(process.cwd(), 'temp', 'videos');
  private readonly tempDir = path.join(process.cwd(), 'temp', 'frames');

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Generate video from script and product data
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    if (!aiConfig.features.videoGeneration) {
      console.log('Video generation disabled, returning placeholder');
      return this.getPlaceholderVideo(request);
    }

    try {
      // Check if FFmpeg is available
      if (!await this.checkFFmpegAvailable()) {
        console.warn('FFmpeg not available, using placeholder');
        return this.getPlaceholderVideo(request);
      }

      // Generate video using FFmpeg
      const videoPath = await this.composeVideoWithFFmpeg(request);

      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(videoPath);

      // Upload to cloud storage (if enabled)
      const videoUrl = await this.uploadToStorage(videoPath);
      const thumbnailUrl = await this.uploadToStorage(thumbnailPath);

      // Get video stats
      const stats = await fs.stat(videoPath);

      return {
        videoUrl,
        thumbnailUrl,
        duration: request.duration || 15,
        format: 'mp4',
        resolution: aiConfig.video.resolution,
        size: stats.size,
        status: 'completed',
      };
    } catch (error) {
      console.error('Video generation error:', error);
      return this.getPlaceholderVideo(request);
    }
  }

  /**
   * Compose video using FFmpeg
   */
  private async composeVideoWithFFmpeg(request: VideoGenerationRequest): Promise<string> {
    const outputFile = path.join(
      this.outputDir,
      `reel_${Date.now()}_${request.productName.replace(/\s+/g, '_')}.mp4`
    );

    // Extract text lines from script for overlays
    const textLines = this.extractTextOverlays(request.script);

    // Create a simple video with text overlays
    // This is a simplified version - in production, you'd use templates, transitions, etc.
    
    if (request.productImages && request.productImages.length > 0) {
      // Create video from images with text overlays
      await this.createVideoFromImages(request, outputFile, textLines);
    } else {
      // Create video with colored background and text
      await this.createTextOnlyVideo(request, outputFile, textLines);
    }

    return outputFile;
  }

  /**
   * Create video from product images
   */
  private async createVideoFromImages(
    request: VideoGenerationRequest,
    outputFile: string,
    textLines: string[]
  ): Promise<void> {
    const duration = request.duration || 15;
    const imagesPerSecond = request.productImages!.length / duration;

    // FFmpeg command to create video from images
    const command = `ffmpeg -y \
      -loop 1 -t ${duration} -i ${request.productImages![0]} \
      -vf "scale=${aiConfig.video.resolution.replace('x', ':')},\
           drawtext=text='${this.escapeFFmpegText(request.productName)}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=100" \
      -c:v libx264 -preset fast -crf 23 \
      -r ${aiConfig.video.fps} \
      -pix_fmt yuv420p \
      "${outputFile}"`;

    await execPromise(command);
  }

  /**
   * Create text-only video with colored background
   */
  private async createTextOnlyVideo(
    request: VideoGenerationRequest,
    outputFile: string,
    textLines: string[]
  ): Promise<void> {
    const duration = request.duration || 15;

    // Create video with gradient background and text
    const command = `ffmpeg -y \
      -f lavfi -i color=c=#FF6B9D:s=${aiConfig.video.resolution}:d=${duration} \
      -vf "drawtext=text='${this.escapeFFmpegText(request.productName)}':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
      -c:v libx264 -preset fast -crf 23 \
      -r ${aiConfig.video.fps} \
      -pix_fmt yuv420p \
      "${outputFile}"`;

    await execPromise(command);
  }

  /**
   * Generate video thumbnail
   */
  private async generateThumbnail(videoPath: string): Promise<string> {
    const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');

    const command = `ffmpeg -y -i "${videoPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`;
    await execPromise(command);

    return thumbnailPath;
  }

  /**
   * Upload to cloud storage (Cloudinary, S3, etc.)
   */
  private async uploadToStorage(filePath: string): Promise<string> {
    if (!aiConfig.storage.cloudinary.enabled) {
      // Return local file path if cloud storage not configured
      return `/temp/videos/${path.basename(filePath)}`;
    }

    try {
      // In production, implement Cloudinary upload
      // For now, return mock URL
      const filename = path.basename(filePath);
      return `https://res.cloudinary.com/${aiConfig.storage.cloudinary.cloudName}/video/upload/${filename}`;
    } catch (error) {
      console.error('Upload error:', error);
      return `/temp/videos/${path.basename(filePath)}`;
    }
  }

  /**
   * Check if FFmpeg is available
   */
  private async checkFFmpegAvailable(): Promise<boolean> {
    try {
      await execPromise('ffmpeg -version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract text overlays from script
   */
  private extractTextOverlays(script: string): string[] {
    const lines = script.split('\n').filter(line => line.trim().length > 0);
    return lines.slice(0, 5); // First 5 lines for overlay
  }

  /**
   * Escape text for FFmpeg
   */
  private escapeFFmpegText(text: string): string {
    return text
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/\\/g, '\\\\');
  }

  /**
   * Placeholder video when generation not available
   */
  private getPlaceholderVideo(request: VideoGenerationRequest): VideoGenerationResult {
    return {
      videoUrl: `https://placeholder.com/video/${request.productName}`,
      thumbnailUrl: `https://placeholder.com/thumbnail/${request.productName}`,
      duration: request.duration || 15,
      format: 'mp4',
      resolution: '1080x1920',
      size: 0,
      status: 'processing',
    };
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Directory creation error:', error);
    }
  }
}

export const videoComposer = new VideoComposer();

