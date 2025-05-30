// Import sample products data
import sampleProducts from './sample-products.js';

// Load product details on product detail page
document.addEventListener('DOMContentLoaded', () => {
  const productId = getUrlParam('id');
  
  if (productId) {
    loadProductDetails(productId);
    loadRelatedProducts(productId);
  } else {
    window.location.href = 'products.html';
  }
});

// Load product details
function loadProductDetails(productId) {
  const productContainer = document.getElementById('product-container');
  const productBreadcrumb = document.getElementById('product-breadcrumb');
  
  if (!productContainer) return;
  
  try {
    // Find product in sample data instead of API call
    const product = sampleProducts.find(p => p._id === productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Update breadcrumb
    if (productBreadcrumb) {
      productBreadcrumb.textContent = product.name;
    }
    
    // Update page title
    document.title = `${product.name} - ShopEase`;
    
    // Determine stock status
    let stockStatus = '';
    let stockClass = '';
    
    if (product.stock > 10) {
      stockStatus = 'In Stock';
      stockClass = 'in-stock';
    } else if (product.stock > 0) {
      stockStatus = `Low Stock (${product.stock} left)`;
      stockClass = 'low-stock';
    } else {
      stockStatus = 'Out of Stock';
      stockClass = 'out-of-stock';
    }
    
    productContainer.innerHTML = `
      <div class="product-detail-layout">
        <div class="product-detail-image">
          <img src="${product.imageUrl}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
          <h1 class="product-detail-name">${product.name}</h1>
          <p class="product-detail-category">${product.category}</p>
          <p class="product-detail-price">${formatPrice(product.price)}</p>
          <p class="product-detail-description">${product.description}</p>
          <p class="product-detail-stock ${stockClass}">${stockStatus}</p>
          
          ${product.stock > 0 ? `
            <div class="quantity-selector">
              <label for="quantity">Quantity:</label>
              <button class="quantity-decrease">-</button>
              <input type="number" id="quantity" name="quantity" value="1" min="1" max="${product.stock}">
              <button class="quantity-increase">+</button>
            </div>
            <button id="add-to-cart" class="btn btn-primary">Add to Cart</button>
          ` : `
            <button class="btn btn-secondary" disabled>Out of Stock</button>
          `}
        </div>
      </div>
    `;
    
    // Setup quantity selector
    if (product.stock > 0) {
      setupQuantitySelector(product.stock);
      setupAddToCart(product);
    }
    
  } catch (error) {
    console.error('Error loading product details:', error);
    productContainer.innerHTML = '<p class="error">Failed to load product details. Please try again later.</p>';
  }
}

// Setup quantity selector
function setupQuantitySelector(maxStock) {
  const quantityInput = document.getElementById('quantity');
  const decreaseBtn = document.querySelector('.quantity-decrease');
  const increaseBtn = document.querySelector('.quantity-increase');
  
  if (!quantityInput || !decreaseBtn || !increaseBtn) return;
  
  decreaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
      quantityInput.value = currentValue - 1;
    }
  });
  
  increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(quantityInput.value);
    if (currentValue < maxStock) {
      quantityInput.value = currentValue + 1;
    }
  });
  
  quantityInput.addEventListener('change', () => {
    let value = parseInt(quantityInput.value);
    
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > maxStock) {
      value = maxStock;
    }
    
    quantityInput.value = value;
  });
}

// Setup add to cart button
function setupAddToCart(product) {
  const addToCartBtn = document.getElementById('add-to-cart');
  
  if (!addToCartBtn) return;
  
  addToCartBtn.addEventListener('click', () => {
    if (!getCurrentUser) {
      window.location.href = 'login.html';
      return;
    }
    
    const quantity = parseInt(document.getElementById('quantity').value);
    
    try {
      // Simulate adding to cart without API call
      console.log(`Added ${quantity} of product ${product._id} to cart`);
      
      // Get existing cart from localStorage or create new one
      const cart = JSON.parse(localStorage.getItem('cart') || '{ "items": [] }');
      
      // Check if product already in cart
      const existingItem = cart.items.find(item => item.productId === product._id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          productId: product._id,
          quantity,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        });
      }
      
      // Save updated cart
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Show success message
      addToCartBtn.textContent = 'Added to Cart!';
      addToCartBtn.classList.add('btn-success');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        addToCartBtn.textContent = 'Add to Cart';
        addToCartBtn.classList.remove('btn-success');
      }, 2000);
      
      // Update cart count
      updateCartCount();
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      addToCartBtn.textContent = 'Error!';
      addToCartBtn.classList.add('btn-danger');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        addToCartBtn.textContent = 'Add to Cart';
        addToCartBtn.classList.remove('btn-danger');
      }, 2000);
    }
  });
}

// Load related products
function loadRelatedProducts(productId) {
  const relatedProductsContainer = document.getElementById('related-products');
  
  if (!relatedProductsContainer) return;
  
  try {
    // Use sample products data instead of API call
    const products = sampleProducts;
    
    // Get current product to find its category
    const currentProduct = products.find(p => p._id === productId);
    
    if (!currentProduct) {
      relatedProductsContainer.innerHTML = '';
      return;
    }
    
    // Filter products by same category, excluding current product
    const relatedProducts = products
      .filter(p => p.category === currentProduct.category && p._id !== productId)
      .slice(0, 4); // Limit to 4 related products
    
    if (relatedProducts.length === 0) {
      relatedProductsContainer.innerHTML = '<p>No related products found.</p>';
      return;
    }
    
    relatedProductsContainer.innerHTML = relatedProducts.map(product => `
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
    console.error('Error loading related products:', error);
    relatedProductsContainer.innerHTML = '';
  }
}