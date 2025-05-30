// Import sample products data
import sampleProducts from './sample-products.js';

// Load featured products on home page
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
});

// Load featured products
function loadFeaturedProducts() {
  const featuredProductsContainer = document.getElementById('featured-products');
  
  if (!featuredProductsContainer) return;
  
  try {
    // Use sample products data instead of API call
    const products = sampleProducts;
    
    // Display only first 4 products as featured
    const featuredProducts = products.slice(0, 4);
    
    if (featuredProducts.length === 0) {
      featuredProductsContainer.innerHTML = '<p class="no-products">No products available.</p>';
      return;
    }
    
    featuredProductsContainer.innerHTML = featuredProducts.map(product => `
      <div class="product-card">
        <div class="product-image">
          <img src="${product.imageUrl}" alt="${product.name}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-category">${product.category}</p>
          <p class="product-price">${formatPrice(product.price)}</p>
          <div class="product-actions">
            <a href="product-detail.html?id=${product._id}" class="btn btn-primary">View Details</a>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading featured products:', error);
    featuredProductsContainer.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
  }
}