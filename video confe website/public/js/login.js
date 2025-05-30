document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Check if user is already logged in
  if (Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const result = await Auth.login(email, password);
      if (result.success) {
        window.location.href = 'index.html';
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
    }
  });

  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});