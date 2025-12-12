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

const getMultipartAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  };
};

// Admin endpoints
export const getAllResources = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/resources?${params}`, getAuthHeaders());
  return response.data;
};

export const getResourceById = async (id) => {
  const response = await axios.get(`${API_URL}/resources/${id}`, getAuthHeaders());
  return response.data;
};

export const createResource = async (formData, onUploadProgress) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  };
  
  if (onUploadProgress) {
    config.onUploadProgress = onUploadProgress;
  }
  
  const response = await axios.post(`${API_URL}/resources`, formData, config);
  return response.data;
};

export const updateResource = async (id, data, onUploadProgress) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  };
  
  if (onUploadProgress) {
    config.onUploadProgress = onUploadProgress;
  }
  
  const response = await axios.put(`${API_URL}/resources/${id}`, data, config);
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await axios.delete(`${API_URL}/resources/${id}`, getAuthHeaders());
  return response.data;
};

// Student endpoints
export const getResourcesForStudent = async (type) => {
  const params = type ? `?type=${type}` : '';
  const response = await axios.get(`${API_URL}/resources/student${params}`, getAuthHeaders());
  return response.data;
};

const resourcesAPI = {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getResourcesForStudent
};

export default resourcesAPI;
