import { Router } from 'express';
import campaignsRouter from './campaigns';
import metricsRouter from './metrics';
import exportsRouter from './exports';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Campaign Performance API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/campaigns', campaignsRouter);
router.use('/metrics', metricsRouter);
router.use('/exports', exportsRouter);

export default router;
