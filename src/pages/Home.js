import React from 'react';
import { Link } from 'react-router-dom';
import HighlightsSection from '../components/HighlightsSection';
import TestimonialsSection from '../components/TestimonialsSection';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Tunisie Academy</h1>
          <p className="hero-subtitle">
            The Best Educational Platform in Tunisia and Quality
          </p>
          <p className="hero-description">
            Join thousands of students learning online with expert instructors. 
            Access live sessions, recorded lessons, PDF materials, and interactive exercises.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn-primary">Get Started</Link>
            <Link to="/courses" className="btn-secondary">Explore Courses</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/image/bannnerr.jpg" alt="E-learning" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Tunisie Academy?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              📹
            </div>
            <h3>Live Sessions</h3>
            <p>Attend interactive live classes with experienced teachers in real-time</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🎬
            </div>
            <h3>Recorded Lessons</h3>
            <p>Access comprehensive video lessons anytime, anywhere at your own pace</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              📄
            </div>
            <h3>PDF Materials</h3>
            <p>Download and study from high-quality PDF documents and workbooks</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              ✍️
            </div>
            <h3>Interactive Exercises</h3>
            <p>Practice with exercises and quizzes to reinforce your learning</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              💰
            </div>
            <h3>Affordable Prices</h3>
            <p>Quality education at the best prices in Tunisia</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🤝
            </div>
            <h3>24/7 Support</h3>
            <p>Get help anytime with our dedicated support team</p>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>5000+</h3>
            <p>Active Students</p>
          </div>
          <div className="stat-card">
            <h3>150+</h3>
            <p>Expert Instructors</p>
          </div>
          <div className="stat-card">
            <h3>300+</h3>
            <p>Online Courses</p>
          </div>
          <div className="stat-card">
            <h3>95%</h3>
            <p>Success Rate</p>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <HighlightsSection />

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up with your email and create your student profile</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Choose Your Course</h3>
            <p>Browse and select from our wide range of quality courses</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Start Learning</h3>
            <p>Access all materials and begin your learning journey</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Learning Journey?</h2>
          <p>Join Tunisie Academy today and unlock your potential</p>
          <Link to="/signup" className="cta-button">Sign Up Now</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
