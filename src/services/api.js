import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for large file uploads
  maxContentLength: 100 * 1024 * 1024, // 100MB
  maxBodyLength: 100 * 1024 * 1024, // 100MB
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Completely suppress console errors for auth failures and 500 on protected routes
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const is500OnProtectedRoute = error.response?.status === 500 && !localStorage.getItem('token');
    
    // Don't log auth errors or 500s when not authenticated
    if (!isAuthError && !is500OnProtectedRoute && error.code !== 'ERR_NETWORK') {
      console.error('API Error:', error);
    }

    // Handle authentication errors silently - just clean up, no redirect unless necessary
    if (isAuthError) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're on a protected page (not homepage, login, or signup)
      const protectedPaths = ['/admin', '/dashboard', '/student'];
      const isOnProtectedPage = protectedPaths.some(path => window.location.pathname.includes(path));
      
      if (isOnProtectedPage && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify'),
};

// Courses
export const coursesAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (courseData) => api.post('/courses', courseData),
  update: (id, courseData) => api.put(`/courses/${id}`, courseData),
  delete: (id) => api.delete(`/courses/${id}`),
  enroll: (courseId) => api.post(`/courses/${courseId}/enroll`),
  getEnrolled: () => api.get('/courses/enrolled'),
};

// Users (Admin only)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getStudents: () => api.get('/users/students'),
};

// Lessons
export const lessonsAPI = {
  getByCourse: (courseId) => api.get(`/courses/${courseId}/lessons`),
  getById: (id) => api.get(`/lessons/${id}`),
  create: (lessonData) => api.post('/lessons', lessonData),
  update: (id, lessonData) => api.put(`/lessons/${id}`, lessonData),
  delete: (id) => api.delete(`/lessons/${id}`),
};

// Progress
export const progressAPI = {
  getByUser: () => api.get('/progress'),
  updateProgress: (lessonId, data) => api.post(`/progress/${lessonId}`, data),
};

// Levels
export const levelsAPI = {
  getAll: () => api.get('/levels'),
  getActive: () => axios.get(`${API_URL}/levels/active`), // Public endpoint, no auth needed
  create: (levelData) => api.post('/levels', levelData),
  update: (id, levelData) => api.put(`/levels/${id}`, levelData),
  delete: (id) => api.delete(`/levels/${id}`),
};

// Classes
export const classesAPI = {
  getAll: () => api.get('/classes'),
  getActive: () => axios.get(`${API_URL}/classes/active`), // Public endpoint, no auth needed
  getByLevel: (levelId) => axios.get(`${API_URL}/classes/level/${levelId}`), // Public endpoint
  create: (classData) => api.post('/classes', classData),
  update: (id, classData) => api.put(`/classes/${id}`, classData),
  delete: (id) => api.delete(`/classes/${id}`),
};

// Sections
export const sectionsAPI = {
  getAll: () => api.get('/sections'),
  getActive: () => axios.get(`${API_URL}/sections/active`), // Public endpoint, no auth needed
  create: (sectionData) => api.post('/sections', sectionData),
  update: (id, sectionData) => api.put(`/sections/${id}`, sectionData),
  delete: (id) => api.delete(`/sections/${id}`),
};

