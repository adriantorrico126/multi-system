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
  DollarSign,
  Plus,
  Filter,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Building,
  User,
  CreditCard,
  BarChart3,
  PieChart,
  Activity,
  Settings
} from 'lucide-react';

// Importar APIs y tipos
import {
  egresosApi,
  categoriasEgresosApi,
  presupuestosApi,
  egresosUtils,
  type Egreso,
  type CategoriaEgreso,
  type PresupuestoEgreso,
  type FiltrosEgresos
} from '../services/egresosApi';

// Importar componentes específicos (los crearemos después)
import { EgresosList } from '../components/egresos/EgresosList';
import { EgresoModal } from '../components/egresos/EgresoModal';
import { CategoriasList } from '../components/egresos/CategoriasList';
import {
  CategoriaModal,
  PresupuestosList,
  PresupuestoModal,
  EgresosDashboard
} from '../components/egresos';

const EgresosPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.rol || '';

  // Estados principales
  const [activeTab, setActiveTab] = useState<'dashboard' | 'egresos' | 'categorias' | 'presupuestos' | 'reportes'>('dashboard');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de datos
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [categorias, setCategorias] = useState<CategoriaEgreso[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoEgreso[]>([]);
  const [egresosPendientes, setEgresosPendientes] = useState<Egreso[]>([]);

  // Estados de modales
  const [egresoModal, setEgresoModal] = useState<{
    open: boolean;
    egreso?: Egreso;
    mode: 'create' | 'edit' | 'view';
  }>({
    open: false,
    mode: 'create'
  });

  const [categoriaModal, setCategoriaModal] = useState<{
    open: boolean;
    categoria?: CategoriaEgreso;
    mode: 'create' | 'edit';
  }>({
    open: false,
    mode: 'create'
  });

  const [presupuestoModal, setPresupuestoModal] = useState<{
    open: boolean;
    presupuesto?: PresupuestoEgreso;
    mode: 'create' | 'edit';
  }>({
    open: false,
    mode: 'create'
  });

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosEgresos>({
    page: 1,
    limit: 20
  });

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    // Verificar permisos
    if (!['admin', 'gerente', 'cajero'].includes(userRole)) {
      navigate('/');
      return;
    }

    // Cargar datos iniciales
    loadInitialData();
  }, [userRole, navigate]);

  useEffect(() => {
    // Recargar egresos cuando cambien los filtros
    if (activeTab === 'egresos') {
      loadEgresos();
    }
  }, [filtros, activeTab]);

  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadCategorias(),
        loadEgresosPendientes(),
        activeTab === 'dashboard' && loadDashboardData()
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar los datos iniciales');
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadEgresos = async () => {
    try {
      setLoading(true);
      const response = await egresosApi.getAll(filtros);
      setEgresos(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading egresos:', err);
      toast.error('Error al cargar los egresos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const data = await categoriasEgresosApi.getAll();
      setCategorias(data);
    } catch (err) {
      console.error('Error loading categorias:', err);
      toast.error('Error al cargar las categorías');
    }
  };

  const loadPresupuestos = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const data = await presupuestosApi.getAll({ anio: currentYear });
      setPresupuestos(data);
    } catch (err) {
      console.error('Error loading presupuestos:', err);
      toast.error('Error al cargar los presupuestos');
    }
  };

  const loadEgresosPendientes = async () => {
    try {
      if (egresosUtils.canApprove(userRole)) {
        const data = await egresosApi.getPendientesAprobacion();
        setEgresosPendientes(data);
      }
    } catch (err) {
      console.error('Error loading egresos pendientes:', err);
    }
  };

  const loadDashboardData = async () => {
    // Esta función se implementará en el componente EgresosDashboard
    return Promise.resolve();
  };

  // =====================================================
  // HANDLERS DE MODALES
  // =====================================================

  const handleCreateEgreso = () => {
    setEgresoModal({
      open: true,
      mode: 'create'
    });
  };

  const handleEditEgreso = (egreso: Egreso) => {
    setEgresoModal({
      open: true,
      egreso,
      mode: 'edit'
    });
  };

  const handleViewEgreso = (egreso: Egreso) => {
    setEgresoModal({
      open: true,
      egreso,
      mode: 'view'
    });
  };

  const handleCreateCategoria = () => {
    setCategoriaModal({
      open: true,
      mode: 'create'
    });
  };

  const handleEditCategoria = (categoria: CategoriaEgreso) => {
    setCategoriaModal({
      open: true,
      categoria,
      mode: 'edit'
    });
  };

  const handleCreatePresupuesto = () => {
    setPresupuestoModal({
      open: true,
      mode: 'create'
    });
  };

  const handleEditPresupuesto = (presupuesto: PresupuestoEgreso) => {
    setPresupuestoModal({
      open: true,
      presupuesto,
      mode: 'edit'
    });
  };

  // =====================================================
  // HANDLERS DE ACCIONES
  // =====================================================

  const handleAprobarEgreso = async (id: number, comentario?: string) => {
    try {
      await egresosApi.aprobar(id, comentario);
      toast.success('Egreso aprobado exitosamente');
      loadEgresos();
      loadEgresosPendientes();
    } catch (err) {
      console.error('Error approving egreso:', err);
      toast.error('Error al aprobar el egreso');
    }
  };

  const handleRechazarEgreso = async (id: number, comentario: string) => {
    try {
      await egresosApi.rechazar(id, comentario);
      toast.success('Egreso rechazado');
      loadEgresos();
      loadEgresosPendientes();
    } catch (err) {
      console.error('Error rejecting egreso:', err);
      toast.error('Error al rechazar el egreso');
    }
  };

  const handlePagarEgreso = async (id: number, comentario?: string) => {
    try {
      await egresosApi.marcarPagado(id, comentario);
      toast.success('Egreso marcado como pagado');
      loadEgresos();
      loadEgresosPendientes();
    } catch (err) {
      console.error('Error marking egreso as paid:', err);
      toast.error('Error al marcar el egreso como pagado');
    }
  };

  const handleDeleteEgreso = async (id: number) => {
    try {
      await egresosApi.delete(id);
      toast.success('Egreso cancelado');
      loadEgresos();
      loadEgresosPendientes();
    } catch (err) {
      console.error('Error deleting egreso:', err);
      toast.error('Error al cancelar el egreso');
    }
  };

  // =====================================================
  // HANDLERS DE CAMBIO DE TAB
  // =====================================================

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    
    // Cargar datos específicos según la pestaña
    switch (tab) {
      case 'egresos':
        loadEgresos();
        break;
      case 'categorias':
        loadCategorias();
        break;
      case 'presupuestos':
        loadPresupuestos();
        break;
      case 'dashboard':
        loadDashboardData();
        break;
    }
  };

  // =====================================================
  // VERIFICACIÓN DE PERMISOS
  // =====================================================

  if (!['admin', 'gerente', 'cajero'].includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
        <p className="text-gray-700 mb-6">No tienes permisos para acceder al sistema de egresos.</p>
        <Button onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Egresos</h1>
          <p className="text-gray-600 mt-2">
            Gestión completa de gastos y presupuestos del restaurante
          </p>
        </div>

        {/* Alertas de egresos pendientes */}
        {egresosPendientes.length > 0 && egresosUtils.canApprove(userRole) && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-orange-700 font-medium">
                  {egresosPendientes.length} egresos pendientes de aprobación
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('egresos')}
                >
                  Ver
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="egresos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Egresos
            {egresosPendientes.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {egresosPendientes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="presupuestos" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Presupuestos
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <EgresosDashboard
            categorias={categorias}
            egresosPendientes={egresosPendientes}
            userRole={userRole}
            onCreateEgreso={handleCreateEgreso}
            onViewEgreso={handleViewEgreso}
            onAprobarEgreso={handleAprobarEgreso}
            onRechazarEgreso={handleRechazarEgreso}
          />
        </TabsContent>

        {/* Egresos Tab */}
        <TabsContent value="egresos" className="mt-6">
          <div className="space-y-4">
            {/* Header de egresos */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gestión de Egresos</h2>
              <Button onClick={handleCreateEgreso}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Egreso
              </Button>
            </div>

            {/* Lista de egresos */}
            <EgresosList
              egresos={egresos}
              categorias={categorias}
              loading={loading}
              pagination={pagination}
              filtros={filtros}
              userRole={userRole}
              onEdit={handleEditEgreso}
              onView={handleViewEgreso}
              onDelete={handleDeleteEgreso}
              onAprobar={handleAprobarEgreso}
              onRechazar={handleRechazarEgreso}
              onPagar={handlePagarEgreso}
              onFiltrosChange={setFiltros}
              onPageChange={(page) => setFiltros(prev => ({ ...prev, page }))}
            />
          </div>
        </TabsContent>

        {/* Categorías Tab */}
        <TabsContent value="categorias" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Categorías de Egresos</h2>
              {egresosUtils.canEdit(userRole) && (
                <Button onClick={handleCreateCategoria}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </Button>
              )}
            </div>

            <CategoriasList
              categorias={categorias}
              loading={loading}
              userRole={userRole}
              onEdit={handleEditCategoria}
              onDelete={async (id) => {
                try {
                  await categoriasEgresosApi.delete(id);
                  toast.success('Categoría eliminada');
                  loadCategorias();
                } catch (err) {
                  toast.error('Error al eliminar la categoría');
                }
              }}
            />
          </div>
        </TabsContent>

        {/* Presupuestos Tab */}
        <TabsContent value="presupuestos" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Presupuestos</h2>
              {egresosUtils.canEdit(userRole) && (
                <Button onClick={handleCreatePresupuesto}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Presupuesto
                </Button>
              )}
            </div>

            <PresupuestosList
              presupuestos={presupuestos}
              categorias={categorias}
              loading={loading}
              userRole={userRole}
              onEdit={handleEditPresupuesto}
              onDelete={async (id) => {
                try {
                  await presupuestosApi.delete(id);
                  toast.success('Presupuesto eliminado');
                  loadPresupuestos();
                } catch (err) {
                  toast.error('Error al eliminar el presupuesto');
                }
              }}
            />
          </div>
        </TabsContent>

        {/* Reportes Tab */}
        <TabsContent value="reportes" className="mt-6">
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Reportes en Desarrollo
              </h3>
              <p className="text-gray-600">
                Los reportes y análisis estarán disponibles próximamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modales */}
      <EgresoModal
        open={egresoModal.open}
        onClose={() => setEgresoModal({ ...egresoModal, open: false })}
        egreso={egresoModal.egreso}
        categorias={categorias}
        mode={egresoModal.mode}
        onSave={async (egresoData) => {
          try {
            if (egresoModal.mode === 'create') {
              await egresosApi.create(egresoData);
              toast.success('Egreso creado exitosamente');
            } else {
              await egresosApi.update(egresoModal.egreso!.id_egreso, egresoData);
              toast.success('Egreso actualizado exitosamente');
            }
            setEgresoModal({ ...egresoModal, open: false });
            loadEgresos();
            loadEgresosPendientes();
          } catch (err) {
            toast.error('Error al guardar el egreso');
          }
        }}
      />

      <CategoriaModal
        open={categoriaModal.open}
        onClose={() => setCategoriaModal({ ...categoriaModal, open: false })}
        categoria={categoriaModal.categoria}
        mode={categoriaModal.mode}
        onSave={async (categoriaData) => {
          try {
            if (categoriaModal.mode === 'create') {
              await categoriasEgresosApi.create(categoriaData);
              toast.success('Categoría creada exitosamente');
            } else {
              await categoriasEgresosApi.update(categoriaModal.categoria!.id_categoria_egreso, categoriaData);
              toast.success('Categoría actualizada exitosamente');
            }
            setCategoriaModal({ ...categoriaModal, open: false });
            loadCategorias();
          } catch (err) {
            toast.error('Error al guardar la categoría');
          }
        }}
      />

      <PresupuestoModal
        open={presupuestoModal.open}
        onClose={() => setPresupuestoModal({ ...presupuestoModal, open: false })}
        presupuesto={presupuestoModal.presupuesto}
        categorias={categorias}
        mode={presupuestoModal.mode}
        onSave={async (presupuestoData) => {
          try {
            if (presupuestoModal.mode === 'create') {
              await presupuestosApi.create(presupuestoData);
              toast.success('Presupuesto creado exitosamente');
            } else {
              await presupuestosApi.update(presupuestoModal.presupuesto!.id_presupuesto, presupuestoData);
              toast.success('Presupuesto actualizado exitosamente');
            }
            setPresupuestoModal({ ...presupuestoModal, open: false });
            loadPresupuestos();
          } catch (err) {
            toast.error('Error al guardar el presupuesto');
          }
        }}
      />
    </div>
  );
};

export default EgresosPage;
