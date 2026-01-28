import { Router } from 'express';
import { signup, login, demoLogin } from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/token', login); // Matches FastAPI OAuth2PasswordRequestForm endpoint
router.post('/demo', demoLogin);

export default router;
