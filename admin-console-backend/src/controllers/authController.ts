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
];

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    // Buscar usuario activo por email en admin_users
    const userResult = await pool.query('SELECT * FROM admin_users WHERE username = $1 AND activo = true', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    
    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
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
      sucursales: ['ver', 'crear', 'editar', 'eliminar']
    };
    
    const token = jwt.sign(
      {
        id_usuario: user.id,
        nombre: user.nombre,
        username: user.username,
        rol_id: 1,
        rol_nombre: 'admin',
        permisos
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
        permisos
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}; 