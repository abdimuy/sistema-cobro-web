import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { setNavigateRef } from "./lib/navigation";

// Components
import Home from "./modules/home/Home";
import Settings from "./modules/setting/Settings";
import CreateUser from "./modules/user/CreateUser";
import Sales from "./modules/sales/Sales";
import VentasLocales from "./modules/ventasLocales/VentasLocales";
import Garantias from "./modules/garantias/Garantias";
import GarantiaDetalle from "./modules/garantias/GarantiaDetails";
import AsignacionAlmacenes from "./modules/almacenes/AsignacionAlmacenes";
import Traspasos from "./modules/traspasos/Traspasos";
import InventarioDetalle from "./modules/traspasos/InventarioDetalle";
import FailedIntents from "./modules/failedIntents/FailedIntents";
import Winback from "./modules/winback/Winback";
import { Clientes } from "./modules/clientes/Clientes";
import ClienteFichaPage from "./modules/clientes/ClienteFichaPage";
import { Rutas } from "./modules/rutas/Rutas";
import { Cartera } from "./modules/cartera/Cartera";

// Auth Components
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppLayout } from "./components/AppLayout";

// Constants
import { ROLES } from "./constants/roles";

function NavigationSetter() {
  const navigate = useNavigate();
  useEffect(() => { setNavigateRef(navigate); }, [navigate]);
  return null;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

function App() {
  useEffect(() => {
    invoke("close_splash").catch(() => {});
  }, []);

  return (
    <ThemeProvider>
    <AuthProvider>
      <NotificationProvider>
      <Router>
        <NavigationSetter />
        <LoadScript googleMapsApiKey="AIzaSyCASwsCJvFm7dGajUWlVg19PmS8JVPqRaY">
          <Toaster
            richColors
            position="top-right"
            expand
            toastOptions={{
              style: {
                width: "420px",
                padding: "16px 20px",
                fontSize: "14px",
              },
              descriptionClassName: "text-sm",
            }}
          />
          <Routes>
            {/* Ruta de Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas Protegidas con Layout */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Home />} />

              <Route path="/sales" element={
                <ProtectedRoute requiredModule="SALES"><Sales /></ProtectedRoute>
              } />

              <Route path="/ventas-locales" element={
                <ProtectedRoute requiredModule="VENTAS_LOCALES"><VentasLocales /></ProtectedRoute>
              } />

              <Route path="/garantias" element={
                <ProtectedRoute requiredModule="GARANTIAS"><Garantias /></ProtectedRoute>
              } />

              <Route path="/garantias/:id" element={
                <ProtectedRoute requiredModule="GARANTIAS"><GarantiaDetalle /></ProtectedRoute>
              } />

              <Route path="/asignacion-almacenes" element={
                <ProtectedRoute requiredModule="ALMACENES"><AsignacionAlmacenes /></ProtectedRoute>
              } />

              <Route path="/inventario-camionetas" element={
                <ProtectedRoute requiredModule="INVENTARIO"><Traspasos /></ProtectedRoute>
              } />

              <Route path="/almacenes/:almacenId/inventario" element={
                <ProtectedRoute requiredModule="INVENTARIO"><InventarioDetalle /></ProtectedRoute>
              } />

              {/* Rutas de Administración - Solo Admin y Super Admin */}
              <Route path="/failed-intents" element={
                <ProtectedRoute requiredModule="FAILED_INTENTS"><FailedIntents /></ProtectedRoute>
              } />

              <Route path="/winback" element={
                <ProtectedRoute requiredModule="WINBACK_ANALYTICS"><Winback /></ProtectedRoute>
              } />

              <Route path="/clientes" element={
                <ProtectedRoute requiredModule="CLIENTES"><Clientes /></ProtectedRoute>
              } />

              <Route path="/clientes/:id" element={
                <ProtectedRoute requiredModule="CLIENTES"><ClienteFichaPage /></ProtectedRoute>
              } />

              <Route path="/rutas" element={
                <ProtectedRoute requiredModule="RUTAS"><Rutas /></ProtectedRoute>
              } />

              <Route path="/cartera" element={
                <ProtectedRoute requiredModule="CARTERA"><Cartera /></ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute requiredModule="USUARIOS" requiredRole={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                  <Settings />
                </ProtectedRoute>
              } />

              <Route path="/create-user" element={
                <ProtectedRoute requiredModule="USUARIOS" requiredRole={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                  <CreateUser />
                </ProtectedRoute>
              } />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LoadScript>
      </Router>
      </NotificationProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
