import { Router } from 'express';
import { getComponents, getCategories, seedComponents } from '../controllers/componentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getComponents);
router.get('/categories', authMiddleware, getCategories);
router.get('/seed', authMiddleware, seedComponents);

export default router;
