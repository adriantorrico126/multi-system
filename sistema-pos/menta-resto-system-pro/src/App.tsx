import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { OrientationBanner } from "./components/OrientationBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { RestaurantChangeHandler } from "./components/RestaurantChangeHandler";
// import { useMobile } from "./hooks/use-mobile";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const KitchenView = lazy(() => import("./pages/KitchenView"));
const ArqueoPage = lazy(() => import("./pages/ArqueoPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const EgresosPage = lazy(() => import("./pages/EgresosPage"));
const CajaEgresoPage = lazy(() => import("./pages/CajaEgresoPage"));
const InfoCajaPage = lazy(() => import("./pages/InfoCajaPage"));
const Login = lazy(() => import("./pages/Login"));
const SupportPage = lazy(() => import("./pages/SupportPage"));

const queryClient = new QueryClient();

function AppContent() {
  // Aplicar detección móvil globalmente
  // useMobile();
  
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <OrientationBanner>
              <Suspense fallback={<div className="text-center p-8 text-gray-600">Cargando...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/cocina" element={<KitchenView />} />
                  <Route path="/arqueo" element={<ArqueoPage />} />
                  <Route path="/inventario" element={<InventoryPage />} />
                  <Route path="/egresos" element={<EgresosPage />} />
                  <Route path="/egresos-caja" element={<CajaEgresoPage />} />
                  <Route path="/info-caja" element={<InfoCajaPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/soporte" element={<SupportPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <RestaurantChangeHandler />
              <Toaster />
            </OrientationBanner>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
