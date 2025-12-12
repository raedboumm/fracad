import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, ordersAPI } from '../services/api';
import Notification from '../components/Notification';
import '../styles/ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    client_name: '',
    phone: '',
    address: '',
    quantity: 1
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      setProduct(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setNotification({ message: 'Produit non trouvé', type: 'error' });
      setLoading(false);
    }
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
      const orderData = {
        ...formData,
        product_id: product.id,
        product_name: product.name,
        total_price: product.price * formData.quantity
      };

      await ordersAPI.create(orderData);
      setNotification({ 
        message: 'Commande passée avec succès! Nous vous contacterons bientôt.', 
        type: 'success' 
      });
      
      // Reset form
      setFormData({
        client_name: '',
        phone: '',
        address: '',
        quantity: 1
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setNotification({ 
        message: 'Erreur lors de la commande. Veuillez réessayer.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="loading-message">Chargement...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="error-message">
          <h2>Produit non trouvé</h2>
          <button onClick={() => navigate('/products')} className="btn-back">
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  const isInStock = product.status === 'in_stock' && product.quantity > 0;

  return (
    <div className="product-detail-page">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="product-detail-container">
        <button onClick={() => navigate('/products')} className="btn-back-top">
          ← Retour aux produits
        </button>

        <div className="product-detail-content">
          {/* Product Image */}
          <div className="product-image-section">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="product-detail-image" />
            ) : (
              <div className="product-placeholder-large">
                <span className="product-icon-large">📦</span>
              </div>
            )}
            <div className="product-stock-info">
              {isInStock ? (
                <span className="stock-badge in-stock">
                  ✓ En stock ({product.quantity} disponibles)
                </span>
              ) : (
                <span className="stock-badge out-of-stock">
                  ✗ Rupture de stock
                </span>
              )}
            </div>
          </div>

          {/* Product Info & Order Form */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-price-large">
              <span className="price-amount">{parseFloat(product.price).toFixed(2)}</span>
              <span className="price-currency">DT</span>
            </div>

            {product.description && (
              <div className="product-description-section">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Order Form */}
            <div className="order-form-section">
              <h3>Commander ce produit</h3>
              
              {isInStock ? (
                <form onSubmit={handleSubmit} className="order-form">
                  <div className="form-group">
                    <label>Nom complet *</label>
                    <input
                      type="text"
                      name="client_name"
                      value={formData.client_name}
                      onChange={handleInputChange}
                      required
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="Votre numéro de téléphone"
                    />
                  </div>

                  <div className="form-group">
                    <label>Adresse de livraison *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      placeholder="Adresse complète de livraison"
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantité *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      max={product.quantity}
                      required
                    />
                    <small>{product.quantity} disponibles</small>
                  </div>

                  <div className="order-total-section">
                    <div className="total-row">
                      <span>Prix unitaire:</span>
                      <span>{parseFloat(product.price).toFixed(2)} DT</span>
                    </div>
                    <div className="total-row">
                      <span>Quantité:</span>
                      <span>× {formData.quantity}</span>
                    </div>
                    <div className="total-row final-total">
                      <span>Total:</span>
                      <span className="total-amount">
                        {(product.price * formData.quantity).toFixed(2)} DT
                      </span>
                    </div>
                  </div>

                  <button type="submit" className="btn-submit-order" disabled={submitting}>
                    {submitting ? 'Envoi en cours...' : 'Confirmer la commande'}
                  </button>
                </form>
              ) : (
                <div className="out-of-stock-message">
                  <p>Ce produit est actuellement en rupture de stock.</p>
                  <p>Veuillez vérifier plus tard ou contactez-nous pour plus d'informations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
