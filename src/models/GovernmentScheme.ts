import mongoose, { Schema, Document } from 'mongoose';
import { IGovernmentScheme } from '../types/index.js';

export interface IGovernmentSchemeDocument extends Omit<IGovernmentScheme, '_id'>, Document {}

const GovernmentSchemeSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Scheme name is required'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Description is required']
  },
  link: { 
    type: String, 
    required: [true, 'Link is required']
  },
  minIncome: { 
    type: Number,
    min: [0, 'Minimum income cannot be negative']
  },
  maxIncome: { 
    type: Number,
    min: [0, 'Maximum income cannot be negative']
  },
  eligibility: { 
    type: String, 
    required: [true, 'Eligibility is required']
  }
});

// Index for faster queries
GovernmentSchemeSchema.index({ minIncome: 1, maxIncome: 1 });

export default mongoose.model<IGovernmentSchemeDocument>('GovernmentScheme', GovernmentSchemeSchema);

