import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types/index.js';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  role: { 
    type: String, 
    required: [true, 'Role is required'],
    enum: ['woman', 'customer', 'hub_manager']
  },
  village: { 
    type: String,
    trim: true
  },
  district: { 
    type: String,
    trim: true
  },
  state: { 
    type: String,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
UserSchema.index({ name: 1, role: 1 });
UserSchema.index({ village: 1 });

export default mongoose.model<IUserDocument>('User', UserSchema);

