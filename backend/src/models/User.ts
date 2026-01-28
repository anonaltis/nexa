import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name?: string;
    password?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
