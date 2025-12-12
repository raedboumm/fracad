import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <img src="/image/logo.png" alt="Tunisie Academy Logo" className="footer-logo" />
          <h3>About Us</h3>
          <p>Tunisie Academy is your gateway to quality online education in Tunisia</p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>Contact</p>
          <p>+216 48 221 529</p>
          <p>+216 24 080 155</p>
          <p>Tunis, Tunisia</p>
        </div>

        <div className="footer-section">
          <h3>Language</h3>
          <div className="language-selector">
            <p>🌐 English</p>
          </div>
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="#1877F2"/>
                <path d="M27.5 20C27.5 15.8579 24.1421 12.5 20 12.5C15.8579 12.5 12.5 15.8579 12.5 20C12.5 23.7208 15.2396 26.8125 18.8281 27.4062V22.3438H16.9531V20H18.8281V18.2812C18.8281 16.4375 20.0104 15.3438 21.6979 15.3438C22.5104 15.3438 23.3594 15.4844 23.3594 15.4844V17.3125H22.4219C21.5 17.3125 21.1719 17.8646 21.1719 18.4323V20H23.2656L22.8906 22.3438H21.1719V27.4062C24.7604 26.8125 27.5 23.7208 27.5 20Z" fill="white"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="url(#instagram-gradient)"/>
                <defs>
                  <linearGradient id="instagram-gradient" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0%" stopColor="#833AB4"/>
                    <stop offset="50%" stopColor="#E1306C"/>
                    <stop offset="100%" stopColor="#FD1D1D"/>
                  </linearGradient>
                </defs>
                <path d="M20 14.5C17.1 14.5 14.5 17.1 14.5 20C14.5 22.9 17.1 25.5 20 25.5C22.9 25.5 25.5 22.9 25.5 20C25.5 17.1 22.9 14.5 20 14.5ZM20 23.5C18.3 23.5 16.5 22.1 16.5 20C16.5 18.3 17.9 16.5 20 16.5C21.7 16.5 23.5 17.9 23.5 20C23.5 21.7 21.7 23.5 20 23.5ZM26.2 14.3C26.2 13.7 25.7 13.2 25.1 13.2C24.5 13.2 24 13.7 24 14.3C24 14.9 24.5 15.4 25.1 15.4C25.7 15.4 26.2 14.9 26.2 14.3ZM28.9 15.4C28.8 14.1 28.5 12.9 27.5 11.9C26.5 10.9 25.3 10.6 24 10.5C22.7 10.4 17.3 10.4 16 10.5C14.7 10.6 13.5 10.9 12.5 11.9C11.5 12.9 11.2 14.1 11.1 15.4C11 16.7 11 22.3 11.1 23.6C11.2 24.9 11.5 26.1 12.5 27.1C13.5 28.1 14.7 28.4 16 28.5C17.3 28.6 22.7 28.6 24 28.5C25.3 28.4 26.5 28.1 27.5 27.1C28.5 26.1 28.8 24.9 28.9 23.6C29 22.3 29 16.7 28.9 15.4ZM27.3 25C27 25.8 26.4 26.4 25.6 26.7C24.5 27.1 22 27 20 27C18 27 15.5 27.1 14.4 26.7C13.6 26.4 13 25.8 12.7 25C12.3 23.9 12.4 21.4 12.4 19.4C12.4 17.4 12.3 14.9 12.7 13.8C13 13 13.6 12.4 14.4 12.1C15.5 11.7 18 11.8 20 11.8C22 11.8 24.5 11.7 25.6 12.1C26.4 12.4 27 13 27.3 13.8C27.7 14.9 27.6 17.4 27.6 19.4C27.6 21.4 27.7 23.9 27.3 25Z" fill="white"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 Tunisie Academy. All rights reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
