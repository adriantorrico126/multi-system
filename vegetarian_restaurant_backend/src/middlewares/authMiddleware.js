const jwt = require('jsonwebtoken');
const envConfig = require('../config/envConfig');

// Middleware para verificar el token de autenticación
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token de autenticación.' });
  } // No hay token

  jwt.verify(token, envConfig.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Error de verificación de token:', err.message);
      return res.status(403).json({ message: 'Token de autenticación inválido o expirado.' });
    } // Token inválido
    req.user = user; // Adjuntar el usuario al objeto de solicitud
    next();
  });
};

// Middleware para verificar el rol del usuario (acepta 'rol' o 'role')
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.rol || req.user?.role;
    console.log('Auth middleware:', { 
      user: req.user, 
      userRole, 
      requiredRoles: roles,
      hasPermission: req.user && roles.includes(userRole)
    });
    
    if (!req.user || !roles.includes(userRole)) {
      console.log('Auth middleware: Acceso denegado');
      return res.status(403).json({ message: 'Acceso denegado. No tienes los permisos necesarios para realizar esta acción.' });
    }
    
    console.log('Auth middleware: Acceso concedido');
    next();
  };
};