// Load checkout page
document.addEventListener('DOMContentLoaded', () => {
  // Redirect to login if not authenticated
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
    return;
  }
  
  loadCartForCheckout();
  setupCheckoutForm();
});

// Load cart for checkout
async function loadCartForCheckout() {
  const orderItems = document.getElementById('order-items');
  
  if (!orderItems) return;
  
  try {
    const response = await authenticatedFetch(`${API_URL}/cart`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }
    
    const cart = await response.json();
    
    if (!cart.items || cart.items.length === 0) {
      // Redirect to cart if empty
      window.location.href = 'cart.html';
      return;
    }
    
    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => {
      return total + (item.productId.price * item.quantity);
    }, 0);
    
    const shipping = subtotal > 50 ? 0 : 10;
    const total = subtotal + shipping;
    
    // Update summary
    document.getElementById('order-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('order-shipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    document.getElementById('order-total').textContent = formatPrice(total);
    
    // Render order items
    orderItems.innerHTML = cart.items.map(item => `
      <div class="order-item">
        <div class="order-item-image">
          <img src="${item.productId.imageUrl}" alt="${item.productId.name}">
        </div>
        <div class="order-item-details">
          <h4 class="order-item-name">${item.productId.name}</h4>
          <p class="order-item-price">${formatPrice(item.productId.price)}</p>
          <p class="order-item-quantity">Quantity: ${item.quantity}</p>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading cart for checkout:', error);
    orderItems.innerHTML = '<p class="error">Failed to load cart. Please try again later.</p>';
  }
}

// Setup checkout form
function setupCheckoutForm() {
  const checkoutForm = document.getElementById('checkout-form');
  
  if (!checkoutForm) return;
  
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(checkoutForm);
    
    // Create shipping address object
    const shippingAddress = {
      address: formData.get('address'),
      city: formData.get('city'),
      postalCode: formData.get('postalCode'),
      country: formData.get('country')
    };
    
    try {
      const response = await authenticatedFetch(`${API_URL}/orders`, {
        method: 'POST',
        body: JSON.stringify({ shippingAddress })
      });
      
      if (!response.ok) {
        throw new Error('Failed to place order');
      }
      
      const order = await response.json();
      
      // Store order ID in localStorage for confirmation page
      localStorage.setItem('lastOrder', JSON.stringify(order));
      
      // Redirect to confirmation page
      window.location.href = 'order-confirmation.html';
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  });
}