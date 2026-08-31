import express from 'express';
import { validateEnvironment } from './config/env.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { redisClient } from './config/redis.js';
import { startClickWorker, stopClickWorker } from './services/batchWorker.js';

import campaignRoutes from './routes/campaign.route.js';
import offerRoutes from './routes/offer.route.js';
import landerRoutes from './routes/lander.route.js';
import linkRoutes from './routes/link.route.js';
import postBackRoutes from './routes/postback.router.js';
import userRoutes from './routes/user.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import redirectRoutes from './routes/redirect.route.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or S2S postbacks) or any localhost/frontend origin
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Express trust proxy (crucial for reading real client IP from X-Forwarded-For)
app.set('trust proxy', true);

// Fast Direct Redirect Engine route: GET /go/:slug
app.use('/', redirectRoutes);

// Postback webhook endpoints (Support direct /postback as well as /api/postback and /api/rules)
app.use('/postback', postBackRoutes);
app.use('/api/postback', postBackRoutes);
app.use('/api/rules', postBackRoutes);

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve lander redirect script
app.get('/lander-redirect.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, '../public/lander-redirect.js'));
});

// Serve demo lander page
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/lander-demo.html'));
});

// Management & Analytics API Routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/landers', landerRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Standard Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

const startServer = async () => {
  try {
    validateEnvironment();
    await connectDB();
    startClickWorker();

    app.listen(PORT, () => {
      console.log(`[Server] Routing Engine running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Boot Error]: Failed to initialize app', err);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  stopClickWorker();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] Terminating gracefully...');
  stopClickWorker();
  await redisClient.quit();
  process.exit(0);
});