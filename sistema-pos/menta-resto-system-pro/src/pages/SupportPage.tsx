import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { createSupportTicket, getSupportTickets } from '@/services/api';

export default function SupportPage() {
  const { user } = useAuth();
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.rol === 'admin') {
      setLoading(true);
      getSupportTickets()
        .then(setTickets)
        .catch(() => setError('No se pudieron cargar los tickets de soporte.'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user || user.rol !== 'admin') {
    return <div className="p-8 text-center text-red-600 font-bold">Acceso solo para administradores.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje('');
    setError('');
    try {
      await createSupportTicket(asunto, descripcion);
      setAsunto('');
      setDescripcion('');
      setMensaje('¡Tu reclamo ha sido enviado!');
      // Refrescar lista
      const nuevosTickets = await getSupportTickets();
      setTickets(nuevosTickets);
    } catch (err) {
      setError('No se pudo enviar el reclamo.');
    } finally {
      setEnviando(false);
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Soporte y Reclamos</CardTitle>
          <CardDescription>
            Envía tus reclamos, quejas o sugerencias al equipo de soporte. Solo para administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Asunto</label>
              <Input value={asunto} onChange={e => setAsunto(e.target.value)} required maxLength={100} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} required rows={4} maxLength={500} />
            </div>
            <Button type="submit" disabled={enviando || !asunto || !descripcion}>
              {enviando ? 'Enviando...' : 'Enviar Reclamo'}
            </Button>
            {mensaje && <div className="text-green-600 font-medium mt-2">{mensaje}</div>}
            {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis Tickets de Soporte</CardTitle>
          <CardDescription>Historial de reclamos y sugerencias enviados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-blue-600">Cargando tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-slate-500">No has enviado ningún ticket de soporte.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map(ticket => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.asunto}</TableCell>
                      <TableCell>{ticket.descripcion}</TableCell>
                      <TableCell>
                        <Badge variant={ticket.estado === 'resuelto' ? 'success' : 'secondary'}>
                          {ticket.estado.charAt(0).toUpperCase() + ticket.estado.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.fecha}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 