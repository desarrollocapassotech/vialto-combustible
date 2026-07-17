# Vialto Combustible

App de control de carga de combustible para el cliente Bressan. **Hoy** es una SPA standalone sobre **Firebase** (Auth + Firestore + Storage), sin relación de código con el backend NestJS/Prisma ni con Clerk — eso es lo legacy. Lo que **no** es legacy es el repo en sí: la dirección del proyecto es migrarlo al mismo stack que `vialto-frontend` para que se convierta en la **app mobile-first dedicada a choferes** de Vialto.

> El backend ya expone lo necesario para esa migración: `core/chofer-auth` (login DNI+PIN, JWT propio para choferes, sin Clerk) y `modules/combustible/chofer-combustible.controller.ts` (API de cargas de combustible gateada por ese JWT). Ver `CLAUDE.md` de este repo y de `vialto-backend` para el detalle.

---

## Stack

- React 18 + TypeScript + Vite 5
- shadcn-ui (Radix) + Tailwind CSS
- Firebase: Authentication (email/password), Firestore, Storage
- React Query, React Hook Form + Zod
- Despliegue: **Firebase Hosting**

## Requisitos

- Node.js 18+ (o Bun, hay `bun.lockb`)
- Acceso al proyecto de Firebase `registro-combustible-logistica` (o uno propio para desarrollo)

## Instalación

```bash
npm install
# o: bun install
```

La configuración de Firebase está **hardcodeada** en [`src/firebase.js`](./src/firebase.js) (no usa variables de entorno). Para apuntar a otro proyecto de Firebase, editar ese archivo con las credenciales del proyecto correspondiente.

## Scripts

- `npm run dev` — entorno local con Vite.
- `npm run build` — build de producción.
- `npm run build:dev` — build en modo desarrollo.
- `npm run lint` — ESLint.
- `npm run preview` — sirve el build localmente.
- `npm run create-superadmin` — crea el primer usuario `SUPER_ADMIN` en Firestore usando `serviceAccountKey.json` (ver [MIGRACION.md](./MIGRACION.md)).

## Modelo de datos (Firestore)

Multi-empresa desde la migración documentada en [MIGRACION.md](./MIGRACION.md):

- **`empresas`** — `cuit`, `nombre`, `razonSocial`, `telefono`, `createdAt`, `createdBy`.
- **`usuarios`** — `name`, `lastName`, `dni`, `role` (`SUPER_ADMIN` | admin | chofer), `empresaId` (`null` solo para `SUPER_ADMIN`), credenciales según rol (`email` para admins, `patente`/`pass` para choferes creados por un admin).
- **`cargas`** — registro de carga de combustible, incluye `empresaId`.

Los conversores Firestore ↔ tipos TS están en `src/converters/` (`empresaConverter`, `userConverter`, `loadConverter`).

> **Nota de seguridad** (ver `MIGRACION.md`): las reglas de Firestore actuales permiten lectura/escritura sin depender de reglas estrictas por rol; el control de acceso se hace en la app (`ProtectedRoute`). Cualquiera con acceso a la consola de Firebase del proyecto podría ver o modificar datos.

## Estructura del proyecto

```txt
src/
  pages/        # Login, LoginAdmin, Index (carga), gestión de choferes/empresas, config de empresa
  components/   # NavBar, ProtectedRoute, formularios de carga, exportación, UI (shadcn)
  converters/   # Mapeo Firestore <-> tipos TS
  types/        # Empresa, Usuario, Carga
  hooks/        # useEmpresaLogo, use-toast, use-mobile
  lib/          # api.ts, utils.ts
  firebase.js   # inicialización de Firebase (config hardcodeada)
```

## Roles y rutas principales

- `/login` — login de chofer (patente + contraseña).
- `/login-administrador` — login de admin/super admin (email + contraseña).
- `/inicio` — registro y listado de cargas (ruta protegida).
- `/admin/choferes`, `/admin/usuarios` — gestión de choferes/usuarios por empresa.
- Panel de **super admin** — gestión de empresas (`EmpresasManagement`, `EmpresaConfig`), ve todas las empresas; el resto de roles queda acotado a su `empresaId`.

## Despliegue

Firebase Hosting, proyecto `registro-combustible-logistica` (ver [`.firebaserc`](./.firebaserc) y [`firebase.json`](./firebase.json)):

```bash
npm run build
firebase deploy --only hosting
```

Reglas e índices de Firestore:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Migración al stack nuevo

Este repo va camino a dejar de hablarle a Firebase directo y pasar a consumir la API de `vialto-backend`, como app mobile-first para choferes:

- **Auth:** `POST auth/chofer-login` (DNI + PIN) en vez de Firebase Authentication.
- **Datos:** `chofer-combustible.controller.ts` del backend en vez de leer/escribir Firestore directo.
- **Convenciones de código:** alinear con `vialto-frontend` (capa `lib/api.ts` centralizada, tipado en `types/`) a medida que se migra cada pantalla.

Mientras dure la migración, este repo sigue siendo el sistema en producción para Bressan — no romper el flujo actual.

## Documentación adicional

- [MIGRACION.md](./MIGRACION.md) — estructura de datos multi-empresa (Firestore) y creación del primer super admin.
- [CLAUDE.md](./CLAUDE.md) — reglas y estado específicos de este repo, más el plan de migración.

---

*Última actualización del README: julio 2026.*
