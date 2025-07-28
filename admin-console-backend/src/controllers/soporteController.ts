import { Request, Response } from 'express';

// Mock temporal en memoria (reemplazar por base de datos real)
const tickets: any[] = [];

export const createTicket = (req: Request, res: Response) => {
  const { asunto, descripcion } = req.body;
  if (!asunto || !descripcion) {
    return res.status(400).json({ message: 'Asunto y descripción son requeridos' });
  }
  const ticket = {
    id: tickets.length + 1,
    id_usuario: (req as any).admin?.id,
    asunto,
    descripcion,
    estado: 'pendiente',
    fecha: new Date().toISOString().slice(0, 10),
  };
  tickets.unshift(ticket);
  res.status(201).json({ data: ticket });
};

export const getTickets = (req: Request, res: Response) => {
  const id_usuario = (req as any).admin?.id;
  const userTickets = tickets.filter(t => t.id_usuario === id_usuario);
  res.json({ data: userTickets });
}; 