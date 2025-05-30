// Load order confirmation page
document.addEventListener('DOMContentLoaded', () => {
  // Redirect to login if not authenticated
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
    return;
  }
  
  displayOrderConfirmation();
});

// Display order confirmation
function displayOrderConfirmation() {
  const orderNumber = document.getElementById('order-number');
  const orderDate = document.getElementById('order-date');
  const orderTotal = document.getElementById('order-total');
  const orderStatus = document.getElementById('order-status');
  
  if (!orderNumber || !orderDate || !orderTotal || !orderStatus) return;
  
  // Get order from localStorage
  const orderData = localStorage.getItem('lastOrder');
  
  if (!orderData) {
    // Redirect to home if no order data
    window.location.href = 'index.html';
    return;
  }
  
  try {
    const order = JSON.parse(orderData);
    
    // Display order details
    orderNumber.textContent = order._id;
    orderDate.textContent = formatDate(order.createdAt);
    orderTotal.textContent = formatPrice(order.totalAmount);
    
    // Format status
    const status = order.status.charAt(0).toUpperCase() + order.status.slice(1);
    orderStatus.textContent = status;
    
    // Clear order from localStorage
    localStorage.removeItem('lastOrder');
    
    // Update cart count
    updateCartCount();
    
  } catch (error) {
    console.error('Error displaying order confirmation:', error);
    window.location.href = 'index.html';
  }
}