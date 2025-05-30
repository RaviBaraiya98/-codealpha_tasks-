/**
 * Authentication and user management utilities
 */

console.log('Auth module loaded');

// Toast notification system
class Toast {
  static show(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Create global toast instance
window.toast = new Toast();

// Auth class to handle authentication
class Auth {
  constructor() {
    this.token = localStorage.getItem('videoapp_auth_token');
    this.user = JSON.parse(localStorage.getItem('videoapp_user'));
    this.updateUI();
  }

  async register(name, email, password) {
    try {
      console.log('Attempting registration:', { name, email });
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.errors ? data.errors[0].msg : data.message;
        throw new Error(errorMessage || 'Registration failed');
      }

      this.setAuth(data.token, data.user);
      Toast.show('Registration successful!', 'success');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      Toast.show(error.message || 'Registration failed', 'error');
      return false;
    }
  }

  async login(email, password) {
    try {
      console.log('Attempting login:', { email });
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.errors ? data.errors[0].msg : data.message;
        throw new Error(errorMessage || 'Login failed');
      }

      this.setAuth(data.token, data.user);
      Toast.show('Login successful!', 'success');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      Toast.show(error.message || 'Login failed', 'error');
      return false;
    }
  }

  async logout() {
    try {
      console.log('Attempting logout');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      this.clearAuth();
      Toast.show('Logged out successfully', 'success');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show('Logout failed', 'error');
      return false;
    }
  }

  async checkAuth() {
    if (!this.token) return false;

    try {
      console.log('Checking auth status');
      const response = await fetch('/api/auth/status', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication check failed');
      }

      if (data.isAuthenticated) {
        this.user = data.user;
        localStorage.setItem('videoapp_user', JSON.stringify(data.user));
        this.updateUI();
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.clearAuth();
      return false;
    }
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('videoapp_auth_token', token);
    localStorage.setItem('videoapp_user', JSON.stringify(user));
    this.updateUI();
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('videoapp_auth_token');
    localStorage.removeItem('videoapp_user');
    this.updateUI();
  }

  updateUI() {
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const logoutLink = document.getElementById('logoutLink');
    const userInfo = document.getElementById('userInfo');
    const startMeetingBtn = document.getElementById('startMeetingBtn');

    if (this.token && this.user) {
      if (loginLink) loginLink.style.display = 'none';
      if (signupLink) signupLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'inline-block';
      if (userInfo) {
        userInfo.textContent = `Welcome, ${this.user.name}`;
        userInfo.style.display = 'inline-block';
      }
      if (startMeetingBtn) startMeetingBtn.style.display = 'inline-block';
    } else {
      if (loginLink) loginLink.style.display = 'inline-block';
      if (signupLink) signupLink.style.display = 'inline-block';
      if (logoutLink) logoutLink.style.display = 'none';
      if (userInfo) userInfo.style.display = 'none';
      if (startMeetingBtn) startMeetingBtn.style.display = 'none';
    }
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Initialize auth
window.auth = new Auth();

// Check auth status on page load
document.addEventListener('DOMContentLoaded', () => {
  window.auth.checkAuth();
});