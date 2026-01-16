import mongoose, { Schema, Document } from 'mongoose';
import { ICustomerRequest } from '../types/index.js';

export interface ICustomerRequestDocument extends Omit<ICustomerRequest, '_id'>, Document {}

const CustomerRequestSchema: Schema = new Schema({
  customerId: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  entrepreneurId: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Entrepreneur ID is required']
  },
  message: { 
    type: String, 
    required: [true, 'Message is required']
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
CustomerRequestSchema.index({ customerId: 1 });
CustomerRequestSchema.index({ entrepreneurId: 1 });
CustomerRequestSchema.index({ status: 1 });

export default mongoose.model<ICustomerRequestDocument>('CustomerRequest', CustomerRequestSchema);

