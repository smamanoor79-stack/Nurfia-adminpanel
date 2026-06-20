// api.js
export const BASE_URL = 'http://localhost:5000';

// Token helpers
export function getToken() {
  return localStorage.getItem('nurfia_token');
}

export function saveUser(userData) {
  localStorage.setItem('nurfia_token', userData.token);
  localStorage.setItem('nurfia_user', JSON.stringify({
    _id: userData._id,
    name: userData.name,
    email: userData.email,
    isAdmin: userData.isAdmin
  }));
}

export function getUser() {
  const u = localStorage.getItem('nurfia_user');
  return u ? JSON.parse(u) : null;
}

export function logoutUser() {
  localStorage.removeItem('nurfia_token');
  localStorage.removeItem('nurfia_user');
}

export function isLoggedIn() {
  return !!getToken();
}

// Main fetch wrapper — token auto-attach karta hai
async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ---- AUTH APIs ----
export async function registerUser(name, email, password) {
  const data = await apiFetch('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  saveUser(data);
  return data;
}

export async function loginUser(email, password) {
  const data = await apiFetch('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveUser(data);
  return data;
}

export async function getUserProfile() {
  return await apiFetch('/api/users/profile');
}

// ---- PRODUCTS APIs ----
export async function getAllProducts() {
  return await apiFetch('/api/products');
}

export async function getSingleProduct(id) {
  return await apiFetch(`/api/products/${id}`);
}

export async function getFilteredProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await apiFetch(`/api/products/filter?${query}`);
}

// ---- CART APIs ----
export async function getBackendCart() {
  return await apiFetch('/api/cart');
}

export async function addToBackendCart(product, name, image, price, quantity) {
  return await apiFetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify({ product, name, image, price, quantity }),
  });
}

export async function removeFromBackendCart(productId) {
  return await apiFetch(`/api/cart/${productId}`, { method: 'DELETE' });
}

export async function clearBackendCart() {
  return await apiFetch('/api/cart/clear', { method: 'DELETE' });
}

// ---- WISHLIST APIs ----
export async function getBackendWishlist() {
  return await apiFetch('/api/wishlist');
}

export async function addToBackendWishlist(product, name, image, price) {
  return await apiFetch('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify({ product, name, image, price }),
  });
}

export async function removeFromBackendWishlist(productId) {
  return await apiFetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
}

// ---- ORDER APIs ----
export async function getMyOrders() {
  return await apiFetch('/api/orders/myorders');
}

export async function getOrderById(id) {
  return await apiFetch(`/api/orders/${id}`);
}
// ---- ADMIN PRODUCT APIs  ----
export async function createProduct(productData) {
  return await apiFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(id, productData) {
  return await apiFetch(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
}

export async function deleteProduct(id) {
  return await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
}
// Admin APIs — api.js mein add karo
export async function adminGetAllOrders() {
  return await apiFetch('/api/orders/admin/all');
}

export async function adminGetAllUsers() {
  return await apiFetch('/api/users/admin/all');
}