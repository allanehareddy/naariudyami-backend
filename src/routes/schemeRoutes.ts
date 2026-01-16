import express from 'express';
import {
  getSchemes,
  getScheme,
  createScheme,
  updateScheme,
  deleteScheme
} from '../controllers/schemeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getSchemes);
router.get('/:id', getScheme);

// Protected routes (for admin - can be added later)
router.post('/', createScheme);
router.put('/:id', updateScheme);
router.delete('/:id', deleteScheme);

export default router;

