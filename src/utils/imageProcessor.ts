import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ImageProcessingOptions {
  width: number;
  height: number;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export class ImageProcessor {
  private readonly fullSizeDir: string;
  private readonly thumbDir: string;

  constructor(fullSizeDir = 'full-size', thumbDir = 'thumb') {
    this.fullSizeDir = fullSizeDir;
    this.thumbDir = thumbDir;
  }

  /**
   * Process an image by resizing and saving it to the thumbnail directory
   * @param filename - The name of the image file
   * @param options - Processing options including width and height
   * @returns Promise<string> - The path to the processed image
   */
  public async processImage(
    filename: string,
    options: ImageProcessingOptions
  ): Promise<string> {
    this.validateInputs(filename, options);

    const sourcePath = path.join(this.fullSizeDir, filename);
    const thumbFilename = this.generateThumbFilename(filename, options);
    const outputPath = path.join(this.thumbDir, thumbFilename);

    // Check if source image exists
    await this.validateSourceImage(sourcePath);

    // Check if thumbnail already exists
    if (await this.fileExists(outputPath)) {
      return outputPath;
    }

    // Ensure thumb directory exists
    await this.ensureDirectoryExists(this.thumbDir);

    // Process the image
    await this.resizeImage(sourcePath, outputPath, options);

    return outputPath;
  }

  /**
   * Generate a unique filename for the thumbnail including dimensions
   * @param filename - Original filename
   * @param options - Processing options
   * @returns string - Generated thumbnail filename
   */
  private generateThumbFilename(
    filename: string,
    options: ImageProcessingOptions
  ): string {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const format = options.format || 'jpeg';
    return `${name}_${options.width}x${options.height}.${format}`;
  }

  /**
   * Validate input parameters
   * @param filename - Image filename
   * @param options - Processing options
   */
  private validateInputs(
    filename: string,
    options: ImageProcessingOptions
  ): void {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Filename must be a non-empty string');
    }

    if (!options.width || !options.height) {
      throw new Error('Width and height are required');
    }

    if (options.width <= 0 || options.height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }

    if (!Number.isInteger(options.width) || !Number.isInteger(options.height)) {
      throw new Error('Width and height must be integers');
    }

    if (options.quality && (options.quality < 1 || options.quality > 100)) {
      throw new Error('Quality must be between 1 and 100');
    }
  }

  /**
   * Validate that the source image exists
   * @param sourcePath - Path to the source image
   */
  private async validateSourceImage(sourcePath: string): Promise<void> {
    if (!(await this.fileExists(sourcePath))) {
      throw new Error(`Source image not found: ${sourcePath}`);
    }
  }

  /**
   * Check if a file exists
   * @param filePath - Path to the file
   * @returns Promise<boolean> - True if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure a directory exists, create if it doesn't
   * @param dirPath - Path to the directory
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Resize an image using Sharp
   * @param inputPath - Path to input image
   * @param outputPath - Path to output image
   * @param options - Processing options
   */
  private async resizeImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions
  ): Promise<void> {
    let pipeline = sharp(inputPath).resize(options.width, options.height, {
      fit: 'cover',
      position: 'center',
    });

    const format = options.format || 'jpeg';

    if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: options.quality || 80 });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality: options.quality || 80 });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality: options.quality || 80 });
    }

    await pipeline.toFile(outputPath);
  }

  /**
   * Get image metadata
   * @param filename - Image filename
   * @returns Promise<sharp.Metadata> - Image metadata
   */
  public async getImageMetadata(filename: string): Promise<sharp.Metadata> {
    const sourcePath = path.join(this.fullSizeDir, filename);
    await this.validateSourceImage(sourcePath);

    const metadata = await sharp(sourcePath).metadata();
    return metadata;
  }

  /**
   * List all available images in the full-size directory
   * @returns Promise<string[]> - Array of filenames
   */
  public async listAvailableImages(): Promise<string[]> {
    try {
      await this.ensureDirectoryExists(this.fullSizeDir);
      const files = await fs.readdir(this.fullSizeDir);

      // Filter for common image extensions
      const imageExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.bmp',
        '.webp',
        '.tiff',
      ];
      return files.filter((file) =>
        imageExtensions.includes(path.extname(file).toLowerCase())
      );
    } catch (error) {
      throw new Error(
        `Failed to list images: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
