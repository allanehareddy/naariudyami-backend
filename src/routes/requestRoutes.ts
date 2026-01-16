import express from 'express';
import {
  getRequests,
  getRequest,
  createRequest,
  updateRequestStatus,
  deleteRequest
} from '../controllers/requestController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getRequests);
router.get('/:id', getRequest);
router.post('/', authorize('customer'), createRequest);
router.patch('/:id', authorize('woman'), updateRequestStatus);
router.delete('/:id', authorize('customer'), deleteRequest);

export default router;

