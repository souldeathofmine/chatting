import { Router } from 'express';
import { getUsers, searchUsers, updateProfile, getUserById } from '../controllers/userController.js';
import { verifyFirebaseToken, resolveOrCreateUser } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyFirebaseToken, getUsers);
router.get('/search', verifyFirebaseToken, searchUsers);
router.get('/:id', verifyFirebaseToken, getUserById);
router.put('/profile', resolveOrCreateUser, updateProfile);

export default router;
