import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { AuthLogin } from "@/components/auth/AuthLogin";

const queryClient = new QueryClient();

function App() {
  const { user } = useAuth();
  const [loggedIn, setLoggedIn] = useState(false);
  // Si no hay usuario autenticado, mostrar solo el login
  if (!user && !loggedIn) {
    return (
      <AuthLogin onLogin={() => setLoggedIn(true)} onRoleChange={() => {}} />
    );
  }
  // Si está autenticado, mostrar el resto de la app
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
