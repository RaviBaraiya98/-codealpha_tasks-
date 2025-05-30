// Import sample products data
import sampleProducts from './sample-products.js';

// Load products on products page
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupFilters();
  setupSorting();
});

// Load products
function loadProducts() {
  const productsGrid = document.getElementById('products-grid');
  const productsCount = document.getElementById('products-count');
  
  if (!productsGrid) return;
  
  // Get filter parameters from URL
  const category = getUrlParam('category') || '';
  const minPrice = getUrlParam('minPrice') || '';
  const maxPrice = getUrlParam('maxPrice') || '';
  
  // Update filter form with URL parameters
  if (category) {
    const categoryRadio = document.querySelector(`input[name="category"][value="${category}"]`);
    if (categoryRadio) categoryRadio.checked = true;
  }
  
  if (minPrice) {
    const minPriceInput = document.getElementById('min-price');
    if (minPriceInput) minPriceInput.value = minPrice;
  }
  
  if (maxPrice) {
    const maxPriceInput = document.getElementById('max-price');
    if (maxPriceInput) maxPriceInput.value = maxPrice;
  }
  
  try {
    // Filter products from sample data instead of API call
    let products = [...sampleProducts];
    
    // Apply filters
    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }
    
    if (minPrice) {
      products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      products = products.filter(p => p.price <= parseFloat(maxPrice));
    }
    
    if (products.length === 0) {
      productsGrid.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
      if (productsCount) productsCount.textContent = '0';
      return;
    }
    
    // Update products count
    if (productsCount) productsCount.textContent = products.length.toString();
    
    // Apply sorting if selected
    const sortBy = document.getElementById('sort-by').value;
    const sortedProducts = sortProducts(products, sortBy);
    
    productsGrid.innerHTML = sortedProducts.map(product => `
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
    console.error('Error loading products:', error);
    productsGrid.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
    if (productsCount) productsCount.textContent = '0';
  }
}

// Setup filter form
function setupFilters() {
  const filterForm = document.getElementById('filter-form');
  
  if (!filterForm) return;
  
  filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(filterForm);
    const category = formData.get('category');
    const minPrice = formData.get('minPrice');
    const maxPrice = formData.get('maxPrice');
    
    // Build query string
    let queryString = '';
    if (category && category !== 'all') queryString += `category=${category}&`;
    if (minPrice) queryString += `minPrice=${minPrice}&`;
    if (maxPrice) queryString += `maxPrice=${maxPrice}&`;
    
    // Remove trailing & if exists
    if (queryString.endsWith('&')) {
      queryString = queryString.slice(0, -1);
    }
    
    // Update URL and reload products
    window.location.href = `products.html${queryString ? `?${queryString}` : ''}`;
  });
  
  // Reset filters
  filterForm.addEventListener('reset', () => {
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 100);
  });
}

// Setup sorting
function setupSorting() {
  const sortBySelect = document.getElementById('sort-by');
  
  if (!sortBySelect) return;
  
  // Set initial value from URL
  const sortParam = getUrlParam('sort');
  if (sortParam) {
    sortBySelect.value = sortParam;
  }
  
  sortBySelect.addEventListener('change', () => {
    const productsGrid = document.getElementById('products-grid');
    const sortBy = sortBySelect.value;
    
    try {
      // Get current products
      const products = Array.from(productsGrid.querySelectorAll('.product-card')).map(card => {
        const name = card.querySelector('.product-name').textContent;
        const price = parseFloat(card.querySelector('.product-price').textContent.replace('$', ''));
        const category = card.querySelector('.product-category').textContent;
        const imageUrl = card.querySelector('img').src;
        const id = card.querySelector('.btn').href.split('id=')[1];
        
        return { name, price, category, imageUrl, _id: id };
      });
      
      // Sort products
      const sortedProducts = sortProducts(products, sortBy);
      
      // Update DOM
      productsGrid.innerHTML = sortedProducts.map(product => `
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
      console.error('Error sorting products:', error);
    }
  });
}

// Sort products
function sortProducts(products, sortBy) {
  const productsCopy = [...products];
  
  switch (sortBy) {
    case 'price-low':
      return productsCopy.sort((a, b) => a.price - b.price);
    case 'price-high':
      return productsCopy.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return productsCopy.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return productsCopy.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return productsCopy;
  }
}