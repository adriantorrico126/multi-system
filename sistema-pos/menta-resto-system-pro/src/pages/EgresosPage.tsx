import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { PlanGate } from '../components/plan/PlanGate';
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
  Settings,
  RefreshCw,
  Menu,
  Crown
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
import { EgresosInfo } from '../components/egresos/EgresosInfo';
import {
  CategoriaModal,
  PresupuestosList,
  PresupuestoModal,
  EgresosDashboard
} from '../components/egresos';

// Componente de restricción para EgresosPage
const EgresosRestricted = () => (
  <div className="container mx-auto p-6">
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-center text-green-800">
          🔒 Sistema de Egresos - Plan Profesional Requerido
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-green-700">
          La funcionalidad de <strong>Sistema de Egresos</strong> está disponible únicamente en el plan <strong>Profesional</strong> o superior.
        </p>
        <p className="text-sm text-green-600">
          Esta funcionalidad incluye registro básico de gastos, categorías básicas de egresos y gestión de presupuestos.
        </p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" className="border-green-300 text-green-700">
            📞 Contactar Soporte
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            👑 Actualizar Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const EgresosPage: React.FC = () => {
  const { user } = useAuth();
  const { currentPlan } = usePlan();
  const navigate = useNavigate();
  const userRole = user?.rol || '';

  // Función para verificar si una pestaña está disponible según el plan
  const isTabAvailable = (tabName: string): boolean => {
    console.log(`🔍 [EGRESOS] Verificando acceso a pestaña "${tabName}"`);
    console.log(`🔍 [EGRESOS] Usuario:`, user);
    console.log(`🔍 [EGRESOS] CurrentPlan:`, currentPlan);
    
    // SOLUCIÓN TEMPORAL: Admin/Super_admin = Enterprise = Acceso completo
    if (user?.rol === 'admin' || user?.rol === 'super_admin') {
      console.log(`✅ [EGRESOS] Usuario admin/super_admin detectado - acceso completo a "${tabName}": TRUE`);
      return true;
    }
    
    // Si hay información del plan, usarla
    if (currentPlan) {
      const planName = currentPlan.nombre.toLowerCase();
      console.log(`🔍 [EGRESOS] Plan detectado: "${planName}"`);
      
      // Plan Enterprise: Acceso completo
      if (planName.includes('enterprise')) {
        console.log(`✅ [EGRESOS] Plan Enterprise detectado - acceso completo a "${tabName}": TRUE`);
        return true;
      }
      
      // Plan Básico: Solo Dashboard
      if (planName === 'basico') {
        const access = tabName === 'dashboard';
        console.log(`🔍 [EGRESOS] Plan Básico - acceso a "${tabName}": ${access}`);
        return access;
      }
      
      // Plan Profesional: Dashboard y Egresos
      if (planName === 'profesional') {
        const access = tabName === 'dashboard' || tabName === 'egresos';
        console.log(`🔍 [EGRESOS] Plan Profesional - acceso a "${tabName}": ${access}`);
        return access;
      }
      
      // Plan Avanzado: Todas las pestañas
      console.log(`✅ [EGRESOS] Plan Avanzado - acceso completo a "${tabName}": TRUE`);
      return true;
    }
    
    // Si no hay información del plan, denegar por seguridad (excepto admin ya validado arriba)
    console.log(`⚠️ [EGRESOS] Sin información del plan - denegando acceso a "${tabName}": FALSE`);
    return false;
  };


  // Componente de mensaje profesional para funcionalidades restringidas
  const UpgradeMessage = ({ tabInfo }: { tabInfo: any }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        {/* Icono y título */}
        <div className="space-y-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <tabInfo.icon className="h-10 w-10 text-purple-600" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Crown className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {tabInfo.text} - Plan Avanzado
            </h2>
            <p className="text-lg text-gray-600">
              {tabInfo.description}
            </p>
          </div>
        </div>

        {/* Mensaje de upgrade */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
          <p className="text-gray-700 leading-relaxed">
            {tabInfo.upgradeMessage}
          </p>
        </div>

        {/* Beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-700">Análisis avanzado</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-700">Reportes profesionales</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-700">Exportación múltiple</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-700">Soporte prioritario</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            📞 Contactar Soporte
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            👑 Actualizar a Plan Avanzado
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-sm text-gray-500">
          <p>💡 <strong>Tip:</strong> El plan Avanzado incluye todas las funcionalidades de egresos + análisis predictivo</p>
        </div>
      </div>
    </div>
  );

  // Estados principales
  const [activeTab, setActiveTab] = useState<'dashboard' | 'egresos' | 'categorias' | 'presupuestos' | 'reportes' | 'informacion'>('dashboard');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileTabsMenu, setShowMobileTabsMenu] = useState<boolean>(false);

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
  // FUNCIONES AUXILIARES
  // =====================================================

  const getTabInfo = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return { icon: BarChart3, text: 'Dashboard' };
      case 'egresos':
        return { icon: DollarSign, text: 'Egresos' };
      case 'categorias':
        return { icon: FileText, text: 'Categorías' };
      case 'presupuestos':
        return { icon: PieChart, text: 'Presupuestos' };
      case 'reportes':
        return { icon: Activity, text: 'Reportes' };
      case 'informacion':
        return { icon: FileText, text: 'Información' };
      default:
        return { icon: BarChart3, text: 'Dashboard' };
    }
  };

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    // Verificar permisos
    if (!['admin', 'gerente', 'cajero', 'contador'].includes(userRole)) {
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

  useEffect(() => {
    // Cargar egresos cuando se active la pestaña de información
    console.log('EgresosPage - useEffect - activeTab:', activeTab, 'egresos.length:', egresos.length);
    
    if (activeTab === 'informacion' && egresos.length === 0) {
      console.log('EgresosPage - useEffect - cargando egresos para pestaña información');
      loadEgresos();
    }
  }, [activeTab, egresos.length]);

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
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al cargar los datos iniciales';
      if (err.response?.data?.message) {
        errorMessage = `Error: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadEgresos = async () => {
    try {
      setLoading(true);
      console.log('EgresosPage - loadEgresos iniciado con filtros:', filtros);
      
      const response = await egresosApi.getAll(filtros);
      console.log('EgresosPage - respuesta de la API:', response);
      console.log('EgresosPage - cantidad de egresos recibidos:', response.data?.length || 0);
      
      if (response.data && response.data.length > 0) {
        console.log('EgresosPage - primer egreso:', response.data[0]);
        console.log('EgresosPage - registrado_por_nombre del primer egreso:', response.data[0].registrado_por_nombre);
      }
      
      setEgresos(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Error loading egresos:', err);
      
      // Mostrar mensaje de error más específico
      if (err.response?.data?.message) {
        toast.error(`Error al cargar egresos: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Error al cargar egresos: ${err.message}`);
      } else {
        toast.error('Error al cargar los egresos');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const data = await categoriasEgresosApi.getAll();
      setCategorias(data);
    } catch (err: any) {
      console.error('Error loading categorias:', err);
      
      // Mostrar mensaje de error más específico
      if (err.response?.data?.message) {
        toast.error(`Error al cargar categorías: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Error al cargar categorías: ${err.message}`);
      } else {
        toast.error('Error al cargar las categorías');
      }
    }
  };

  const loadPresupuestos = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const data = await presupuestosApi.getAll({ anio: currentYear });
      setPresupuestos(data);
    } catch (err: any) {
      console.error('Error loading presupuestos:', err);
      
      // Mostrar mensaje de error más específico
      if (err.response?.data?.message) {
        toast.error(`Error al cargar presupuestos: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Error al cargar presupuestos: ${err.message}`);
      } else {
        toast.error('Error al cargar los presupuestos');
      }
    }
  };

  const loadEgresosPendientes = async () => {
    try {
      if (egresosUtils.canApprove(userRole)) {
        const data = await egresosApi.getPendientesAprobacion();
        setEgresosPendientes(data);
      }
    } catch (err: any) {
      console.error('Error loading egresos pendientes:', err);
      
      // Mostrar mensaje de error más específico
      if (err.response?.data?.message) {
        toast.error(`Error al cargar egresos pendientes: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Error al cargar egresos pendientes: ${err.message}`);
      } else {
        toast.error('Error al cargar los egresos pendientes');
      }
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
      const egresoAprobado = await egresosApi.aprobar(id, comentario);
      
      // Verificar si el estado cambió o solo se registró la aprobación
      if (egresoAprobado.estado === 'aprobado') {
        toast.success('Egreso aprobado exitosamente');
      } else if (egresoAprobado.estado === 'pagado') {
        toast.success('Aprobación administrativa registrada para egreso ya pagado');
      }
      
      loadEgresos();
      loadEgresosPendientes();
    } catch (err: any) {
      console.error('Error approving egreso:', err);
      
      // Mostrar mensaje de error más específico
      if (err.response?.data?.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Error: ${err.message}`);
      } else {
        toast.error('Error al aprobar el egreso');
      }
    }
  };

  const handleRechazarEgreso = async (id: number, comentario: string) => {
    try {
      const egresoRechazado = await egresosApi.rechazar(id, comentario);
      
      // Verificar si el estado cambió o solo se registró el rechazo
      if (egresoRechazado.estado === 'rechazado') {
        toast.success('Egreso rechazado exitosamente');
      } else if (egresoRechazado.estado === 'pagado') {
        toast.success('Rechazo administrativo registrado para egreso ya pagado');
      }
      
      loadEgresos();
      loadEgresosPendientes();
    } catch (err: any) {
      console.error('Error rejecting egreso:', err);
      
      // Mostrar mensaje de error más específico
      if (err.response?.data?.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Error: ${err.message}`);
      } else {
        toast.error('Error al rechazar el egreso');
      }
    }
  };

  const handlePagarEgreso = async (id: number, comentario?: string) => {
    try {
      await egresosApi.marcarPagado(id, comentario);
      toast.success('Egreso marcado como pagado');
      loadEgresos();
      loadEgresosPendientes();
    } catch (err: any) {
      console.error('Error marking egreso as paid:', err);
      
      // Mostrar mensaje de error más específico
      if (err.response?.data?.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Error: ${err.message}`);
      } else {
        toast.error('Error al marcar el egreso como pagado');
      }
    }
  };

  const handleDeleteEgreso = async (id: number) => {
    try {
      await egresosApi.delete(id);
      toast.success('Egreso cancelado');
      loadEgresos();
      loadEgresosPendientes();
    } catch (err: any) {
      console.error('Error deleting egreso:', err);
      
      // Mostrar mensaje de error más específico
      if (err.response?.data?.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else if (err.message) {
        toast.error(`Error: ${err.message}`);
      } else {
        toast.error('Error al cancelar el egreso');
      }
    }
  };

  // =====================================================
  // HANDLERS DE CAMBIO DE TAB
  // =====================================================

  const handleTabChange = (tab: string) => {
    console.log('EgresosPage - handleTabChange - cambiando a pestaña:', tab);
    setActiveTab(tab as any);
    
    // Cargar datos específicos según la pestaña
    switch (tab) {
      case 'egresos':
        console.log('EgresosPage - cargando egresos para pestaña egresos');
        loadEgresos();
        break;
      case 'categorias':
        console.log('EgresosPage - cargando categorías');
        loadCategorias();
        break;
      case 'presupuestos':
        console.log('EgresosPage - cargando presupuestos');
        loadPresupuestos();
        break;
      case 'dashboard':
        console.log('EgresosPage - cargando dashboard');
        loadDashboardData();
        break;
      case 'informacion':
        console.log('EgresosPage - cargando egresos para pestaña información');
        loadEgresos(); // Cargar egresos para mostrar en la información
        break;
    }
  };

  // =====================================================
  // VERIFICACIÓN DE PERMISOS
  // =====================================================

  if (!['admin', 'gerente', 'cajero', 'contador'].includes(userRole)) {
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
    <PlanGate feature="egresos" fallback={<EgresosRestricted />} requiredPlan="profesional">
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
        {/* Desktop Navigation */}
        <TabsList className="hidden lg:grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="egresos" 
            className={`flex items-center gap-2 ${!isTabAvailable('egresos') ? 'opacity-60' : ''}`}
          >
            <DollarSign className="h-4 w-4" />
            Egresos
            {egresosPendientes.length > 0 && isTabAvailable('egresos') && (
              <Badge variant="destructive" className="ml-1">
                {egresosPendientes.length}
              </Badge>
            )}
            {!isTabAvailable('egresos') && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="categorias" 
            className={`flex items-center gap-2 ${!isTabAvailable('categorias') ? 'opacity-60' : ''}`}
          >
            <FileText className="h-4 w-4" />
            Categorías
            {!isTabAvailable('categorias') && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="presupuestos" 
            className={`flex items-center gap-2 ${!isTabAvailable('presupuestos') ? 'opacity-60' : ''}`}
          >
            <PieChart className="h-4 w-4" />
            Presupuestos
            {!isTabAvailable('presupuestos') && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="reportes" 
            className={`flex items-center gap-2 ${!isTabAvailable('reportes') ? 'opacity-60' : ''}`}
          >
            <Activity className="h-4 w-4" />
            Reportes
            {!isTabAvailable('reportes') && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="informacion" 
            className={`flex items-center gap-2 ${!isTabAvailable('informacion') ? 'opacity-60' : ''}`}
          >
            <FileText className="h-4 w-4" />
            Información
            {!isTabAvailable('informacion') && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {(() => {
                const { icon: Icon, text } = getTabInfo(activeTab);
                return (
                  <>
                    <Icon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{text}</span>
                    {activeTab === 'egresos' && egresosPendientes.length > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {egresosPendientes.length}
                      </Badge>
                    )}
                  </>
                );
              })()}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileTabsMenu(!showMobileTabsMenu)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileTabsMenu && (
            <div className="mt-2 p-2 bg-white border rounded-lg shadow-lg">
              <div className="space-y-1">
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setShowMobileTabsMenu(false);
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === 'egresos' ? 'default' : 'ghost'}
                  className={`w-full justify-start ${!isTabAvailable('egresos') ? 'opacity-60' : ''}`}
                  onClick={() => {
                    setActiveTab('egresos');
                    setShowMobileTabsMenu(false);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Egresos
                  {egresosPendientes.length > 0 && isTabAvailable('egresos') && (
                    <Badge variant="destructive" className="ml-2">
                      {egresosPendientes.length}
                    </Badge>
                  )}
                  {!isTabAvailable('egresos') && (
                    <Crown className="h-3 w-3 text-yellow-500 ml-2" />
                  )}
                </Button>
                <Button
                  variant={activeTab === 'categorias' ? 'default' : 'ghost'}
                  className={`w-full justify-start ${!isTabAvailable('categorias') ? 'opacity-60' : ''}`}
                  onClick={() => {
                    setActiveTab('categorias');
                    setShowMobileTabsMenu(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Categorías
                  {!isTabAvailable('categorias') && (
                    <Crown className="h-3 w-3 text-yellow-500 ml-2" />
                  )}
                </Button>
                <Button
                  variant={activeTab === 'presupuestos' ? 'default' : 'ghost'}
                  className={`w-full justify-start ${!isTabAvailable('presupuestos') ? 'opacity-60' : ''}`}
                  onClick={() => {
                    setActiveTab('presupuestos');
                    setShowMobileTabsMenu(false);
                  }}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Presupuestos
                  {!isTabAvailable('presupuestos') && (
                    <Crown className="h-3 w-3 text-yellow-500 ml-2" />
                  )}
                </Button>
                <Button
                  variant={activeTab === 'reportes' ? 'default' : 'ghost'}
                  className={`w-full justify-start ${!isTabAvailable('reportes') ? 'opacity-60' : ''}`}
                  onClick={() => {
                    setActiveTab('reportes');
                    setShowMobileTabsMenu(false);
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Reportes
                  {!isTabAvailable('reportes') && (
                    <Crown className="h-3 w-3 text-yellow-500 ml-2" />
                  )}
                </Button>
                <Button
                  variant={activeTab === 'informacion' ? 'default' : 'ghost'}
                  className={`w-full justify-start ${!isTabAvailable('informacion') ? 'opacity-60' : ''}`}
                  onClick={() => {
                    setActiveTab('informacion');
                    setShowMobileTabsMenu(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Información
                  {!isTabAvailable('informacion') && (
                    <Crown className="h-3 w-3 text-yellow-500 ml-2" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

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
              onFiltrosChange={setFiltros}
              onPageChange={(page) => setFiltros(prev => ({ ...prev, page }))}
            />
          </div>
        </TabsContent>

        {/* Categorías Tab */}
        <TabsContent value="categorias" className="mt-6">
          {isTabAvailable('categorias') ? (
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
                  } catch (err: any) {
                    console.error('Error deleting categoria:', err);
                    
                    // Mostrar mensaje de error más específico
                    if (err.response?.data?.message) {
                      toast.error(`Error: ${err.response.data.message}`);
                    } else if (err.message) {
                      toast.error(`Error: ${err.message}`);
                    } else {
                      toast.error('Error al eliminar la categoría');
                    }
                  }
                }}
              />
            </div>
          ) : (
            <UpgradeMessage tabInfo={getTabInfo('categorias')} />
          )}
        </TabsContent>

        {/* Presupuestos Tab */}
        <TabsContent value="presupuestos" className="mt-6">
          {isTabAvailable('presupuestos') ? (
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
                  } catch (err: any) {
                    console.error('Error deleting presupuesto:', err);
                    
                    // Mostrar mensaje de error más específico
                    if (err.response?.data?.message) {
                      toast.error(`Error: ${err.response.data.message}`);
                    } else if (err.message) {
                      toast.error(`Error: ${err.message}`);
                    } else {
                      toast.error('Error al eliminar el presupuesto');
                    }
                  }
                }}
              />
            </div>
          ) : (
            <UpgradeMessage tabInfo={getTabInfo('presupuestos')} />
          )}
        </TabsContent>

                 {/* Reportes Tab */}
         <TabsContent value="reportes" className="mt-6">
           {isTabAvailable('reportes') ? (
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
           ) : (
             <UpgradeMessage tabInfo={getTabInfo('reportes')} />
           )}
         </TabsContent>

         {/* Información Tab */}
         <TabsContent value="informacion" className="mt-6">
           {isTabAvailable('informacion') ? (
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <div>
                   <h2 className="text-xl font-semibold">Información de Egresos</h2>
                   <p className="text-sm text-gray-500">
                     Resumen detallado de egresos por cajero y estadísticas generales
                   </p>
                 </div>
                 <Button 
                   onClick={loadEgresos} 
                   variant="outline" 
                   size="sm"
                   disabled={loading}
                 >
                   <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                   {loading ? 'Actualizando...' : 'Actualizar'}
                 </Button>
               </div>
               <EgresosInfo egresos={egresos} userRole={userRole} />
             </div>
           ) : (
             <UpgradeMessage tabInfo={getTabInfo('informacion')} />
           )}
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
          } catch (err: any) {
            console.error('Error saving egreso:', err);
            
            // Mostrar mensaje de error más específico
            if (err.response?.data?.message) {
              toast.error(`Error: ${err.response.data.message}`);
            } else if (err.message) {
              toast.error(`Error: ${err.message}`);
            } else {
              toast.error('Error al guardar el egreso');
            }
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
          } catch (err: any) {
            console.error('Error saving categoria:', err);
            
            // Mostrar mensaje de error más específico
            if (err.response?.data?.message) {
              toast.error(`Error: ${err.response.data.message}`);
            } else if (err.message) {
              toast.error(`Error: ${err.message}`);
            } else {
              toast.error('Error al guardar la categoría');
            }
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
          } catch (err: any) {
            console.error('Error saving presupuesto:', err);
            
            // Mostrar mensaje de error más específico
            if (err.response?.data?.message) {
              toast.error(`Error: ${err.response.data.message}`);
            } else if (err.message) {
              toast.error(`Error: ${err.message}`);
            } else {
              toast.error('Error al guardar el presupuesto');
            }
          }
        }}
      />
    </div>
    </PlanGate>
  );
};

export default EgresosPage;
