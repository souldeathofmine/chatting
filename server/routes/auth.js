import { Router } from 'express';
import { syncUser, verifyToken, changePassword } from '../controllers/authController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

router.post('/sync-user', syncUser);
router.post('/verify-token', verifyToken);
router.post('/change-password', verifyFirebaseToken, changePassword);

export default router;
