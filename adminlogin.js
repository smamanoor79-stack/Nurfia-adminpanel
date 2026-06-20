import { loginUser, getUser, isLoggedIn } from './api.js';

const form = document.getElementById('adminLoginForm');
const errorBox = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');

// Agar already admin-logged-in hai, seedha dashboard pe bhej do
if (isLoggedIn()) {
  const user = getUser();
  if (user && user.isAdmin) {
    window.location.href = 'index.html';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  errorBox.style.display = 'none';
  errorBox.textContent = '';

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';

  try {
    const data = await loginUser(email, password);

    if (!data.isAdmin) {
      errorBox.textContent = 'This account does not have admin access.';
      errorBox.style.display = 'block';
      
      // Non-admin ka token/user clear kar do taake galti se admin panel use na ho
      localStorage.removeItem('nurfia_token');
      localStorage.removeItem('nurfia_user');
      return;
    }

    // Admin hai — dashboard pe bhej do
    window.location.href = 'index.html';

  } catch (err) {
    errorBox.textContent = err.message || 'Login failed. Please try again.';
    errorBox.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});