
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
  Send,
  RefreshCw
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
        const hubKey = import.meta.env.VITE_HUB_ADMIN_KEY || 'dev-key';
        const candidates: string[] = [];
        const posHubUrl = import.meta.env.VITE_POS_API_URL as string | undefined;
        if (posHubUrl) {
          candidates.push(`${posHubUrl}/soporte/tickets/hub?key=${encodeURIComponent(hubKey)}`);
        }
        // Fallback de desarrollo si no hay env configurado
        candidates.push(`http://localhost:3000/api/v1/soporte/tickets/hub?key=${encodeURIComponent(hubKey)}`);

        const normalize = (t: any, idx: number) => ({
          id: t?.id ?? t?.id_ticket ?? idx + 1,
          restaurantName: t?.restaurantName ?? t?.restaurante ?? 'Restaurante',
          subject: t?.subject ?? t?.asunto ?? '',
          description: t?.description ?? t?.descripcion ?? '',
          priority: t?.priority ?? 'normal',
          status: t?.status ?? 'open',
          assignedTo: t?.assignedTo ?? t?.asignado_a ?? '',
          contact: t?.contact ?? t?.vendedor_username ?? t?.username ?? '',
          createdAt: t?.createdAt ?? t?.fecha ?? t?.fecha_creacion ?? '',
          updatedAt: t?.updatedAt ?? t?.fecha ?? t?.fecha_creacion ?? '',
          category: t?.category ?? 'technical'
        });

        let rows: any[] | null = null;
        let lastErr: any = null;
        for (const url of candidates) {
          try {
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            const raw = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
            rows = raw.map((t: any, i: number) => normalize(t, i));
            if (Array.isArray(rows)) break;
          } catch (e) {
            lastErr = e;
          }
        }

        if (!rows) {
          // Fallback final: backend del hub
          const resp = await apiFetch<any>('/soporte/tickets', {}, token || undefined);
          const raw = Array.isArray(resp)
            ? resp
            : (resp && Array.isArray(resp.data))
              ? resp.data
              : [];
          rows = raw.map((t: any, i: number) => normalize(t, i));
        }
        setSupportTickets(rows || []);
      } catch (err: any) {
        setError(err.message || 'Error al cargar tickets de soporte.');
        setSupportTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [token]);

  const safeTickets = Array.isArray(supportTickets) ? supportTickets : [];
  const filteredTickets = safeTickets.filter(ticket => {
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

  const openTickets = safeTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = safeTickets.filter(t => t.status === 'in_progress').length;
  const urgentTickets = safeTickets.filter(t => t.priority === 'urgent').length;
  const unassignedTickets = safeTickets.filter(t => !t.assignedTo).length;

  const handleResponseSubmit = () => {
    (async () => {
      try {
        if (!selectedTicket || !responseText.trim()) return;
        const key = import.meta.env.VITE_HUB_ADMIN_KEY || 'dev-key';
        const posHubUrl = import.meta.env.VITE_POS_API_URL || 'http://localhost:3000/api/v1';
        await fetch(`${posHubUrl}/soporte/tickets/${selectedTicket.id}/respuestas?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mensaje: responseText })
        });
        setIsResponseDialogOpen(false);
        setResponseText('');
      } catch (e) {
        console.error('Error enviando respuesta:', e);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header del Sistema de Soporte */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Centro de Soporte Técnico
            </h1>
            <p className="text-slate-300 text-lg">
              Sistema avanzado de gestión de tickets y soporte técnico
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Última actualización</p>
              <p className="text-white font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Cargando tickets de soporte...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}
      {/* KPIs del Sistema de Soporte */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* KPI Tickets Abiertos */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                <MessageSquare className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Tickets Abiertos</p>
              <p className="text-3xl font-bold text-white">{openTickets}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.min((openTickets / Math.max(safeTickets.length, 1)) * 100, 100)}%`}}></div>
                </div>
                <span className="text-xs text-slate-400">{Math.round((openTickets / Math.max(safeTickets.length, 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI En Proceso */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors duration-300">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">En Proceso</p>
              <p className="text-3xl font-bold text-white">{inProgressTickets}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: `${Math.min((inProgressTickets / Math.max(safeTickets.length, 1)) * 100, 100)}%`}}></div>
                </div>
                <span className="text-xs text-slate-400">{Math.round((inProgressTickets / Math.max(safeTickets.length, 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Urgentes */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors duration-300">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Urgentes</p>
              <p className="text-3xl font-bold text-white">{urgentTickets}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: `${Math.min((urgentTickets / Math.max(safeTickets.length, 1)) * 100, 100)}%`}}></div>
                </div>
                <span className="text-xs text-slate-400">{Math.round((urgentTickets / Math.max(safeTickets.length, 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Sin Asignar */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/20 to-slate-800/10 border-slate-500/30 hover:border-slate-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-500/20 rounded-xl group-hover:bg-slate-500/30 transition-colors duration-300">
                <User className="h-8 w-8 text-slate-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Sin Asignar</p>
              <p className="text-3xl font-bold text-white">{unassignedTickets}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-slate-500 h-2 rounded-full" style={{width: `${Math.min((unassignedTickets / Math.max(safeTickets.length, 1)) * 100, 100)}%`}}></div>
                </div>
                <span className="text-xs text-slate-400">{Math.round((unassignedTickets / Math.max(safeTickets.length, 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centro de Soporte Técnico */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Headphones className="h-6 w-6 text-blue-400" />
            </div>
            <span>Centro de Soporte Técnico</span>
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg mt-2">
            Gestiona todos los tickets de soporte de los restaurantes
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          {/* Filtros y Búsqueda Avanzada */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <Input
                    placeholder="🔍 Búsqueda inteligente: restaurante o asunto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-400 rounded-xl transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white rounded-xl">
                    <SelectValue placeholder="⚡ Prioridad" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">🌐 Todas las prioridades</SelectItem>
                    <SelectItem value="urgent" className="text-white hover:bg-slate-700">🔴 Urgente</SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-slate-700">🟠 Alta</SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-slate-700">🟡 Media</SelectItem>
                    <SelectItem value="low" className="text-white hover:bg-slate-700">🟢 Baja</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white rounded-xl">
                    <SelectValue placeholder="📊 Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">🌐 Todos los estados</SelectItem>
                    <SelectItem value="open" className="text-white hover:bg-slate-700">🔵 Abierto</SelectItem>
                    <SelectItem value="in_progress" className="text-white hover:bg-slate-700">🟡 En Proceso</SelectItem>
                    <SelectItem value="resolved" className="text-white hover:bg-slate-700">🟢 Resuelto</SelectItem>
                    <SelectItem value="closed" className="text-white hover:bg-slate-700">⚫ Cerrado</SelectItem>
                  </SelectContent>
                </Select>
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/50">
                  <span className="text-sm text-slate-300">
                    {filteredTickets.length} de {safeTickets.length} tickets
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Tecnológica de Tickets */}
          <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5"></div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-slate-700/20">
                  <TableHead className="text-slate-300 font-semibold">🎫 Ticket</TableHead>
                  <TableHead className="text-slate-300 font-semibold">🏢 Restaurante</TableHead>
                  <TableHead className="text-slate-300 font-semibold">📋 Asunto</TableHead>
                  <TableHead className="text-slate-300 font-semibold">⚡ Prioridad</TableHead>
                  <TableHead className="text-slate-300 font-semibold">📊 Estado</TableHead>
                  <TableHead className="text-slate-300 font-semibold">👤 Asignado a</TableHead>
                  <TableHead className="text-slate-300 font-semibold">📅 Fecha</TableHead>
                  <TableHead className="text-slate-300 font-semibold">⚙️ Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    className="group border-slate-700/50 hover:bg-slate-700/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                          {getCategoryIcon(ticket.category)}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">#{ticket.id}</p>
                          <p className="text-sm text-slate-400">ID: {ticket.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">{ticket.restaurantName}</p>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-400">{ticket.contact}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">{ticket.subject}</p>
                        <p className="text-sm text-slate-400 truncate max-w-xs">
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(ticket.priority)}
                        <div className={`w-2 h-2 rounded-full ${
                          ticket.priority === 'urgent' ? 'bg-red-400 animate-pulse' : 
                          ticket.priority === 'high' ? 'bg-orange-400' : 
                          ticket.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(ticket.status)}
                        <div className={`w-2 h-2 rounded-full ${
                          ticket.status === 'open' ? 'bg-blue-400 animate-pulse' : 
                          ticket.status === 'in_progress' ? 'bg-amber-400' : 
                          ticket.status === 'resolved' ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {ticket.assignedTo ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-300" />
                          </div>
                          <span className="text-sm text-slate-300">{ticket.assignedTo}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50">Sin asignar</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-300">{ticket.createdAt}</span>
                        </div>
                        {ticket.updatedAt !== ticket.createdAt && (
                          <p className="text-xs text-slate-400">
                            Actualizado: {ticket.updatedAt}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50">
                            Acciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem onClick={() => setSelectedTicket(ticket)} className="text-white hover:bg-slate-700">
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedTicket(ticket); setIsResponseDialogOpen(true); }} className="text-white hover:bg-slate-700">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Responder
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const key = import.meta.env.VITE_HUB_ADMIN_KEY || 'dev-key';
                              const posHubUrl = import.meta.env.VITE_POS_API_URL || 'http://localhost:3000/api/v1';
                              await fetch(`${posHubUrl}/soporte/tickets/${ticket.id}/estado?key=${encodeURIComponent(key)}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: ticket.status === 'open' ? 'in_progress' : 'open' })
                              });
                              setSupportTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: t.status === 'open' ? 'in_progress' : 'open' } : t));
                            } catch (e) { console.error(e); }
                          }} className="text-white hover:bg-slate-700">
                            <Clock className="mr-2 h-4 w-4" />
                            Marcar En Proceso
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const key = import.meta.env.VITE_HUB_ADMIN_KEY || 'dev-key';
                              const posHubUrl = import.meta.env.VITE_POS_API_URL || 'http://localhost:3000/api/v1';
                              await fetch(`${posHubUrl}/soporte/tickets/${ticket.id}/estado?key=${encodeURIComponent(key)}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'resolved' })
                              });
                              setSupportTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'resolved' } : t));
                            } catch (e) { console.error(e); }
                          }} className="text-white hover:bg-slate-700">
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

      {/* Dialog Tecnológico para Responder Ticket */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-white flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
              <span>Centro de Respuesta - Ticket #{selectedTicket?.id}</span>
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-lg mt-2">
              {selectedTicket && `Respondiendo a: ${selectedTicket.subject}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              {/* Información del Ticket */}
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Información del Ticket</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Restaurante</p>
                    <p className="text-white font-medium">{selectedTicket.restaurantName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Contacto</p>
                    <p className="text-white font-medium">{selectedTicket.contact}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Prioridad</p>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(selectedTicket.priority)}
                      <div className={`w-2 h-2 rounded-full ${
                        selectedTicket.priority === 'urgent' ? 'bg-red-400 animate-pulse' : 
                        selectedTicket.priority === 'high' ? 'bg-orange-400' : 
                        selectedTicket.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                      }`}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Estado</p>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(selectedTicket.status)}
                      <div className={`w-2 h-2 rounded-full ${
                        selectedTicket.status === 'open' ? 'bg-blue-400 animate-pulse' : 
                        selectedTicket.status === 'in_progress' ? 'bg-amber-400' : 
                        selectedTicket.status === 'resolved' ? 'bg-green-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Área de Respuesta */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Send className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Tu Respuesta</h3>
                </div>
                <Textarea
                  placeholder="Escribe tu respuesta profesional aquí..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-700/50 border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-white placeholder-slate-400 rounded-xl resize-none"
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    {responseText.length} caracteres
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-400">Respuesta en tiempo real</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsResponseDialogOpen(false)}
              className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleResponseSubmit}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-green-500/25"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
