import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import {
  getAllUsers,
  getUserDetail,
  deleteUser,
  deleteAllNonAdminUsers,
  getUserChats,
  getChatMessages,
  getAllMessages,
  deleteChat,
  updateUserProfile,
  changeUserPassword,
  deleteAnyMessage,
} from '../controllers/adminController.js';

const router = Router();

router.use(verifyFirebaseToken, requireAdmin);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.delete('/users', deleteAllNonAdminUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/profile', updateUserProfile);
router.put('/users/:id/change-password', changeUserPassword);
router.get('/users/:id/chats', getUserChats);
router.get('/chats/:chatId/messages', getChatMessages);
router.get('/messages', getAllMessages);
router.delete('/chats/:chatId', deleteChat);
router.delete('/messages/:id', deleteAnyMessage);

export default router;
