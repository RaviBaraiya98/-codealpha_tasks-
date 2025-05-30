// Setup login form
document.addEventListener('DOMContentLoaded', () => {
  // Redirect to dashboard if already logged in
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  const loginForm = document.getElementById('login-form');
  
  if (!loginForm) return;
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    clearMessage('login-message');
    
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const userData = await response.json();
      
      // Store user data and token
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }));
      
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
      
    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || 'Invalid email or password', 'login-message');
    }
  });
});