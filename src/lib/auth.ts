/**
 * Punto único de salida de sesión de la app.
 *
 * Existen dos mecanismos de auth conviviendo (Firebase para admins,
 * JWT propio en `vialtoToken` para choferes) y varias claves de sesión que
 * deben limpiarse siempre juntas. Antes cada pantalla las borraba a mano y
 * terminaron desincronizándose (el logout del NavBar nunca borraba
 * `vialtoToken`, dejando al usuario sin poder volver a loguearse). Centralizar
 * el logout acá evita que ese tipo de inconsistencia vuelva a aparecer.
 */
import { auth } from "@/firebase";

const USER_KEY = "user";
const TOKEN_KEY = "vialtoToken";
const SUPER_ADMIN_EMPRESA_KEY = "superAdminEmpresaId";
const SUPER_ADMIN_EMPRESA_NOMBRE_KEY = "superAdminEmpresaNombre";

export async function logout(): Promise<void> {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error al cerrar sesión en Firebase:", error);
  }
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SUPER_ADMIN_EMPRESA_KEY);
  sessionStorage.removeItem(SUPER_ADMIN_EMPRESA_NOMBRE_KEY);
}
