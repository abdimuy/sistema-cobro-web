import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";

// Components
import Home from "./modules/home/Home";
import Settings from "./modules/setting/Settings";
import CreateUser from "./modules/user/CreateUser";
import Sales from "./modules/sales/Sales";
import VentasLocales from "./modules/ventasLocales/VentasLocales";
import Garantias from "./modules/garantias/Garantias";
import GarantiaDetalle from "./modules/garantias/GarantiaDetails";
import AsignacionAlmacenes from "./modules/almacenes/AsignacionAlmacenes";

// Auth Components
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Constants
import { ROLES } from "./constants/roles";

function App() {
  return (
    <AuthProvider>
      <Router>
        <LoadScript googleMapsApiKey="AIzaSyCASwsCJvFm7dGajUWlVg19PmS8JVPqRaY">
          <Routes>
            {/* Ruta de Login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rutas Protegidas */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/sales" 
              element={
                <ProtectedRoute requiredModule="SALES">
                  <Sales />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/ventas-locales" 
              element={
                <ProtectedRoute requiredModule="VENTAS_LOCALES">
                  <VentasLocales />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/garantias" 
              element={
                <ProtectedRoute requiredModule="GARANTIAS">
                  <Garantias />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/garantias/:id" 
              element={
                <ProtectedRoute requiredModule="GARANTIAS">
                  <GarantiaDetalle />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/asignacion-almacenes" 
              element={
                <ProtectedRoute requiredModule="ALMACENES">
                  <AsignacionAlmacenes />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas de Administración - Solo Admin y Super Admin */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute 
                  requiredModule="USUARIOS" 
                  requiredRole={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}
                >
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-user" 
              element={
                <ProtectedRoute 
                  requiredModule="USUARIOS" 
                  requiredRole={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}
                >
                  <CreateUser />
                </ProtectedRoute>
              } 
            />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LoadScript>
      </Router>
    </AuthProvider>
  );
}

export default App;
