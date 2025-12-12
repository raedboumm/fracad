import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../services/api';
import '../styles/StudentCalendar.css';

const StudentCalendar = ({ userClassId, userLevelId, userSectionId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, list
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [userClassId, userLevelId, userSectionId]);

  // Refresh events when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userClassId, userLevelId, userSectionId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch calendar events
      const calendarResponse = await calendarAPI.getAll();
      
      // Fetch student exams
      let examEvents = [];
      try {
        const examResponse = await fetch('http://localhost:5000/api/exams/student/my-exams', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const examsData = await examResponse.json();
        
        // Convert exams to calendar events format
        examEvents = Array.isArray(examsData) ? examsData.map(exam => ({
          id: `exam-${exam.id}`,
          title: exam.title,
          description: exam.description,
          date: exam.start_time, // exam.start_time is the date field
          start_time: exam.start_time,
          duration_minutes: exam.duration_minutes,
          type: 'exam',
          source_type: 'exam',
          show_public: false,
          subject_name: exam.subject_name,
          // Mark as exam event
          isExam: true
        })) : [];
        
        console.log('Fetched exams:', examEvents.length);
      } catch (examError) {
        console.error('Error fetching exams for calendar:', examError);
      }
      
      console.log('User Info:', { userLevelId, userClassId, userSectionId });
      
      // Filter calendar events relevant to the student
      const filteredCalendarEvents = calendarResponse.data.filter(event => {
        // Parse level_ids and class_ids from JSON
        let eventLevelIds = [];
        let eventClassIds = [];
        
        try {
          if (event.level_ids) {
            eventLevelIds = typeof event.level_ids === 'string' 
              ? JSON.parse(event.level_ids) 
              : (Array.isArray(event.level_ids) ? event.level_ids : []);
          }
          if (event.class_ids) {
            eventClassIds = typeof event.class_ids === 'string' 
              ? JSON.parse(event.class_ids) 
              : (Array.isArray(event.class_ids) ? event.class_ids : []);
          }
        } catch (e) {
          console.error('Error parsing event IDs:', e, event);
        }

        console.log('Event:', event.title, {
          eventLevelIds,
          eventClassIds,
          eventSectionId: event.section_id,
          showPublic: event.show_public
        });

        // Show public events to everyone
        if (event.show_public) {
          console.log('✓ Public event');
          return true;
        }

        // STUDENT HAS A SECTION (Lycée students)
        if (userSectionId) {
          // If event has a section_id, it MUST match the student's section
          if (event.section_id) {
            const sectionMatch = event.section_id === userSectionId;
            console.log('Section-specific event. Match:', sectionMatch);
            return sectionMatch;
          }
          
          // If event has no section_id, check if student's class matches
          if (eventClassIds.length > 0 && userClassId) {
            const classMatch = eventClassIds.includes(userClassId);
            console.log('No section on event, checking class. Match:', classMatch);
            return classMatch;
          }
        }
        
        // STUDENT HAS NO SECTION (Non-lycée students)
        else {
          // Don't show section-specific events to students without sections
          if (event.section_id) {
            console.log('✗ Event has section, student has none');
            return false;
          }
          
          // Check if student's class matches
          if (eventClassIds.length > 0 && userClassId) {
            const classMatch = eventClassIds.includes(userClassId);
            console.log('Checking class match:', classMatch);
            return classMatch;
          }
        }

        // If event has no restrictions at all (no section, no classes, not public), don't show
        console.log('✗ Event has no matching criteria');
        return false;
      });

      // Combine calendar events and exam events
      const allEvents = [...filteredCalendarEvents, ...examEvents];
      console.log('Total events (calendar + exams):', allEvents.length, '=', filteredCalendarEvents.length, '+', examEvents.length);
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    return events.filter(event => {
      const eventDate = event.date.split('T')[0];
      return eventDate === dateStr;
    });
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const getEventTypeIcon = (type) => {
    switch(type) {
      case 'zoom_meeting': return '🎥';
      case 'google_meet': return '📹';
      case 'in_person': return '🏫';
      case 'exam': return '📝';
      default: return '📅';
    }
  };

  const isEventActive = (event) => {
    if (!event.date || !event.start_time) return false;
    
    // Parse event date and time
    const eventDateStr = event.date.split('T')[0];
    const [hours, minutes] = event.start_time.split(':');
    const eventDateTime = new Date(`${eventDateStr}T${hours}:${minutes}:00`);
    
    // Get current time
    const now = new Date();
    
    // Calculate time difference in minutes
    const diffMinutes = (eventDateTime - now) / (1000 * 60);
    
    // Event is active if it's currently happening
    return diffMinutes <= 0 && diffMinutes >= -event.duration_minutes;
  };

  const canAccessMeeting = (event) => {
    if (!event.date || !event.start_time) return false;
    
    // Parse event date and time
    const eventDateStr = event.date.split('T')[0];
    const [hours, minutes] = event.start_time.split(':');
    const eventDateTime = new Date(`${eventDateStr}T${hours}:${minutes}:00`);
    
    // Get current time
    const now = new Date();
    
    // Calculate time difference in minutes
    const diffMinutes = (eventDateTime - now) / (1000 * 60);
    
    // Allow access 5 minutes before meeting starts
    return diffMinutes <= 5 && diffMinutes >= -event.duration_minutes;
  };

  const getActiveEvents = () => {
    return events.filter(event => isEventActive(event));
  };

  const renderEventModal = () => {
    if (!showEventModal || !selectedEvent) return null;

    const meetingAvailable = canAccessMeeting(selectedEvent);

    return (
      <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
        <div className="modal-content event-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{getEventTypeIcon(selectedEvent.type || selectedEvent.source_type)} {selectedEvent.title}</h2>
            <button className="modal-close" onClick={() => setShowEventModal(false)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="event-detail-section">
              <div className={`event-type-badge-large ${selectedEvent.isExam ? 'exam' : 'meeting'}`}>
                {selectedEvent.isExam ? '📝 Exam' : `🎥 ${selectedEvent.type || 'Event'}`}
              </div>
              
              <div className="event-detail-info">
                <p><strong>📅 Date:</strong> {new Date(selectedEvent.date.split('T')[0] + 'T12:00:00').toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</p>
                <p><strong>🕐 Time:</strong> {formatTime(selectedEvent.start_time)}</p>
                <p><strong>⏱️ Duration:</strong> {selectedEvent.duration_minutes} minutes</p>
                {selectedEvent.subject_name && (
                  <p><strong>📚 Subject:</strong> {selectedEvent.subject_name}</p>
                )}
                {selectedEvent.description && (
                  <div className="event-description-box">
                    <strong>📝 Description:</strong>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              <div className="event-actions">
                {selectedEvent.isExam ? (
                  <button 
                    className="btn-view-exam"
                    onClick={() => {
                      setShowEventModal(false);
                      window.location.href = '?section=exams';
                    }}
                  >
                    📝 Go to Exam Section
                  </button>
                ) : (
                  <>
                    {selectedEvent.zoom_link && (
                      <>
                        {meetingAvailable ? (
                          <a 
                            href={selectedEvent.zoom_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-join-event"
                          >
                            🚀 Join {selectedEvent.type === 'zoom_meeting' ? 'Zoom' : 'Meeting'} Now
                          </a>
                        ) : (
                          <div className="meeting-locked">
                            <p>🔒 Meeting link will be available 5 minutes before start time</p>
                            <p className="countdown-text">Meeting starts at {formatTime(selectedEvent.start_time)}</p>
                          </div>
                        )}
                      </>
                    )}
                    {selectedEvent.meeting_id && (
                      <div className="meeting-details">
                        <p><strong>Meeting ID:</strong> {selectedEvent.meeting_id}</p>
                        {selectedEvent.meeting_password && <p><strong>Password:</strong> {selectedEvent.meeting_password}</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <div key={day} className={`calendar-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}>
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.slice(0, 3).map(event => (
              <div 
                key={event.id} 
                className={`event-dot event-type-${event.type || event.source_type || 'other'} ${isEventActive(event) ? 'event-active' : ''}`} 
                title={event.title}
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventModal(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                {isEventActive(event) && <span className="live-indicator"></span>}
                <span className="event-icon">{getEventTypeIcon(event.type || event.source_type)}</span>
                <span className="event-title">{event.title}</span>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div 
                className="more-events" 
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
    
    return days;
  };

  const renderListView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingEvents = events
      .filter(event => {
        const eventDate = new Date(event.date.split('T')[0] + 'T12:00:00');
        return eventDate >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date.split('T')[0] + 'T12:00:00');
        const dateB = new Date(b.date.split('T')[0] + 'T12:00:00');
        return dateA - dateB;
      });

    if (upcomingEvents.length === 0) {
      return <div className="no-events">📅 No upcoming events</div>;
    }

    return (
      <div className="events-list">
        {upcomingEvents.map(event => (
          <div 
            key={event.id} 
            className={`event-card event-type-${event.type || event.source_type || 'other'}`}
            onClick={() => {
              setSelectedEvent(event);
              setShowEventModal(true);
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="event-icon-large">{getEventTypeIcon(event.type || event.source_type)}</div>
            <div className="event-details">
              <h3>{event.title}</h3>
              <p className="event-date">
                📅 {new Date(event.date.split('T')[0] + 'T12:00:00').toLocaleDateString('en-GB', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </p>
              <p className="event-time">🕐 {formatTime(event.start_time)} ({event.duration_minutes} min)</p>
              {event.subject_name && <p className="event-subject">📚 Subject: {event.subject_name}</p>}
              {event.description && <p className="event-description">{event.description}</p>}
              
              {/* Show appropriate action button */}
              {event.isExam ? (
                <button 
                  className="btn-view-exam"
                  onClick={() => window.location.href = '?section=exams'}
                >
                  View Exam Details
                </button>
              ) : (
                <>
                  {event.zoom_link && (
                    <a href={event.zoom_link} target="_blank" rel="noopener noreferrer" className="btn-join-event">
                      Join {event.type === 'zoom_meeting' ? 'Zoom' : event.type === 'google_meet' ? 'Meet' : 'Session'}
                    </a>
                  )}
                  {event.meeting_id && (
                    <div className="meeting-details">
                      <p><strong>Meeting ID:</strong> {event.meeting_id}</p>
                      {event.meeting_password && <p><strong>Password:</strong> {event.meeting_password}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
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
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📅 {dateStr}</h2>
            <button className="modal-close" onClick={() => setShowDayModal(false)}>✕</button>
          </div>
          <div className="modal-body">
            {dayEvents.length === 0 ? (
              <p>No events on this day</p>
            ) : (
              <div className="modal-events-list">
                {dayEvents.map(event => (
                  <div 
                    key={event.id} 
                    className={`modal-event-card event-type-${event.type || event.source_type || 'other'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDayModal(false);
                      setSelectedEvent(event);
                      setShowEventModal(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="modal-event-icon">{getEventTypeIcon(event.type || event.source_type)}</div>
                    <div className="modal-event-details">
                      <h3>{event.title}</h3>
                      <p className="modal-event-time">🕐 {formatTime(event.start_time)} ({event.duration_minutes} min)</p>
                      {event.subject_name && <p className="modal-event-subject">📚 {event.subject_name}</p>}
                      {event.description && <p className="modal-event-description">{event.description}</p>}
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
    return <div className="loading-spinner">Loading calendar...</div>;
  }

  return (
    <div className="student-calendar">
      {renderEventModal()}
      {renderDayModal()}
      <div className="calendar-header">
        <h1>📅 My Calendar</h1>
        <p className="subtitle">View your scheduled classes and events</p>
        <button className="refresh-btn" onClick={fetchEvents} title="Refresh events">
          🔄 Refresh
        </button>
      </div>

      {getActiveEvents().length > 0 && (
        <div className="active-events-banner">
          <div className="banner-header">
            <span className="live-pulse"></span>
            <span className="banner-title">🔴 LIVE NOW</span>
          </div>
          <div className="active-events-list">
            {getActiveEvents().map(event => (
              <div 
                key={event.id} 
                className={`active-event-item ${event.isExam ? 'exam' : 'meeting'}`}
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventModal(true);
                }}
              >
                <span className="active-event-icon">{getEventTypeIcon(event.type || event.source_type)}</span>
                <div className="active-event-details">
                  <span className="active-event-title">{event.title}</span>
                  <span className="active-event-time">Started at {formatTime(event.start_time)}</span>
                </div>
                {!event.isExam && event.zoom_link && canAccessMeeting(event) && (
                  <a 
                    href={event.zoom_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-join-now"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Join Now
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="calendar-controls">
        <div className="view-toggle">
          <button 
            className={view === 'month' ? 'active' : ''} 
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button 
            className={view === 'list' ? 'active' : ''} 
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>

        {view === 'month' && (
          <div className="month-navigation">
            <button onClick={() => changeMonth(-1)} className="nav-btn">◀</button>
            <h2>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => changeMonth(1)} className="nav-btn">▶</button>
          </div>
        )}
      </div>

      {view === 'month' ? (
        <div className="calendar-grid">
          <div className="calendar-header-days">
            <div className="day-header">Sun</div>
            <div className="day-header">Mon</div>
            <div className="day-header">Tue</div>
            <div className="day-header">Wed</div>
            <div className="day-header">Thu</div>
            <div className="day-header">Fri</div>
            <div className="day-header">Sat</div>
          </div>
          <div className="calendar-days">
            {renderMonthView()}
          </div>
        </div>
      ) : (
        renderListView()
      )}
    </div>
  );
};

export default StudentCalendar;
