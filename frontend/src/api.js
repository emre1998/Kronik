import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

export const getJobs = () => api.get('/api/jobs');
export const createJob = (data) => api.post('/api/jobs', data);
export const updateJob = (id, data) => api.put(`/api/jobs/${id}`, data);
export const deleteJob = (id) => api.delete(`/api/jobs/${id}`);
export const triggerJob = (id) => api.post(`/api/jobs/${id}/trigger`);
export const getLogs = () => api.get('/api/logs');
export const getJobLogs = (id) => api.get(`/api/logs/job/${id}`);
export const aiChat = (messages) => api.post('/api/ai/chat', { messages });
