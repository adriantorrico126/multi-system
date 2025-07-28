import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

// Si no existe un controlador, implementa getAuditoria aquí:
export const getAuditoria = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await pool.query(
      'SELECT * FROM auditoria_admin ORDER BY fecha_accion DESC LIMIT $1 OFFSET $2',
      [Number(limit), Number(offset)]
    );
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error al consultar auditoría', detail: message });
  }
};

const router = Router();

// GET /auditoria
router.get('/', authenticateAdmin, authorizePerm('auditoria_admin', 'ver'), getAuditoria);

export default router; 