import express from 'express';
import cors from 'cors';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { trackTiming } from './middleware/timing';
import { factRoutes } from './routes/facts.routes';
import { authRoutes } from './routes/auth.routes';
import { placeAdminRoutes } from './routes/places.routes';
import { metricsRoutes } from './routes/metrics.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(trackTiming);

// Health check (no auth, used by nginx + orchestrator)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api', factRoutes);
app.use('/api/admin', placeAdminRoutes);
app.use('/api/metrics', metricsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`World Facts backend listening on port ${PORT}`);
});

export { app };
