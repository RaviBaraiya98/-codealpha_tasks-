// Load dashboard page
document.addEventListener('DOMContentLoaded', () => {
  // Redirect to login if not authenticated
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
    return;
  }
  
  setupDashboardTabs();
  loadUserProfile();
  loadUserOrders();
  
  // Load admin panel if user is admin
  if (isAdmin()) {
    loadAdminProducts();
    setupProductForm();
  }
});

// Setup dashboard tabs
function setupDashboardTabs() {
  const tabLinks = document.querySelectorAll('.dashboard-nav a');
  const tabs = document.querySelectorAll('.dashboard-tab');
  
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const tabId = link.dataset.tab;
      
      // Update active tab link
      tabLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Show selected tab
      tabs.forEach(tab => {
        if (tab.id === `${tabId}-tab`) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    });
  });
}

// Load user profile
function loadUserProfile() {
  const user = getCurrentUser();
  
  if (!user) return;
  
  // Update dashboard username and email
  document.getElementById('dashboard-username').textContent = user.name;
  document.getElementById('dashboard-email').textContent = user.email;
  
  // Update profile form
  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-email').value = user.email;
}

// Load user orders
async function loadUserOrders() {
  const ordersContainer = document.getElementById('orders-container');
  const noOrders = document.getElementById('no-orders');
  
  if (!ordersContainer || !noOrders) return;
  
  try {
    const response = await authenticatedFetch(`${API_URL}/orders`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const orders = await response.json();
    
    if (orders.length === 0) {
      ordersContainer.classList.add('hidden');
      noOrders.classList.remove('hidden');
      return;
    }
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    ordersContainer.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-card-header">
          <div class="order-number">Order #${order._id}</div>
          <div class="order-date">${formatDate(order.createdAt)}</div>
        </div>
        <div class="order-card-body">
          <div class="order-status ${order.status}">
            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
          <div class="order-items-preview">
            ${order.items.length} item${order.items.length > 1 ? 's' : ''}
          </div>
          <div class="order-total">
            Total: ${formatPrice(order.totalAmount)}
          </div>
        </div>
      </div>
    `).join('');
    
    ordersContainer.classList.remove('hidden');
    noOrders.classList.add('hidden');
    
  } catch (error) {
    console.error('Error loading orders:', error);
    ordersContainer.innerHTML = '<p class="error">Failed to load orders. Please try again later.</p>';
    ordersContainer.classList.remove('hidden');
    noOrders.classList.add('hidden');
  }
}

// Load admin products
async function loadAdminProducts() {
  const adminProductsList = document.getElementById('admin-products-list');
  
  if (!adminProductsList) return;
  
  try {
    const response = await authenticatedFetch(`${API_URL}/products`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const products = await response.json();
    
    if (products.length === 0) {
      adminProductsList.innerHTML = '<p>No products available.</p>';
      return;
    }
    
    adminProductsList.innerHTML = products.map(product => `
      <div class="admin-product-card" data-id="${product._id}">
        <div class="admin-product-image">
          <img src="${product.imageUrl}" alt="${product.name}">
        </div>
        <div class="admin-product-info">
          <h4>${product.name}</h4>
          <p class="admin-product-price">${formatPrice(product.price)}</p>
          <p class="admin-product-stock">Stock: ${product.stock}</p>
        </div>
        <div class="admin-product-actions">
          <button class="edit-btn" data-id="${product._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn" data-id="${product._id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
    
    // Setup edit and delete buttons
    setupProductActions();
    
  } catch (error) {
    console.error('Error loading admin products:', error);
    adminProductsList.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
  }
}

// Setup product actions (edit/delete)
function setupProductActions() {
  // Edit buttons
  const editButtons = document.querySelectorAll('.edit-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const productId = button.dataset.id;
      
      try {
        const response = await authenticatedFetch(`${API_URL}/products/${productId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const product = await response.json();
        
        // Fill form with product data
        document.getElementById('product-modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product._id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-image').value = product.imageUrl;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-description').value = product.description;
        
        // Open modal
        openModal('product-modal');
        
      } catch (error) {
        console.error('Error fetching product for edit:', error);
        alert('Failed to load product details. Please try again.');
      }
    });
  });
  
  // Delete buttons
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.dataset.id;
      
      // Store product ID for delete confirmation
      document.getElementById('confirm-delete').dataset.id = productId;
      
      // Open delete confirmation modal
      openModal('delete-modal');
    });
  });
  
  // Confirm delete button
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      const productId = confirmDeleteBtn.dataset.id;
      
      try {
        const response = await authenticatedFetch(`${API_URL}/products/${productId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete product');
        }
        
        // Close modal
        closeModal('delete-modal');
        
        // Reload products
        loadAdminProducts();
        
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    });
  }
}

// Setup product form
function setupProductForm() {
  const productForm = document.getElementById('product-form');
  const addProductBtn = document.getElementById('add-product-btn');
  
  if (!productForm || !addProductBtn) return;
  
  // Open modal for new product
  addProductBtn.addEventListener('click', () => {
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    productForm.reset();
    document.getElementById('product-id').value = '';
    
    openModal('product-modal');
  });
  
  // Handle form submission
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(productForm);
    const productId = document.getElementById('product-id').value;
    
    const productData = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price')),
      imageUrl: formData.get('imageUrl'),
      category: formData.get('category'),
      stock: parseInt(formData.get('stock')),
      description: formData.get('description')
    };
    
    try {
      let response;
      
      if (productId) {
        // Update existing product
        response = await authenticatedFetch(`${API_URL}/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
        response = await authenticatedFetch(`${API_URL}/products`, {
          method: 'POST',
          body: JSON.stringify(productData)
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save product');
      }
      
      // Close modal
      closeModal('product-modal');
      
      // Reload products
      loadAdminProducts();
      
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  });
}