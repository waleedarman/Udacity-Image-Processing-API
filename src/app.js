"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const imageRoutes_1 = __importDefault(require("./routes/imageRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});
app.use('/api/images', imageRoutes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});
app.get('/', (req, res) => {
    res.json({
        message: 'Image Processing API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            listImages: '/api/images',
            getImageMetadata: '/api/images/:filename',
            resizeImage: '/api/images/:filename/resize?width=300&height=300',
            placeholderImage: '/api/images/:filename/placeholder?width=300&height=300',
        },
    });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});
app.use((err, req, res) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Something went wrong',
    });
});
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Image Processing API server running on port ${PORT}`);
        console.log(`📖 API documentation: http://localhost:${PORT}/`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
}
exports.default = app;
//# sourceMappingURL=app.js.map