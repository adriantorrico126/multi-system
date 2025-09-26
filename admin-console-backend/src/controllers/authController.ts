import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

// Usuarios administradores hardcodeados para demo (puedes migrar a BD luego)
const admins = [
  {
    id: 1,
    username: 'admin_global',
    passwordHash: bcrypt.hashSync('admin', 10), // Cambia esto en producción
    nombre: 'Admin Global',
    rol: 'superadmin', // <--- AGREGADO
  },
  {
    id: 2,
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin', 10),
    nombre: 'Admin Sistema POS',
    rol: 'admin',
  },
  {
    id: 3,
    username: 'adrian.kkopa',
    passwordHash: bcrypt.hashSync('123456', 10),
    nombre: 'Adrian Kkopa',
    rol: 'admin',
  },
];

export const login = async (req: Request, res: Response) => {
  const { email, username, password, securityInfo, rememberMe } = req.body;
  
  try {
    // Determinar si se está usando email o username
    const loginIdentifier = email || username;
    
    // Log del intento de login con información de seguridad
    console.log('Intento de login:', {
      identifier: loginIdentifier,
      type: email ? 'email' : 'username',
      ip: securityInfo?.ip || req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Primero buscar usuario en la base de datos
    const userResult = await pool.query('SELECT * FROM admin_users WHERE username = $1 AND activo = true', [loginIdentifier]);
    
    let user = null;
    let valid = false;
    
    if (userResult.rows.length > 0) {
      // Usuario encontrado en la base de datos
      user = userResult.rows[0];
      valid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Si no se encuentra en la BD, buscar en usuarios hardcodeados
      const hardcodedUser = admins.find(admin => admin.username === loginIdentifier);
      if (hardcodedUser) {
        user = {
          id: hardcodedUser.id,
          username: hardcodedUser.username,
          nombre: hardcodedUser.nombre,
          rol: hardcodedUser.rol,
          activo: true
        };
        valid = await bcrypt.compare(password, hardcodedUser.passwordHash);
      }
    }
    
    if (!user || !valid) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Verificar si requiere 2FA (simulado - en producción verificar en BD)
    const requiresTwoFactor = user.two_factor_enabled || false;
    
    if (requiresTwoFactor) {
      // Guardar sesión temporal para 2FA
      const tempToken = jwt.sign(
        { identifier: loginIdentifier, timestamp: Date.now() },
        process.env.ADMIN_JWT_SECRET || 'supersecreto_admin',
        { expiresIn: '10m' }
      );
      
      return res.json({
        requiresTwoFactor: true,
        tempToken,
        message: 'Se requiere autenticación de dos factores'
      });
    }
    
    // Crear permisos básicos para el usuario
    const permisos = {
      restaurantes: ['ver', 'crear', 'editar', 'eliminar'],
      productos: ['ver', 'crear', 'editar', 'eliminar'],
      usuarios: ['ver', 'crear', 'editar', 'eliminar'],
      pagos: ['ver', 'crear', 'editar', 'eliminar'],
      reportes: ['ver'],
      configuracion: ['ver', 'editar'],
      servicios_restaurante: ['ver', 'crear', 'editar', 'eliminar'],
      dashboard: ['ver'],
      auditoria: ['ver'],
      soporte: ['ver', 'crear', 'editar'],
      sucursales: ['ver', 'crear', 'editar', 'eliminar'],
      pos_manager: ['ver', 'editar'],
      roles_admin: ['ver', 'crear', 'editar', 'eliminar']
    };
    
    const tokenExpiry = rememberMe ? '30d' : '8h';
    const token = jwt.sign(
      {
        id_usuario: user.id,
        nombre: user.nombre,
        username: user.username,
        rol_id: 1,
        rol_nombre: 'admin',
        permisos,
        securityInfo,
        loginTime: new Date().toISOString()
      },
      process.env.ADMIN_JWT_SECRET || 'supersecreto_admin',
      { expiresIn: tokenExpiry }
    );
    
    res.json({
      token,
      user: {
        id_usuario: user.id,
        nombre: user.nombre,
        username: user.username,
        rol_id: 1,
        rol_nombre: 'admin',
        permisos,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const verifyTwoFactor = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  
  try {
    // Verificar código 2FA (simulado - en producción usar TOTP)
    const validCodes = ['123456', '000000', '111111']; // Códigos de prueba
    
    if (!validCodes.includes(code)) {
      return res.status(401).json({ message: 'Código de verificación incorrecto' });
    }

    // Buscar usuario
    const userResult = await pool.query('SELECT * FROM admin_users WHERE username = $1 AND activo = true', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Crear permisos
    const permisos = {
      restaurantes: ['ver', 'crear', 'editar', 'eliminar'],
      productos: ['ver', 'crear', 'editar', 'eliminar'],
      usuarios: ['ver', 'crear', 'editar', 'eliminar'],
      pagos: ['ver', 'crear', 'editar', 'eliminar'],
      reportes: ['ver'],
      configuracion: ['ver', 'editar'],
      servicios_restaurante: ['ver', 'crear', 'editar', 'eliminar'],
      dashboard: ['ver'],
      auditoria: ['ver'],
      soporte: ['ver', 'crear', 'editar'],
      sucursales: ['ver', 'crear', 'editar', 'eliminar'],
      pos_manager: ['ver', 'editar'],
      roles_admin: ['ver', 'crear', 'editar', 'eliminar']
    };
    
    const token = jwt.sign(
      {
        id_usuario: user.id,
        nombre: user.nombre,
        username: user.username,
        rol_id: 1,
        rol_nombre: 'admin',
        permisos,
        twoFactorVerified: true,
        loginTime: new Date().toISOString()
      },
      process.env.ADMIN_JWT_SECRET || 'supersecreto_admin',
      { expiresIn: '8h' }
    );
    
    res.json({
      token,
      user: {
        id_usuario: user.id,
        nombre: user.nombre,
        username: user.username,
        rol_id: 1,
        rol_nombre: 'admin',
        permisos,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en verify2FA:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  
  try {
    // Verificar si el usuario existe
    const userResult = await pool.query('SELECT * FROM admin_users WHERE username = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' });
    }
    
    const user = userResult.rows[0];
    
    // Generar código de verificación de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generar token de reset con el código
    const resetToken = jwt.sign(
      { 
        email, 
        verificationCode,
        purpose: 'password_reset',
        timestamp: Date.now()
      },
      process.env.ADMIN_JWT_SECRET || 'supersecreto_admin',
      { expiresIn: '1h' }
    );
    
    // Simular envío de email (en producción usar servicio de email real)
    console.log('\n=== EMAIL DE RECUPERACIÓN ===');
    console.log('Para:', email);
    console.log('Asunto: Recuperación de Contraseña - ForkastBI Admin');
    console.log('Contenido:');
    console.log(`Hola ${user.nombre},`);
    console.log('');
    console.log('Has solicitado recuperar tu contraseña del sistema ForkastBI Admin.');
    console.log('');
    console.log(`Tu código de verificación es: ${verificationCode}`);
    console.log('');
    console.log('Este código expira en 1 hora.');
    console.log('Si no solicitaste este cambio, ignora este mensaje.');
    console.log('');
    console.log('Saludos,');
    console.log('Equipo de Seguridad ForkastBI');
    console.log('===========================\n');
    
    res.json({ 
      message: 'Se ha enviado un código de verificación a tu correo electrónico.',
      resetToken, // Solo para desarrollo
      verificationCode // Solo para desarrollo - REMOVER EN PRODUCCIÓN
    });
  } catch (error) {
    console.error('Error en requestPasswordReset:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const verifyResetCode = async (req: Request, res: Response) => {
  const { token, code } = req.body;
  
  try {
    // Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'supersecreto_admin') as any;
    
    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Verificar que el token no haya expirado (adicional a JWT)
    const tokenAge = Date.now() - decoded.timestamp;
    if (tokenAge > 60 * 60 * 1000) { // 1 hora
      return res.status(401).json({ message: 'El código ha expirado. Solicita uno nuevo.' });
    }
    
    // Verificar código
    if (decoded.verificationCode !== code) {
      return res.status(401).json({ message: 'Código de verificación incorrecto' });
    }
    
    // Generar nuevo token para el cambio de contraseña
    const passwordChangeToken = jwt.sign(
      { 
        email: decoded.email, 
        purpose: 'password_change_verified',
        timestamp: Date.now()
      },
      process.env.ADMIN_JWT_SECRET || 'supersecreto_admin',
      { expiresIn: '15m' } // Token corto para cambio de contraseña
    );
    
    res.json({ 
      message: 'Código verificado correctamente',
      passwordChangeToken
    });
  } catch (error) {
    console.error('Error en verifyResetCode:', error);
    res.status(500).json({ message: 'Token inválido o expirado' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  
  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'supersecreto_admin') as any;
    
    if (decoded.purpose !== 'password_change_verified') {
      return res.status(401).json({ message: 'Token inválido. Debes verificar el código primero.' });
    }

    // Verificar que el token no haya expirado
    const tokenAge = Date.now() - decoded.timestamp;
    if (tokenAge > 15 * 60 * 1000) { // 15 minutos
      return res.status(401).json({ message: 'El token ha expirado. Inicia el proceso nuevamente.' });
    }
    
    // Verificar fortaleza de la contraseña
    const hasMinLength = newPassword.length >= 8;
    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
    
    const score = [hasMinLength, hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    
    if (score < 3) {
      return res.status(400).json({ 
        message: 'La contraseña no cumple con los requisitos mínimos de seguridad',
        requirements: {
          minLength: hasMinLength,
          hasLower,
          hasUpper,
          hasNumber,
          hasSymbol,
          score,
          minScore: 3
        }
      });
    }
    
    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 12); // Salt más alto para mayor seguridad
    
    // Actualizar contraseña en BD
    const updateResult = await pool.query(
      'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2',
      [passwordHash, decoded.email]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Log de seguridad
    console.log('Contraseña actualizada para usuario:', decoded.email, 'en', new Date().toISOString());
    
    res.json({ 
      message: 'Contraseña actualizada exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Token inválido o expirado' });
  }
}; 