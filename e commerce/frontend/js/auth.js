// Auth state management
let currentUser = null;

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
});

// Check authentication state
function checkAuthState() {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      updateUIForAuthenticatedUser();
    } catch (error) {
      console.error('Error parsing user data:', error);
      logout();
    }
  } else {
    updateUIForUnauthenticatedUser();
  }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
  const authLinks = document.querySelector('.auth-links');
  const userMenu = document.querySelector('.user-menu');
  const usernameElement = document.querySelector('.username');
  const adminLink = document.querySelector('.admin-link');
  
  if (authLinks) authLinks.classList.add('hidden');
  if (userMenu) {
    userMenu.classList.remove('hidden');
    if (usernameElement) usernameElement.textContent = currentUser.name;
  }
  
  // Show admin link if user is admin
  if (adminLink && currentUser.role === 'admin') {
    adminLink.classList.remove('hidden');
  }
  
  // Setup logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
  const authLinks = document.querySelector('.auth-links');
  const userMenu = document.querySelector('.user-menu');
  
  if (authLinks) authLinks.classList.remove('hidden');
  if (userMenu) userMenu.classList.add('hidden');
  
  // Redirect from protected pages
  const protectedPages = ['dashboard.html', 'checkout.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage)) {
    window.location.href = 'login.html';
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  
  // Redirect to home page if on a protected page
  const protectedPages = ['dashboard.html', 'checkout.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage)) {
    window.location.href = 'index.html';
  } else {
    updateUIForUnauthenticatedUser();
  }
}

// Get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

// Check if user is admin
function isAdmin() {
  return currentUser && currentUser.role === 'admin';
}

// Get current user
function getCurrentUser() {
  return currentUser;
}

// API request with auth
async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}