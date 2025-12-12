import React, { useState, useEffect } from 'react';
import { calendarAPI, levelsAPI, classesAPI, subjectsAPI, sectionsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/CalendarManagement.css';

const CalendarManagement = () => {
  const [events, setEvents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day, list
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    type: 'zoom_meeting',
    description: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '00:00',
    duration_minutes: 60,
    level_ids: [],
    class_ids: [],
    section_id: '',
    subject_id: '',
    zoom_link: '',
    meeting_id: '',
    meeting_password: '',
    show_public: false,
  });

  useEffect(() => {
    fetchEvents();
    fetchLevels();
    fetchClasses();
    fetchSections();
    fetchSubjects();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getAll();
      console.log('Fetched events:', response.data);
      // Log a sample event to see the date format
      if (response.data.length > 0) {
        console.log('Sample event:', response.data[0]);
        console.log('Date type:', typeof response.data[0].date);
        console.log('Date value:', response.data[0].date);
      }
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setToast({ message: 'Failed to fetch calendar events', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await levelsAPI.getAll();
      setLevels(response.data);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await sectionsAPI.getAll();
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLevelCheckbox = (levelId) => {
    const currentLevels = [...formData.level_ids];
    const index = currentLevels.indexOf(levelId);
    if (index > -1) {
      currentLevels.splice(index, 1);
    } else {
      currentLevels.push(levelId);
    }
    setFormData({ ...formData, level_ids: currentLevels, section_id: '' });
  };

  const handleClassCheckbox = (classId) => {
    const currentClasses = [...formData.class_ids];
    const index = currentClasses.indexOf(classId);
    if (index > -1) {
      currentClasses.splice(index, 1);
    } else {
      currentClasses.push(classId);
    }
    setFormData({ ...formData, class_ids: currentClasses, section_id: '' });
  };

  // Check if any selected class is a lycée class (2ème, 3ème, 4ème lycée only)
  const shouldShowSectionDropdown = () => {
    if (formData.class_ids.length === 0) return false;
    return formData.class_ids.some(classId => {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return false;
      const classNameLower = cls.name.toLowerCase();
      // Only show for lycée classes (must contain both "lycée" and one of the years)
      const isLycee = classNameLower.includes('lycée') || classNameLower.includes('lycee');
      const isSecondThirdOrFourth = 
        classNameLower.includes('2ème') || 
        classNameLower.includes('3ème') || 
        classNameLower.includes('4ème');
      return isLycee && isSecondThirdOrFourth;
    });
  };

  const openAddModal = (selectedDate = null) => {
    setFormData({
      id: '',
      title: '',
      type: 'zoom_meeting',
      description: '',
      date: selectedDate || new Date().toISOString().split('T')[0],
      start_time: '00:00',
      duration_minutes: 60,
      level_ids: [],
      class_ids: [],
      section_id: '',
      subject_id: '',
      zoom_link: '',
      meeting_id: '',
      meeting_password: '',
      show_public: false,
    });
    setIsEditMode(false);
    setShowModal(true);
  };

  const openViewModal = (event) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  const openEditModal = (event) => {
    if (event.source_type === 'exam') {
      setToast({ message: 'Exams cannot be edited from calendar. Please edit from Exams section.', type: 'info' });
      return;
    }

    setShowViewModal(false);
    setFormData({
      id: event.id,
      title: event.title,
      type: event.type || 'zoom_meeting',
      description: event.description || '',
      date: event.date.split('T')[0],
      start_time: event.start_time,
      duration_minutes: event.duration_minutes,
      level_ids: event.level_ids ? JSON.parse(event.level_ids) : [],
      class_ids: event.class_ids ? JSON.parse(event.class_ids) : [],
      section_id: event.section_id || '',
      subject_id: event.subject_id || '',
      zoom_link: event.zoom_link || '',
      meeting_id: event.meeting_id || '',
      meeting_password: event.meeting_password || '',
      show_public: event.show_public || false,
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.start_time || !formData.duration_minutes) {
      setToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    try {
      const eventData = {
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes),
      };

      if (isEditMode) {
        await calendarAPI.update(formData.id, eventData);
        setToast({ message: 'Event updated successfully! 📅', type: 'success' });
      } else {
        await calendarAPI.create(eventData);
        setToast({ message: 'Event created successfully! 📅', type: 'success' });
      }

      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to save event',
        type: 'error'
      });
    }
  };

  const openDeleteModal = (event) => {
    if (event.source_type === 'exam') {
      setToast({ message: 'Exams cannot be deleted from calendar. Please delete from Exams section.', type: 'info' });
      return;
    }
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      await calendarAPI.delete(eventToDelete.id);
      setToast({ message: 'Event deleted successfully! 🗑️', type: 'success' });
      setShowDeleteModal(false);
      setShowViewModal(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setToast({ message: 'Failed to delete event', type: 'error' });
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  // Calendar rendering functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log(`Looking for events on: ${dateStr}`);
    
    const filtered = events.filter(event => {
      // Extract date part from event.date (handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss.sssZ")
      let eventDate = event.date;
      if (typeof eventDate === 'string') {
        eventDate = eventDate.split('T')[0]; // Get just the date part before 'T'
      } else if (eventDate instanceof Date) {
        // Convert date object to local date string
        const evYear = eventDate.getFullYear();
        const evMonth = String(eventDate.getMonth() + 1).padStart(2, '0');
        const evDay = String(eventDate.getDate()).padStart(2, '0');
        eventDate = `${evYear}-${evMonth}-${evDay}`;
      }
      const matches = eventDate === dateStr;
      if (matches) {
        console.log(`Event "${event.title}" matches: eventDate=${eventDate}, dateStr=${dateStr}`);
      }
      return matches;
    });
    
    console.log(`Found ${filtered.length} events for ${dateStr}`);
    return filtered;
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                className={`event-item ${event.source_type === 'exam' ? 'exam-event' : 'regular-event'}`}
                onClick={() => openViewModal(event)}
                title={`${event.start_time} - ${event.title}`}
              >
                {event.start_time.substring(0, 5)} {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div 
                className="event-more" 
                onClick={() => {
                  setSelectedDate(date);
                  setShowDayModal(true);
                }}
              >
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header-days">
          {dayNames.map(name => (
            <div key={name} className="day-name">{name}</div>
          ))}
        </div>
        <div className="calendar-grid">{days}</div>
      </div>
    );
  };

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start_time.localeCompare(b.start_time);
    });

    return (
      <div className="list-view">
        {sortedEvents.length === 0 ? (
          <div className="no-events">No events found</div>
        ) : (
          sortedEvents.map((event) => (
            <div key={`${event.source_type}-${event.id}`} className="list-event-item">
              <div className="event-dates">
                <div className="event-day">{event.date.split('T')[0].split('-')[2]}</div>
                <div className="event-month">
                  {new Date(event.date.split('T')[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
              <div className="event-details">
                <div className="event-title">{event.title}</div>
                <div className="event-info">
                  <span className={`event-type-badge ${event.source_type === 'exam' ? 'exam' : event.type}`}>
                    {event.source_type === 'exam' ? 'Exam' : event.type}
                  </span>
                  <span className="event-time">
                    {event.start_time.substring(0, 5)} ({event.duration_minutes} min)
                  </span>
                  {event.subject_name && <span className="event-subject">{event.subject_name}</span>}
                </div>
              </div>
              <div className="event-actions">
                <button onClick={() => openViewModal(event)} className="btn-view-small" title="View Details">
                  👁️
                </button>
                <button onClick={() => openEditModal(event)} className="btn-edit-small" title="Edit">
                  ✏️
                </button>
                <button onClick={() => openDeleteModal(event)} className="btn-delete-small" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderDayModal = () => {
    if (!showDayModal || !selectedDate) return null;

    const dayEvents = getEventsForDate(selectedDate);
    const dateStr = new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000).toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    return (
      <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
        <div className="modal-content day-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📅 {dateStr}</h2>
            <button className="modal-close" onClick={() => setShowDayModal(false)}>✕</button>
          </div>
          <div className="modal-body">
            {dayEvents.length === 0 ? (
              <p>No events on this day</p>
            ) : (
              <div className="day-modal-events-list">
                {dayEvents.map((event, idx) => (
                  <div 
                    key={idx} 
                    className={`day-modal-event-card ${event.source_type === 'exam' ? 'exam-event' : 'regular-event'}`}
                    onClick={() => {
                      setShowDayModal(false);
                      openViewModal(event);
                    }}
                  >
                    <div className="day-modal-event-time">
                      🕐 {event.start_time.substring(0, 5)}
                    </div>
                    <div className="day-modal-event-details">
                      <h3>{event.title}</h3>
                      <p className="event-type-badge">
                        {event.source_type === 'exam' ? '📝 Exam' : `🎥 ${event.type}`}
                      </p>
                      <p className="event-duration">Duration: {event.duration_minutes} minutes</p>
                      {event.description && <p className="event-description">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading calendar...</div>;
  }

  return (
    <div className="calendar-management">
      {renderDayModal()}
      
      <div className="calendar-header-bar">
        <h2>📅 Calendar Management</h2>
        <button onClick={() => openAddModal()} className="btn-create-event">
          ➕ Create Event
        </button>
      </div>

      <div className="calendar-controls">
        <div className="calendar-nav">
          <button onClick={() => navigateMonth(-1)} className="btn-nav">←</button>
          <button onClick={goToToday} className="btn-today">Today</button>
          <button onClick={() => navigateMonth(1)} className="btn-nav">→</button>
        </div>

        <div className="calendar-title">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>

        <div className="calendar-view-switcher">
          <button
            onClick={() => setView('month')}
            className={`btn-view ${view === 'month' ? 'active' : ''}`}
          >
            month
          </button>
          <button
            onClick={() => setView('list')}
            className={`btn-view ${view === 'list' ? 'active' : ''}`}
          >
            list
          </button>
        </div>
      </div>

      {view === 'month' ? renderMonthView() : renderListView()}

      {showViewModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content-view" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Event Details</h3>
              <button onClick={() => setShowViewModal(false)} className="close-btn">✖</button>
            </div>
            <div className="event-details-content">
              <div className="detail-row">
                <span className="detail-label">Title:</span>
                <span className="detail-value">{selectedEvent.title}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className={`event-type-badge ${selectedEvent.source_type === 'exam' ? 'exam' : selectedEvent.type}`}>
                  {selectedEvent.source_type === 'exam' ? 'Exam' : selectedEvent.type?.replace('_', ' ')}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Time:</span>
                <span className="detail-value">
                  {selectedEvent.start_time?.substring(0, 5)} ({selectedEvent.duration_minutes} minutes)
                </span>
              </div>

              {selectedEvent.subject_name && (
                <div className="detail-row">
                  <span className="detail-label">Subject:</span>
                  <span className="detail-value">{selectedEvent.subject_name}</span>
                </div>
              )}

              {selectedEvent.level_name && (
                <div className="detail-row">
                  <span className="detail-label">Level:</span>
                  <span className="detail-value">{selectedEvent.level_name}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{selectedEvent.description}</span>
                </div>
              )}

              {selectedEvent.zoom_link && (
                <div className="detail-row">
                  <span className="detail-label">Zoom Link:</span>
                  <span className="detail-value">
                    <a href={selectedEvent.zoom_link} target="_blank" rel="noopener noreferrer" className="zoom-link">
                      Join Meeting 🔗
                    </a>
                  </span>
                </div>
              )}

              {selectedEvent.meeting_id && (
                <div className="detail-row">
                  <span className="detail-label">Meeting ID:</span>
                  <span className="detail-value">{selectedEvent.meeting_id}</span>
                </div>
              )}

              {selectedEvent.meeting_password && (
                <div className="detail-row">
                  <span className="detail-label">Password:</span>
                  <span className="detail-value">{selectedEvent.meeting_password}</span>
                </div>
              )}

              <div className="modal-actions">
                {selectedEvent.source_type !== 'exam' && (
                  <button 
                    onClick={() => openEditModal(selectedEvent)} 
                    className="btn-edit-modal"
                  >
                    ✏️ Edit Event
                  </button>
                )}
                {selectedEvent.source_type !== 'exam' && (
                  <button 
                    onClick={() => {
                      setShowViewModal(false);
                      openDeleteModal(selectedEvent);
                    }} 
                    className="btn-delete-modal"
                  >
                    🗑️ Delete Event
                  </button>
                )}
                <button onClick={() => setShowViewModal(false)} className="btn-close-modal">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-calendar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditMode ? 'Edit Event' : 'Create Event'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">✖</button>
            </div>
            <form onSubmit={handleSubmit} className="calendar-form">
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select name="type" value={formData.type} onChange={handleInputChange}>
                    <option value="zoom_meeting">Zoom Meeting</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="in_person">In Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Levels ({formData.level_ids.length} selected)</label>
                  <div className="checkbox-list">
                    {levels.map((level) => (
                      <label key={level.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.level_ids.includes(level.id)}
                          onChange={() => handleLevelCheckbox(level.id)}
                        />
                        <span>{level.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Classes ({formData.class_ids.length} selected)</label>
                  <div className="checkbox-list">
                    {classes.map((cls) => (
                      <label key={cls.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.class_ids.includes(cls.id)}
                          onChange={() => handleClassCheckbox(cls.id)}
                        />
                        <span>{cls.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {shouldShowSectionDropdown() && (
                  <div className="form-group">
                    <label>Section</label>
                    <select name="section_id" value={formData.section_id} onChange={handleInputChange}>
                      <option value="">Select Section</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <select name="subject_id" value={formData.subject_id} onChange={handleInputChange}>
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group full-width">
                <label>Zoom Link</label>
                <input
                  type="url"
                  name="zoom_link"
                  value={formData.zoom_link}
                  onChange={handleInputChange}
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Meeting ID</label>
                  <input
                    type="text"
                    name="meeting_id"
                    value={formData.meeting_id}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Meeting Password</label>
                  <input
                    type="text"
                    name="meeting_password"
                    value={formData.meeting_password}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="show_public"
                    checked={formData.show_public}
                    onChange={handleInputChange}
                  />
                  Show publicly on homepage
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && eventToDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirm Delete</h3>
              <button onClick={cancelDelete} className="close-btn">✖</button>
            </div>
            <div className="delete-modal-body">
              <p>Are you sure you want to delete this event?</p>
              <div className="event-delete-info">
                <strong>{eventToDelete.title}</strong>
                <p className="event-delete-date">
                  {new Date(eventToDelete.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {eventToDelete.start_time.substring(0, 5)}
                </p>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button onClick={cancelDelete} className="btn-cancel-delete">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-confirm-delete">
                🗑️ Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default CalendarManagement;
