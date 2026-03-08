"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
describe('API Endpoints', () => {
    const testFullSizeDir = 'full-size';
    const testImageName = 'test-api-image.jpg';
    beforeAll(async () => {
        await promises_1.default.mkdir(testFullSizeDir, { recursive: true });
        const sharp = require('sharp');
        const testImageBuffer = await sharp({
            create: {
                width: 800,
                height: 600,
                channels: 3,
                background: { r: 0, g: 255, b: 0 }
            }
        })
            .jpeg()
            .toBuffer();
        await promises_1.default.writeFile(path_1.default.join(testFullSizeDir, testImageName), testImageBuffer);
    });
    afterAll(async () => {
        try {
            await promises_1.default.unlink(path_1.default.join(testFullSizeDir, testImageName));
        }
        catch (error) {
            console.error('Error cleaning up test image:', error);
        }
    });
    describe('GET /', () => {
        it('should return API information', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/')
                .expect(200);
            expect(response.body).toHaveProperty('message', 'Image Processing API');
            expect(response.body).toHaveProperty('version', '1.0.0');
            expect(response.body).toHaveProperty('endpoints');
        });
    });
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/health')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBeDefined();
            expect(response.body.endpoints).toBeDefined();
        });
    });
    describe('GET /api/images', () => {
        it('should return list of available images', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/images')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.count).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });
    describe('GET /api/images/:filename', () => {
        it('should return metadata for existing image', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.filename).toBe(testImageName);
            expect(response.body.data.metadata).toBeDefined();
            expect(response.body.data.metadata.width).toBe(800);
            expect(response.body.data.metadata.height).toBe(600);
        });
        it('should return 404 for non-existent image', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/images/non-existent.jpg')
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });
    describe('GET /api/images/:filename/resize', () => {
        it('should resize image with valid parameters', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ width: 300, height: 200 })
                .expect(200);
            expect(response.headers['content-type']).toMatch(/image\/jpeg/);
        });
        it('should return 400 for missing width parameter', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ height: 200 })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('Width and height parameters are required');
        });
        it('should return 400 for missing height parameter', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ width: 300 })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('Width and height parameters are required');
        });
        it('should return 400 for invalid width (non-numeric)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ width: 'invalid', height: 200 })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('must be valid numbers');
        });
        it('should return 400 for negative dimensions', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ width: -100, height: 200 })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('must be positive numbers');
        });
        it('should return 400 for zero dimensions', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ width: 0, height: 200 })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('must be positive numbers');
        });
        it('should return 400 for invalid quality', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ width: 300, height: 200, quality: 150 })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('Quality must be between 1 and 100');
        });
        it('should handle different image formats', async () => {
            const pngResponse = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ width: 150, height: 100, format: 'png' })
                .expect(200);
            expect(pngResponse.headers['content-type']).toMatch(/image\/png/);
            const webpResponse = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/resize`)
                .query({ width: 200, height: 150, format: 'webp' })
                .expect(200);
            expect(webpResponse.headers['content-type']).toMatch(/image\/webp/);
        });
        it('should return 404 for non-existent image', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/images/non-existent.jpg/resize')
                .query({ width: 300, height: 200 })
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });
    describe('GET /api/images/:filename/placeholder', () => {
        it('should generate placeholder image with valid parameters', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/placeholder`)
                .query({ width: 300, height: 200 })
                .expect(200);
            expect(response.headers['content-type']).toMatch(/image\/jpeg/);
        });
        it('should generate placeholder with custom text', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/placeholder`)
                .query({ width: 300, height: 200, text: 'Custom Placeholder' })
                .expect(200);
            expect(response.headers['content-type']).toMatch(/image\/jpeg/);
        });
        it('should return 400 for missing width parameter', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/placeholder`)
                .query({ height: 200 })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('Width and height parameters are required');
        });
        it('should return 400 for missing height parameter', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/placeholder`)
                .query({ width: 300 })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('Width and height parameters are required');
        });
        it('should handle different formats for placeholder', async () => {
            const pngResponse = await (0, supertest_1.default)(app_1.default)
                .get(`/api/images/${testImageName}/placeholder`)
                .query({ width: 150, height: 100, format: 'png' })
                .expect(200);
            expect(pngResponse.headers['content-type']).toMatch(/image\/png/);
        });
    });
    describe('404 Handler', () => {
        it('should return 404 for non-existent endpoints', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/non-existent-endpoint')
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });
});
//# sourceMappingURL=api.spec.js.map