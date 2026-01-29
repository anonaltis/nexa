import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    name: string;
    description?: string;
    category: string;
    tags: string[];
    status: string;
    userId: string;
    planningDoc?: any;
    pcbDiagram?: any;
    codeFiles?: any[];
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
    planningDoc: { type: Schema.Types.Mixed },
    pcbDiagram: { type: Schema.Types.Mixed },
    codeFiles: { type: [Schema.Types.Mixed], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProject>('Project', ProjectSchema);
