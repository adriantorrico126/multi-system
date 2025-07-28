import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'supersecreto_admin', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
    (req as any).admin = user;
    next();
  });
}

export function authorizePerm(module: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const permisos = (req as any).admin?.permisos;
    if (!permisos || !permisos[module] || !permisos[module].includes(action)) {
      return res.status(403).json({ message: 'Acceso denegado. No tienes los permisos necesarios.' });
    }
    next();
  };
} 