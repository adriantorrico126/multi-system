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
  // Buscar usuario activo por email
  const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = true', [email]);
  if (userResult.rows.length === 0) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
  }
  const user = userResult.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
  }
  // Cargar rol y permisos
  const rolResult = await pool.query('SELECT id_rol, nombre, permisos FROM roles_admin WHERE id_rol = $1', [user.rol_id]);
  if (rolResult.rows.length === 0) {
    return res.status(403).json({ message: 'Rol de usuario no válido' });
  }
  const rol = rolResult.rows[0];
  const permisos = rol.permisos || {};
  const token = jwt.sign(
    {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      rol_id: user.rol_id,
      rol_nombre: rol.nombre,
      permisos
    },
    process.env.ADMIN_JWT_SECRET || 'supersecreto_admin',
    { expiresIn: '8h' }
  );
  res.json({
    token,
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      rol_id: user.rol_id,
      rol_nombre: rol.nombre,
      permisos
    }
  });
}; 