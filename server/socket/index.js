import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

const onlineUsers = new Map();

const updateUserStatus = async (userId, update) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(userId)
      ? { _id: userId }
      : { firebaseUID: userId };
    await User.findOneAndUpdate(query, update);
  } catch (err) {
    console.error('Failed to update user status:', err.message);
  }
};

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_chat', ({ userId }) => {
      if (!userId) return;
      socket.userId = userId;
      socket.join(`user:${userId}`);

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
        io.emit('user_online', { userId });
        updateUserStatus(userId, { online: true, lastSeen: new Date() });
      }
      onlineUsers.get(userId).add(socket.id);

      socket.emit('online_users', { userIds: Array.from(onlineUsers.keys()) });
    });

    socket.on('send_message', async (data) => {
      try {
        const { chatId, sender, receiver, message, messageType, image, file, isGlobal } = data;

        if (!chatId || !sender) return;
        if (!isGlobal && !receiver) return;

        if (isGlobal) {
          const globalChat = await Chat.findOne({ isGlobal: true });
          if (!globalChat) return;

          const newMessage = await Message.create({
            chatId: globalChat._id,
            sender,
            receiver: null,
            message: message || '',
            messageType: messageType || 'text',
            image: image || null,
            file: file || null,
            delivered: true,
            seen: true,
          });

          const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'username photoURL')
            .populate('receiver', 'username photoURL');

          globalChat.lastMessage = message || (messageType === 'image' ? '📷 Image' : '📎 File');
          globalChat.lastMessageTime = new Date();
          globalChat.lastSender = sender;
          await globalChat.save();

          io.emit('receive_message', populatedMessage);
          return;
        }

        const chat = await Chat.findOne({ _id: chatId, participants: sender });
        if (!chat) return;

        const newMessage = await Message.create({
          chatId,
          sender,
          receiver,
          message: message || '',
          messageType: messageType || 'text',
          image: image || null,
          file: file || null,
          delivered: false,
          seen: false,
        });

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username photoURL')
          .populate('receiver', 'username photoURL');

        chat.lastMessage = message || (messageType === 'image' ? '📷 Image' : '📎 File');
        chat.lastMessageTime = new Date();
        chat.lastSender = sender;
        await chat.save();

        io.to(`user:${sender}`).emit('receive_message', populatedMessage);
        io.to(`user:${receiver}`).emit('receive_message', populatedMessage);
      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    socket.on('message_deleted', async ({ msgId, chatId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const participants = chat.isGlobal
          ? null
          : chat.participants.map((p) => p.toString());

        const payload = { msgId, chatId };

        if (chat.isGlobal) {
          io.emit('message_deleted', payload);
        } else if (participants) {
          participants.forEach((pid) => {
            io.to(`user:${pid}`).emit('message_deleted', payload);
          });
        }
      } catch (error) {
        console.error('Socket message_deleted error:', error);
      }
    });

    socket.on('message_seen', async ({ messageIds, chatId, userId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, receiver: userId },
          { $set: { seen: true } }
        );

        io.to(`user:${userId}`).emit('message_seen', { messageIds, chatId });
      } catch (error) {
        console.error('Socket message_seen error:', error);
      }
    });

    socket.on('typing', ({ chatId, userId }) => {
      socket.to(`chat:${chatId}`).emit('typing', { chatId, userId });
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      socket.to(`chat:${chatId}`).emit('stop_typing', { chatId, userId });
    });

    socket.on('call_user', ({ to, callerInfo, roomName, callType }) => {
      if (!socket.userId || !to) return;
      io.to(`user:${to}`).emit('incoming_call', {
        from: socket.userId,
        callerInfo,
        roomName,
        callType,
      });
    });

    socket.on('call_accepted', ({ to, roomName, callType }) => {
      if (!socket.userId || !to) return;
      io.to(`user:${to}`).emit('call_accepted', { roomName, callType });
    });

    socket.on('call_declined', ({ to }) => {
      if (!socket.userId || !to) return;
      io.to(`user:${to}`).emit('call_declined', { from: socket.userId });
    });

    socket.on('call_ended', ({ to }) => {
      if (!socket.userId || !to) return;
      io.to(`user:${to}`).emit('call_ended', { from: socket.userId });
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);

      let disconnectedUserId = null;
      for (const [userId, socketIds] of onlineUsers.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            disconnectedUserId = userId;
            onlineUsers.delete(userId);
          }
          break;
        }
      }

      if (disconnectedUserId) {
        io.emit('user_offline', { userId: disconnectedUserId });
        updateUserStatus(disconnectedUserId, { online: false, lastSeen: new Date() });
      }
    });
  });

  return io;
};
