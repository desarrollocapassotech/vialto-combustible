## Arquitectura del proyecto

> **Este repo NO es código descartable.** Es una SPA (Vite + shadcn + Tailwind) para el cliente Bressan, en **migración parcial en curso** desde **Firebase** (Auth + Firestore + Storage) hacia el stack nuevo (el de `vialto-frontend`/`vialto-backend`), para convertirse en la **app mobile-first dedicada a choferes** de Vialto.
>
> **El flujo del rol `CHOFER` ya está migrado**: login (`POST /api/auth/chofer-login`, JWT propio vía `core/chofer-auth/` — los choferes no tienen cuenta Clerk) y alta/edición/baja de cargas de combustible (`lib/cargas.ts` → `modules/combustible/chofer-combustible.controller.ts` en `vialto-backend`) van contra la API del backend nuevo y quedan en Postgres, no en Firestore. Ver `Index.tsx` (`handleSubmit`/`handleDeleteLoad`, rama `userRole === "CHOFER"`).
>
> **Lo que sigue en Firestore** es el flujo `ADMIN`/`SUPER_ADMIN` dentro de este mismo repo — el código lo marca explícito (`Index.tsx`: `// ADMIN / SUPER_ADMIN: Firestore (pendiente de migración)`): alta/edición/baja de cargas hechas por un admin desde esta app, y toda la gestión de empresas/usuarios (`EmpresasManagement.tsx`, `UserManagement.tsx`, `RegisterEmpresa.tsx`, `EmpresaConfig.tsx`, `LoginAdmin.tsx`).
>
> El `CLAUDE.md` de `vialto-backend` sigue siendo la fuente de verdad del producto/roadmap general (incluida la arquitectura de `chofer-auth` y del módulo `combustible`). Este archivo documenta solo el estado y las reglas específicas de **este** repo mientras dura la migración.

---

## Qué es este repo hoy (estado actual, migración parcial)

App React (Vite + shadcn + Tailwind) donde los choferes registran cargas de combustible vía la API de `vialto-backend` (ya migrado, ver arriba) y los administradores gestionan choferes/empresas/cargas-propias vía Firebase (pendiente de migrar). Multi-empresa a nivel Firestore para lo que sigue ahí (colecciones `empresas`, `usuarios`, `cargas`, ver [MIGRACION.md](./MIGRACION.md)).

### Reglas absolutas mientras el repo siga en Firebase

1. **Todo dato multi-empresa filtra por `empresaId`** en las colecciones `usuarios` y `cargas` — el equivalente local al `tenantId` del stack nuevo, pero sin garantías de integridad referencial (Firestore, no Postgres).
2. **`SUPER_ADMIN`** es el único rol con `empresaId: null`; ve todas las empresas. El resto de roles queda acotado a la suya.
3. **Reglas de Firestore actuales permiten lectura/escritura amplia** — el control de acceso real ocurre en la app (`ProtectedRoute` + chequeo de rol), no en las reglas. Ver nota de seguridad en [MIGRACION.md](./MIGRACION.md). No asumir que las reglas de Firestore son una barrera de seguridad real al tocar este código.
4. **La config de Firebase está hardcodeada** en `src/firebase.js`, no en variables de entorno.

### Estructura actual

```txt
src/
  pages/        # Login (chofer, backend nuevo), LoginAdmin, Index (carga), gestión choferes/empresas, config de empresa
  components/   # NavBar, ProtectedRoute, formularios de carga, exportación, UI (shadcn)
  converters/   # Mapeo Firestore <-> tipos TS (empresaConverter, userConverter, loadConverter) — solo para lo que sigue en Firestore
  types/        # Empresa, Usuario, Carga
  hooks/        # useEmpresaLogo, use-toast, use-mobile
  lib/          # api.ts (cliente HTTP a vialto-backend), cargas.ts (alta/fotos/sync-errors del chofer), auth.ts, offlineQueue.ts/offlineSync.ts (cola offline del chofer), utils.ts
  firebase.js   # inicialización de Firebase (config hardcodeada) — usado por lo que sigue sin migrar
```

### Qué falta migrar

El flujo del chofer (login + CRUD de cargas, incluida la cola offline) ya está en el stack nuevo. Lo pendiente es el flujo `ADMIN`/`SUPER_ADMIN` de este mismo repo:

- Alta/edición/baja de cargas hechas por un admin desde `Index.tsx` (hoy Firestore directo).
- Gestión de empresas (`EmpresasManagement.tsx`, `RegisterEmpresa.tsx`, `EmpresaConfig.tsx`) y usuarios (`UserManagement.tsx`), y el login de admin (`LoginAdmin.tsx`).
- **Convenciones al migrar lo que falta:** seguir los patrones ya usados en el flujo del chofer (`lib/api.ts` centralizado, tipado en `types/`, componentes chicos por responsabilidad) en vez de mantener el estilo atado a Firestore.
- No romper el flujo Firestore actual mientras se migra: sigue siendo el camino real para admins hasta que se reemplace.

---

*Última actualización: julio 2026.*
