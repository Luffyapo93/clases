/**
 * blog.js
 * Módulo del Blog: CRUD completo de publicaciones
 */

const Blog = (() => {

  /**
   * Renderizar el listado de publicaciones en la página principal
   */
  function renderPosts() {
    const session = Storage.getSession();
    if (!session) return;

    const posts = Storage.getPostsByUser(session.username);
    const container = document.getElementById('posts-container');
    const countEl = document.getElementById('post-count');

    if (!container) return;

    // Actualizar contador
    if (countEl) {
      countEl.textContent = `${posts.length} ${posts.length === 1 ? 'publicación' : 'publicaciones'}`;
    }

    // Si no hay publicaciones
    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <h3>Aún no hay publicaciones</h3>
          <p>Crea tu primera publicación y comienza a compartir tus ideas con el mundo.</p>
          <button class="btn btn-primary" onclick="Blog.openCreateModal()">
            Crear publicación
          </button>
        </div>
      `;
      return;
    }

    // Generar tarjetas de publicaciones
    container.innerHTML = posts.map(post => `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-card-header">
          <h2 class="post-card-title">
            <a href="post.html?id=${post.id}">${escapeHTML(post.title)}</a>
          </h2>
          <div class="post-card-actions">
            <button class="btn btn-ghost btn-sm" onclick="Blog.openEditModal('${post.id}')" title="Editar" aria-label="Editar publicación">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="Blog.confirmDelete('${post.id}')" title="Eliminar" aria-label="Eliminar publicación" style="color: var(--danger);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="post-card-excerpt">${escapeHTML(post.content)}</p>
        <div class="post-card-meta">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${Storage.timeAgo(post.createdAt)}
          </span>
          ${post.updatedAt !== post.createdAt ? `
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              Editado
            </span>
          ` : ''}
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="17" y1="10" x2="3" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
            ${countWords(post.content)} palabras
          </span>
        </div>
      </article>
    `).join('');
  }

  /**
   * Renderizar la vista individual de una publicación
   */
  function renderPostView() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
      window.location.href = 'index.html';
      return;
    }

    const post = Storage.getPostById(postId);
    const container = document.getElementById('post-view');

    if (!post || !container) {
      window.location.href = 'index.html';
      return;
    }

    container.innerHTML = `
      <a href="index.html" class="post-view-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Volver al blog
      </a>
      <header class="post-view-header">
        <h1 class="post-view-title">${escapeHTML(post.title)}</h1>
        <div class="post-view-meta">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            ${escapeHTML(post.author)}
          </span>
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${Storage.formatDate(post.createdAt)}
          </span>
          ${post.updatedAt !== post.createdAt ? `
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              Editado: ${Storage.formatDate(post.updatedAt)}
            </span>
          ` : ''}
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="17" y1="10" x2="3" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
            ${countWords(post.content)} palabras
          </span>
        </div>
      </header>
      <div class="post-view-content">${escapeHTML(post.content)}</div>
      <div class="post-view-actions">
        <button class="btn btn-secondary" onclick="Blog.openEditModal('${post.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button class="btn btn-danger" onclick="Blog.confirmDelete('${post.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Eliminar
        </button>
      </div>
    `;

    // Actualizar el título de la página
    document.title = `${post.title} — Mi Blog`;
  }

  /**
   * Abrir modal para crear publicación
   */
  function openCreateModal() {
    const modal = document.getElementById('post-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('post-form');
    const submitBtn = document.getElementById('post-submit');
    const postIdInput = document.getElementById('post-id');

    if (!modal) return;

    title.textContent = 'Nueva publicación';
    submitBtn.textContent = 'Publicar';
    postIdInput.value = '';
    form.querySelector('#post-title').value = '';
    form.querySelector('#post-content').value = '';

    clearModalErrors();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus al primer campo
    setTimeout(() => form.querySelector('#post-title').focus(), 300);
  }

  /**
   * Abrir modal para editar publicación
   */
  function openEditModal(postId) {
    const post = Storage.getPostById(postId);
    if (!post) return;

    const modal = document.getElementById('post-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('post-form');
    const submitBtn = document.getElementById('post-submit');
    const postIdInput = document.getElementById('post-id');

    if (!modal) return;

    title.textContent = 'Editar publicación';
    submitBtn.textContent = 'Guardar cambios';
    postIdInput.value = post.id;
    form.querySelector('#post-title').value = post.title;
    form.querySelector('#post-content').value = post.content;

    clearModalErrors();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => form.querySelector('#post-title').focus(), 300);
  }

  /**
   * Cerrar el modal de publicación
   */
  function closeModal() {
    const modal = document.getElementById('post-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Manejar envío del formulario de publicación (crear o editar)
   */
  function handlePostSubmit(formElement) {
    const postIdInput = document.getElementById('post-id');
    const titleInput = formElement.querySelector('#post-title');
    const contentInput = formElement.querySelector('#post-content');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    clearModalErrors();

    // Validaciones
    let isValid = true;

    if (title.length < 3) {
      showModalError('post-title', 'El título debe tener al menos 3 caracteres.');
      isValid = false;
    }

    if (title.length > 150) {
      showModalError('post-title', 'El título no puede superar los 150 caracteres.');
      isValid = false;
    }

    if (content.length < 10) {
      showModalError('post-content', 'El contenido debe tener al menos 10 caracteres.');
      isValid = false;
    }

    if (!isValid) return false;

    const session = Storage.getSession();
    const postId = postIdInput.value;

    if (postId) {
      // Editar publicación existente
      const updated = Storage.updatePost(postId, title, content);
      if (updated) {
        App.showToast('Publicación actualizada.', 'success');
      }
    } else {
      // Crear nueva publicación
      Storage.createPost(title, content, session.username);
      App.showToast('Publicación creada.', 'success');
    }

    closeModal();

    // Re-renderizar según la página actual
    if (document.getElementById('posts-container')) {
      renderPosts();
    } else if (document.getElementById('post-view')) {
      renderPostView();
    }

    return true;
  }

  /**
   * Mostrar diálogo de confirmación para eliminar
   */
  function confirmDelete(postId) {
    const post = Storage.getPostById(postId);
    if (!post) return;

    const modal = document.getElementById('confirm-modal');
    const textEl = document.getElementById('confirm-text');
    const confirmBtn = document.getElementById('confirm-btn');

    if (!modal) return;

    textEl.innerHTML = `Estás a punto de eliminar <strong>"${escapeHTML(post.title)}"</strong>. Esta acción no se puede deshacer.`;
    confirmBtn.onclick = () => {
      Storage.deletePost(postId);
      closeModal('confirm-modal');
      App.showToast('Publicación eliminada.', 'info');

      // Si estamos en la vista individual, volver al listado
      if (document.getElementById('post-view')) {
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      } else {
        renderPosts();
      }
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // ─── Utilidades ───

  function clearModalErrors() {
    const modal = document.getElementById('post-modal');
    if (!modal) return;

    modal.querySelectorAll('.form-input, .form-textarea').forEach(el => {
      el.classList.remove('error');
    });

    modal.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
  }

  function showModalError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.add('error');

    let errorEl = field.parentElement.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-error';
      field.parentElement.appendChild(errorEl);
    }

    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }

  function countWords(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── API Pública ───
  return {
    renderPosts,
    renderPostView,
    openCreateModal,
    openEditModal,
    closeModal,
    handlePostSubmit,
    confirmDelete
  };
})();