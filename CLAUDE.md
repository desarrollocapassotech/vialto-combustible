## Arquitectura del proyecto

> **Este repo NO es código descartable.** Hoy es una SPA standalone sobre **Firebase** (Auth + Firestore + Storage) para el cliente Bressan, sin Clerk ni Prisma — eso sí es legacy. Pero la dirección del proyecto es **migrar este mismo repo al stack nuevo** (el de `vialto-frontend`/`vialto-backend`), para que se convierta en la **app mobile-first dedicada a choferes** de Vialto: login y operaciones vía la API de `vialto-backend` en vez de Firebase directo.
>
> El backend ya tiene la mitad de esa integración construida y esperando: `core/chofer-auth/` (login por DNI+PIN, JWT propio — los choferes no tienen cuenta Clerk) y `modules/combustible/chofer-combustible.controller.ts` (API de cargas de combustible gateada por ese JWT, paralela a la que usa el resto del SaaS). Cualquier trabajo de migración de este repo apunta a consumir esos endpoints, no a reinventar una API propia.
>
> El `CLAUDE.md` de `vialto-backend` sigue siendo la fuente de verdad del producto/roadmap general (incluida la arquitectura de `chofer-auth` y del módulo `combustible`). Este archivo documenta solo el estado y las reglas específicas de **este** repo mientras dura la migración.

---

## Qué es este repo hoy (estado actual, pre-migración)

App React (Vite + shadcn + Tailwind) que permite a choferes registrar cargas de combustible y a administradores gestionar choferes/empresas, con Firebase como único backend (sin API propia salvo el script `create-superadmin`). Es multi-empresa a nivel Firestore (colecciones `empresas`, `usuarios`, `cargas`, ver [MIGRACION.md](./MIGRACION.md)).

### Reglas absolutas mientras el repo siga en Firebase

1. **Todo dato multi-empresa filtra por `empresaId`** en las colecciones `usuarios` y `cargas` — el equivalente local al `tenantId` del stack nuevo, pero sin garantías de integridad referencial (Firestore, no Postgres).
2. **`SUPER_ADMIN`** es el único rol con `empresaId: null`; ve todas las empresas. El resto de roles queda acotado a la suya.
3. **Reglas de Firestore actuales permiten lectura/escritura amplia** — el control de acceso real ocurre en la app (`ProtectedRoute` + chequeo de rol), no en las reglas. Ver nota de seguridad en [MIGRACION.md](./MIGRACION.md). No asumir que las reglas de Firestore son una barrera de seguridad real al tocar este código.
4. **La config de Firebase está hardcodeada** en `src/firebase.js`, no en variables de entorno.

### Estructura actual

```txt
src/
  pages/        # Login, LoginAdmin, Index (carga), gestión choferes/empresas, config de empresa
  components/   # NavBar, ProtectedRoute, formularios de carga, exportación, UI (shadcn)
  converters/   # Mapeo Firestore <-> tipos TS (empresaConverter, userConverter, loadConverter)
  types/        # Empresa, Usuario, Carga
  hooks/        # useEmpresaLogo, use-toast, use-mobile
  lib/          # api.ts, utils.ts
  firebase.js   # inicialización de Firebase (config hardcodeada)
```

### Hacia dónde va (migración al stack nuevo)

- **Destino:** app mobile-first dedicada a choferes, consumiendo `vialto-backend` en vez de Firebase directo.
- **Auth:** login DNI+PIN vía `POST auth/chofer-login` (`core/chofer-auth`), JWT propio — no Clerk, porque los choferes no son usuarios de organización.
- **Datos:** cargas de combustible vía `chofer-combustible.controller.ts`, ya implementado y activo en el backend, pensado justo para este caso de uso.
- **Convenciones de código:** al migrar componentes/páginas, seguir los patrones de `vialto-frontend` (capa `lib/api.ts` centralizada, tipado en `types/`, componentes chicos por responsabilidad) en vez de mantener el estilo actual atado a Firestore.
- Este repo sigue siendo el sistema en producción para Bressan hasta que la migración esté lista — no romper el flujo actual mientras se construye el nuevo.

---

*Última actualización: julio 2026.*
