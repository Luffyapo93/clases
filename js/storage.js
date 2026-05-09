/**
 * storage.js
 * Módulo de abstracción para LocalStorage
 * Maneja usuarios y publicaciones con interfaz limpia
 */

const Storage = (() => {
  // Claves de LocalStorage
  const KEYS = {
    USERS: 'blog_users',
    POSTS: 'blog_posts',
    SESSION: 'blog_session',
    INITIALIZED: 'blog_initialized'
  };

  // ─── Métodos genéricos ───

  /**
   * Obtener un valor parseado de LocalStorage
   */
  function get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error leyendo "${key}":`, error);
      return null;
    }
  }

  /**
   * Guardar un valor serializado en LocalStorage
   */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error guardando "${key}":`, error);
      return false;
    }
  }

  /**
   * Eliminar una clave de LocalStorage
   */
  function remove(key) {
    localStorage.removeItem(key);
  }

  // ─── Usuarios ───

  /**
   * Obtener todos los usuarios registrados
   */
  function getUsers() {
    return get(KEYS.USERS) || [];
  }

  /**
   * Buscar un usuario por su nombre de usuario
   */
  function getUserByUsername(username) {
    const users = getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  /**
   * Registrar un nuevo usuario
   */
  function createUser(username, password, displayName) {
    const users = getUsers();

    // Verificar si el usuario ya existe
    if (getUserByUsername(username)) {
      return { success: false, message: 'El nombre de usuario ya está en uso.' };
    }

    // Crear objeto de usuario
    const newUser = {
      id: generateId('user'),
      username: username.trim().toLowerCase(),
      password: password, // En producción se usaría hash
      displayName: displayName.trim(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    set(KEYS.USERS, users);

    return { success: true, user: newUser };
  }

  /**
   * Verificar credenciales de inicio de sesión
   */
  function verifyCredentials(username, password) {
    const user = getUserByUsername(username);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    return { success: true, user };
  }

  // ─── Sesión ───

  /**
   * Crear una sesión activa
   */
  function createSession(user) {
    const session = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      loggedInAt: new Date().toISOString()
    };
    set(KEYS.SESSION, session);
    return session;
  }

  /**
   * Obtener la sesión actual
   */
  function getSession() {
    return get(KEYS.SESSION);
  }

  /**
   * Cerrar la sesión actual
   */
  function destroySession() {
    remove(KEYS.SESSION);
  }

  /**
   * Verificar si hay una sesión activa
   */
  function isLoggedIn() {
    return getSession() !== null;
  }

  // ─── Publicaciones ───

  /**
   * Obtener todas las publicaciones
   */
  function getPosts() {
    return get(KEYS.POSTS) || [];
  }

  /**
   * Obtener una publicación por su ID
   */
  function getPostById(id) {
    const posts = getPosts();
    return posts.find(p => p.id === id) || null;
  }

  /**
   * Obtener publicaciones de un usuario específico
   */
  function getPostsByUser(username) {
    const posts = getPosts();
    return posts
      .filter(p => p.author === username)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Crear una nueva publicación
   */
  function createPost(title, content, author) {
    const posts = getPosts();

    const newPost = {
      id: generateId('post'),
      title: title.trim(),
      content: content.trim(),
      author: author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    posts.push(newPost);
    set(KEYS.POSTS, posts);

    return newPost;
  }

  /**
   * Actualizar una publicación existente
   */
  function updatePost(id, title, content) {
    const posts = getPosts();
    const index = posts.findIndex(p => p.id === id);

    if (index === -1) return null;

    posts[index].title = title.trim();
    posts[index].content = content.trim();
    posts[index].updatedAt = new Date().toISOString();

    set(KEYS.POSTS, posts);
    return posts[index];
  }

  /**
   * Eliminar una publicación por su ID
   */
  function deletePost(id) {
    const posts = getPosts();
    const filtered = posts.filter(p => p.id !== id);

    if (filtered.length === posts.length) return false;

    set(KEYS.POSTS, filtered);
    return true;
  }

  // ─── Inicialización ───

  /**
   * Cargar datos iniciales de ejemplo si es la primera vez
   */
  async function initializeWithSampleData() {
    if (get(KEYS.INITIALIZED)) return;

    try {
      // Intentar cargar posts de ejemplo desde el JSON
      const response = await fetch('data/posts.json');
      if (response.ok) {
        const samplePosts = await response.json();
        // Asignar IDs si no los tienen
        const postsWithIds = samplePosts.map(p => ({
          ...p,
          id: p.id || generateId('post'),
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString()
        }));
        set(KEYS.POSTS, postsWithIds);
      }
    } catch (error) {
      console.warn('No se pudieron cargar los datos de ejemplo:', error);
    }

    // Crear usuario admin por defecto si no existe
    if (!getUserByUsername('admin')) {
      createUser('admin', 'admin123', 'Administrador');
    }

    set(KEYS.INITIALIZED, true);
  }

  // ─── Utilidades ───

  /**
   * Generar un ID único con prefijo
   */
  function generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}${random}`;
  }

  /**
   * Formatear una fecha ISO a formato legible
   */
  function formatDate(isoString) {
    const date = new Date(isoString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  /**
   * Calcular tiempo relativo (hace X tiempo)
   */
  function timeAgo(isoString) {
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHour < 24) return `Hace ${diffHour}h`;
    if (diffDay < 7) return `Hace ${diffDay}d`;
    return formatDate(isoString);
  }

  /**
   * Limpiar todo el almacenamiento (para desarrollo)
   */
  function clearAll() {
    Object.values(KEYS).forEach(key => remove(key));
  }

  // ─── API Pública ───
  return {
    // Genérico
    get,
    set,
    remove,
    // Usuarios
    getUsers,
    getUserByUsername,
    createUser,
    verifyCredentials,
    // Sesión
    createSession,
    getSession,
    destroySession,
    isLoggedIn,
    // Publicaciones
    getPosts,
    getPostById,
    getPostsByUser,
    createPost,
    updatePost,
    deletePost,
    // Inicialización
    initializeWithSampleData,
    // Utilidades
    generateId,
    formatDate,
    timeAgo,
    clearAll
  };
})();