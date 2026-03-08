# 🖼️ Image Processing API 

---

<a name="english-version"></a>
A scalable **Node.js/TypeScript** API for image processing and resizing with built-in caching. This project is designed for high performance and reliability.

### 🌟 Key Features
- **High Performance**: Powered by the `Sharp` library for lightning-fast processing.
- **Intelligent Caching**: Automatically stores processed images to optimize performance.
- **Robust Testing**: Comprehensive test suite using Jasmine and Supertest.
- **Security**: Implements Helmet, CORS, and input validation.

### 📂 Project Structure
```text
project/
├── src/
│   ├── utils/         # Image processing logic
│   ├── routes/        # API endpoints
│   └── app.ts         # Main configuration
├── full-size/         # Original images
├── thumb/             # Cached images
└── tests/             # Jasmine test files
```

### 💻 Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

### 📑 API Usage Examples

#### Resize an Image
`GET /api/images/santorini.jpg/resize?width=400&height=300`

#### Generate Placeholder
`GET /api/images/test/placeholder?width=200&height=200&text=Hello`

---
## 📄 License
Licensed under [ISC](LICENSE).
