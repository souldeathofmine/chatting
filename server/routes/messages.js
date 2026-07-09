import { Router } from 'express';
import {
  getMessages,
  editMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyFirebaseToken);

router.get('/:chatId', getMessages);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);

export default router;
