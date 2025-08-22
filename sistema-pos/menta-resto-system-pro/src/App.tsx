import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { lazy, Suspense } from "react"; // Import lazy and Suspense
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { OrientationBanner } from "./components/OrientationBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const KitchenView = lazy(() => import("./pages/KitchenView"));
const ArqueoPage = lazy(() => import("./pages/ArqueoPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const Login = lazy(() => import("./pages/Login"));
const SupportPage = lazy(() => import("./pages/SupportPage"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <OrientationBanner />
        <BrowserRouter>
          <Suspense fallback={<div>Cargando...</div>}> {/* Add Suspense fallback */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cocina" element={<KitchenView />} />
              <Route path="/arqueo" element={<ArqueoPage />} />
              <Route path="/inventario" element={<InventoryPage />} />
              <Route path="/soporte" element={<SupportPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
