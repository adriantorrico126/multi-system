import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { RestaurantManagement } from "@/components/restaurants/RestaurantManagement";
import { SubscriptionControl } from "@/components/subscriptions/SubscriptionControl";
import { SupportCenter } from "@/components/support/SupportCenter";
import { GlobalAnalytics } from "@/components/analytics/GlobalAnalytics";
import { SystemConfiguration } from "@/components/config/SystemConfiguration";
import { POSManager } from "@/components/pos-manager/POSManager";
import { AuthLogin } from "@/components/auth/AuthLogin";
import { PlansManagement } from "@/components/plans/PlansManagement";
import { UsageStats } from "@/components/plans/UsageStats";
import { 
  Shield, 
  Building2, 
  CreditCard, 
  Headphones, 
  BarChart3,
  Settings, 
  LogOut, 
  Bell,
  AlertTriangle,
  Users,
  Activity,
  User
} from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <AuthLogin onLogin={setIsAuthenticated} onRoleChange={setUserRole} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar de Navegación */}
      <aside className="w-64 bg-slate-800/90 backdrop-blur-md shadow-xl border-r border-slate-700/50 flex flex-col">
        {/* Logo y Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Admin Central</h1>
              <p className="text-sm text-slate-300">POS Management</p>
            </div>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Activity className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('restaurants')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTab === 'restaurants'
                ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Building2 className="h-5 w-5" />
            <span className="font-medium">Restaurantes</span>
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTab === 'subscriptions'
                ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">Suscripciones</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span className="font-medium">Planes</span>
          </button>

          <button
            onClick={() => setActiveTab('usage')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTab === 'usage'
                ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Uso</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTab === 'support'
                ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Headphones className="h-5 w-5" />
            <span className="font-medium">Soporte</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">Análisis</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Sistema</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('pos-manager')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                activeTab === 'pos-manager'
                  ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">POS Manager</span>
            </button>
          )}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                {userRole === 'admin' ? 'Super Administrador' : 'Administrador'}
              </p>
              <p className="text-xs text-slate-400">Sistema POS</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsAuthenticated(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col">
        {/* Header del Contenido */}
        <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white capitalize">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'restaurants' && 'Gestión de Restaurantes'}
                {activeTab === 'subscriptions' && 'Suscripciones'}
                {activeTab === 'plans' && 'Planes y Tarifas'}
                {activeTab === 'usage' && 'Estadísticas de Uso'}
                {activeTab === 'support' && 'Centro de Soporte'}
                {activeTab === 'analytics' && 'Análisis y Reportes'}
                {activeTab === 'config' && 'Configuración del Sistema'}
                {activeTab === 'pos-manager' && 'POS Manager'}
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                {activeTab === 'dashboard' && 'Panel de control principal del sistema'}
                {activeTab === 'restaurants' && 'Administra todos los restaurantes registrados'}
                {activeTab === 'subscriptions' && 'Gestiona las suscripciones y pagos'}
                {activeTab === 'plans' && 'Configura planes y tarifas del sistema'}
                {activeTab === 'usage' && 'Monitorea el uso y rendimiento'}
                {activeTab === 'support' && 'Gestiona tickets y soporte técnico'}
                {activeTab === 'analytics' && 'Análisis detallados y reportes'}
                {activeTab === 'config' && 'Configuración general del sistema'}
                {activeTab === 'pos-manager' && 'Herramientas avanzadas de POS'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
            </div>
          </div>
        </header>

        {/* Área de Contenido */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="dashboard" className="space-y-6">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="restaurants" className="space-y-6">
              <RestaurantManagement />
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <SubscriptionControl />
            </TabsContent>

            <TabsContent value="plans" className="space-y-6">
              <PlansManagement />
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <UsageStats />
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <SupportCenter />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <GlobalAnalytics />
            </TabsContent>

            <TabsContent value="config" className="space-y-6">
              <SystemConfiguration />
            </TabsContent>

            {userRole === 'admin' && (
              <TabsContent value="pos-manager" className="space-y-6">
                <POSManager />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
