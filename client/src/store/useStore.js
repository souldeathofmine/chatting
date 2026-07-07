import { create } from 'zustand';

const useStore = create((set, get) => ({
  user: null,
  users: [],
  chats: [],
  currentChat: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: {},
  loading: false,
  sidebarView: 'chats',

  setUser: (user) => set({ user }),
  setUsers: (usersOrFn) =>
    set((state) => ({
      users: typeof usersOrFn === 'function' ? usersOrFn(state.users) : Array.isArray(usersOrFn) ? usersOrFn : [],
    })),
  setChats: (chatsOrFn) =>
    set((state) => ({
      chats: typeof chatsOrFn === 'function' ? chatsOrFn(state.chats) : Array.isArray(chatsOrFn) ? chatsOrFn : [],
    })),
  setCurrentChat: (chat) => set({ currentChat: chat }),
  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ loading }),
  setSidebarView: (view) => set({ sidebarView: view }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (updatedMessage) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      ),
    })),

  removeMessage: (msgId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== msgId),
    })),

  addOnlineUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.add(userId);
      return { onlineUsers: newSet };
    }),

  removeOnlineUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    }),

  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),

  setTyping: (chatId, userId, isTyping) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: isTyping ? userId : null,
      },
    })),

  updateChatLastMessage: (chatId, message, time, sender) =>
    set((state) => {
      const updated = state.chats.map((chat) =>
        chat._id === chatId
          ? { ...chat, lastMessage: message, lastMessageTime: time, lastSender: sender }
          : chat
      );
      const idx = updated.findIndex((c) => c._id === chatId);
      if (idx > 0) {
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
      }
      return { chats: updated };
    }),

  incrementUnread: (chatId) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === chatId ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 } : chat
      ),
    })),

  resetUnread: (chatId) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
      ),
    })),

  addChat: (chat) =>
    set((state) => {
      const exists = state.chats.find((c) => c._id === chat._id);
      if (exists) return state;
      return { chats: [chat, ...state.chats] };
    }),

  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => c._id !== chatId),
      currentChat: state.currentChat?._id === chatId ? null : state.currentChat,
    })),

  clearMessages: (chatId) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c._id === chatId ? { ...c, lastMessage: '', lastMessageTime: null, lastSender: null } : c
      ),
      messages: state.currentChat?._id === chatId ? [] : state.messages,
    })),
}));

export default useStore;
