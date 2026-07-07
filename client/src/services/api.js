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
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const messageAPI = {
  getMessages: (chatId, page = 1, limit = 50) =>
    api.get(`/messages/${chatId}?page=${page}&limit=${limit}`),
  sendMessage: (data) => api.post('/messages', data),
  editMessage: (id, message) => api.put(`/messages/${id}`, { message }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

export default api;
