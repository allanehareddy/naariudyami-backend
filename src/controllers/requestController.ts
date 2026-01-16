import { Response } from 'express';
import CustomerRequest from '../models/CustomerRequest.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { transformPopulatedDocument, transformPopulatedDocuments } from '../utils/transform.js';

// Get all requests (filtered by role)
export const getRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { status } = req.query;
    const filter: any = {};

    // Filter based on user role
    if (req.user.role === 'customer') {
      filter.customerId = req.user.userId;
    } else if (req.user.role === 'woman') {
      filter.entrepreneurId = req.user.userId;
    }

    // Filter by status if provided
    if (status && ['pending', 'accepted', 'rejected'].includes(status as string)) {
      filter.status = status;
    }

    const requests = await CustomerRequest.find(filter)
      .populate('customerId', 'name state')
      .populate('entrepreneurId', 'name village district')
      .sort({ createdAt: -1 });

    const transformedRequests = transformPopulatedDocuments(requests);

    res.status(200).json({
      success: true,
      count: transformedRequests.length,
      data: { requests: transformedRequests }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching requests'
    });
  }
};

// Get single request
export const getRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;

    const request = await CustomerRequest.findById(id)
      .populate('customerId', 'name state')
      .populate('entrepreneurId', 'name village district');

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    // Check authorization
    const customerIdStr = typeof request.customerId === 'string' 
      ? request.customerId 
      : (request.customerId as any)?._id?.toString() || request.customerId;
    const entrepreneurIdStr = typeof request.entrepreneurId === 'string' 
      ? request.entrepreneurId 
      : (request.entrepreneurId as any)?._id?.toString() || request.entrepreneurId;

    if (
      customerIdStr !== req.user.userId &&
      entrepreneurIdStr !== req.user.userId
    ) {
      throw new AppError('Not authorized to view this request', 403);
    }

    const transformedRequest = transformPopulatedDocument(request);

    res.status(200).json({
      success: true,
      data: { request: transformedRequest }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching request'
    });
  }
};

// Create new request
export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user.role !== 'customer') {
      throw new AppError('Only customers can create requests', 403);
    }

    const { entrepreneurId, message } = req.body;

    // Validation
    if (!entrepreneurId || !message) {
      throw new AppError('Entrepreneur ID and message are required', 400);
    }

    // Check if entrepreneur exists and has 'woman' role
    const entrepreneur = await User.findById(entrepreneurId);
    if (!entrepreneur) {
      throw new AppError('Entrepreneur not found', 404);
    }
    if (entrepreneur.role !== 'woman') {
      throw new AppError('Invalid entrepreneur ID', 400);
    }

    const request = await CustomerRequest.create({
      customerId: req.user.userId,
      entrepreneurId,
      message,
      status: 'pending'
    });

    const populatedRequest = await CustomerRequest.findById(request._id)
      .populate('customerId', 'name state')
      .populate('entrepreneurId', 'name village district');

    const transformedRequest = transformPopulatedDocument(populatedRequest);

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: { request: transformedRequest }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating request'
    });
  }
};

// Update request status
export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user.role !== 'woman') {
      throw new AppError('Only entrepreneurs can update request status', 403);
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validation
    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      throw new AppError('Invalid status. Must be: pending, accepted, or rejected', 400);
    }

    const request = await CustomerRequest.findById(id);

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    // Check authorization - only the entrepreneur can update
    if (request.entrepreneurId.toString() !== req.user.userId) {
      throw new AppError('Not authorized to update this request', 403);
    }

    request.status = status;
    await request.save();

    const updatedRequest = await CustomerRequest.findById(id)
      .populate('customerId', 'name state')
      .populate('entrepreneurId', 'name village district');

    const transformedRequest = transformPopulatedDocument(updatedRequest);

    res.status(200).json({
      success: true,
      message: 'Request status updated successfully',
      data: { request: transformedRequest }
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating request'
    });
  }
};

// Delete request
export const deleteRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;

    const request = await CustomerRequest.findById(id);

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    // Only customer who created the request can delete it
    if (request.customerId.toString() !== req.user.userId) {
      throw new AppError('Not authorized to delete this request', 403);
    }

    await CustomerRequest.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting request'
    });
  }
};

