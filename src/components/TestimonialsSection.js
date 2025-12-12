import React, { useState, useEffect } from 'react';
import { testimonialsAPI } from '../services/api';
import '../styles/TestimonialsSection.css';

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await testimonialsAPI.getPublic();
      const testimonialsData = response.data?.data || response.data || [];
      setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  if (loading || !testimonials || testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <h2 className="testimonials-title">WHAT OUR STUDENTS SAY</h2>
        
        <div className="testimonial-carousel">
          {testimonials.length > 1 && (
            <button className="carousel-btn prev-btn" onClick={handlePrev} aria-label="Previous">
              ‹
            </button>
          )}

          <div className="testimonial-card">
            <div className="quote-icon">"</div>
            <div className="testimonial-content">
              {currentTestimonial.type === 'text' ? (
                <p className="testimonial-text">{currentTestimonial.content}</p>
              ) : (
                <div className="testimonial-video">
                  <iframe
                    src={currentTestimonial.video_url?.includes('youtube.com') 
                      ? currentTestimonial.video_url.replace('watch?v=', 'embed/').split('&')[0]
                      : currentTestimonial.video_url}
                    title={currentTestimonial.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">
                {currentTestimonial.gender === 'male' ? '👨‍🎓' : '👩‍🎓'}
              </div>
              <div className="author-info">
                <h4 className="author-name">{currentTestimonial.name}</h4>
                <div className="author-rating">
                  {'⭐'.repeat(currentTestimonial.rating)}
                </div>
              </div>
            </div>
          </div>

          {testimonials.length > 1 && (
            <button className="carousel-btn next-btn" onClick={handleNext} aria-label="Next">
              ›
            </button>
          )}
        </div>

        {testimonials.length > 1 && (
          <div className="carousel-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
