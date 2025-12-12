import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about">
      <section className="about-hero">
        <div className="about-hero-content">
          <img src="/image/logo.png" alt="Tunisie Academy Logo" className="about-logo" />
          <h1>Tunisie Academy</h1>
        </div>
      </section>

      <section className="about-content">
        <div className="about-text">
          <p className="about-description">
            Tunisie Academy is an innovative e-learning platform dedicated to providing diverse educational content for students at all levels, including high school, middle school, and French Baccalaureate (Bac français). Our platform offers interactive live sessions with qualified instructors, recorded video lessons, reliable exercises with detailed solutions, and a wide range of tools and resources to help students excel and stand out.
          </p>
          <p className="about-description">
            We pride ourselves on offering the best prices in Tunisia while maintaining the highest quality of education. Our mission is to revolutionize distance learning in Tunisia by introducing new teaching methods that help students save time and effort while achieving excellence in their studies.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
