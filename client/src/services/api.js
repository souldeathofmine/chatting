import axios from 'axios';
import { auth, signOut } from './firebase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut(auth);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  syncUser: (data) => api.post('/auth/sync-user', data),
  verifyToken: (idToken) => api.post('/auth/verify-token', { idToken }),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  searchUsers: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getUserById: (id) => api.get(`/users/${id}`),
};

export const chatAPI = {
  getChats: () => api.get('/chats'),
  createChat: (participantId) => api.post('/chats', { participantId }),
  deleteChat: (chatId) => api.delete(`/chats/${chatId}`),
  clearChat: (chatId) => api.delete(`/chats/${chatId}/messages`),
};

export const messageAPI = {
  getMessages: (chatId, page = 1, limit = 50) =>
    api.get(`/messages/${chatId}?page=${page}&limit=${limit}`),
  sendMessage: (data) => api.post('/messages', data),
  editMessage: (id, message) => api.put(`/messages/${id}`, { message }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  deleteAllNonAdminUsers: () => api.delete('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserProfile: (id, data) => api.put(`/admin/users/${id}/profile`, data),
  changeUserPassword: (id, data) => api.put(`/admin/users/${id}/change-password`, data),
  getUserChats: (id) => api.get(`/admin/users/${id}/chats`),
  getChatMessages: (chatId, page = 1, limit = 50) =>
    api.get(`/admin/chats/${chatId}/messages?page=${page}&limit=${limit}`),
  getAllMessages: (params) => api.get('/admin/messages', { params }),
  deleteChat: (chatId) => api.delete(`/admin/chats/${chatId}`),
  deleteMessage: (id) => api.delete(`/admin/messages/${id}`),
};

export default api;
