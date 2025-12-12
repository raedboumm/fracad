import React, { useState, useEffect } from 'react';
import '../styles/LiveSessions.css';

const LiveSessions = ({ userClassId, userLevelId, userSectionId, isSubscriptionActive = true, showNotification }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  console.log('🎬 LiveSessions mounted with:', { userClassId, userLevelId, userSectionId });

  const fetchEvents = async () => {
    console.log('🔄 Starting fetchEvents...');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? 'exists' : 'missing');
      
      const response = await fetch('http://localhost:5000/api/calendar', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      console.log('📅 ALL Calendar events:', data.length, data);
      console.log('📋 Event types found:', data.map(e => e.event_type));
      console.log('🔍 First event fields:', data[0] ? Object.keys(data[0]) : 'no events');
      
      // Show ALL calendar events as live sessions (they are all zoom meetings from calendar management)
      const meetingEvents = data;
      console.log('🎥 Meeting events to show:', meetingEvents.length, meetingEvents);
      
      // Filter by student's level/class/section (same logic as StudentCalendar)
      const filteredEvents = meetingEvents.filter(event => {
        let eventLevelIds = [];
        let eventClassIds = [];
        
        // Parse JSON arrays if needed
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

        // Show public events to everyone
        if (event.show_public) {
          return true;
        }

        // STUDENT HAS A SECTION (Lycée students)
        if (userSectionId) {
          // If event has a section_id, it MUST match the student's section
          if (event.section_id) {
            return event.section_id === userSectionId;
          }
          
          // If event has no section_id, check if student's class matches
          if (eventClassIds.length > 0 && userClassId) {
            return eventClassIds.includes(userClassId);
          }
        }
        
        // STUDENT HAS NO SECTION (Non-lycée students)
        else {
          // Don't show section-specific events to students without sections
          if (event.section_id) {
            return false;
          }
          
          // Check if student's class matches
          if (eventClassIds.length > 0 && userClassId) {
            return eventClassIds.includes(userClassId);
          }
        }

        // If event has no restrictions at all, don't show
        return false;
      });

      console.log('✅ Filtered events for student:', filteredEvents.length, filteredEvents);
      setEvents(filteredEvents);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered');
    fetchEvents();
    
    // Update current time every second for countdown
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh events every 30 seconds
    const fetchInterval = setInterval(() => {
      fetchEvents();
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(fetchInterval);
    };
  }, [userClassId, userLevelId, userSectionId, fetchEvents]);
  const getEventStatus = (event) => {
    // Parse date properly to avoid timezone issues
    const eventDate = event.date;
    const [hours, minutes] = event.start_time.split(':');
    
    // Create date from parts to avoid timezone conversion
    const [year, month, day] = eventDate.split('-');
    const eventDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0, 0);
    
    const now = currentTime;
    const diffMs = eventDateTime - now;
    const diffMinutes = diffMs / (1000 * 60);
    
    console.log('⏰ Event:', event.title, {
      eventDateTime: eventDateTime.toLocaleString(),
      now: now.toLocaleString(),
      diffMinutes: diffMinutes.toFixed(2),
      duration: event.duration_minutes
    });
    
    // Event is live now
    if (diffMinutes <= 0 && diffMinutes >= -event.duration_minutes) {
      console.log('🔴 LIVE:', event.title);
      return {
        status: 'live',
        message: 'LIVE NOW',
        canJoin: true,
        color: '#dc2626'
      };
    }
    
    // Link unlocked (40 minutes before to event end)
    if (diffMinutes > 0 && diffMinutes <= 40) {
      console.log('🟢 UNLOCKED:', event.title);
      return {
        status: 'unlocked',
        message: 'Link Available',
        canJoin: true,
        countdown: Math.ceil(diffMinutes * 60), // seconds
        color: '#16a34a'
      };
    }
    
    // Upcoming (more than 40 minutes away)
    if (diffMinutes > 40) {
      console.log('🔒 LOCKED:', event.title);
      return {
        status: 'locked',
        message: 'Locked',
        canJoin: false,
        countdown: Math.ceil(diffMinutes * 60), // seconds
        unlockTime: Math.ceil((diffMinutes - 40) * 60), // seconds until unlock
        color: '#6b7280'
      };
    }
    
    // Event ended
    console.log('⚫ ENDED:', event.title);
    return {
      status: 'ended',
      message: 'Ended',
      canJoin: false,
      color: '#374151'
    };
  };

  const formatCountdown = (seconds) => {
    if (seconds <= 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getActiveEvents = () => {
    const active = events.filter(event => {
      const status = getEventStatus(event);
      return status.status === 'live';
    }).sort((a, b) => new Date(a.date + ' ' + a.start_time) - new Date(b.date + ' ' + b.start_time));
    console.log('🔴 Active events count:', active.length);
    return active;
  };

  const getUpcomingEvents = () => {
    const upcoming = events.filter(event => {
      const status = getEventStatus(event);
      return status.status === 'locked' || status.status === 'unlocked';
    }).sort((a, b) => new Date(a.date + ' ' + a.start_time) - new Date(b.date + ' ' + b.start_time));
    console.log('📅 Upcoming events count:', upcoming.length);
    return upcoming;
  };

  const getPastEvents = () => {
    const past = events.filter(event => {
      const status = getEventStatus(event);
      return status.status === 'ended';
    }).sort((a, b) => new Date(b.date + ' ' + b.start_time) - new Date(a.date + ' ' + a.start_time));
    console.log('⚫ Past events count:', past.length);
    return past;
  };

  const handleJoinMeeting = (event) => {
    if (!isSubscriptionActive) {
      if (showNotification) {
        showNotification('🔒 Subscription required to join live sessions! Check Offers to unlock.');
      } else {
        alert('🔒 Subscription required to join live sessions!');
      }
      return;
    }
    
    console.log('🔗 Attempting to join meeting:', event.title, 'Link:', event.zoom_link);
    if (event.zoom_link) {
      // Convert Zoom link to web browser format to avoid app download prompt
      let webLink = event.zoom_link;
      
      // If it's a regular Zoom link, convert it to web format
      if (webLink.includes('zoom.us/j/')) {
        // Extract meeting ID and password if present
        const meetingMatch = webLink.match(/\/j\/(\d+)/);
        const passwordMatch = webLink.match(/pwd=([^&\s]+)/);
        
        if (meetingMatch) {
          const meetingId = meetingMatch[1];
          const password = passwordMatch ? passwordMatch[1] : '';
          
          // Create web browser link that forces browser version
          webLink = `https://zoom.us/wc/join/${meetingId}`;
          if (password) {
            webLink += `?pwd=${password}`;
          }
        }
      }
      // Add web parameter to force browser version for other link formats
      else if (!webLink.includes('/wc/')) {
        webLink += webLink.includes('?') ? '&web=1' : '?web=1';
      }
      
      console.log('✅ Opening web link:', webLink);
      window.open(webLink, '_blank', 'noopener,noreferrer');
    } else {
      console.log('❌ No meeting link found');
      alert('Meeting link not available');
    }
  };

  const activeEvents = getActiveEvents();
  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  if (loading) {
    return (
      <div className="live-sessions-container">
        <div className="loading-message">Loading live sessions...</div>
      </div>
    );
  }

  // No events at all
  if (events.length === 0) {
    return (
      <div className="live-sessions-container">
        <div className="no-live-state">
          <div className="no-live-icon">📺</div>
          <h2>No Live Sessions Available</h2>
          <p>There are no scheduled live sessions at the moment.</p>
          <p className="check-later">Check back later for upcoming sessions!</p>
        </div>
      </div>
    );
  }

  // No active events
  if (activeEvents.length === 0 && upcomingEvents.length === 0) {
    return (
      <div className="live-sessions-container">
        <div className="no-live-state dark">
          <div className="no-live-icon">🌙</div>
          <h2>No Live Sessions Running Now</h2>
          <p>All scheduled sessions have ended.</p>
          <p className="check-later">Check back later for upcoming sessions!</p>
        </div>
        
        {pastEvents.length > 0 && (
          <div className="past-sessions-section">
            <h3>📼 Past Sessions</h3>
            <div className="sessions-grid">
              {pastEvents.slice(0, 6).map(event => {
                const status = getEventStatus(event);
                return (
                  <div key={event.id} className="session-card past">
                    <div className="session-header">
                      <div className="session-icon">
                        {event.event_type === 'zoom_meeting' ? '📹' : '🎥'}
                      </div>
                      <div className="session-badge ended">Ended</div>
                    </div>
                    <h3>{event.title}</h3>
                    <p className="session-description">{event.description}</p>
                    <div className="session-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏰</span>
                        <span>{formatTime(event.start_time)} ({event.duration_minutes} min)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="live-sessions-container">
      {/* Active Sessions */}
      {activeEvents.length > 0 && (
        <div className="active-sessions-section">
          <div className="section-header live">
            <h2>
              <span className="live-pulse-dot"></span>
              LIVE NOW
            </h2>
            <p>{activeEvents.length} session{activeEvents.length > 1 ? 's' : ''} in progress</p>
          </div>
          
          <div className="sessions-grid">
            {activeEvents.map(event => {
              const status = getEventStatus(event);
              return (
                <div key={event.id} className="session-card live">
                  <div className="session-header">
                    <div className="session-icon live">
                      {event.event_type === 'zoom_meeting' ? '📹' : '🎥'}
                    </div>
                    <div className="session-badge live">
                      <span className="pulse-dot"></span>
                      LIVE NOW
                    </div>
                  </div>
                  
                  <h3>{event.title}</h3>
                  <p className="session-description">{event.description}</p>
                  
                  <div className="session-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span>{formatTime(event.start_time)} ({event.duration_minutes} min)</span>
                    </div>
                  </div>
                  
                  <button 
                    className="btn-join live"
                    onClick={() => handleJoinMeeting(event)}
                  >
                    Join Live Session
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingEvents.length > 0 && (
        <div className="upcoming-sessions-section">
          <div className="section-header">
            <h2>📅 Upcoming Sessions</h2>
            <p>{upcomingEvents.length} session{upcomingEvents.length > 1 ? 's' : ''} scheduled</p>
          </div>
          
          <div className="sessions-grid">
            {upcomingEvents.map(event => {
              const status = getEventStatus(event);
              return (
                <div key={event.id} className={`session-card ${status.status}`}>
                  <div className="session-header">
                    <div className="session-icon">
                      {event.event_type === 'zoom_meeting' ? '📹' : '🎥'}
                    </div>
                    <div className={`session-badge ${status.status}`}>
                      {status.status === 'unlocked' ? '🔓 Available' : '🔒 Locked'}
                    </div>
                  </div>
                  
                  <h3>{event.title}</h3>
                  <p className="session-description">{event.description}</p>
                  
                  <div className="session-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span>{formatTime(event.start_time)} ({event.duration_minutes} min)</span>
                    </div>
                  </div>
                  
                  {status.status === 'locked' && (
                    <div className="countdown-section">
                      <div className="countdown-label">Link unlocks 40 min before</div>
                      <div className="countdown-timer locked">
                        {formatCountdown(status.unlockTime)}
                      </div>
                      <div className="countdown-sublabel">Session starts in: {formatCountdown(status.countdown)}</div>
                    </div>
                  )}
                  
                  {status.status === 'unlocked' && (
                    <div className="countdown-section unlocked">
                      <div className="countdown-label">Starting in:</div>
                      <div className="countdown-timer unlocked">
                        {formatCountdown(status.countdown)}
                      </div>
                      <button 
                        className="btn-join unlocked"
                        onClick={() => handleJoinMeeting(event)}
                      >
                        Join Session
                      </button>
                    </div>
                  )}
                  
                  {status.status === 'locked' && (
                    <button className="btn-join locked" disabled>
                      🔒 Link Locked
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastEvents.length > 0 && (
        <div className="past-sessions-section">
          <div className="section-header">
            <h2>📼 Past Sessions</h2>
          </div>
          
          <div className="sessions-grid">
            {pastEvents.slice(0, 6).map(event => {
              return (
                <div key={event.id} className="session-card past">
                  <div className="session-header">
                    <div className="session-icon">
                      {event.event_type === 'zoom_meeting' ? '📹' : '🎥'}
                    </div>
                    <div className="session-badge ended">Ended</div>
                  </div>
                  
                  <h3>{event.title}</h3>
                  <p className="session-description">{event.description}</p>
                  
                  <div className="session-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span>{formatTime(event.start_time)} ({event.duration_minutes} min)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessions;
