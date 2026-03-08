"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProcessor = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class ImageProcessor {
    constructor(fullSizeDir = 'full-size', thumbDir = 'thumb') {
        this.fullSizeDir = fullSizeDir;
        this.thumbDir = thumbDir;
    }
    async processImage(filename, options) {
        this.validateInputs(filename, options);
        const sourcePath = path_1.default.join(this.fullSizeDir, filename);
        const thumbFilename = this.generateThumbFilename(filename, options);
        const outputPath = path_1.default.join(this.thumbDir, thumbFilename);
        await this.validateSourceImage(sourcePath);
        if (await this.fileExists(outputPath)) {
            return outputPath;
        }
        await this.ensureDirectoryExists(this.thumbDir);
        await this.resizeImage(sourcePath, outputPath, options);
        return outputPath;
    }
    generateThumbFilename(filename, options) {
        const ext = path_1.default.extname(filename);
        const name = path_1.default.basename(filename, ext);
        const format = options.format || 'jpeg';
        return `${name}_${options.width}x${options.height}.${format}`;
    }
    validateInputs(filename, options) {
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
    async validateSourceImage(sourcePath) {
        if (!(await this.fileExists(sourcePath))) {
            throw new Error(`Source image not found: ${sourcePath}`);
        }
    }
    async fileExists(filePath) {
        try {
            await promises_1.default.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async ensureDirectoryExists(dirPath) {
        try {
            await promises_1.default.access(dirPath);
        }
        catch {
            await promises_1.default.mkdir(dirPath, { recursive: true });
        }
    }
    async resizeImage(inputPath, outputPath, options) {
        let pipeline = (0, sharp_1.default)(inputPath).resize(options.width, options.height, {
            fit: 'cover',
            position: 'center',
        });
        const format = options.format || 'jpeg';
        if (format === 'jpeg') {
            pipeline = pipeline.jpeg({ quality: options.quality || 80 });
        }
        else if (format === 'png') {
            pipeline = pipeline.png({ quality: options.quality || 80 });
        }
        else if (format === 'webp') {
            pipeline = pipeline.webp({ quality: options.quality || 80 });
        }
        await pipeline.toFile(outputPath);
    }
    async getImageMetadata(filename) {
        const sourcePath = path_1.default.join(this.fullSizeDir, filename);
        await this.validateSourceImage(sourcePath);
        const metadata = await (0, sharp_1.default)(sourcePath).metadata();
        return metadata;
    }
    async listAvailableImages() {
        try {
            await this.ensureDirectoryExists(this.fullSizeDir);
            const files = await promises_1.default.readdir(this.fullSizeDir);
            const imageExtensions = [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif',
                '.bmp',
                '.webp',
                '.tiff',
            ];
            return files.filter((file) => imageExtensions.includes(path_1.default.extname(file).toLowerCase()));
        }
        catch (error) {
            throw new Error(`Failed to list images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.ImageProcessor = ImageProcessor;
//# sourceMappingURL=imageProcessor.js.map