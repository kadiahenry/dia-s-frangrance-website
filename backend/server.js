require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const fs = require('fs/promises');
const path = require('path');
const pool = require('./config/db');
const { ensureSchema } = require('./config/schema');
const protect = require('./middleware/auth.middleware');
const adminOnly = require('./middleware/admin.middleware');

const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const productRoutes = require('./routes/product.routes');
const homeContentRoutes = require('./routes/home-content.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadsDir = path.join(__dirname, 'uploads');
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: isProduction
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '12mb' }));
app.use('/uploads', express.static(uploadsDir, {
  maxAge: isProduction ? '30d' : '1h',
  immutable: isProduction
}));

app.get('/', (req, res) => {
  res.json({
    message: 'Dias Fragrance API is running.',
    health: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/uploads', protect, adminOnly, async (req, res) => {
  try {
    const { filename, contentType, data } = req.body;

    if (!filename || !contentType || !data) {
      return res.status(400).json({ message: 'filename, contentType, and data are required.' });
    }

    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image uploads are allowed.' });
    }

    const ext = path.extname(filename) || '.png';
    const safeName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '-');
    const storedFilename = `${Date.now()}-${safeName}${ext}`;
    const filePath = path.join(uploadsDir, storedFilename);

    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, Buffer.from(data, 'base64'));

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${storedFilename}`;
    res.status(201).json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Unable to upload image.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/home-content', homeContentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'The uploaded image is too large. Please use a smaller image file.'
    });
  }

  res.status(error.status || 500).json({
    message: error.message || 'Internal server error.'
  });
});

async function start() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected');
    await ensureSchema();
    connection.release();

    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
