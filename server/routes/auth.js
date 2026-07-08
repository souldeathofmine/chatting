import { Router } from 'express';
import { syncUser, verifyToken, changePassword } from '../controllers/authController.js';
import { verifyFirebaseToken, verifyFirebaseTokenLax } from '../middleware/auth.js';

const router = Router();

router.post('/sync-user', verifyFirebaseTokenLax, syncUser);
router.post('/verify-token', verifyToken);
router.post('/change-password', verifyFirebaseToken, changePassword);

export default router;
