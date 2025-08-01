const jwt = require('jsonwebtoken');
const envConfig = require('../config/envConfig');
const logger = require('../config/logger'); // Importar logger

// Middleware para verificar el token de autenticación
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token de autenticación.' });
  } // No hay token

  jwt.verify(token, envConfig.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Intento de acceso con token inválido: ${err.message}`, { token, ip: req.ip });
      return res.status(403).json({ message: 'Token de autenticación inválido o expirado.' });
    } // Token inválido
    
    req.user = user; // Adjuntar el usuario al objeto de solicitud
    next();
  });
};

// Middleware para verificar el rol del usuario
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.rol;    
    if (!userRole || !roles.includes(userRole)) {
      logger.warn(`Acceso denegado por rol: [Usuario: ${req.user?.username}, Rol: ${userRole}, Roles Permitidos: ${roles.join(',')}]`, { url: req.originalUrl });
      return res.status(403).json({ message: 'Acceso denegado. No tienes los permisos necesarios.' });
    }
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