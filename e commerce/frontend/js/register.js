// Setup register form
document.addEventListener('DOMContentLoaded', () => {
  // Redirect to dashboard if already logged in
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  const registerForm = document.getElementById('register-form');
  
  if (!registerForm) return;
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    clearMessage('register-message');
    
    const formData = new FormData(registerForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      showError('Passwords do not match', 'register-message');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
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
      console.error('Registration error:', error);
      showError(error.message || 'Registration failed', 'register-message');
    }
  });
});