import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    name: string;
    description?: string;
    category: string;
    tags: string[];
    status: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'other' },
    tags: { type: [String], default: [] },
    status: { type: String, default: 'planning' },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProject>('Project', ProjectSchema);
