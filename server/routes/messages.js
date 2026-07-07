import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markAsSeen,
} from '../controllers/messageController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyFirebaseToken);

router.get('/:chatId', getMessages);
router.post('/', sendMessage);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.put('/:chatId/seen', markAsSeen);

export default router;
