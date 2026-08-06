import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  // A diferencia de ProtectedRoute, aquí solo necesitamos una verificación síncrona
  // rápida para saber si mostrar el login o redirigir. No hace falta suscribirse
  // a Firebase porque si existe vialtoToken, asumimos que hay sesión activa.
  const isAuthenticated = !!localStorage.getItem("vialtoToken");

  if (isAuthenticated) {
    return <Navigate to="/inicio" replace />;
  }

  return children;
};

export default PublicRoute;
