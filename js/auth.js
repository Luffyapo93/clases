/**
 * auth.js
 * Módulo de autenticación: registro, login, logout, protección de rutas
 */

const Auth = (() => {

  /**
   * Registrar un nuevo usuario
   */
  function register(formElement) {
    const username = formElement.querySelector('#reg-username').value.trim();
    const displayName = formElement.querySelector('#reg-displayname').value.trim();
    const password = formElement.querySelector('#reg-password').value;
    const confirmPassword = formElement.querySelector('#reg-confirm').value;

    // Limpiar errores previos
    clearFormErrors(formElement);

    // Validaciones
    let isValid = true;

    if (username.length < 3) {
      showFieldError('reg-username', 'El usuario debe tener al menos 3 caracteres.');
      isValid = false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showFieldError('reg-username', 'Solo se permiten letras, números y guion bajo.');
      isValid = false;
    }

    if (displayName.length < 2) {
      showFieldError('reg-displayname', 'El nombre debe tener al menos 2 caracteres.');
      isValid = false;
    }

    if (password.length < 6) {
      showFieldError('reg-password', 'La contraseña debe tener al menos 6 caracteres.');
      isValid = false;
    }

    if (password !== confirmPassword) {
      showFieldError('reg-confirm', 'Las contraseñas no coinciden.');
      isValid = false;
    }

    if (!isValid) return false;

    // Intentar crear el usuario
    const result = Storage.createUser(username, password, displayName);

    if (!result.success) {
      showFieldError('reg-username', result.message);
      return false;
    }

    // Crear sesión automáticamente tras registro
    Storage.createSession(result.user);
    App.showToast('Cuenta creada exitosamente. Bienvenido/a.', 'success');

    // Redirigir al blog
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);

    return true;
  }

  /**
   * Iniciar sesión
   */
  function login(formElement) {
    const username = formElement.querySelector('#login-username').value.trim();
    const password = formElement.querySelector('#login-password').value;

    // Limpiar errores previos
    clearFormErrors(formElement);

    // Validaciones básicas
    let isValid = true;

    if (!username) {
      showFieldError('login-username', 'Ingresa tu nombre de usuario.');
      isValid = false;
    }

    if (!password) {
      showFieldError('login-password', 'Ingresa tu contraseña.');
      isValid = false;
    }

    if (!isValid) return false;

    // Verificar credenciales
    const result = Storage.verifyCredentials(username, password);

    if (!result.success) {
      showFieldError('login-username', result.message);
      return false;
    }

    // Crear sesión
    Storage.createSession(result.user);
    App.showToast(`Hola, ${result.user.displayName}`, 'success');

    // Redirigir al blog
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);

    return true;
  }

  /**
   * Cerrar sesión
   */
  function logout() {
    Storage.destroySession();
    App.showToast('Sesión cerrada.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 600);
  }

  /**
   * Proteger una ruta: redirige a login si no hay sesión
   */
  function requireAuth() {
    if (!Storage.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  /**
   * Redirigir si ya hay sesión activa (para login/register)
   */
  function redirectIfLoggedIn() {
    if (Storage.isLoggedIn()) {
      window.location.href = 'index.html';
      return true;
    }
    return false;
  }

  /**
   * Actualizar la interfaz del header según el estado de sesión
   */
  function updateHeaderUI() {
    const session = Storage.getSession();
    const authNav = document.getElementById('auth-nav');

    if (!authNav) return;

    if (session) {
      authNav.innerHTML = `
        <span class="nav-link" style="color: var(--text-muted); pointer-events: none;">
          ${escapeHTML(session.displayName)}
        </span>
        <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" aria-label="Cerrar sesión">
          Salir
        </button>
      `;
    } else {
      authNav.innerHTML = `
        <a href="login.html" class="nav-link">Ingresar</a>
        <a href="register.html" class="btn btn-primary btn-sm">Registrarse</a>
      `;
    }
  }

  // ─── Utilidades de formulario ───

  function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.add('error');

    // Buscar o crear el elemento de error
    let errorEl = field.parentElement.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-error';
      field.parentElement.appendChild(errorEl);
    }

    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }

  function clearFormErrors(formElement) {
    const inputs = formElement.querySelectorAll('.form-input, .form-textarea');
    inputs.forEach(input => {
      input.classList.remove('error');
    });

    const errors = formElement.querySelectorAll('.form-error');
    errors.forEach(err => {
      err.textContent = '';
      err.classList.remove('visible');
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── API Pública ───
  return {
    register,
    login,
    logout,
    requireAuth,
    redirectIfLoggedIn,
    updateHeaderUI
  };
})();