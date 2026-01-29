import mongoose, { Schema, Document } from 'mongoose';

export interface IComponent extends Document {
    name: string;
    category: string;
    description?: string;
    specs?: {
        name?: string;
        value?: string;
        package?: string;
        manufacturer?: string;
        datasheet_url?: string;
        price?: number;
    };
    pinout?: Record<string, string>;
    footprint?: string;
    symbol?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ComponentSchema: Schema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    specs: { type: Schema.Types.Mixed },
    pinout: { type: Schema.Types.Mixed },
    footprint: { type: String },
    symbol: { type: String },
    tags: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IComponent>('Component', ComponentSchema);
