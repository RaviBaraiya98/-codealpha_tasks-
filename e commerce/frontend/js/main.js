// Global variables
// Using localStorage instead of API calls

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('active') && 
        !navLinks.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
      navLinks.classList.remove('active');
    }
  });
  
  // Update cart count
  updateCartCount();
});

// Format price
function formatPrice(price) {
  return `$${parseFloat(price).toFixed(2)}`;
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show error message
function showError(message, elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.classList.add('error');
    element.classList.remove('hidden');
  }
}

// Show success message
function showSuccess(message, elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.classList.add('success');
    element.classList.remove('hidden');
  }
}

// Clear message
function clearMessage(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = '';
    element.classList.remove('error', 'success');
    element.classList.add('hidden');
  }
}

// Update cart count
function updateCartCount() {
  const cartCountElements = document.querySelectorAll('.cart-count');
  
  if (!cartCountElements.length) return;
  
  try {
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{ "items": [] }');
    const itemCount = cart.items ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    
    cartCountElements.forEach(el => el.textContent = itemCount.toString());
  } catch (error) {
    console.error('Error updating cart count:', error);
    cartCountElements.forEach(el => el.textContent = '0');
  }
}

// Get URL parameter
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Modal functionality
function setupModals() {
  // Open modal
  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
  };
  
  // Close modal
  const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  };
  
  // Close modal when clicking on close button or outside the modal
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal') || 
        e.target.classList.contains('cancel-modal')) {
      const modal = e.target.closest('.modal');
      if (modal) modal.style.display = 'none';
    } else if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
  
  // Expose functions
  window.openModal = openModal;
  window.closeModal = closeModal;
}

// Setup modals on page load
document.addEventListener('DOMContentLoaded', setupModals);