import express from 'express';
import {
  getVillageStats,
  getVillageStatsByName,
  predictMarketPrice,
  getPlatformStats
} from '../controllers/hubController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require hub_manager authentication
router.use(authenticate);

router.get('/stats/villages', getVillageStats);
router.get('/stats/villages/:village', getVillageStatsByName);
router.post('/market-price/predict', predictMarketPrice);
router.get('/stats/platform', authorize('hub_manager'), getPlatformStats);

export default router;

