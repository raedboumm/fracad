import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Courses from './pages/Courses';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import StudentBooks from './pages/StudentBooks';
import StudentBaccalaureate from './pages/StudentBaccalaureate';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isDashboard = ['/admin/dashboard', '/student/dashboard', '/student/books', '/student/baccalaureate'].includes(location.pathname);

  return (
    <div className="App">
      {!isDashboard && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route 
          path="/student/dashboard" 
          element={
            <PrivateRoute requiredRole="student">
              <StudentDashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/student/books" 
          element={
            <PrivateRoute requiredRole="student">
              <StudentBooks />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/student/baccalaureate" 
          element={
            <PrivateRoute requiredRole="student">
              <StudentBaccalaureate />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute requiredRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
      {!isDashboard && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
