const API = (() => {
  const base = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/api'
    : '/api';
  const headers = () => {
    const h = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };
  const handle = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error de servidor');
    return data;
  };
  return {
    get: (url) => fetch(`${base}${url}`, { headers: headers() }).then(handle),
    post: (url, body) => fetch(`${base}${url}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
    put: (url, body) => fetch(`${base}${url}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(handle),
    patch: (url, body) => fetch(`${base}${url}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handle),
    delete: (url) => fetch(`${base}${url}`, { method: 'DELETE', headers: headers() }).then(handle),
    upload: (url, formData) => fetch(`${base}${url}`, { method: 'PATCH', headers: { Authorization: headers()['Authorization'] }, body: formData }).then(handle),
    _base: base,
  };
})();

const state = { user: null, artworks: [], mentorships: [] };

function getToken() { return localStorage.getItem('lumina_token') || localStorage.getItem('token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('lumina_user') || localStorage.getItem('user')); } catch { return null; }
}

async function checkAuth() {
  const token = getToken();
  if (!token) { window.location.href = '/'; return; }
  try {
    const { user } = await API.get('/auth/me');
    state.user = user;
    localStorage.setItem('lumina_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    renderGreeting(user);
  } catch {
    localStorage.removeItem('lumina_token');
    localStorage.removeItem('token');
    localStorage.removeItem('lumina_user');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

function renderGreeting(user) {
  document.getElementById('dash-greeting').textContent =
    `Bienvenido de vuelta, ${user.name || 'artista'}`;
}

// STATS
async function loadStats() {
  try {
    const { stats } = await API.get('/users/me/stats');
    document.getElementById('stat-artworks').textContent = stats.artworks;
    document.getElementById('stat-views').textContent = stats.views;
    document.getElementById('stat-mentorships').textContent = stats.mentorships;
    document.getElementById('stat-students').textContent = '—';
  } catch {
    // fallback silencioso
  }
}

// ARTWORKS
async function loadArtworks() {
  const grid = document.getElementById('dash-obras-grid');
  grid.innerHTML = '<p class="dash-empty">Cargando...</p>';
  try {
    const me = state.user || getUser();
    const { artworks } = await API.get(`/artworks?artist=${me.id || me._id}&limit=50`);
    state.artworks = artworks;
    renderArtworks();
  } catch {
    grid.innerHTML = '<p class="dash-empty">No se pudieron cargar las obras. ¿Backend corriendo?</p>';
  }
}

function renderArtworks() {
  const grid = document.getElementById('dash-obras-grid');
  if (!state.artworks.length) {
    grid.innerHTML = '<p class="dash-empty">Aún no tienes obras. ¡Sube tu primera obra!</p>';
    return;
  }
  grid.innerHTML = state.artworks.map(a => `
    <div class="dash-card" data-id="${a.id || a._id}">
      <img class="dash-card-img" src="${a.image}" alt="${a.title}" loading="lazy">
      <div class="dash-card-body">
        <h3 class="dash-card-title">${a.title}</h3>
        <p class="dash-card-meta">${a.category || ''} · ${a.views || 0} vistas</p>
        <div class="dash-card-actions">
          <button class="btn-edit" onclick="editArtwork('${a.id || a._id}')">Editar</button>
          <button class="btn-delete" onclick="deleteArtwork('${a.id || a._id}')">Eliminar</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function deleteArtwork(id) {
  if (!confirm('¿Eliminar esta obra permanentemente?')) return;
  try {
    await API.delete(`/artworks/${id}`);
    state.artworks = state.artworks.filter(a => (a.id || a._id) !== id);
    renderArtworks();
    loadStats();
  } catch (e) {
    alert('Error al eliminar: ' + e.message);
  }
}

async function editArtwork(id) {
  // Por ahora redirigimos al modal de obra; en el futuro podríamos precargar datos
  alert('Funcionalidad de edición próximamente');
}

// MENTORSHIPS
async function loadMentorships() {
  const grid = document.getElementById('dash-mentorias-grid');
  grid.innerHTML = '<p class="dash-empty">Cargando...</p>';
  try {
    const me = state.user || getUser();
    const { mentorships } = await API.get(`/mentorships?mentor=${me.id || me._id}&limit=50`);
    state.mentorships = mentorships;
    renderMentorships();
  } catch {
    grid.innerHTML = '<p class="dash-empty">No se pudieron cargar las mentorías.</p>';
  }
}

function renderMentorships() {
  const grid = document.getElementById('dash-mentorias-grid');
  if (!state.mentorships.length) {
    grid.innerHTML = '<p class="dash-empty">Aún no tienes mentorías. ¡Crea tu primera mentoría!</p>';
    return;
  }
  grid.innerHTML = state.mentorships.map(m => `
    <div class="dash-card" data-id="${m.id || m._id}">
      <div class="dash-card-body">
        <h3 class="dash-card-title">${m.title}</h3>
        <p class="dash-card-meta">$${m.price} · ${m.duration} min · ${m.available ? 'Disponible' : 'No disponible'}</p>
        <div class="dash-card-actions">
          <button class="btn-edit" onclick="editMentorship('${m.id || m._id}')">Editar</button>
          <button class="btn-delete" onclick="deleteMentorship('${m.id || m._id}')">Eliminar</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function deleteMentorship(id) {
  if (!confirm('¿Eliminar esta mentoría permanentemente?')) return;
  try {
    await API.delete(`/mentorships/${id}`);
    state.mentorships = state.mentorships.filter(m => (m.id || m._id) !== id);
    renderMentorships();
    loadStats();
  } catch (e) {
    alert('Error al eliminar: ' + e.message);
  }
}

async function editMentorship(id) {
  alert('Funcionalidad de edición próximamente');
}

// PERFIL
async function loadProfile() {
  const user = state.user || getUser();
  if (!user) return;
  document.getElementById('perfil-name').value = user.name || '';
  document.getElementById('perfil-email').value = user.email || '';
  document.getElementById('perfil-bio').value = user.bio || '';
  document.getElementById('perfil-specialties').value = (user.specialties || []).join(', ');
  document.getElementById('perfil-instagram').value = user.socialLinks?.instagram || '';
  document.getElementById('perfil-twitter').value = user.socialLinks?.twitter || '';
  document.getElementById('perfil-website').value = user.socialLinks?.website || '';
}

document.getElementById('dash-perfil-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const successEl = document.getElementById('perfil-success');
  const errorEl = document.getElementById('perfil-error');
  successEl.textContent = '';
  errorEl.textContent = '';

  const fileInput = document.getElementById('perfil-avatar');
  const formData = new FormData();
  formData.append('name', document.getElementById('perfil-name').value);
  formData.append('bio', document.getElementById('perfil-bio').value);
  formData.append('specialties', document.getElementById('perfil-specialties').value);
  formData.append('socialLinks', JSON.stringify({
    instagram: document.getElementById('perfil-instagram').value,
    twitter: document.getElementById('perfil-twitter').value,
    website: document.getElementById('perfil-website').value,
  }));
  if (fileInput.files[0]) formData.append('avatar', fileInput.files[0]);

  try {
    const token = getToken();
    const res = await fetch(`${API._base}/users/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    state.user = data.user;
    localStorage.setItem('lumina_user', JSON.stringify(data.user));
    localStorage.setItem('user', JSON.stringify(data.user));
    successEl.textContent = 'Perfil actualizado correctamente';
    loadProfile();
  } catch (e) {
    errorEl.textContent = e.message;
  }
});

// MODAL OBRA
const modalObra = document.getElementById('modal-obra');
document.getElementById('btn-nueva-obra').onclick = () => modalObra.classList.add('show');
document.querySelectorAll('.modal-close').forEach(el => {
  el.onclick = () => el.closest('.modal').classList.remove('show');
});
document.querySelectorAll('.modal-backdrop').forEach(el => {
  el.onclick = () => el.closest('.modal').classList.remove('show');
});

document.getElementById('form-obra').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('obra-error');
  const successEl = document.getElementById('obra-success');
  errorEl.textContent = '';
  successEl.textContent = '';

  const fileInput = document.getElementById('modal-obra-image');
  const formData = new FormData();
  formData.append('title', document.getElementById('modal-obra-title').value);
  formData.append('description', document.getElementById('modal-obra-desc').value);
  formData.append('category', document.getElementById('modal-obra-category').value);
  formData.append('tags', document.getElementById('modal-obra-tags').value);
  if (fileInput.files[0]) formData.append('image', fileInput.files[0]);

  try {
    const token = getToken();
    const res = await fetch(`${API._base}/artworks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    successEl.textContent = 'Obra publicada correctamente';
    document.getElementById('form-obra').reset();
    modalObra.classList.remove('show');
    loadArtworks();
    loadStats();
  } catch (e) {
    errorEl.textContent = e.message;
  }
});

// MODAL MENTORIA
const modalMentoria = document.getElementById('modal-mentoria');
document.getElementById('btn-nueva-mentoria').onclick = () => modalMentoria.classList.add('show');

document.getElementById('form-mentoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('mentoria-error');
  const successEl = document.getElementById('mentoria-success');
  errorEl.textContent = '';
  successEl.textContent = '';

  try {
    const { mentorship } = await API.post('/mentorships', {
      title: document.getElementById('modal-mentoria-title').value,
      description: document.getElementById('modal-mentoria-desc').value,
      category: document.getElementById('modal-mentoria-category').value,
      price: Number(document.getElementById('modal-mentoria-price').value),
      duration: Number(document.getElementById('modal-mentoria-duration').value),
      skills: document.getElementById('modal-mentoria-skills').value.split(',').map(s => s.trim()).filter(Boolean),
    });
    successEl.textContent = 'Mentoría creada correctamente';
    document.getElementById('form-mentoria').reset();
    modalMentoria.classList.remove('show');
    loadMentorships();
    loadStats();
  } catch (e) {
    errorEl.textContent = e.message;
  }
});

// =========================
// BOOKINGS (SESIONES)
// =========================

async function loadUpcomingSessions() {
  const grid = document.getElementById('dash-sesiones-grid');
  try {
    const { bookings } = await API.get('/bookings/upcoming');
    if (!bookings.length) {
      grid.innerHTML = '<p class="dash-empty">No tienes sesiones próximas</p>';
      return;
    }
    const userId = state.user?._id || state.user?.id;
    grid.innerHTML = bookings.map(b => {
      const otherRole = (b.student?._id === userId || b.student === userId) ? 'mentor' : 'estudiante';
      const otherName = otherRole === 'mentor' ? b.mentor?.name : b.student?.name;
      const date = b.scheduledDate ? new Date(b.scheduledDate).toLocaleString('es') : 'Sin agendar';
      return `
        <div class="dash-card">
          <div class="dash-card-body">
            <h3 class="dash-card-title">${b.mentorship?.title || 'Mentoría'}</h3>
            <p class="dash-card-meta">Con ${otherName} · $${b.amount}</p>
            <p class="dash-card-meta">${date}</p>
            ${!b.scheduledDate ? `<button class="dash-btn-primary" onclick="abrirAgendar('${b._id}')" style="font-size:0.85rem;padding:8px 16px;margin-top:8px">Agendar</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch {
    grid.innerHTML = '<p class="dash-empty">Error al cargar sesiones</p>';
  }
}

async function loadHistory() {
  const grid = document.getElementById('dash-historial-grid');
  try {
    const { bookings } = await API.get('/bookings/history');
    if (!bookings.length) {
      grid.innerHTML = '<p class="dash-empty">No hay sesiones pasadas</p>';
      return;
    }
    const userId = state.user?._id || state.user?.id;
    grid.innerHTML = bookings.map(b => {
      const otherRole = (b.student?._id === userId || b.student === userId) ? 'mentor' : 'estudiante';
      const otherName = otherRole === 'mentor' ? b.mentor?.name : b.student?.name;
      const date = b.scheduledDate ? new Date(b.scheduledDate).toLocaleString('es') : 'Sin fecha';
      const isStudent = b.student?._id === userId || b.student === userId;
      const canReview = b.status === 'completed' && isStudent;
      return `
        <div class="dash-card">
          <div class="dash-card-body">
            <h3 class="dash-card-title">${b.mentorship?.title || 'Mentoría'}</h3>
            <p class="dash-card-meta">Con ${otherName} · $${b.amount}</p>
            <p class="dash-card-meta">${date} · ${b.status}</p>
            ${canReview ? `<button class="dash-btn-primary" onclick="abrirReseña('${b.mentorship?._id || b.mentorship}')" style="font-size:0.85rem;padding:8px 16px;margin-top:8px">Dejar reseña</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch {
    grid.innerHTML = '<p class="dash-empty">Error al cargar historial</p>';
  }
}

// Agendar modal
let currentBookingId = null;

function abrirAgendar(bookingId) {
  currentBookingId = bookingId;
  document.getElementById('agendar-info').textContent = 'Seleccioná fecha y horario para tu mentoría';
  document.getElementById('agendar-error').textContent = '';
  document.getElementById('agendar-success').textContent = '';
  document.getElementById('form-agendar').reset();
  document.getElementById('agendar-slot').innerHTML = '<option value="">Seleccioná una fecha primero</option>';
  document.getElementById('modal-agendar').classList.add('show');

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('agendar-date').min = tomorrow.toISOString().slice(0, 10);
}

document.getElementById('agendar-date').addEventListener('change', async (e) => {
  const date = e.target.value;
  if (!date || !currentBookingId) return;

  const slotSelect = document.getElementById('agendar-slot');
  slotSelect.innerHTML = '<option value="">Cargando horarios...</option>';

  try {
    const { bookings } = await API.get('/bookings/upcoming');
    const booking = bookings.find(b => b._id === currentBookingId || b.id === currentBookingId);
    if (!booking) throw new Error('Booking not found');

    const mentorId = booking.mentor?._id || booking.mentor;
    const { slots } = await API.get(`/bookings/mentor/${mentorId}/slots?date=${date}`);

    if (!slots.length) {
      slotSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
      return;
    }

    slotSelect.innerHTML = slots.map(s => `<option value="${s}">${s}</option>`).join('');
  } catch {
    slotSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
  }
});

document.getElementById('form-agendar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('agendar-error');
  const successEl = document.getElementById('agendar-success');
  errorEl.textContent = '';
  successEl.textContent = '';

  const date = document.getElementById('agendar-date').value;
  const time = document.getElementById('agendar-slot').value;
  if (!date || !time) {
    errorEl.textContent = 'Seleccioná fecha y horario';
    return;
  }

  const scheduledDate = new Date(`${date}T${time}:00`).toISOString();

  try {
    await API.patch(`/bookings/${currentBookingId}/schedule`, { scheduledDate });
    successEl.textContent = 'Sesión agendada correctamente';
    setTimeout(() => {
      document.getElementById('modal-agendar').classList.remove('show');
      loadUpcomingSessions();
    }, 1000);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// =========================
// REVIEWS
// =========================

let currentReviewMentorshipId = null;

function abrirReseña(mentorshipId) {
  currentReviewMentorshipId = mentorshipId;
  document.getElementById('resena-error').textContent = '';
  document.getElementById('resena-success').textContent = '';
  document.getElementById('resena-comment').value = '';
  document.getElementById('resena-rating').value = '0';
  document.querySelectorAll('.star-option').forEach(el => el.classList.remove('active'));
  document.getElementById('modal-resena').classList.add('show');
}

document.querySelectorAll('.star-option').forEach(el => {
  el.addEventListener('click', () => {
    const val = parseInt(el.dataset.value);
    document.getElementById('resena-rating').value = val;
    document.querySelectorAll('.star-option').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.value) <= val);
    });
  });
});

document.getElementById('form-resena').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('resena-error');
  const successEl = document.getElementById('resena-success');
  errorEl.textContent = '';
  successEl.textContent = '';

  const rating = parseInt(document.getElementById('resena-rating').value);
  if (!rating || rating < 1 || rating > 5) {
    errorEl.textContent = 'Seleccioná una puntuación';
    return;
  }

  const comment = document.getElementById('resena-comment').value.trim();

  try {
    await API.post(`/mentorships/${currentReviewMentorshipId}/reviews`, { rating, comment });
    successEl.textContent = '¡Reseña enviada! Gracias por tu feedback.';
    setTimeout(() => {
      document.getElementById('modal-resena').classList.remove('show');
      loadHistory();
    }, 1500);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// Availability
async function loadAvailability() {
  try {
    const { availability } = await API.get('/bookings/availability');
    const form = document.getElementById('dash-avail-form');
    form.style.display = 'block';
    renderAvailSlots(availability.slots || []);
  } catch {
    // Not a mentor, hide
    document.getElementById('dash-availability').style.display = 'none';
  }
}

function renderAvailSlots(slots) {
  const container = document.getElementById('avail-slots');
  if (!slots.length) {
    slots = [{ day: 1, start: '09:00', end: '17:00' }];
  }
  container.innerHTML = slots.map((slot, i) => `
    <div class="dash-form-row" style="margin-bottom:12px;align-items:end">
      <div class="form-group">
        <label>Día</label>
        <select class="avail-day">
          ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d, di) =>
            `<option value="${di}" ${slot.day === di ? 'selected' : ''}>${d}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Desde</label>
        <input type="time" class="avail-start" value="${slot.start}">
      </div>
      <div class="form-group">
        <label>Hasta</label>
        <input type="time" class="avail-end" value="${slot.end}">
      </div>
      ${i > 0 ? `<button type="button" class="btn-delete" onclick="this.closest('.dash-form-row').remove()" style="padding:8px 12px;border:1px solid rgba(255,255,255,0.12);border-radius:6px;background:transparent;color:#ff4040;cursor:pointer;font-size:0.8rem">✕</button>` : ''}
    </div>
  `).join('');
}

document.getElementById('btn-add-slot').addEventListener('click', () => {
  renderAvailSlots([...document.querySelectorAll('.avail-day')].map((sel, i) => ({
    day: parseInt(sel.value),
    start: document.querySelectorAll('.avail-start')[i].value,
    end: document.querySelectorAll('.avail-end')[i].value,
  })).concat([{ day: 1, start: '09:00', end: '17:00' }]));
});

document.getElementById('dash-avail-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const successEl = document.getElementById('avail-success');
  const errorEl = document.getElementById('avail-error');
  successEl.textContent = '';
  errorEl.textContent = '';

  const rows = document.querySelectorAll('.avail-day');
  const slots = Array.from(rows).map((sel, i) => ({
    day: parseInt(sel.value),
    start: document.querySelectorAll('.avail-start')[i].value,
    end: document.querySelectorAll('.avail-end')[i].value,
  }));

  try {
    await API.put('/bookings/availability', { slots });
    successEl.textContent = 'Disponibilidad guardada';
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// TABS
document.querySelectorAll('.dash-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

// CERRAR SESIÓN
document.getElementById('nav-auth-dash').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('lumina_token');
  localStorage.removeItem('token');
  localStorage.removeItem('lumina_user');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// REFRESH
document.getElementById('btn-refresh-obras').addEventListener('click', loadArtworks);

// INIT
(async function init() {
  console.log('[LUMINA] init started');
  await checkAuth();
  console.log('[LUMINA] checkAuth done, user:', state.user?.name, state.user?.role);
  try {
    await Promise.all([
      loadStats(),
      loadArtworks(),
      loadMentorships(),
      loadProfile(),
      loadUpcomingSessions(),
      loadHistory(),
      loadAvailability(),
    ]);
    console.log('[LUMINA] all data loaded');
  } catch(e) {
    console.error('[LUMINA] init error:', e);
  }
})();
