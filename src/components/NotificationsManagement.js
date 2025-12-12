import React, { useState, useEffect } from 'react';
import notificationsAPI from '../services/notificationsAPI';
import './NotificationsManagement.css';

const NotificationsManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setStatusMessage({ type: 'error', text: 'Erreur lors du chargement des notifications' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setStatusMessage({ type: 'error', text: 'Veuillez saisir un message' });
      return;
    }

    try {
      setSending(true);
      setStatusMessage(null);
      await notificationsAPI.createNotification(message);
      setStatusMessage({ type: 'success', text: 'Notification envoyée avec succès' });
      setMessage('');
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      setStatusMessage({ type: 'error', text: 'Erreur lors de l\'envoi de la notification' });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification?')) {
      return;
    }

    try {
      await notificationsAPI.deleteNotification(id);
      setStatusMessage({ type: 'success', text: 'Notification supprimée' });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      setStatusMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="notifications-management">
      <div className="notifications-header">
        <h2>📢 Gestion des Notifications</h2>
        <p>Envoyer des messages à tous les étudiants</p>
      </div>

      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="send-notification-section">
        <h3>Envoyer une Nouvelle Notification</h3>
        <form onSubmit={handleSendNotification}>
          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tapez votre message ici... (max 500 caractères)"
              maxLength={500}
              rows={4}
              required
            />
            <span className="char-count">{message.length}/500</span>
          </div>
          <button 
            type="submit" 
            className="send-notification-btn"
            disabled={sending || !message.trim()}
          >
            {sending ? 'Envoi...' : '📤 Envoyer à Tous les Étudiants'}
          </button>
        </form>
      </div>

      <div className="notifications-list-section">
        <h3>Historique des Notifications</h3>
        {loading ? (
          <div className="loading-container">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>Aucune notification envoyée</p>
          </div>
        ) : (
          <div className="notifications-table">
            <table>
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Envoyé le</th>
                  <th>Lus par</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="message-cell">{notification.message}</td>
                    <td className="date-cell">{formatDate(notification.created_at)}</td>
                    <td className="read-count-cell">
                      <span className="read-badge">
                        {notification.read_count} étudiants
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteNotification(notification.id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsManagement;
