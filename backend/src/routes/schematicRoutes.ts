import { Router } from 'express';
import {
    getSchematics,
    createSchematic,
    getSchematic,
    updateSchematic,
    deleteSchematic,
    analyzeSchematic
} from '../controllers/schematicController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getSchematics);
router.post('/', createSchematic);
router.get('/:id', getSchematic);
router.put('/:id', updateSchematic);
router.delete('/:id', deleteSchematic);
router.post('/:id/analyze', analyzeSchematic);

export default router;
