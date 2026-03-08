import { ImageProcessor } from '../src/utils/imageProcessor';
import fs from 'fs/promises';
import path from 'path';

describe('ImageProcessor', () => {
  let imageProcessor: ImageProcessor;
  const testFullSizeDir = 'test-full-size';
  const testThumbDir = 'test-thumb';
  const testImageName = 'test-image.jpg';

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(testFullSizeDir, { recursive: true });
    await fs.mkdir(testThumbDir, { recursive: true });

    // Create a simple test image using Sharp
    const sharp = require('sharp');
    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .jpeg()
      .toBuffer();

    await fs.writeFile(path.join(testFullSizeDir, testImageName), testImageBuffer);

    imageProcessor = new ImageProcessor(testFullSizeDir, testThumbDir);
  });

  afterAll(async () => {
    // Clean up test directories
    try {
      await fs.rm(testFullSizeDir, { recursive: true, force: true });
      await fs.rm(testThumbDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up test directories:', error);
    }
  });

  describe('processImage', () => {
    it('should successfully process an image with valid parameters', async () => {
      const options = {
        width: 300,
        height: 200,
        format: 'jpeg' as const,
        quality: 80
      };

      const result = await imageProcessor.processImage(testImageName, options);

      expect(result).toContain(testThumbDir);
      expect(result).toContain('test-image_300x200.jpeg');
      
      // Verify the file exists
      const stats = await fs.stat(result);
      expect(stats.isFile()).toBe(true);
    });

    it('should return existing thumbnail if it already exists', async () => {
      const options = {
        width: 300,
        height: 200,
        format: 'jpeg' as const
      };

      // First call creates the thumbnail
      const firstResult = await imageProcessor.processImage(testImageName, options);
      
      // Second call should return the same path
      const secondResult = await imageProcessor.processImage(testImageName, options);
      
      expect(firstResult).toBe(secondResult);
    });

    it('should throw error for missing filename', async () => {
      const options = {
        width: 300,
        height: 200
      };

      await expectAsync(imageProcessor.processImage('', options))
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringContaining('Filename must be a non-empty string')
        }));
    });

    it('should throw error for missing width', async () => {
      const options = {
        width: 0,
        height: 200
      };

      await expectAsync(imageProcessor.processImage(testImageName, options))
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringContaining('Width and height are required')
        }));
    });

    it('should throw error for missing height', async () => {
      const options = {
        width: 300,
        height: 0
      };

      await expectAsync(imageProcessor.processImage(testImageName, options))
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringContaining('Width and height are required')
        }));
    });

    it('should throw error for negative dimensions', async () => {
      const options = {
        width: -100,
        height: 200
      };

      await expectAsync(imageProcessor.processImage(testImageName, options))
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringContaining('Width and height must be positive numbers')
        }));
    });

    it('should throw error for non-existent image', async () => {
      const options = {
        width: 300,
        height: 200
      };

      await expectAsync(imageProcessor.processImage('non-existent.jpg', options))
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringContaining('Source image not found')
        }));
    });

    it('should throw error for invalid quality', async () => {
      const options = {
        width: 300,
        height: 200,
        quality: 150
      };

      await expectAsync(imageProcessor.processImage(testImageName, options))
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringContaining('Quality must be between 1 and 100')
        }));
    });

    it('should process different image formats', async () => {
      const pngOptions = {
        width: 150,
        height: 100,
        format: 'png' as const
      };

      const pngResult = await imageProcessor.processImage(testImageName, pngOptions);
      expect(pngResult).toContain('test-image_150x100.png');

      const webpOptions = {
        width: 200,
        height: 150,
        format: 'webp' as const
      };

      const webpResult = await imageProcessor.processImage(testImageName, webpOptions);
      expect(webpResult).toContain('test-image_200x150.webp');
    });
  });

  describe('getImageMetadata', () => {
    it('should return metadata for existing image', async () => {
      const metadata = await imageProcessor.getImageMetadata(testImageName);

      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
      expect(metadata.format).toBe('jpeg');
    });

    it('should throw error for non-existent image', async () => {
      await expectAsync(imageProcessor.getImageMetadata('non-existent.jpg'))
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringContaining('Source image not found')
        }));
    });
  });

  describe('listAvailableImages', () => {
    it('should return list of available images', async () => {
      const images = await imageProcessor.listAvailableImages();

      expect(images).toContain(testImageName);
      expect(images.length).toBeGreaterThan(0);
    });

    it('should filter only image files', async () => {
      // Create a non-image file
      await fs.writeFile(path.join(testFullSizeDir, 'test.txt'), 'This is not an image');

      const images = await imageProcessor.listAvailableImages();

      expect(images).toContain(testImageName);
      expect(images).not.toContain('test.txt');
    });
  });
});
