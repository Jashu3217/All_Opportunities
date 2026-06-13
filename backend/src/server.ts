import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { ENV } from './config/app.config';
import { connectMongoDB } from './config/database';
import { connectRedis } from './config/redis';
import router from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { startAlertScheduler } from './controllers/alerts.controller';

const app = express();

// Trust Railway/Vercel proxy
app.set('trust proxy', 1);

// ── Security & utilities ──────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = [
      ENV.CLIENT_ORIGIN,
      /\.vercel\.app$/,
      /^http:\/\/localhost/,
    ];
    const isAllowed = allowed.some(pattern =>
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    );
    if (isAllowed) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods:     ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max:      ENV.RATE_LIMIT_MAX,
  message:  { success:false, error:'Too many requests — please try again later' },
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', router);

// ── 404 + Error handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectMongoDB();
  await connectRedis();

  startAlertScheduler();

  app.listen(ENV.PORT, () => {
    console.log(`\n🚀 OpportunityOS API running on port ${ENV.PORT}`);
    console.log(`   Environment : ${ENV.NODE_ENV}`);
    console.log(`   Client      : ${ENV.CLIENT_ORIGIN}`);
    console.log(`   Health      : http://localhost:${ENV.PORT}/api/health\n`);
  });
}

bootstrap().catch(console.error);

export default app;
// redeploy Sat Jun 13 09:47:06 UTC 2026
