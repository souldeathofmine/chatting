import { Router } from 'express';
import { syncUser, verifyToken } from '../controllers/authController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

router.post('/sync-user', syncUser);
router.post('/verify-token', verifyToken);

export default router;
