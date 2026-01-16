import express from 'express';
import {
  generateReelScript,
  generateProductDescription,
  generateCaption
} from '../controllers/aiController.js';
import {
  generateReelScriptEnhanced,
  generateProductDescriptionEnhanced,
  generateCaptionEnhanced
} from '../controllers/aiControllerEnhanced.js';
import { authenticate, authorize } from '../middleware/auth.js';
import aiConfig from '../config/ai-config.js';

const router = express.Router();

// All AI routes require authentication (primarily for women entrepreneurs)
router.use(authenticate);

// Use enhanced versions if LLM integration is enabled, otherwise use standard versions
const useEnhanced = aiConfig.features.llmIntegration;

router.post(
  '/reels/generate',
  authorize('woman'),
  useEnhanced ? generateReelScriptEnhanced : generateReelScript
);

router.post(
  '/description/generate',
  authorize('woman'),
  useEnhanced ? generateProductDescriptionEnhanced : generateProductDescription
);

router.post(
  '/caption/generate',
  authorize('woman'),
  useEnhanced ? generateCaptionEnhanced : generateCaption
);

export default router;

