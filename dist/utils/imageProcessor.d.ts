import sharp from 'sharp';
export interface ImageProcessingOptions {
    width: number;
    height: number;
    format?: 'jpeg' | 'png' | 'webp';
    quality?: number;
}
export declare class ImageProcessor {
    private readonly fullSizeDir;
    private readonly thumbDir;
    constructor(fullSizeDir?: string, thumbDir?: string);
    processImage(filename: string, options: ImageProcessingOptions): Promise<string>;
    private generateThumbFilename;
    private validateInputs;
    private validateSourceImage;
    private fileExists;
    private ensureDirectoryExists;
    private resizeImage;
    getImageMetadata(filename: string): Promise<sharp.Metadata>;
    listAvailableImages(): Promise<string[]>;
}
//# sourceMappingURL=imageProcessor.d.ts.map