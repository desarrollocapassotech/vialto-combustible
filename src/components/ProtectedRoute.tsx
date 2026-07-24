import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { logout } from "@/lib/auth";
import Loader from "./ui/loader";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar la carga inicial
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado para verificar la autenticación
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // 1. Verificar si los datos del usuario están en localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return; // Terminar la ejecución si los datos están en localStorage
        }

        // 2. Verificar si el usuario está autenticado en Firebase Authentication
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
          setIsLoading(false); // Finalizar la carga inicial
        });

        return () => unsubscribe(); // Limpiar el listener cuando el componente se desmonta
      } catch (error) {
        console.error("Error al verificar la autenticación:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // La navegación debe dispararse en un efecto, no durante el render: llamar
  // navigate() en el cuerpo del componente actualiza `BrowserRouter` mientras
  // `ProtectedRoute` todavía se está renderizando (warning de React).
  //
  // Antes de redirigir, se llama a logout(): App.tsx decide si mostrar /login
  // mirando solo `vialtoToken`. Si ProtectedRoute concluye "no autenticado" sin
  // limpiar esa clave (por ejemplo, por un estado de sesión inconsistente
  // heredado), App.tsx seguiría creyendo que hay sesión y mandaría de vuelta a
  // /inicio, generando un loop de redirecciones entre ambas rutas.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      logout().then(() => navigate("/login", { replace: true }));
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Mientras se carga, mostrar un loader
  if (isLoading) {
    return <Loader />
  }

  // Si no está autenticado después de la carga inicial, no renderizar nada
  // mientras se redirige (la redirección la dispara el efecto de arriba)
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, renderizar los hijos
  return children;
};

export default ProtectedRoute;