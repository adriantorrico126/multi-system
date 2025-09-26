// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Rutas protegidas
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// UI global
import { Toaster } from '@/components/ui/toaster';

// Páginas
import Index from '@/pages/Index';
import EgresosPage from '@/pages/EgresosPage';
import ArqueoPage from '@/pages/ArqueoPage';
import InventoryPage from '@/pages/InventoryPage';
import CajaEgresoPage from '@/pages/CajaEgresoPage';
import InfoCajaPage from '@/pages/InfoCajaPage';
import SupportPage from '@/pages/SupportPage';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Página principal / login */}
        <Route path="/" element={<Index />} />

        {/* Rutas protegidas por roles */}
        <Route
          path="/egresos"
          element={
            <ProtectedRoute requiredRole={['cajero', 'admin', 'super_admin']}>
              <EgresosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/egresos-caja"
          element={
            <ProtectedRoute requiredRole={['cajero', 'admin', 'super_admin']}>
              <CajaEgresoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/arqueo"
          element={
            <ProtectedRoute requiredRole={['cajero', 'admin', 'super_admin']}>
              <ArqueoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventario"
          element={
            <ProtectedRoute requiredRole={['admin', 'super_admin']}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/info-caja"
          element={
            <ProtectedRoute requiredRole={['cajero', 'admin', 'super_admin']}>
              <InfoCajaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/soporte"
          element={
            <ProtectedRoute>
              <SupportPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback: redirige a inicio */}
        <Route path="*" element={<Index />} />
      </Routes>

      {/* Toaster para notificaciones */}
      <Toaster />
    </>
  );
};

export default App;
