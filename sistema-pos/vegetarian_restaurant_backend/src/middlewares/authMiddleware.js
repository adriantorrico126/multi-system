const jwt = require('jsonwebtoken');
const envConfig = require('../config/envConfig');

// Middleware para verificar el token de autenticación
exports.authenticateToken = (req, res, next) => {
  console.log('🔍 authenticateToken Debug - req.headers.authorization:', req.headers.authorization);
  console.log('🔍 authenticateToken Debug - req.url:', req.url);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 authenticateToken Debug - token:', token ? 'EXISTS' : 'NULL');

  if (token == null) {
    console.log('❌ authenticateToken Error - No token provided');
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token de autenticación.' });
  } // No hay token

  jwt.verify(token, envConfig.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ authenticateToken Error - Token verification failed:', err.message);
      // Solo loguear errores que no sean expiración o formato inválido
      if (err.name !== 'TokenExpiredError' && err.name !== 'JsonWebTokenError') {
      console.error('Error de verificación de token:', err.message);
      }
      return res.status(403).json({ message: 'Token de autenticación inválido o expirado.' });
    } // Token inválido
    
    console.log('✅ authenticateToken Success - User:', user);
    req.user = user; // Adjuntar el usuario al objeto de solicitud
    next();
  });
};

// Middleware para verificar el rol del usuario
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.rol;
    console.log('🔍 authorizeRoles Debug - userRole:', userRole);
    console.log('🔍 authorizeRoles Debug - roles permitidos:', roles);
    console.log('🔍 authorizeRoles Debug - req.user:', req.user);
    
    if (!userRole || !roles.includes(userRole)) {
      console.log('❌ authorizeRoles Error - Rol no permitido:', userRole);
      return res.status(403).json({ message: 'Acceso denegado. No tienes los permisos necesarios.' });
    }
    console.log('✅ authorizeRoles Success - Rol permitido:', userRole);
    next();
  };
};

// Middleware para asegurar que la petición tiene un contexto de restaurante (tenant).
exports.ensureTenantContext = (req, res, next) => {
  // El rol 'super_admin' puede operar sin un id_restaurante específico en el token,
  // ya que su función es gestionar los restaurantes mismos.
  if (req.user.rol === 'super_admin') {
    return next();
  }

  // Para todos los demás roles, el id_restaurante es obligatorio.
  if (!req.user.id_restaurante) {
    return res.status(403).json({ message: 'Acceso denegado. No se pudo determinar el restaurante asociado a su usuario.' });
  }
  next();
};