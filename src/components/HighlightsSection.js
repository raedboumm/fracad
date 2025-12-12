import React, { useState, useEffect } from 'react';
import { highlightsAPI } from '../services/api';
import '../styles/HighlightsSection.css';

const HighlightsSection = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    try {
      const response = await highlightsAPI.getPublic();
      console.log('Homepage highlights response:', response);
      console.log('Homepage highlights data:', response.data);
      
      // Handle both response.data and response.data.data formats
      const highlightsData = response.data?.data || response.data || [];
      console.log('Homepage highlights array:', highlightsData);
      
      setHighlights(Array.isArray(highlightsData) ? highlightsData : []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
      setHighlights([]);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtube\.com\/embed\/([^?]+)/,
      /youtu\.be\/([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getThumbnailUrl = (videoUrl) => {
    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return '';
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? highlights.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === highlights.length - 1 ? 0 : prev + 1));
  };

  const getVisibleHighlights = () => {
    if (!highlights || highlights.length === 0) return [];
    
    const visible = [];
    const itemsToShow = Math.min(3, highlights.length);
    
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % highlights.length;
      if (highlights[index]) {
        visible.push(highlights[index]);
      }
    }
    return visible;
  };

  if (loading || !highlights || highlights.length === 0) {
    return null;
  }

  const visibleHighlights = getVisibleHighlights();

  if (visibleHighlights.length === 0) {
    return null;
  }

  return (
    <section className="highlights-section">
      <div className="highlights-container">
        <h2 className="highlights-title">EXPLORE OUR LESSONS</h2>
        
        <div className="highlights-carousel">
          {highlights.length > 1 && (
            <button className="carousel-btn prev-btn" onClick={handlePrev} aria-label="Previous">
              &#8249;
            </button>
          )}

          <div className="highlights-grid">
            {visibleHighlights.filter(h => h).map((highlight, index) => (
              <div key={highlight.id} className={`highlight-card ${index === 1 && highlights.length >= 3 ? 'center' : ''}`}>
                <div className="highlight-thumbnail">
                  <img 
                    src={highlight.thumbnail_url || getThumbnailUrl(highlight.video_url)} 
                    alt={highlight.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/640x360?text=Video';
                    }}
                  />
                  <div className="play-overlay">
                    <a 
                      href={highlight.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="play-button"
                      aria-label={`Play ${highlight.title}`}
                    >
                      ▶
                    </a>
                  </div>
                  {highlight.title.includes('bac') && (
                    <div className="highlight-badge">
                      {highlight.title.match(/[A-Z\s]+/)?.[0] || 'HIGHLIGHT'}
                    </div>
                  )}
                </div>
                <div className="highlight-info">
                  <h3 className="highlight-card-title">{highlight.title}</h3>
                  <p className="highlight-description">
                    {highlight.description || 'Watch this lesson'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {highlights.length > 1 && (
            <button className="carousel-btn next-btn" onClick={handleNext} aria-label="Next">
              &#8250;
            </button>
          )}
        </div>

        {highlights && highlights.length > 3 && (
          <div className="carousel-dots">
            {highlights.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HighlightsSection;
