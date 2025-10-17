import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Filter,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  Search,
  FileText,
  Menu,
  BarChart3,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';

// Importar APIs y tipos
import {
  obtenerPensionados,
  obtenerPensionadosActivos,
  obtenerEstadisticasGenerales,
  eliminarPensionado,
  formatearFecha,
  formatearMoneda,
  calcularDiasRestantes,
  obtenerColorEstado,
  obtenerTextoTipoCliente,
  obtenerTextoTipoPeriodo
} from '../services/pensionadosApi';

import type {
  Pensionado,
  EstadoPensionado,
  EstadisticasGenerales
} from '../types/pensionados';

// Importar componentes (los crearemos después)
import { PensionadoFormModal } from '../components/pensionados/PensionadoFormModal';
import { PensionadoDetalleModal } from '../components/pensionados/PensionadoDetalleModal';
import { EstadisticasCard } from '../components/pensionados/EstadisticasCard';

const PensionadosPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [pensionados, setPensionados] = useState<Pensionado[]>([]);
  const [pensionadosFiltrados, setPensionadosFiltrados] = useState<Pensionado[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoPensionado | 'todos'>('todos');
  
  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [pensionadoSeleccionado, setPensionadoSeleccionado] = useState<Pensionado | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarPensionados();
  }, [pensionados, searchTerm, estadoFiltro]);

  // =====================================================
  // FUNCIONES DE CARGA
  // =====================================================

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar pensionados y estadísticas en paralelo
      const [pensionadosRes, estadisticasRes] = await Promise.all([
        obtenerPensionados(),
        obtenerEstadisticasGenerales()
      ]);

      if (pensionadosRes.success && pensionadosRes.data) {
        setPensionados(pensionadosRes.data);
      }

      if (estadisticasRes.success && estadisticasRes.data) {
        setEstadisticas(estadisticasRes.data);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar datos de pensionados');
    } finally {
      setLoading(false);
    }
  };

  const filtrarPensionados = () => {
    let filtrados = [...pensionados];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtrados = filtrados.filter(p =>
        p.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.documento_identidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono?.includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (estadoFiltro !== 'todos') {
      filtrados = filtrados.filter(p => p.estado === estadoFiltro);
    }

    setPensionadosFiltrados(filtrados);
  };

  // =====================================================
  // FUNCIONES DE ACCIÓN
  // =====================================================

  const handleNuevoPensionado = () => {
    setPensionadoSeleccionado(null);
    setModoEdicion(false);
    setShowFormModal(true);
  };

  const handleEditarPensionado = (pensionado: Pensionado) => {
    setPensionadoSeleccionado(pensionado);
    setModoEdicion(true);
    setShowFormModal(true);
  };

  const handleVerDetalle = (pensionado: Pensionado) => {
    setPensionadoSeleccionado(pensionado);
    setShowDetalleModal(true);
  };

  const handleEliminarPensionado = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pensionado?')) {
      return;
    }

    try {
      const response = await eliminarPensionado(id);
      if (response.success) {
        toast.success('Pensionado eliminado correctamente');
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar pensionado');
    }
  };

  const handleSuccess = () => {
    setShowFormModal(false);
    setShowDetalleModal(false);
    cargarDatos();
  };

  // =====================================================
  // RENDERIZADO DE COMPONENTES
  // =====================================================

  const renderEstadisticas = () => {
    if (!estadisticas) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pensionados</p>
                <p className="text-2xl font-bold">{estadisticas.total_pensionados}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.pensionados_activos}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Consumo Mes Actual</p>
                <p className="text-2xl font-bold">{formatearMoneda(estadisticas.total_consumo_mes_actual)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Prefacturas Pendientes</p>
                <p className="text-2xl font-bold">{estadisticas.total_prefacturas_pendientes}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTablaPensionados = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }

    if (pensionadosFiltrados.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pensionados</h3>
          <p className="text-gray-500 mb-4">Comienza creando tu primer pensionado</p>
          <Button onClick={handleNuevoPensionado}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pensionado
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pensionadosFiltrados.map((pensionado) => (
          <Card key={pensionado.id_pensionado} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{pensionado.nombre_cliente}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {obtenerTextoTipoCliente(pensionado.tipo_cliente)}
                  </p>
                </div>
                <Badge className={obtenerColorEstado(pensionado.estado)}>
                  {pensionado.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Información del contrato */}
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">
                    {formatearFecha(pensionado.fecha_inicio)} - {formatearFecha(pensionado.fecha_fin)}
                  </span>
                </div>

                {/* Días restantes */}
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">
                    {calcularDiasRestantes(pensionado.fecha_fin)} días restantes
                  </span>
                </div>

                {/* Total consumido */}
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">
                    Consumido: {formatearMoneda(pensionado.total_consumido)}
                  </span>
                </div>

                {/* Servicios incluidos */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {pensionado.incluye_desayuno && (
                    <Badge variant="outline" className="text-xs">Desayuno</Badge>
                  )}
                  {pensionado.incluye_almuerzo && (
                    <Badge variant="outline" className="text-xs">Almuerzo</Badge>
                  )}
                  {pensionado.incluye_cena && (
                    <Badge variant="outline" className="text-xs">Cena</Badge>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleVerDetalle(pensionado)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditarPensionado(pensionado)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleEliminarPensionado(pensionado.id_pensionado)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Pensionados
              </h1>
              <p className="text-gray-500 mt-1">
                Gestión de clientes con planes de consumo
              </p>
            </div>
          </div>
          <Button onClick={handleNuevoPensionado}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Pensionado
          </Button>
        </div>

        {/* Estadísticas */}
        {renderEstadisticas()}

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, documento o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro por estado */}
              <div className="flex gap-2">
                {(['todos', 'activo', 'pausado', 'finalizado', 'cancelado'] as const).map((estado) => (
                  <Button
                    key={estado}
                    variant={estadoFiltro === estado ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEstadoFiltro(estado)}
                  >
                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Refrescar */}
              <Button
                variant="outline"
                size="icon"
                onClick={cargarDatos}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de pensionados */}
      {renderTablaPensionados()}

      {/* Modales */}
      {showFormModal && (
        <PensionadoFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSuccess={handleSuccess}
          pensionado={pensionadoSeleccionado}
          modoEdicion={modoEdicion}
        />
      )}

      {showDetalleModal && pensionadoSeleccionado && (
        <PensionadoDetalleModal
          isOpen={showDetalleModal}
          onClose={() => setShowDetalleModal(false)}
          pensionado={pensionadoSeleccionado}
          onEditar={() => {
            setShowDetalleModal(false);
            handleEditarPensionado(pensionadoSeleccionado);
          }}
          onActualizar={handleSuccess}
        />
      )}
    </div>
  );
};

export default PensionadosPage;

