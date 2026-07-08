import { useEffect, useRef } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '../services/socket.js';
import useStore from '../store/useStore.js';

export const useSocket = (userId) => {
  const {
    addMessage,
    updateMessage,
    removeMessage,
    addOnlineUser,
    removeOnlineUser,
    setOnlineUsers,
    setTyping,
    updateChatLastMessage,
    incrementUnread,
    setCurrentChat,
    currentChat,
  } = useStore();

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket(userId);

    socket.on('receive_message', (message) => {
      if (currentChat?._id === message.chatId) {
        addMessage(message);
      }
      updateChatLastMessage(
        message.chatId,
        message.message || (message.messageType === 'image' ? '📷 Image' : '📎 File'),
        message.createdAt,
        message.sender._id
      );

      if (currentChat?._id !== message.chatId) {
        incrementUnread(message.chatId);
      }

      if (Notification.permission === 'granted' && currentChat?._id !== message.chatId) {
        const senderName = message.sender?.username || 'Someone';
        new Notification(senderName, {
          body: message.message || (message.messageType === 'image' ? 'Sent an image' : 'Sent a file'),
          icon: message.sender?.photoURL || '/vite.svg',
        });
      }
    });

    socket.on('message_seen', ({ messageIds }) => {
      messageIds.forEach((id) => {
        updateMessage({ _id: id, seen: true });
      });
    });

    socket.on('message_deleted', ({ msgId, chatId }) => {
      removeMessage(msgId);
    });

    socket.on('online_users', ({ userIds }) => {
      setOnlineUsers(userIds);
    });

    socket.on('user_online', ({ userId: onlineUserId }) => {
      addOnlineUser(onlineUserId);
    });

    socket.on('user_offline', ({ userId: offlineUserId }) => {
      removeOnlineUser(offlineUserId);
    });

    socket.on('typing', ({ chatId, userId: typingUserId }) => {
      setTyping(chatId, typingUserId, true);
    });

    socket.on('stop_typing', ({ chatId, userId: typingUserId }) => {
      setTyping(chatId, typingUserId, false);
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_seen');
      socket.off('message_deleted');
      socket.off('online_users');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [userId, currentChat?._id]);

  const emitTyping = (chatId, userId) => {
    const socket = getSocket();
    if (socket) socket.emit('typing', { chatId, userId });
  };

  const emitStopTyping = (chatId, userId) => {
    const socket = getSocket();
    if (socket) socket.emit('stop_typing', { chatId, userId });
  };

  const emitSendMessage = (data) => {
    const socket = getSocket();
    if (socket) socket.emit('send_message', data);
  };

  const emitMessageSeen = (data) => {
    const socket = getSocket();
    if (socket) socket.emit('message_seen', data);
  };

  return { emitTyping, emitStopTyping, emitSendMessage, emitMessageSeen };
};

export default useSocket;
