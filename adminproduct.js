import {
  getUser,
  isLoggedIn,
  logoutUser,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adminGetAllOrders,
  adminGetAllUsers,
} from './api.js';

const gate = document.getElementById('adminGate');
const layout = document.getElementById('adminLayout');

// Page detection — same file works on adminproduct.html AND admindashboard.html
const isProductsPage = !!document.getElementById('adminProductsBody');
const isDashboardPage = !!document.getElementById('statRevenue');

let products = [];
let editingId = null; // null = add mode, otherwise editing this product's _id

const tbody = document.getElementById('adminProductsBody');
const countLabel = document.getElementById('productCountLabel');

// ===== ADMIN ACCESS CHECK (shared by both pages) =====
const user = getUser();
if (!isLoggedIn() || !user || !user.isAdmin) {
  gate.style.display = 'flex';
  layout.style.display = 'none';
} else {
  gate.style.display = 'none';
  layout.style.display = 'flex';
  init();
}

document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
  logoutUser();
  window.location.href = 'index.html';
});

async function init() {
  if (isDashboardPage) {
    initDashboardGreeting();
    await loadDashboard();
  } else if (isProductsPage) {
    await loadProducts();
  }
}

/* =========================================================
   PRODUCTS PAGE (adminproduct.html)
========================================================= */

async function loadProducts() {
  tbody.innerHTML = `<tr><td colspan="6" class="admin-table-loading">Loading…</td></tr>`;
  try {
    products = await getAllProducts();
    renderTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-table-empty">Could not load products: ${escapeHtml(err.message)}</td></tr>`;
    countLabel.textContent = 'Failed to load';
  }
}

