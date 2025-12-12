import React, { useState, useEffect } from 'react';
import { packagesAPI, levelsAPI } from '../services/api';
import Notification from '../components/Notification';
import '../styles/Courses.css';

const Courses = () => {
  const [packages, setPackages] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    class_name: '',
    last_year_average: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
    fetchPackages();
  }, []);

  const fetchData = async () => {
    try {
      const [levelsRes] = await Promise.all([
        levelsAPI.getAll()
      ]);
      setLevels(levelsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      // Fetch all packages without level filter - we'll filter on frontend
      const response = await packagesAPI.getActive();
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelFilter = (level) => {
    setSelectedLevel(level);
  };

  const getLevelName = (levelName) => {
    // Map level names to filter button names
    if (levelName.toLowerCase().includes('collège') || levelName.toLowerCase().includes('college')) {
      return 'Collège';
    } else if (levelName.toLowerCase().includes('lycée') || levelName.toLowerCase().includes('lycee')) {
      return 'Lycée';
    } else if (levelName.toLowerCase().includes('primaire')) {
      return 'Primaire';
    }
    return levelName;
  };

  // Group levels by their category
  const groupedLevels = levels.reduce((acc, level) => {
    const category = getLevelName(level.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(level);
    return {};
  }, {});

  // Get unique categories
  const categories = [...new Set(levels.map(l => getLevelName(l.name)))];

  const handleSubscribeClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/anonymous-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          package_name: selectedPackage.name
        })
      });

      if (response.ok) {
        setNotification({
          message: 'Your request has been submitted successfully! We will contact you soon.',
          type: 'success'
        });
        setShowModal(false);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          class_name: '',
          last_year_average: ''
        });
      } else {
        setNotification({
          message: 'Failed to submit request. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setNotification({
        message: 'An error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPackage(null);
  };

  return (
    <div className="courses-page">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="courses-hero">
        <div className="courses-hero-content">
          <h1>Our Packages</h1>
          <p>Choose the package that suits you</p>
        </div>
      </div>

      <div className="courses-container">
        <div className="package-filters">
          <button
            className={`filter-btn ${selectedLevel === 'all' ? 'active' : ''}`}
            onClick={() => handleLevelFilter('all')}
          >
            All Packages
          </button>
          <button
            className={`filter-btn ${selectedLevel === 'Primaire' ? 'active' : ''}`}
            onClick={() => handleLevelFilter('Primaire')}
          >
            Primaire
          </button>
          <button
            className={`filter-btn ${selectedLevel === 'Collège' ? 'active' : ''}`}
            onClick={() => handleLevelFilter('Collège')}
          >
            Collège
          </button>
          <button
            className={`filter-btn ${selectedLevel === 'Lycée' ? 'active' : ''}`}
            onClick={() => handleLevelFilter('Lycée')}
          >
            Lycée
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="no-packages">
            <p>No packages available at the moment</p>
          </div>
        ) : (
          <div className="packages-grid">
            {packages
              .filter(pkg => {
                if (selectedLevel === 'all') return true;
                return pkg.level_names && pkg.level_names.includes(selectedLevel);
              })
              .map((pkg) => (
              <div key={pkg.id} className="package-card">
                <div className="package-image-container">
                  {pkg.package_image_url ? (
                    <img src={pkg.package_image_url} alt={pkg.name} className="package-image" />
                  ) : (
                    <div className="package-placeholder">
                      <span className="package-icon">📚</span>
                    </div>
                  )}
                  <div className="package-type-badge">
                    {pkg.type === 'full_package' ? 'Full Package' : 'Subject Package'}
                  </div>
                </div>
                
                <div className="package-content">
                  <h3 className="package-name">{pkg.name}</h3>
                  
                  {pkg.description && (
                    <p className="package-description">{pkg.description}</p>
                  )}
                  
                  <div className="package-details">
                    {pkg.level_names && (
                      <div className="package-detail-item">
                        <span className="detail-icon">🎓</span>
                        <span className="detail-text">{pkg.level_names}</span>
                      </div>
                    )}
                    
                    {pkg.class_names && (
                      <div className="package-detail-item">
                        <span className="detail-icon">📚</span>
                        <span className="detail-text">{pkg.class_names}</span>
                      </div>
                    )}
                    
                    {pkg.section_names && (
                      <div className="package-detail-item">
                        <span className="detail-icon">📖</span>
                        <span className="detail-text">{pkg.section_names}</span>
                      </div>
                    )}
                    
                    {pkg.subject_names && (
                      <div className="package-detail-item">
                        <span className="detail-icon">📝</span>
                        <span className="detail-text">{pkg.subject_names}</span>
                      </div>
                    )}
                    
                    {pkg.duration && (
                      <div className="package-detail-item">
                        <span className="detail-icon">⏱️</span>
                        <span className="detail-text">{pkg.duration} months access</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="package-footer">
                    <div className="package-price">
                      <span className="price-amount">{pkg.price}</span>
                      <span className="price-currency">TND</span>
                    </div>
                    <button 
                      className="package-btn"
                      onClick={() => handleSubscribeClick(pkg)}
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content-form" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            <h2>Interested in the offer? Let us reach out to you.</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>First name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Class</label>
                <input
                  type="text"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Last year average</label>
                <input
                  type="text"
                  name="last_year_average"
                  value={formData.last_year_average}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
