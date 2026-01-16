import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  predictPrice
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes (Women entrepreneurs only)
router.post('/', authenticate, authorize('woman'), createProduct);
router.put('/:id', authenticate, authorize('woman'), updateProduct);
router.delete('/:id', authenticate, authorize('woman'), deleteProduct);
router.post('/:id/predict-price', authenticate, predictPrice);

export default router;

