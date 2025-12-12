import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import Notification from './Notification';
import '../styles/ProductsManagement.css';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    image_url: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setNotification({ message: 'Error fetching products', type: 'error' });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (20MB = 20 * 1024 * 1024 bytes)
      if (file.size > 20 * 1024 * 1024) {
        setNotification({ message: 'Image size must be less than 20MB', type: 'error' });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setNotification({ message: 'Please select a valid image file', type: 'error' });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let productData = { ...formData };

      // If there's an image file, convert to base64
      if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
          productData.image_url = reader.result;
          
          if (editingProduct) {
            await productsAPI.update(editingProduct.id, productData);
            setNotification({ message: 'Product updated successfully', type: 'success' });
          } else {
            await productsAPI.create(productData);
            setNotification({ message: 'Product created successfully', type: 'success' });
          }

          setShowModal(false);
          setEditingProduct(null);
          setImageFile(null);
          setImagePreview('');
          setFormData({ name: '', description: '', price: '', quantity: '', image_url: '' });
          fetchProducts();
        };
      } else {
        if (editingProduct) {
          await productsAPI.update(editingProduct.id, productData);
          setNotification({ message: 'Product updated successfully', type: 'success' });
        } else {
          await productsAPI.create(productData);
          setNotification({ message: 'Product created successfully', type: 'success' });
        }

        setShowModal(false);
        setEditingProduct(null);
        setImageFile(null);
        setImagePreview('');
        setFormData({ name: '', description: '', price: '', quantity: '', image_url: '' });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setNotification({ message: 'Error saving product', type: 'error' });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
      image_url: product.image_url || ''
    });
    setImagePreview(product.image_url || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(id);
      setNotification({ message: 'Product deleted successfully', type: 'success' });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setNotification({ message: 'Error deleting product', type: 'error' });
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', quantity: '', image_url: '' });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({ name: '', description: '', price: '', quantity: '', image_url: '' });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-message">Loading products...</div>;
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

      <div className="products-header">
        <h1>Products Management</h1>
        <button className="btn-add-new" onClick={handleAddNew}>
          <span>+</span> Add New Product
        </button>
      </div>

      <div className="products-controls">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No Products Found</h3>
          <p>Add your first product to get started</p>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="product-thumbnail" />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>{product.price} DT</td>
                  <td>
                    <span className="quantity-badge">{product.quantity}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.status === 'in_stock' ? 'in-stock' : 'out-of-stock'}`}>
                      {product.status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(product)} title="Edit">
                        ✏️
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(product.id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Write your product description..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (DT)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Quantity Available</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="imageUpload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="imageUpload" className="upload-btn">
                    📁 Choose Image
                  </label>
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  )}
                </div>
                <small>Accepted formats: JPG, PNG, GIF, WebP (Max 20MB)</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;
