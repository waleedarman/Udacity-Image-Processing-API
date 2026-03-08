import { Router, Request, Response } from 'express';
import { ImageProcessor } from '../utils/imageProcessor';

const router = Router();
const imageProcessor = new ImageProcessor();

/**
 * GET /api/images
 * List all available images
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const images = await imageProcessor.listAvailableImages();
    res.json({
      success: true,
      data: images,
      count: images.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list images',
    });
  }
});

/**
 * GET /api/images/:filename
 * Get image metadata
 */
router.get('/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;

    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'Filename is required',
      });
      return;
    }

    const metadata = await imageProcessor.getImageMetadata(filename as string);
    res.json({
      success: true,
      data: {
        filename,
        metadata,
      },
    });
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get image metadata',
    });
  }
});

/**
 * GET /api/images/:filename/resize
 * Resize an image with specified dimensions
 * Query parameters:
 * - width: number (required)
 * - height: number (required)
 * - format: 'jpeg' | 'png' | 'webp' (optional, default: 'jpeg')
 * - quality: number (optional, default: 80)
 */
router.get(
  '/:filename/resize',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;
      const { width, height, format, quality } = req.query;

      // Validate required parameters
      if (!filename) {
        res.status(400).json({
          success: false,
          error: 'Filename is required',
        });
        return;
      }

      if (!width || !height) {
        res.status(400).json({
          success: false,
          error: 'Width and height parameters are required',
        });
        return;
      }

      // Parse and validate dimensions
      const parsedWidth = parseInt(width as string, 10);
      const parsedHeight = parseInt(height as string, 10);

      if (isNaN(parsedWidth) || isNaN(parsedHeight)) {
        res.status(400).json({
          success: false,
          error: 'Width and height must be valid numbers',
        });
        return;
      }

      if (parsedWidth <= 0 || parsedHeight <= 0) {
        res.status(400).json({
          success: false,
          error: 'Width and height must be positive numbers',
        });
        return;
      }

      // Parse optional parameters
      let parsedQuality: number | undefined;
      if (quality) {
        parsedQuality = parseInt(quality as string, 10);
        if (isNaN(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
          res.status(400).json({
            success: false,
            error: 'Quality must be between 1 and 100',
          });
          return;
        }
      }

      const validFormats = ['jpeg', 'png', 'webp'];
      const imageFormat =
        format && validFormats.includes(format as string)
          ? (format as 'jpeg' | 'png' | 'webp')
          : 'jpeg';

      // Process the image
      const options = {
        width: parsedWidth,
        height: parsedHeight,
        format: imageFormat,
        quality: parsedQuality || 80,
      };

      const processedImagePath = await imageProcessor.processImage(
        filename as string,
        options
      );

      // Send the processed image
      res.sendFile(processedImagePath, { root: '.' }, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Failed to send processed image',
            });
          }
        }
      });
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes('not found')
          ? 404
          : 400;
      res.status(statusCode).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process image',
      });
    }
  }
);

/**
 * GET /api/images/:filename/placeholder
 * Generate a placeholder image with specified dimensions
 * Query parameters:
 * - width: number (required)
 * - height: number (required)
 * - format: 'jpeg' | 'png' | 'webp' (optional, default: 'jpeg')
 * - quality: number (optional, default: 80)
 * - text: string (optional, default: dimensions)
 */
router.get(
  '/:filename/placeholder',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { width, height, format, quality, text } = req.query;

      // Validate required parameters
      if (!width || !height) {
        res.status(400).json({
          success: false,
          error: 'Width and height parameters are required',
        });
        return;
      }

      // Parse and validate dimensions
      const parsedWidth = parseInt(width as string, 10);
      const parsedHeight = parseInt(height as string, 10);

      if (isNaN(parsedWidth) || isNaN(parsedHeight)) {
        res.status(400).json({
          success: false,
          error: 'Width and height must be valid numbers',
        });
        return;
      }

      if (parsedWidth <= 0 || parsedHeight <= 0) {
        res.status(400).json({
          success: false,
          error: 'Width and height must be positive numbers',
        });
        return;
      }

      // Parse optional parameters
      let parsedQuality: number | undefined;
      if (quality) {
        parsedQuality = parseInt(quality as string, 10);
        if (isNaN(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
          res.status(400).json({
            success: false,
            error: 'Quality must be between 1 and 100',
          });
          return;
        }
      }

      const validFormats = ['jpeg', 'png', 'webp'];
      const imageFormat =
        format && validFormats.includes(format as string)
          ? (format as 'jpeg' | 'png' | 'webp')
          : 'jpeg';

      // Generate placeholder filename
      const placeholderText = text
        ? (text as string)
        : `${parsedWidth}x${parsedHeight}`;
      const placeholderFilename = `placeholder_${parsedWidth}x${parsedHeight}_${Date.now()}.${imageFormat}`;
      const outputPath = `thumb/${placeholderFilename}`;

      // Ensure thumb directory exists
      const fs = require('fs/promises');
      try {
        await fs.access('thumb');
      } catch {
        await fs.mkdir('thumb', { recursive: true });
      }

      // Create a simple placeholder image using Sharp
      const sharp = require('sharp');
      const svg = `
      <svg width="${parsedWidth}" height="${parsedHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e0e0e0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" fill="#666">
          ${placeholderText}
        </text>
      </svg>
    `;

      let pipeline = sharp(Buffer.from(svg))
        .resize(parsedWidth, parsedHeight)
        .png(); // Start with PNG for SVG

      if (imageFormat === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: parsedQuality || 80 });
      } else if (imageFormat === 'png') {
        pipeline = pipeline.png({ quality: parsedQuality || 80 });
      } else if (imageFormat === 'webp') {
        pipeline = pipeline.webp({ quality: parsedQuality || 80 });
      }

      await pipeline.toFile(outputPath);

      // Send the placeholder image
      res.sendFile(outputPath, { root: '.' }, (err) => {
        if (err) {
          console.error('Error sending placeholder file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Failed to send placeholder image',
            });
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate placeholder image',
      });
    }
  }
);

export default router;
