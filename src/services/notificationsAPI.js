import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Student endpoints
export const getNotificationsForStudent = async () => {
  const response = await axios.get(`${API_URL}/notifications/student`, getAuthHeaders());
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await axios.get(`${API_URL}/notifications/student/unread-count`, getAuthHeaders());
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await axios.post(`${API_URL}/notifications/student/${notificationId}/read`, {}, getAuthHeaders());
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await axios.post(`${API_URL}/notifications/student/read-all`, {}, getAuthHeaders());
  return response.data;
};

// Admin endpoints
export const createNotification = async (message) => {
  const response = await axios.post(`${API_URL}/notifications/admin`, { message }, getAuthHeaders());
  return response.data;
};

export const getAllNotifications = async () => {
  const response = await axios.get(`${API_URL}/notifications/admin`, getAuthHeaders());
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await axios.delete(`${API_URL}/notifications/admin/${id}`, getAuthHeaders());
  return response.data;
};

const notificationsAPI = {
  getNotificationsForStudent,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  getAllNotifications,
  deleteNotification
};

export default notificationsAPI;
