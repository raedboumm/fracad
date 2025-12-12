import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import '../styles/Products.css';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getActive();
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading-message">Chargement des produits...</div>
      </div>
    );
  }

  return (
    <div className="products-page">

      <div className="products-hero">
        <div className="products-hero-content">
          <h1>📚 Nos Produits</h1>
          <p>Découvrez notre collection de livres et ressources éducatives</p>
        </div>
      </div>

      <div className="products-container">
        {products.length === 0 ? (
          <div className="no-products">
            <h3>Aucun produit disponible</h3>
            <p>Revenez bientôt pour découvrir nos nouveaux produits</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="product-image" />
                  ) : (
                    <div className="product-placeholder">
                      <span className="product-icon">📚</span>
                    </div>
                  )}
                  <div className="product-stock-badge">
                    {product.quantity > 0 ? `${product.quantity} disponibles` : 'Épuisé'}
                  </div>
                </div>

                <div className="product-content">
                  <h3 className="product-name">{product.name}</h3>

                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}

                  <div className="product-footer">
                    <div className="product-price">
                      <span className="price-amount">{product.price}</span>
                      <span className="price-currency">DT</span>
                    </div>
                    <button
                      className="product-order-btn"
                      onClick={() => handleProductClick(product.id)}
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
