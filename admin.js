const API = (() => {
  const base = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/api'
    : '/api';
  const token = () => localStorage.getItem('lumina_token') || localStorage.getItem('token');
  const headers = () => {
    const h = { 'Content-Type': 'application/json' };
    const t = token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  };
  const handle = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    return data;
  };
  return {
    get: (url) => fetch(`${base}${url}`, { headers: headers() }).then(handle),
    patch: (url, body) => fetch(`${base}${url}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handle),
    del: (url) => fetch(`${base}${url}`, { method: 'DELETE', headers: headers() }).then(handle),
  };
})();

function getToken() { return localStorage.getItem('lumina_token') || localStorage.getItem('token'); }

async function checkAuth() {
  const token = getToken();
  if (!token) { window.location.href = '/'; return; }
  try {
    const { user } = await API.get('/auth/me');
    if (user.role !== 'admin') { window.location.href = '/'; return; }
    document.getElementById('admin-greeting').textContent = `Bienvenido, ${user.name}`;
  } catch {
    localStorage.removeItem('lumina_token');
    localStorage.removeItem('token');
    localStorage.removeItem('lumina_user');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

let currentPage = { users: 1, artworks: 1, mentorships: 1, bookings: 1 };

// STATS
async function loadStats() {
  try {
    const { stats } = await API.get('/admin/stats');
    document.getElementById('stat-users').textContent = stats.users;
    document.getElementById('stat-artworks').textContent = stats.artworks;
    document.getElementById('stat-mentorships').textContent = stats.mentorships;
    document.getElementById('stat-bookings').textContent = stats.bookings;
  } catch {}
}

// USERS
async function loadUsers(page = 1) {
  currentPage.users = page;
  const container = document.getElementById('users-table-container');
  container.innerHTML = '<p class="dash-empty">Cargando...</p>';

  const search = document.getElementById('user-search').value;
  const role = document.getElementById('user-role-filter').value;
  let url = `/admin/users?page=${page}&limit=15`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (role) url += `&role=${role}`;

  try {
    const { users, total, pages } = await API.get(url);
    if (!users.length) {
      container.innerHTML = '<p class="dash-empty">No hay usuarios</p>';
      return;
    }
    container.innerHTML = `
      <table class="dash-table">
        <thead><tr>
          <th>Nombre</th><th>Email</th><th>Rol</th><th>Registro</th><th>Acciones</th>
        </tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${u.name}</td>
              <td style="color:rgba(255,255,255,0.5)">${u.email}</td>
              <td><span class="role-badge ${u.role}">${u.role}</span></td>
              <td style="color:rgba(255,255,255,0.4);font-size:0.8rem">${new Date(u.createdAt).toLocaleDateString('es')}</td>
              <td>
                <button class="btn-mini" onclick="changeRole('${u.id || u._id}','${u.role === 'admin' ? 'artist' : 'admin'}')">
                  ${u.role === 'admin' ? 'Hacer artista' : 'Hacer admin'}
                </button>
                <button class="btn-mini btn-danger" onclick="deleteUser('${u.id || u._id}')">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${pages > 1 ? `
        <div class="dash-pagination">
          ${Array.from({length: pages}, (_, i) => `
            <button class="${i+1 === page ? 'active' : ''}" onclick="loadUsers(${i+1})">${i+1}</button>
          `).join('')}
        </div>
      ` : ''}
    `;
  } catch {
    container.innerHTML = '<p class="dash-empty">Error al cargar usuarios</p>';
  }
}

async function changeRole(id, newRole) {
  try {
    await API.patch(`/admin/users/${id}`, { role: newRole });
    loadUsers(currentPage.users);
  } catch (e) {
    alert(e.message);
  }
}

async function deleteUser(id) {
  if (!confirm('¿Eliminar este usuario permanentemente? También se borrarán sus obras y mentorías.')) return;
  try {
    await API.del(`/admin/users/${id}`);
    loadUsers(currentPage.users);
    loadStats();
  } catch (e) {
    alert(e.message);
  }
}

// ARTWORKS
async function loadArtworks(page = 1) {
  currentPage.artworks = page;
  const container = document.getElementById('artworks-table-container');
  container.innerHTML = '<p class="dash-empty">Cargando...</p>';
  try {
    const { artworks, total, pages } = await API.get(`/admin/artworks?page=${page}&limit=15`);
    if (!artworks.length) {
      container.innerHTML = '<p class="dash-empty">No hay obras</p>';
      return;
    }
    container.innerHTML = `
      <table class="dash-table">
        <thead><tr><th>Título</th><th>Artista</th><th>Categoría</th><th>Vistas</th><th>Acciones</th></tr></thead>
        <tbody>
          ${artworks.map(a => `
            <tr>
              <td>${a.title}</td>
              <td style="color:rgba(255,255,255,0.5)">${a.artist?.name || '—'}</td>
              <td>${a.category || '—'}</td>
              <td>${a.views || 0}</td>
              <td><button class="btn-mini btn-danger" onclick="deleteArtwork('${a.id || a._id}')">Eliminar</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${pages > 1 ? `
        <div class="dash-pagination">
          ${Array.from({length: pages}, (_, i) => `
            <button class="${i+1 === page ? 'active' : ''}" onclick="loadArtworks(${i+1})">${i+1}</button>
          `).join('')}
        </div>
      ` : ''}
    `;
  } catch {
    container.innerHTML = '<p class="dash-empty">Error al cargar obras</p>';
  }
}

async function deleteArtwork(id) {
  if (!confirm('¿Eliminar esta obra?')) return;
  try {
    await API.del(`/admin/artworks/${id}`);
    loadArtworks(currentPage.artworks);
    loadStats();
  } catch (e) { alert(e.message); }
}

// MENTORSHIPS
async function loadMentorships(page = 1) {
  currentPage.mentorships = page;
  const container = document.getElementById('mentorships-table-container');
  container.innerHTML = '<p class="dash-empty">Cargando...</p>';
  try {
    const { mentorships, total, pages } = await API.get(`/admin/mentorships?page=${page}&limit=15`);
    if (!mentorships.length) {
      container.innerHTML = '<p class="dash-empty">No hay mentorías</p>';
      return;
    }
    container.innerHTML = `
      <table class="dash-table">
        <thead><tr><th>Título</th><th>Mentor</th><th>Precio</th><th>Duración</th><th>Acciones</th></tr></thead>
        <tbody>
          ${mentorships.map(m => `
            <tr>
              <td>${m.title}</td>
              <td style="color:rgba(255,255,255,0.5)">${m.mentor?.name || '—'}</td>
              <td>$${m.price}</td>
              <td>${m.duration} min</td>
              <td><button class="btn-mini btn-danger" onclick="deleteMentorship('${m.id || m._id}')">Eliminar</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${pages > 1 ? `
        <div class="dash-pagination">
          ${Array.from({length: pages}, (_, i) => `
            <button class="${i+1 === page ? 'active' : ''}" onclick="loadMentorships(${i+1})">${i+1}</button>
          `).join('')}
        </div>
      ` : ''}
    `;
  } catch {
    container.innerHTML = '<p class="dash-empty">Error al cargar mentorías</p>';
  }
}

async function deleteMentorship(id) {
  if (!confirm('¿Eliminar esta mentoría?')) return;
  try {
    await API.del(`/admin/mentorships/${id}`);
    loadMentorships(currentPage.mentorships);
    loadStats();
  } catch (e) { alert(e.message); }
}

// BOOKINGS
async function loadBookings(page = 1) {
  currentPage.bookings = page;
  const container = document.getElementById('bookings-table-container');
  container.innerHTML = '<p class="dash-empty">Cargando...</p>';
  try {
    const { bookings, total, pages } = await API.get(`/admin/bookings?page=${page}&limit=15`);
    if (!bookings.length) {
      container.innerHTML = '<p class="dash-empty">No hay reservas</p>';
      return;
    }
    container.innerHTML = `
      <table class="dash-table">
        <thead><tr><th>Estudiante</th><th>Mentor</th><th>Mentoría</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
        <tbody>
          ${bookings.map(b => `
            <tr>
              <td>${b.student?.name || '—'}</td>
              <td style="color:rgba(255,255,255,0.5)">${b.mentor?.name || '—'}</td>
              <td>${b.mentorship?.title || '—'}</td>
              <td>$${b.amount}</td>
              <td><span class="role-badge" style="background:${b.status === 'completed' ? '#4ade80' : b.status === 'pending' ? 'rgba(255,255,255,0.1)' : '#ff4040'};color:#000">${b.status}</span></td>
              <td style="color:rgba(255,255,255,0.4);font-size:0.8rem">${b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('es') : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${pages > 1 ? `
        <div class="dash-pagination">
          ${Array.from({length: pages}, (_, i) => `
            <button class="${i+1 === page ? 'active' : ''}" onclick="loadBookings(${i+1})">${i+1}</button>
          `).join('')}
        </div>
      ` : ''}
    `;
  } catch {
    container.innerHTML = '<p class="dash-empty">Error al cargar reservas</p>';
  }
}

// TABS
document.querySelectorAll('.dash-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');

    // Load tab data on demand
    const tabName = tab.dataset.tab;
    if (tabName === 'users') loadUsers();
    else if (tabName === 'artworks') loadArtworks();
    else if (tabName === 'mentorships') loadMentorships();
    else if (tabName === 'bookings') loadBookings();
  });
});

// Search
document.getElementById('btn-search-users').addEventListener('click', () => loadUsers());

// Logout
document.getElementById('nav-auth-admin').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('lumina_token');
  localStorage.removeItem('token');
  localStorage.removeItem('lumina_user');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// INIT
(async function init() {
  await checkAuth();
  await loadStats();
  await loadUsers();
})();
