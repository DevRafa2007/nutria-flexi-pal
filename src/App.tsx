import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/Dashboard";
import { ResetPasswordPage } from "./pages/ResetPassword";
import { PricingPage } from "./pages/Pricing";
import { SuccessPage } from "./pages/Success";
import { CancelPage } from "./pages/Cancel";
import ReturnPage from "./pages/Return";

const queryClient = new QueryClient();

// AnimatedRoutes component to handle location-based transitions
const AnimatedRoutes = () => {
  const location = useLocation();

  // Custom key function:
  // Returns 'auth' for both /login and /register so they share the same "page" context
  // This allows the internal Switch animation to happen without a full page exit/enter
  const getPageKey = (pathname: string) => {
    if (pathname === '/login' || pathname === '/register') return 'auth';
    return pathname;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={getPageKey(location.pathname)}>
        <Route path="/" element={<Index />} />
        {/* Unified Auth Routes */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Pricing & Payment Routes */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/return" element={<ReturnPage />} />
        <Route path="/cancel" element={<CancelPage />} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
