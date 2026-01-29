import mongoose, { Schema, Document } from 'mongoose';

export interface ISchematic extends Document {
    name: string;
    userId: string;
    nodes: any[];
    wires: any[];
    createdAt: Date;
    updatedAt: Date;
}

const SchematicSchema: Schema = new Schema({
    name: { type: String, required: true },
    userId: { type: String, required: true },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    wires: { type: [Schema.Types.Mixed], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISchematic>('Schematic', SchematicSchema);
