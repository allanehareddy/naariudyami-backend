import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from '../types/index.js';

export interface IProductDocument extends Omit<IProduct, '_id'>, Document {}

const ProductSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Description is required']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    trim: true
  },
  images: [{ 
    type: String 
  }],
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  predictedPrice: { 
    type: Number,
    min: [0, 'Predicted price cannot be negative']
  },
  userId: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
ProductSchema.index({ userId: 1 });
ProductSchema.index({ category: 1 });

export default mongoose.model<IProductDocument>('Product', ProductSchema);

