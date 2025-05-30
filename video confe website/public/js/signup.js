document.addEventListener('DOMContentLoaded', () => {
  // Get form elements
  const signupForm = document.getElementById('signupForm');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('usernameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const formError = document.getElementById('formError');
  const signupBtnText = document.getElementById('signupBtnText');
  const signupBtnLoader = document.getElementById('signupBtnLoader');
  
  // Check if user is already logged in
  if (Auth.isAuthenticated()) {
    // Redirect to home page
    window.location.href = '/';
    return;
  }
  
  // Handle form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset error messages
    usernameError.textContent = '';
    emailError.textContent = '';
    passwordError.textContent = '';
    formError.textContent = '';
    
    // Get form values
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Basic validation
    let isValid = true;
    
    if (!username) {
      usernameError.textContent = 'Username is required';
      isValid = false;
    } else if (username.length < 3) {
      usernameError.textContent = 'Username must be at least 3 characters';
      isValid = false;
    }
    
    if (!email) {
      emailError.textContent = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(email)) {
      emailError.textContent = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (!password) {
      passwordError.textContent = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loader
    signupBtnText.classList.add('hidden');
    signupBtnLoader.classList.remove('hidden');
    
    try {
      // Submit registration request
      const result = await Auth.register({ username, email, password });
      
      // Show success message
      toast.success('Account created successfully! Redirecting to home page...');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (error) {
      // Handle registration errors
      console.error('Signup error:', error);
      
      // Check for specific errors
      if (error.message.includes('already exists')) {
        if (error.message.includes('email')) {
          emailError.textContent = 'Email is already registered';
        } else if (error.message.includes('username')) {
          usernameError.textContent = 'Username is already taken';
        } else {
          formError.textContent = error.message;
        }
      } else {
        // Generic error
        formError.textContent = error.message || 'Registration failed. Please try again.';
      }
      
      // Hide loader
      signupBtnText.classList.remove('hidden');
      signupBtnLoader.classList.add('hidden');
    }
  });
  
  /**
   * Validate email format
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});