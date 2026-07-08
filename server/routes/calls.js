import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { createSession, createToken } from '../controllers/callController.js';

const router = Router();

router.use(verifyFirebaseToken);

router.post('/session', createSession);
router.post('/token', createToken);

export default router;
