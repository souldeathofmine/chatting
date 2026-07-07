import { Router } from 'express';
import { getUsers, searchUsers, updateProfile, getUserById } from '../controllers/userController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyFirebaseToken);

router.get('/', getUsers);
router.get('/search', searchUsers);
router.put('/profile', updateProfile);
router.get('/:id', getUserById);

export default router;
