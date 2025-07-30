
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Headphones, 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Calendar,
  Phone,
  Mail,
  FileText,
  Star,
  Send
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export const SupportCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any[]>('/soporte/tickets', {}, token || undefined);
        setSupportTickets(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar tickets de soporte.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTickets();
  }, [token]);

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Baja</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Abierto</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">En Proceso</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resuelto</Badge>;
      case 'closed':
        return <Badge variant="secondary">Cerrado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'hardware':
        return <Phone className="h-4 w-4 text-orange-500" />;
      case 'feature_request':
        return <Star className="h-4 w-4 text-blue-500" />;
      case 'training':
        return <User className="h-4 w-4 text-green-500" />;
      case 'performance':
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const openTickets = supportTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = supportTickets.filter(t => t.status === 'in_progress').length;
  const urgentTickets = supportTickets.filter(t => t.priority === 'urgent').length;
  const unassignedTickets = supportTickets.filter(t => !t.assignedTo).length;

  const handleResponseSubmit = () => {
    console.log('Enviando respuesta:', responseText);
    setResponseText('');
    setIsResponseDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {loading && <div className="text-center text-blue-600">Cargando tickets de soporte...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      {/* Estadísticas del Centro de Soporte */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tickets Abiertos</p>
                <p className="text-2xl font-bold text-blue-600">{openTickets}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Proceso</p>
                <p className="text-2xl font-bold text-amber-600">{inProgressTickets}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{urgentTickets}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sin Asignar</p>
                <p className="text-2xl font-bold text-gray-600">{unassignedTickets}</p>
              </div>
              <User className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centro de Soporte */}
      <Card>
        <CardHeader>
          <CardTitle>Centro de Soporte Técnico</CardTitle>
          <CardDescription>Gestiona todos los tickets de soporte de los restaurantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por restaurante o asunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in_progress">En Proceso</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla de Tickets */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(ticket.category)}
                        <span className="font-medium">{ticket.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{ticket.restaurantName}</p>
                        <p className="text-sm text-gray-500">{ticket.contact}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(ticket.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ticket.status)}
                    </TableCell>
                    <TableCell>
                      {ticket.assignedTo ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{ticket.assignedTo}</span>
                        </div>
                      ) : (
                        <Badge variant="outline">Sin asignar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{ticket.createdAt}</p>
                        {ticket.updatedAt !== ticket.createdAt && (
                          <p className="text-xs text-gray-500">
                            Actualizado: {ticket.updatedAt}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Acciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setIsResponseDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Responder
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Asignar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar Resuelto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Responder Ticket */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket && `Respondiendo a: ${selectedTicket.subject}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium">Restaurante: {selectedTicket.restaurantName}</p>
                <p className="text-sm">Contacto: {selectedTicket.contact}</p>
                <p className="text-sm">Email: {selectedTicket.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Tu Respuesta</label>
                <Textarea
                  placeholder="Escribe tu respuesta aquí..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResponseSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
