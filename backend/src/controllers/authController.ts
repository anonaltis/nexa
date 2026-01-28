import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Project from '../models/Project';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';
const EXPIRES_IN = '1d';

export const signup = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ detail: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, name });
        await user.save();

        const token = jwt.sign({ sub: email, userId: user._id }, SECRET_KEY, { expiresIn: EXPIRES_IN });
        res.status(201).json({ access_token: token, token_type: 'bearer' });
    } catch (error) {
        res.status(500).json({ detail: 'Error creating user' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body; // OAuth2 format uses username for email

    try {
        const user = await User.findOne({ email: username });
        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ detail: 'Incorrect email or password' });
        }

        const token = jwt.sign({ sub: user.email, userId: user._id }, SECRET_KEY, { expiresIn: EXPIRES_IN });
        res.status(200).json({ access_token: token, token_type: 'bearer' });
    } catch (error) {
        res.status(500).json({ detail: 'Error logging in' });
    }
};

export const demoLogin = async (req: Request, res: Response) => {
    const demoEmail = 'demo@example.com';

    try {
        let user = await User.findOne({ email: demoEmail });
        if (!user) {
            user = new User({ email: demoEmail, name: 'Demo User' });
            await user.save();

            // Seed demo projects
            const demoProjects = [
                {
                    name: 'Smart Temperature Monitor',
                    description: 'An IoT device that monitors temperature and humidity.',
                    category: 'iot',
                    status: 'completed',
                    tags: ['esp32', 'dht22'],
                    userId: demoEmail,
                }
            ];
            await Project.insertMany(demoProjects);
        }

        const token = jwt.sign({ sub: demoEmail, userId: user._id }, SECRET_KEY, { expiresIn: EXPIRES_IN });
        res.status(200).json({ access_token: token, token_type: 'bearer' });
    } catch (error) {
        console.error('Demo Login Error:', error);
        // Even if DB fails, provide a token for frontend usability
        const token = jwt.sign({ sub: demoEmail }, SECRET_KEY, { expiresIn: EXPIRES_IN });
        res.status(200).json({ access_token: token, token_type: 'bearer' });
    }
};
