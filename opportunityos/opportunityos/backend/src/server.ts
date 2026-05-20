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

const app = express();

// ── Security & utilities ──────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      ENV.CLIENT_ORIGIN,
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

  app.listen(ENV.PORT, () => {
    console.log(`\n🚀 OpportunityOS API running on port ${ENV.PORT}`);
    console.log(`   Environment : ${ENV.NODE_ENV}`);
    console.log(`   Client      : ${ENV.CLIENT_ORIGIN}`);
    console.log(`   Health      : http://localhost:${ENV.PORT}/api/health\n`);
  });
}

bootstrap().catch(console.error);

export default app;
