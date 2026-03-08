# 🖼️ Image Processing API | واجهة معالجة الصور البرمجية

[English](#english-version) | [العربية](#النسخة-العربية)

---

<a name="النسخة-العربية"></a>
## 🇸🇦 النسخة العربية

واجهة برمجية متطورة وقابلة للتطوير مبنية باستخدام **Node.js** و **TypeScript** لمعالجة الصور وتغيير أحجامها مع خاصية التخزين المؤقت (Caching). يخدم هذا المشروع غرضين أساسيين:

1.  **إنشاء الصور التجريبية (Placeholder API)**: توليد صور بأبعاد مخصصة للاستخدام في النماذج الأولية.
2.  **خدمة تغيير حجم الصور (Image Resizing)**: تغيير حجم الصور ديناميكياً وتقليل حجمها لتسريع تحميل الصفحات.

### ✨ المميزات
- 🚀 **أداء عالي**: يعتمد على مكتبة `Sharp` لمعالجة الصور بسرعة فائقة.
- 💾 **تخزين مؤقت ذكي**: يقوم بحفظ الصور المعالجة لتسريع الاستجابة في الطلبات المتكررة.
- 🔒 **أمان النوع (Type Safety)**: مبني بالكامل باستخدام TypeScript لضمان كود نظيف وأخطاء أقل.
- ✅ **اختبارات شاملة**: يتضمن اختبارات وحدة واختبارات تكاملية باستخدام Jasmine.
- 🎨 **تنسيقات متعددة**: يدعم JPEG و PNG و WebP.

### �️ التثبيت والتشغيل

1. **تثبيت المكتبات**:
   ```bash
   npm install
   ```

2. **بناء المشروع**:
   ```bash
   npm run build
   ```

3. **التشغيل**:
   ```bash
   # وضع التطوير
   npm run dev
   
   # وضع الإنتاج
   npm start
   ```

### 📡 مسارات الواجهة (Endpoints)

- **الحالة**: `GET /health` (للتأكد من عمل الخادم)
- **قائمة الصور**: `GET /api/images` (لعرض كل الصور المتاحة)
- **تغيير الحجم**: `GET /api/images/:filename/resize?width=300&height=200`
- **صورة تجريبية**: `GET /api/images/:filename/placeholder?width=300&height=200`

---

<a name="english-version"></a>
## 🚀 English Version

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
