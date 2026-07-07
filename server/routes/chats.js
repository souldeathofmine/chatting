import { Router } from 'express';
import { getChats, createChat, deleteChat, clearChat } from '../controllers/chatController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyFirebaseToken);

router.get('/', getChats);
router.post('/', createChat);
router.delete('/:chatId', deleteChat);
router.delete('/:chatId/messages', clearChat);

export default router;
