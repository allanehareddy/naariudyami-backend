import express from 'express';
import {
  getEntrepreneurs,
  getEntrepreneur
} from '../controllers/entrepreneurController.js';

const router = express.Router();

// Public routes (no authentication required for browsing)
router.get('/', getEntrepreneurs);
router.get('/:id', getEntrepreneur);

export default router;

