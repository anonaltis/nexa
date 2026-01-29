import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Schematic from '../models/Schematic';

export const getSchematics = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.email;
    try {
        const schematics = await Schematic.find({ userId });
        res.status(200).json(schematics);
    } catch (error) {
        res.status(500).json({ detail: 'Error fetching schematics' });
    }
};

export const createSchematic = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.email;
    const { name } = req.body;
    try {
        const schematic = new Schematic({ name, userId });
        await schematic.save();
        res.status(201).json(schematic);
    } catch (error) {
        res.status(500).json({ detail: 'Error creating schematic' });
    }
};

export const getSchematic = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.email;
    try {
        const schematic = await Schematic.findOne({ _id: id, userId });
        if (!schematic) return res.status(404).json({ detail: 'Schematic not found' });
        res.status(200).json(schematic);
    } catch (error) {
        res.status(500).json({ detail: 'Error fetching schematic' });
    }
};

export const updateSchematic = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.email;
    const updateData = req.body;
    try {
        const schematic = await Schematic.findOneAndUpdate(
            { _id: id, userId },
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        );
        if (!schematic) return res.status(404).json({ detail: 'Schematic not found' });
        res.status(200).json(schematic);
    } catch (error) {
        res.status(500).json({ detail: 'Error updating schematic' });
    }
};

export const deleteSchematic = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.email;
    try {
        const result = await Schematic.deleteOne({ _id: id, userId });
        if (result.deletedCount === 0) return res.status(404).json({ detail: 'Schematic not found' });
        res.status(200).json({ message: 'Schematic deleted successfully' });
    } catch (error) {
        res.status(500).json({ detail: 'Error deleting schematic' });
    }
};

export const analyzeSchematic = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.email;
    try {
        const schematic = await Schematic.findOne({ _id: id, userId });
        if (!schematic) return res.status(404).json({ detail: 'Schematic not found' });

        // Mock analysis for now
        res.status(200).json({
            component_count: schematic.nodes.length,
            wire_count: schematic.wires.length,
            status: "success",
            analysis: "Schematic appears to be well-formed. No major shorts detected."
        });
    } catch (error) {
        res.status(500).json({ detail: 'Error analyzing schematic' });
    }
};
