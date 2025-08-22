
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
  Activity
} from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <AuthLogin onLogin={setIsAuthenticated} onRoleChange={setUserRole} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Admin Central POS
                </h1>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex">
                {userRole === 'admin' ? 'Super Administrador' : 'Administrador'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notificaciones Críticas */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {/* This count will now be managed by AdminDashboard */}
                  </span>
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsAuthenticated(false)}
                className="text-slate-600 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-7 bg-white p-1 shadow-sm rounded-lg">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="restaurants"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Restaurantes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Suscripciones</span>
            </TabsTrigger>
            <TabsTrigger 
              value="support"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Soporte</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Análisis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="config"
              className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger 
                value="pos-manager"
                className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <span className="hidden sm:inline">POS Manager</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Content Sections */}
          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-6">
            <RestaurantManagement />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionControl />
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
      </main>
    </div>
  );
};

export default Index;