function renderTable() {
  countLabel.textContent = `${products.length} product${products.length === 1 ? '' : 's'} total`;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-table-empty">No products yet. Click "Add Product" to create one.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const inStock = p.stock > 0 && p.availability !== false;
    const displayPrice = p.salePrice ? `<span style="text-decoration:line-through;color:#bbb;margin-right:6px;">$${p.price.toFixed(2)}</span>$${p.salePrice.toFixed(2)}` : `$${p.price.toFixed(2)}`;
    return `
      <tr>
        <td>
          <div class="admin-product-cell">
            <img src="${p.image || ''}" alt="${escapeHtml(p.name)}" onerror="this.style.visibility='hidden'" />
            <span class="admin-product-name">${escapeHtml(p.name)}</span>
          </div>
        </td>
        <td>${escapeHtml(p.category || '-')}${p.subCategory ? ' / ' + escapeHtml(p.subCategory) : ''}</td>
        <td>${displayPrice}</td>
        <td>${p.stock ?? 0}</td>
        <td><span class="admin-badge ${inStock ? 'in-stock' : 'out-stock'}">${inStock ? 'In Stock' : 'Out of Stock'}</span></td>
        <td>
          <div class="admin-row-actions">
            <button class="admin-icon-btn edit-btn" data-id="${p._id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="admin-icon-btn delete-btn" data-id="${p._id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== PRODUCT MODAL =====
const productModal = document.getElementById('productModal');
const productModalOverlay = document.getElementById('productModalOverlay');
const productModalTitle = document.getElementById('productModalTitle');
const productFormError = document.getElementById('productFormError');

const fields = ['name', 'category', 'subCategory', 'price', 'salePrice', 'discount', 'stock', 'availability', 'image', 'images', 'colors', 'sizes', 'tags', 'description'];

function getField(id) { return document.getElementById('pf-' + id); }

function openAddModal() {
  editingId = null;
  productModalTitle.textContent = 'Add Product';
  fields.forEach(f => { if (getField(f)) getField(f).value = ''; });
  getField('availability').value = 'true';
  productFormError.textContent = '';
  openProductModal();
}

function openEditModal(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;
  editingId = id;
  productModalTitle.textContent = 'Edit Product';
  productFormError.textContent = '';

  getField('name').value = p.name || '';
  getField('category').value = p.category || '';
  getField('subCategory').value = p.subCategory || '';
  getField('price').value = p.price ?? '';
  getField('salePrice').value = p.salePrice ?? '';
  getField('discount').value = p.discount ?? '';
  getField('stock').value = p.stock ?? '';
  getField('availability').value = p.availability === false ? 'false' : 'true';
  getField('image').value = p.image || '';
  getField('images').value = (p.images || []).join(', ');
  getField('colors').value = (p.colors || []).join(', ');
  getField('sizes').value = (p.sizes || []).join(', ');
  getField('tags').value = (p.tags || []).join(', ');
  getField('description').value = p.description || '';

  openProductModal();
}

function openProductModal() {
  productModal.classList.add('active');
  productModalOverlay.classList.add('active');
}
function closeProductModal() {
  productModal.classList.remove('active');
  productModalOverlay.classList.remove('active');
}

document.getElementById('addProductBtn')?.addEventListener('click', openAddModal);
document.getElementById('productModalClose')?.addEventListener('click', closeProductModal);
document.getElementById('productModalCancel')?.addEventListener('click', closeProductModal);
productModalOverlay?.addEventListener('click', closeProductModal);

function splitToArray(value) {
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

document.getElementById('productModalSave')?.addEventListener('click', async () => {
  const name = getField('name').value.trim();
  const category = getField('category').value.trim();
  const price = parseFloat(getField('price').value);

  if (!name || !category || isNaN(price)) {
    productFormError.textContent = 'Name, Category and Price are required.';
    return;
  }

  const payload = {
    name,
    category,
    subCategory: getField('subCategory').value.trim() || undefined,
    price,
    salePrice: getField('salePrice').value ? parseFloat(getField('salePrice').value) : undefined,
    discount: getField('discount').value ? parseFloat(getField('discount').value) : undefined,
    stock: getField('stock').value ? parseInt(getField('stock').value) : 0,
    availability: getField('availability').value === 'true',
    image: getField('image').value.trim() || undefined,
    images: splitToArray(getField('images').value),
    colors: splitToArray(getField('colors').value),
    sizes: splitToArray(getField('sizes').value),
    tags: splitToArray(getField('tags').value),
    description: getField('description').value.trim() || undefined,
  };

  const saveBtn = document.getElementById('productModalSave');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    if (editingId) {
      await updateProduct(editingId, payload);
    } else {
      await createProduct(payload);
    }
    closeProductModal();
    await loadProducts();
  } catch (err) {
    productFormError.textContent = err.message || 'Something went wrong.';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
  }
});

// ===== DELETE MODAL =====
const deleteModal = document.getElementById('deleteModal');
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
let deleteTargetId = null;

function openDeleteModal(id) {
  deleteTargetId = id;
  deleteModal.classList.add('active');
  deleteModalOverlay.classList.add('active');
}
function closeDeleteModal() {
  deleteTargetId = null;
  deleteModal.classList.remove('active');
  deleteModalOverlay.classList.remove('active');
}

document.getElementById('deleteModalCancel')?.addEventListener('click', closeDeleteModal);
deleteModalOverlay?.addEventListener('click', closeDeleteModal);

document.getElementById('deleteModalConfirm')?.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  const btn = document.getElementById('deleteModalConfirm');
  btn.disabled = true;
  btn.textContent = 'Deleting…';
  try {
    await deleteProduct(deleteTargetId);
    closeDeleteModal();
    await loadProducts();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
});

/* =========================================================
   DASHBOARD PAGE (admindashboard.html)
========================================================= */

function initDashboardGreeting() {
  const hr = new Date().getHours();
  const greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    greetingEl.textContent = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  }
}

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function loadDashboard() {
  try {
    const [orders, users, dashProducts] = await Promise.all([
      adminGetAllOrders().catch(() => []),
      adminGetAllUsers().catch(() => []),
      getAllProducts().catch(() => []),
    ]);

    renderStats(orders, users, dashProducts);
    renderRecentOrders(orders);
    renderLowStock(dashProducts);
    renderCategories(dashProducts);
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

function renderStats(orders, users, dashProducts) {
  const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const paidOrders = orders.filter(o => o.isPaid).length;
  const delivered = orders.filter(o => o.isDelivered).length;
  const lowStock = dashProducts.filter(p => (p.stock ?? 0) <= 5).length;
  const admins = users.filter(u => u.isAdmin).length;

  document.getElementById('statRevenue').textContent = fmt(totalRevenue);
  document.getElementById('statRevenueSub').textContent = `${paidOrders} paid order${paidOrders !== 1 ? 's' : ''}`;

  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statOrdersSub').textContent = `${delivered} delivered`;

  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statUsersSub').textContent = `${admins} admin${admins !== 1 ? 's' : ''}`;

  document.getElementById('statProducts').textContent = dashProducts.length;
  document.getElementById('statProductsSub').textContent = `${lowStock} low stock`;
}

function renderRecentOrders(orders) {
  const body = document.getElementById('recentOrdersBody');
  const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  if (recent.length === 0) {
    body.innerHTML = `<tr><td colspan="4"><div class="empty-sm">No orders yet.</div></td></tr>`;
    return;
  }

  body.innerHTML = recent.map(o => {
    const badge = o.isDelivered
      ? `<span class="badge badge-delivered">Delivered</span>`
      : o.isPaid
      ? `<span class="badge badge-paid">Paid</span>`
      : `<span class="badge badge-pending">Pending</span>`;
    return `
      <tr>
        <td class="order-id-sm">#${o._id.slice(-7).toUpperCase()}</td>
        <td style="font-size:13px">${escapeHtml(o.user?.name || 'Unknown')}</td>
        <td style="font-size:13px;font-weight:600">${fmt(o.totalPrice)}</td>
        <td>${badge}</td>
      </tr>`;
  }).join('');
}

function renderLowStock(dashProducts) {
  const el = document.getElementById('lowStockList');
  const lowList = [...dashProducts].filter(p => (p.stock ?? 0) <= 10).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 5);

  if (lowList.length === 0) {
    el.innerHTML = `<div class="empty-sm">All products are well stocked.</div>`;
    return;
  }

  el.innerHTML = lowList.map(p => {
    const isLow = (p.stock ?? 0) <= 5;
    const FALLBACK_IMG = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='38' height='44' viewBox='0 0 38 44'%3E%3Crect width='38' height='44' fill='%23eeeeee'/%3E%3Ctext x='19' y='25' font-size='10' text-anchor='middle' fill='%23999999'%3EN%2FA%3C%2Ftext%3E%3C%2Fsvg%3E";
    const imgTag = p.image && p.image.endsWith('.mp4')
      ? `<video class="stock-img" src="${p.image}" muted></video>`
      : `<img class="stock-img" src="${p.image || FALLBACK_IMG}" alt="${escapeHtml(p.name)}"
           onerror="this.onerror=null;this.src='${FALLBACK_IMG}'" />`;
    return `
      <div class="stock-item">
        ${imgTag}
        <div class="stock-info">
          <div class="stock-name">${escapeHtml(p.name)}</div>
          <div class="stock-cat">${escapeHtml(p.category || '—')}</div>
        </div>
        <div class="stock-count ${isLow ? '' : 'ok'}">${p.stock ?? 0} left</div>
      </div>`;
  }).join('');
}

function renderCategories(dashProducts) {
  const el = document.getElementById('categoryList');
  const catMap = {};
  dashProducts.forEach(p => {
    const cat = p.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries[0]?.[1] || 1;

  if (catEntries.length === 0) {
    el.innerHTML = `<div class="empty-sm">No products.</div>`;
    return;
  }

  el.innerHTML = catEntries.map(([cat, count]) => `
    <div class="cat-row">
      <div class="cat-label-row">
        <span class="cat-name">${escapeHtml(cat)}</span>
        <span class="cat-count">${count} product${count !== 1 ? 's' : ''}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.round(count / maxCat * 100)}%"></div>
      </div>
    </div>`).join('');
}