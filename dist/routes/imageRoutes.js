"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imageProcessor_1 = require("../utils/imageProcessor");
const router = (0, express_1.Router)();
const imageProcessor = new imageProcessor_1.ImageProcessor();
router.get('/', async (req, res) => {
    try {
        const images = await imageProcessor.listAvailableImages();
        res.json({
            success: true,
            data: images,
            count: images.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list images',
        });
    }
});
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename) {
            res.status(400).json({
                success: false,
                error: 'Filename is required',
            });
            return;
        }
        const metadata = await imageProcessor.getImageMetadata(filename);
        res.json({
            success: true,
            data: {
                filename,
                metadata,
            },
        });
    }
    catch (error) {
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get image metadata',
        });
    }
});
router.get('/:filename/resize', async (req, res) => {
    try {
        const { filename } = req.params;
        const { width, height, format, quality } = req.query;
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
        const parsedWidth = parseInt(width, 10);
        const parsedHeight = parseInt(height, 10);
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
        let parsedQuality;
        if (quality) {
            parsedQuality = parseInt(quality, 10);
            if (isNaN(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
                res.status(400).json({
                    success: false,
                    error: 'Quality must be between 1 and 100',
                });
                return;
            }
        }
        const validFormats = ['jpeg', 'png', 'webp'];
        const imageFormat = format && validFormats.includes(format)
            ? format
            : 'jpeg';
        const options = {
            width: parsedWidth,
            height: parsedHeight,
            format: imageFormat,
            quality: parsedQuality || 80,
        };
        const processedImagePath = await imageProcessor.processImage(filename, options);
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
    }
    catch (error) {
        const statusCode = error instanceof Error && error.message.includes('not found')
            ? 404
            : 400;
        res.status(statusCode).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process image',
        });
    }
});
router.get('/:filename/placeholder', async (req, res) => {
    try {
        const { width, height, format, quality, text } = req.query;
        if (!width || !height) {
            res.status(400).json({
                success: false,
                error: 'Width and height parameters are required',
            });
            return;
        }
        const parsedWidth = parseInt(width, 10);
        const parsedHeight = parseInt(height, 10);
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
        let parsedQuality;
        if (quality) {
            parsedQuality = parseInt(quality, 10);
            if (isNaN(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
                res.status(400).json({
                    success: false,
                    error: 'Quality must be between 1 and 100',
                });
                return;
            }
        }
        const validFormats = ['jpeg', 'png', 'webp'];
        const imageFormat = format && validFormats.includes(format)
            ? format
            : 'jpeg';
        const placeholderText = text
            ? text
            : `${parsedWidth}x${parsedHeight}`;
        const placeholderFilename = `placeholder_${parsedWidth}x${parsedHeight}_${Date.now()}.${imageFormat}`;
        const outputPath = `thumb/${placeholderFilename}`;
        const fs = require('fs/promises');
        try {
            await fs.access('thumb');
        }
        catch {
            await fs.mkdir('thumb', { recursive: true });
        }
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
            .png();
        if (imageFormat === 'jpeg') {
            pipeline = pipeline.jpeg({ quality: parsedQuality || 80 });
        }
        else if (imageFormat === 'png') {
            pipeline = pipeline.png({ quality: parsedQuality || 80 });
        }
        else if (imageFormat === 'webp') {
            pipeline = pipeline.webp({ quality: parsedQuality || 80 });
        }
        await pipeline.toFile(outputPath);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error
                ? error.message
                : 'Failed to generate placeholder image',
        });
    }
});
exports.default = router;
//# sourceMappingURL=imageRoutes.js.map