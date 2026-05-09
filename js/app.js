/**
 * app.js
 * Inicialización general, utilidades comunes y manejo de toasts
 */

const App = (() => {

  /**
   * Inicializar la aplicación
   */
  function init() {
    // Cargar datos de ejemplo si es la primera vez
    Storage.initializeWithSampleData();

    // Actualizar UI del header según sesión
    Auth.updateHeaderUI();

    // Configurar event listeners globales
    setupGlobalListeners();
  }

  /**
   * Configurar listeners globales
   */
  function setupGlobalListeners() {
    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Blog.closeModal();
        const confirmModal = document.getElementById('confirm-modal');
        if (confirmModal && confirmModal.classList.contains('active')) {
          confirmModal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });

    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /**
   * Mostrar una notificación toast
   */
  function showToast(message, type = 'info') {
    // Crear contenedor si no existe
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Seleccionar icono según tipo
    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;

    container.appendChild(toast);

    // Auto-remover después de 3.5 segundos
    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => {
        toast.remove();
        // Remover contenedor si está vacío
        if (container.children.length === 0) {
          container.remove();
        }
      });
    }, 3500);
  }

  /**
   * Generar el HTML del header reutilizable
   */
  function getHeaderHTML(activePage) {
    return `
      <header class="header">
        <div class="header-inner">
          <a href="index.html" class="header-logo">
            <div class="logo-icon">B</div>
            <span>Mi Blog</span>
          </a>
          <nav class="header-nav" id="auth-nav">
            <!-- Se llena dinámicamente por Auth.updateHeaderUI() -->
          </nav>
        </div>
      </header>
    `;
  }

  /**
   * Generar el HTML del fondo decorativo
   */
  function getBackgroundHTML() {
    return `
      <div class="bg-pattern"></div>
      <div class="dot-grid"></div>
    `;
  }

  /**
   * Generar el HTML de los modales (para páginas que los necesitan)
   */
  function getModalsHTML() {
    return `
      <!-- Modal de Crear/Editar Publicación -->
      <div class="modal-overlay" id="post-modal">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2 id="modal-title">Nueva publicación</h2>
            <button class="modal-close" onclick="Blog.closeModal()" aria-label="Cerrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <form id="post-form" onsubmit="event.preventDefault(); Blog.handlePostSubmit(this);">
            <input type="hidden" id="post-id" value="">
            <div class="form-group">
              <label class="form-label" for="post-title">Titulo</label>
              <input type="text" class="form-input" id="post-title" placeholder="Escribe un titulo para tu publicacion" maxlength="150" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="post-content">Contenido</label>
              <textarea class="form-textarea" id="post-content" placeholder="Escribe el contenido de tu publicacion..." rows="8" required></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="Blog.closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="post-submit">Publicar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Confirmación de Eliminación -->
      <div class="modal-overlay" id="confirm-modal">
        <div class="modal" role="dialog" aria-modal="true" style="max-width: 440px;">
          <div class="modal-header">
            <h2>Confirmar eliminacion</h2>
            <button class="modal-close" onclick="document.getElementById('confirm-modal').classList.remove('active'); document.body.style.overflow = '';" aria-label="Cerrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <p class="confirm-text" id="confirm-text"></p>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('confirm-modal').classList.remove('active'); document.body.style.overflow = '';">Cancelar</button>
            <button class="btn btn-danger" id="confirm-btn">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  }

  // ─── API Pública ───
  return {
    init,
    showToast,
    getHeaderHTML,
    getBackgroundHTML,
    getModalsHTML
  };
})();