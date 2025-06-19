import { Router } from 'express';
import campaignsRouter from './campaigns';
import metricsRouter from './metrics';
import exportsRouter from './exports';

const router = Router();

// Health check endpoint is now handled in main app (before auth middleware)

// API routes
router.use('/campaigns', campaignsRouter);
router.use('/metrics', metricsRouter);
router.use('/exports', exportsRouter);

export default router;
