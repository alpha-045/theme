import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import AppLayout from "@/components/AppLayout";
import ClientBrowse from "@/pages/client/ClientBrowse";
import ServiceDetail from "@/pages/client/ServiceDetail";
import ClientOrders from "@/pages/client/ClientOrders";
import OrderDetail from "@/pages/client/OrderDetail";
import OperativeDashboard from "@/pages/operative/OperativeDashboard";
import OperativeServices from "@/pages/operative/OperativeServices";
import IncomingOrders from "@/pages/operative/IncomingOrders";
import OperativeOrders from "@/pages/operative/OperativeOrders";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminServices from "@/pages/admin/AdminServices";
import AdminCategories from "@/pages/admin/AdminCategories";
import NotFound from "./pages/NotFound";
import Landingpage from "./pages/landingpg";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import Layout from "./pages/layout";
import ProfilePage from "./pages/profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Landingpage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
              {/* Client */}
              <Route path="/client" element={<ClientBrowse />} />
              <Route path="/client/service/:id" element={<ServiceDetail />} />
              <Route path="/client/orders" element={<ClientOrders />} />
              <Route path="/client/order/:id" element={<OrderDetail />} />
              {/* Operative */}
              <Route path="/operative" element={<OperativeDashboard />} />
              <Route path="/operative/services" element={<OperativeServices />} />
              <Route path="/operative/incoming" element={<IncomingOrders />} />
              <Route path="/operative/orders" element={<OperativeOrders />} />
              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