// Subjects
export const subjectsAPI = {
  getAll: () => api.get('/subjects'),
  getActive: () => axios.get(`${API_URL}/subjects/active`),
  getBySection: (sectionId) => axios.get(`${API_URL}/subjects/section/${sectionId}`),
  create: (subjectData) => api.post('/subjects', subjectData),
  update: (id, subjectData) => api.put(`/subjects/${id}`, subjectData),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Chapters
export const chaptersAPI = {
  getAll: () => api.get('/chapters'),
  getActive: () => axios.get(`${API_URL}/chapters/active`),
  create: (chapterData) => api.post('/chapters', chapterData),
  update: (id, chapterData) => api.put(`/chapters/${id}`, chapterData),
  delete: (id) => api.delete(`/chapters/${id}`),
};

// Exams
export const examsAPI = {
  getAll: () => api.get('/exams'),
  getSubmissions: (examId) => api.get(`/exams/${examId}/submissions`),
  create: (examData) => api.post('/exams', examData),
  update: (id, examData) => api.put(`/exams/${id}`, examData),
  gradeSubmission: (submissionId, gradeData) => api.put(`/exams/submissions/${submissionId}/grade`, gradeData),
  delete: (id) => api.delete(`/exams/${id}`),
};

// Packages
export const packagesAPI = {
  getAll: () => api.get('/packages'),
  getActive: (levelId) => axios.get(`${API_URL}/packages/active${levelId ? `?level_id=${levelId}` : ''}`),
  create: (packageData) => api.post('/packages', packageData),
  update: (id, packageData) => api.put(`/packages/${id}`, packageData),
  delete: (id) => api.delete(`/packages/${id}`),
};

// Subscriptions
export const subscriptionsAPI = {
  create: (formData) => api.post('/subscriptions/student', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMySubscriptions: () => api.get('/subscriptions/student/my-subscriptions'),
  getAll: (params) => api.get('/subscriptions', { params }),
  getById: (id) => api.get(`/subscriptions/${id}`),
  updateStatus: (id, status) => api.put(`/subscriptions/${id}/status`, { status }),
  delete: (id) => api.delete(`/subscriptions/${id}`)
};

// Books
export const booksAPI = {
  getAll: () => api.get('/books'),
  getActive: () => api.get('/books/active'), // For students
  create: (bookData) => api.post('/books', bookData),
  update: (id, bookData) => api.put(`/books/${id}`, bookData),
  delete: (id) => api.delete(`/books/${id}`),
};

// Telegram
export const telegramAPI = {
  getAll: () => api.get('/telegram'),
  getStudent: () => api.get('/telegram/student'), // For students
  create: (linkData) => api.post('/telegram', linkData),
  update: (id, linkData) => api.put(`/telegram/${id}`, linkData),
  delete: (id) => api.delete(`/telegram/${id}`),
};

// Messenger
export const messengerAPI = {
  getAll: () => api.get('/messenger'),
  create: (groupData) => api.post('/messenger', groupData),
  update: (id, groupData) => api.put(`/messenger/${id}`, groupData),
  delete: (id) => api.delete(`/messenger/${id}`),
};

// Emploi Images
export const emploiAPI = {
  getAll: () => api.get('/emploi'),
  create: (imageData) => api.post('/emploi', imageData),
  update: (id, imageData) => api.put(`/emploi/${id}`, imageData),
  delete: (id) => api.delete(`/emploi/${id}`),
};

// Calendar Events
export const calendarAPI = {
  getAll: () => api.get('/calendar'),
  getByDateRange: (startDate, endDate) => api.get(`/calendar/range?startDate=${startDate}&endDate=${endDate}`),
  create: (eventData) => api.post('/calendar', eventData),
  update: (id, eventData) => api.put(`/calendar/${id}`, eventData),
  delete: (id) => api.delete(`/calendar/${id}`),
};

// Highlights
export const highlightsAPI = {
  getAll: () => api.get('/highlights'),
  getPublic: () => axios.get(`${API_URL}/highlights/public?active_only=true`), // Public endpoint for homepage
  getById: (id) => api.get(`/highlights/${id}`),
  create: (highlightData) => api.post('/highlights', highlightData),
  update: (id, highlightData) => api.put(`/highlights/${id}`, highlightData),
  delete: (id) => api.delete(`/highlights/${id}`),
  toggleStatus: (id) => api.patch(`/highlights/${id}/toggle-status`),
};

// Testimonials
export const testimonialsAPI = {
  getAll: () => api.get('/testimonials'),
  getPublic: () => axios.get(`${API_URL}/testimonials/public?active_only=true`), // Public endpoint for homepage
  getById: (id) => api.get(`/testimonials/${id}`),
  create: (testimonialData) => api.post('/testimonials', testimonialData),
  update: (id, testimonialData) => api.put(`/testimonials/${id}`, testimonialData),
  delete: (id) => api.delete(`/testimonials/${id}`),
  toggleStatus: (id) => api.patch(`/testimonials/${id}/toggle-status`),
};

// BAC Entries
export const bacAPI = {
  getAll: () => api.get('/bac'),
  getPublic: () => axios.get(`${API_URL}/bac/public`),
  getStudent: () => api.get('/bac/student'), // For authenticated students
  getById: (id) => api.get(`/bac/${id}`),
  getSubjectsForSection: (sectionId) => api.get(`/bac/subjects/${sectionId}`),
  create: (bacData) => api.post('/bac', bacData),
  update: (id, bacData) => api.put(`/bac/${id}`, bacData),
  delete: (id) => api.delete(`/bac/${id}`),
  toggleStatus: (id) => api.patch(`/bac/${id}/toggle-status`),
};

// Products
export const productsAPI = {
  getAll: () => api.get('/products/admin/all'),
  getActive: () => axios.get(`${API_URL}/products/active`), // Public endpoint
  getById: (id) => axios.get(`${API_URL}/products/${id}`), // Public endpoint
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
};

// Orders
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getStats: () => api.get('/orders/stats'),
  create: (orderData) => axios.post(`${API_URL}/orders`, orderData), // Public endpoint
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/orders/${id}`),
};

// Promo Codes
export const promoCodesAPI = {
  getAll: (year, month) => api.get('/promo-codes', { params: { year, month } }),
  create: (codeData) => api.post('/promo-codes', codeData),
  update: (id, codeData) => api.put(`/promo-codes/${id}`, codeData),
  delete: (id) => api.delete(`/promo-codes/${id}`),
  validate: (code) => axios.get(`${API_URL}/promo-codes/validate/${code}`), // Public endpoint
};

// Resources (Videos and PDFs)
export const resourcesAPI = {
  getAll: (filters) => api.get('/resources', { params: filters }),
  getById: (id) => api.get(`/resources/${id}`),
  create: (formData) => api.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
  getForStudent: (type) => api.get('/resources/student', { params: { type } }),
};

// Dashboard Statistics
export const dashboardAPI = {
  getAdminStats: () => api.get('/dashboard/admin/stats'),
  getStudentStats: () => api.get('/dashboard/student/stats'),
};

export default api;
