import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import Notification from './Notification';
import '../styles/OrdersManagement.css';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setNotification({ message: 'Error fetching orders', type: 'error' });
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ordersAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setNotification({ message: 'Order status updated successfully', type: 'success' });
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error updating order status:', error);
      setNotification({ message: 'Error updating order status', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await ordersAPI.delete(id);
      setNotification({ message: 'Order deleted successfully', type: 'success' });
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error deleting order:', error);
      setNotification({ message: 'Error deleting order', type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_preparation': return 'preparation';
      case 'expedite': return 'expedited';
      case 'livre': return 'delivered';
      case 'annule': return 'cancelled';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_preparation': return 'EN PRÉPARATION';
      case 'expedite': return 'EXPÉDIÉE';
      case 'livre': return 'LIVRÉE';
      case 'annule': return 'ANNULÉE';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique products for filter
  const uniqueProducts = [...new Set(orders.map(order => order.product_name))];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesProduct = filterProduct === 'all' || order.product_name === filterProduct;

    return matchesSearch && matchesStatus && matchesProduct;
  });

  if (loading) {
    return <div className="loading-message">Loading orders...</div>;
  }

  return (
    <div className="page-content">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="orders-header">
        <h1>Gestion des Commandes</h1>
        <p className="subtitle">Gérez et suivez toutes les commandes de vos clients</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-cards">
          <div className="stat-card total">
            <div className="stat-icon">🛒</div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Commandes</p>
            </div>
          </div>
          <div className="stat-card preparation">
            <div className="stat-icon">⚙️</div>
            <div className="stat-info">
              <h3>{stats.en_preparation}</h3>
              <p>En Préparation</p>
            </div>
          </div>
          <div className="stat-card expedited">
            <div className="stat-icon">🚚</div>
            <div className="stat-info">
              <h3>{stats.expedite}</h3>
              <p>Expédiée</p>
            </div>
          </div>
          <div className="stat-card delivered">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <h3>{stats.livre}</h3>
              <p>Livrée</p>
            </div>
          </div>
          <div className="stat-card cancelled">
            <div className="stat-icon">✕</div>
            <div className="stat-info">
              <h3>{stats.annule}</h3>
              <p>Annulée</p>
            </div>
          </div>
          <div className="stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>{stats.total_revenue ? parseFloat(stats.total_revenue).toFixed(2) : '0.00'} DT</h3>
              <p>Revenus</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="orders-filters">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="en_preparation">En Préparation</option>
          <option value="expedite">Expédiée</option>
          <option value="livre">Livrée</option>
          <option value="annule">Annulée</option>
        </select>

        <select 
          value={filterProduct} 
          onChange={(e) => setFilterProduct(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les produits</option>
          {uniqueProducts.map((product, idx) => (
            <option key={idx} value={product}>{product}</option>
          ))}
        </select>

        <button className="btn-export">
          📥 Télécharger Excel
        </button>
      </div>

      {/* Orders List */}
      <div className="orders-list-title">
        <h2>Liste des Commandes</h2>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <h3>No Orders Found</h3>
          <p>No orders match your filters</p>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ADRESSE</th>
                <th>CLIENT</th>
                <th>TÉLÉPHONE</th>
                <th>PRODUITS</th>
                <th>TOTAL</th>
                <th>STATUT</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.address}</td>
                  <td>{order.client_name}</td>
                  <td>
                    <a href={`tel:${order.phone}`} className="phone-link">{order.phone}</a>
                  </td>
                  <td>{order.product_name}</td>
                  <td className="total-price">{order.total_price ? parseFloat(order.total_price).toFixed(2) : '0.00'} DT</td>
                  <td>
                    <select 
                      className={`status-select ${getStatusColor(order.status)}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="en_preparation">EN PRÉPARATION</option>
                      <option value="expedite">EXPÉDIÉE</option>
                      <option value="livre">LIVRÉE</option>
                      <option value="annule">ANNULÉE</option>
                    </select>
                  </td>
                  <td>{formatDate(order.order_date)}</td>
                  <td>
                    <button 
                      className="btn-view-order"
                      onClick={() => handleDelete(order.id)}
                      title="Delete Order"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
