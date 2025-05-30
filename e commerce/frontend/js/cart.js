// Import sample products data
import sampleProducts from './sample-products.js';

// Load cart on cart page
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
});

// Load cart
function loadCart() {
  const cartContainer = document.getElementById('cart-container');
  const cartEmpty = document.getElementById('cart-empty');
  const cartSummary = document.getElementById('cart-summary');
  
  if (!cartContainer || !cartEmpty || !cartSummary) return;
  
  try {
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{ "items": [] }');
    
    if (!cart.items || cart.items.length === 0) {
      cartContainer.classList.add('hidden');
      cartEmpty.classList.remove('hidden');
      cartSummary.classList.add('hidden');
      return;
    }
    
    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const shipping = subtotal > 50 ? 0 : 10;
    const total = subtotal + shipping;
    
    // Update summary
    document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    document.getElementById('cart-total').textContent = formatPrice(total);
    
    // Render cart items
    cartContainer.innerHTML = `
      <div class="cart-items">
        ${cart.items.map(item => `
          <div class="cart-item" data-id="${item.productId}">
            <div class="cart-item-image">
              <img src="${item.imageUrl}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
              <h3 class="cart-item-name">${item.name}</h3>
              <p class="cart-item-price">${formatPrice(item.price)}</p>
              <p class="cart-item-total">Total: ${formatPrice(item.price * item.quantity)}</p>
            </div>
            <div class="cart-item-actions">
              <div class="cart-item-quantity">
                <button class="quantity-decrease">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-increase">+</button>
              </div>
              <div class="cart-item-remove">
                <i class="fas fa-trash"></i>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Show cart and summary
    cartContainer.classList.remove('hidden');
    cartEmpty.classList.add('hidden');
    cartSummary.classList.remove('hidden');
    
    // Setup quantity buttons and remove buttons
    setupCartItemActions();
    
  } catch (error) {
    console.error('Error loading cart:', error);
    cartContainer.innerHTML = '<p class="error">Failed to load cart. Please try again later.</p>';
    cartContainer.classList.remove('hidden');
    cartEmpty.classList.add('hidden');
    cartSummary.classList.add('hidden');
  }
}

// Setup cart item actions
function setupCartItemActions() {
  const cartItems = document.querySelectorAll('.cart-item');
  
  cartItems.forEach(item => {
    const productId = item.dataset.id;
    const decreaseBtn = item.querySelector('.quantity-decrease');
    const increaseBtn = item.querySelector('.quantity-increase');
    const removeBtn = item.querySelector('.cart-item-remove');
    const quantitySpan = item.querySelector('.cart-item-quantity span');
    
    // Decrease quantity
    decreaseBtn.addEventListener('click', async () => {
      const currentQuantity = parseInt(quantitySpan.textContent);
      
      if (currentQuantity > 1) {
        await updateCartItemQuantity(productId, currentQuantity - 1);
      }
    });
    
    // Increase quantity
    increaseBtn.addEventListener('click', async () => {
      const currentQuantity = parseInt(quantitySpan.textContent);
      await updateCartItemQuantity(productId, currentQuantity + 1);
    });
    
    // Remove item
    removeBtn.addEventListener('click', async () => {
      await removeCartItem(productId);
    });
  });
}

// Update cart item quantity
function updateCartItemQuantity(productId, quantity) {
  try {
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{ "items": [] }');
    
    // Find item in cart
    const item = cart.items.find(item => item.productId === productId);
    
    if (item) {
      item.quantity = quantity;
      
      // Save updated cart
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Reload cart
      loadCart();
      
      // Update cart count
      updateCartCount();
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    alert('Failed to update cart item. Please try again.');
  }
}

// Remove cart item
function removeCartItem(productId) {
  try {
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{ "items": [] }');
    
    // Remove item from cart
    cart.items = cart.items.filter(item => item.productId !== productId);
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Reload cart
    loadCart();
    
    // Update cart count
    updateCartCount();
  } catch (error) {
    console.error('Error removing cart item:', error);
    alert('Failed to remove cart item. Please try again.');
  }
}