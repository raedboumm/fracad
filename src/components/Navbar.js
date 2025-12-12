import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/image/logo.png" alt="Tunisie Academy Logo" />
        </Link>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <ul className="navbar-links">
            <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
            <li><Link to="/courses" onClick={() => setMenuOpen(false)}>Courses</Link></li>
            <li><Link to="/courses" onClick={() => setMenuOpen(false)}>Courses</Link></li>
            <li><Link to="/products" onClick={() => setMenuOpen(false)}>Products</Link></li>
          </ul>

          <div className="navbar-auth">
            {isAuthenticated ? (
              <>
                <Link 
                  to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} 
                  className="navbar-dashboard-btn"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="navbar-logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-login-btn" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/signup" className="navbar-signup-btn" onClick={() => setMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        <button className="navbar-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
