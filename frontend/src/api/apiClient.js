import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('orbit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('orbit_token');
      localStorage.removeItem('orbit_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  guest: () => apiClient.post('/auth/guest'),
  me: () => apiClient.get('/auth/me'),
};

export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  follow: (id) => apiClient.post(`/users/${id}/follow`),
  unfollow: (id) => apiClient.delete(`/users/${id}/follow`),
  getFollowRequests: () => apiClient.get('/users/follow-requests'),
  respondToRequest: (followId, action) =>
    apiClient.patch(`/users/follows/${followId}`, { action }),
};

export const postsApi = {
  getFeed: () => apiClient.get('/posts'),
  create: (data) => apiClient.post('/posts', data),
  getById: (id) => apiClient.get(`/posts/${id}`),
  delete: (id) => apiClient.delete(`/posts/${id}`),
  toggleLike: (id) => apiClient.post(`/posts/${id}/like`),
  createComment: (postId, data) => apiClient.post(`/posts/${postId}/comments`, data),
  deleteComment: (postId, commentId) =>
    apiClient.delete(`/posts/${postId}/comments/${commentId}`),
};

export default apiClient;