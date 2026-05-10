import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import alertsRoutes from './routes/alerts.js';
import { authMiddleware } from './auth.js';

export const createApp = () => {
  const app = express();

  const frontendOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173'
  ].filter(Boolean);

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({
    origin: frontendOrigins,
    credentials: true
  }));

  app.use('/api/auth', authRoutes);
  app.use('/api/alerts', authMiddleware, alertsRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
};
