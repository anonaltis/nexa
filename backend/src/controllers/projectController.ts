import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/Project';

export const getProjects = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.email; // Keeping logic consistent with Python (email as ID) or use userId

    try {
        const projects = await Project.find({ userId });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ detail: 'Error fetching projects' });
    }
};

export const createProject = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.email;
    const projectData = req.body;

    try {
        const project = new Project({ ...projectData, userId });
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ detail: 'Error creating project' });
    }
};

export const getProject = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.email;

    try {
        const project = await Project.findOne({ _id: id, userId });
        if (!project) return res.status(404).json({ detail: 'Project not found' });
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ detail: 'Error fetching project' });
    }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.email;
    const updateData = req.body;

    try {
        const project = await Project.findOneAndUpdate(
            { _id: id, userId },
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        );
        if (!project) return res.status(404).json({ detail: 'Project not found' });
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ detail: 'Error updating project' });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.email;

    try {
        const result = await Project.deleteOne({ _id: id, userId });
        if (result.deletedCount === 0) return res.status(404).json({ detail: 'Project not found' });
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ detail: 'Error deleting project' });
    }
};
