import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiJson, ApiError } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import VialtoLogo from "@/components/VialtoLogo";

const LOGIN_SAVE_KEY = "loginChofer";

interface SavedLogin {
  dni: string;
  password: string;
}

/** Endpoints públicos del backend: no requieren token de sesión. */
const noAuth = async () => null;

interface ChoferLoginResponse {
  token: string;
  chofer: {
    id: string;
    nombre: string;
    dni: string | null;
    tenantId: string;
  };
}

function loadSavedLogin(): Partial<SavedLogin> | null {
  try {
    const saved = localStorage.getItem(LOGIN_SAVE_KEY);
    if (saved) {
      return JSON.parse(saved) as SavedLogin;
    }
  } catch {
    // ignorar si hay error al parsear
  }
  return null;
}

const Login = () => {
  const [dni, setDni] = useState(() => loadSavedLogin()?.dni ?? "");
  const [password, setPassword] = useState(() => loadSavedLogin()?.password ?? "");
  const [saveCredentials, setSaveCredentials] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { token, chofer } = await apiJson<ChoferLoginResponse>(
        "/api/auth/chofer-login",
        noAuth,
        {
          method: "POST",
          body: JSON.stringify({ dni, pin: password }),
        }
      );

      // Adapta la respuesta del backend al formato que ya consumen Index.tsx / NavBar.
      const [firstName, ...rest] = chofer.nombre.trim().split(" ");
      const userWithId = {
        id: chofer.id,
        name: firstName || chofer.nombre,
        lastName: rest.join(" "),
        dni: Number(chofer.dni) || 0,
        role: "CHOFER",
        empresaId: chofer.tenantId,
      };
      localStorage.setItem("user", JSON.stringify(userWithId));
      localStorage.setItem("vialtoToken", token);

      if (saveCredentials) {
        localStorage.setItem(
          LOGIN_SAVE_KEY,
          JSON.stringify({ dni, password } satisfies SavedLogin)
        );
      } else {
        localStorage.removeItem(LOGIN_SAVE_KEY);
      }

      toast.success(`Bienvenido, ${chofer.nombre}`);
      navigate("/inicio");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast.error("DNI o PIN incorrectos.");
      } else {
        console.error("Error al iniciar sesión:", error);
        toast.error("Ocurrió un error al intentar iniciar sesión.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <VialtoLogo variant="dark" showTagline className="mx-auto mb-4" />
        <p className="text-sm text-gray-300 mt-2">Ingresá tus datos para registrar las cargas</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
            required
          />
          <Input
            type="password"
            placeholder="PIN"
            value={password}
            maxLength={4}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-gray-300 focus:border-[#E8470A] focus:ring-[#E8470A]"
            required
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveCredentials"
              checked={saveCredentials}
              onCheckedChange={(checked) => setSaveCredentials(checked === true)}
            />
            <label
              htmlFor="saveCredentials"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Guardar mis datos
            </label>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#E8470A] hover:bg-[#FF6B2B] text-white transition-colors py-2"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Iniciar Sesión"}
          </Button>

        </form>
      </div>

      <div className="mt-8 text-center text-white/50 text-sm font-sans">
        <span>Vialto · Sistema de registro de combustible</span>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => navigate("/login-administrador")}
          className="text-white/20 text-xs hover:text-white/40 transition-colors"
        >
          Acceso administrador
        </button>
      </div>
    </div>
  );
};

export default Login;
