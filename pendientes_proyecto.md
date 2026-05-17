# 📋 Tareas Pendientes (Frontend y Backend)

A continuación se detalla la hoja de ruta con todo lo que queda pendiente para dejar el proyecto completamente funcional, robusto y libre de errores de compilación.

## 🎨 Frontend (React/Vite)

### 1. Migración de Mocks a GraphQL (Apollo Client)
Aún existen pantallas que dependen de variables "Mock" o funciones estáticas no definidas:
- **TaquillaPage.tsx:** Se hacen referencias a variables inexistentes como `MOCK_PENDIENTES` y `MOCK_RETIRO`. Se debe integrar completamente el hook `useParcels` y `useUpdateParcelStatus` para obtener y procesar datos reales.
- **BodegaPage.tsx:** Las funciones `handleAsignarBus` y `handleClasificar` no están declaradas. Se deben crear las respectivas *Mutations* en Apollo y conectarlas a los botones correspondientes.
- **CrearEnvioPage.tsx:** La variable `codigoGenerado` no está definida. Falta la lógica posterior al guardado exitoso de una encomienda para mostrar el tracking de manera dinámica.

### 2. Correcciones estrictas de TypeScript
La compilación estricta (`npm run build`) arroja varios errores que previenen la creación de una versión de producción de la aplicación:
- **Errores de Enum (`TS1294`):** El archivo `src/types/index.ts` usa Enums que son incompatibles con la configuración de compilación de Vite (`erasableSyntaxOnly`). Se deben cambiar los `enum` por Uniones de Strings (`type Rol = 'USUARIO' | 'ADMINISTRADOR'`) o por Objetos Constantes (`const Rol = { ... } as const;`).
- **Mapeo de Roles:** En `Sidebar.tsx` y `LoginPage.tsx`, los diccionarios de configuración exigen la clave `Rol.CLIENTE`, pero se está usando `Rol.USUARIO` (que no existe en el tipo `Rol`). Hay que estandarizar qué roles existirán.
- **Propiedad Faltante:** Se está intentando acceder a la propiedad `telefono` del objeto `Usuario` en múltiples páginas (`CrearEnvioPage.tsx`, `DevNavPage.tsx`), pero el tipo base `Usuario` no la incluye.
- **Variables no usadas:** Existen muchas variables declaradas pero no usadas (iconos de Lucide-React, variables de loading/error en múltiples vistas).

## ⚙️ Backend (NestJS / Supabase)

### 1. Completar Endpoints / Mutations de la Lógica de Negocio
Las pantallas de Bodega y Taquilla requieren operaciones específicas que deben estar respaldadas por su respectivo *resolver* en GraphQL:
- **Bodega:** Se necesitan mutaciones para `asignarBus` y `clasificarEncomienda`, asegurando que cambien el estatus de la base de datos a "EN_TRANSITO" o "CLASIFICANDO".
- **Taquilla:** Asegurarse de que el flujo de confirmación de retiro emita eventos (Subscriptions) o actualice el registro correctamente para que el frontend pueda re-hacer "fetch" de la lista limpia.

### 2. Consolidación de Autenticación
- Validar el esquema de la tabla de usuarios en **Supabase** para verificar si la columna de `telefono` o el `Rol = 'CLIENTE'` existen y están sincronizados con los enums que espera recibir el Frontend.
- Asegurarse de que el sistema RLS (*Row Level Security*) en Supabase esté permitiendo a los roles correctos actualizar los estados de las encomiendas (solo BODEGA o TAQUILLA deberían poder cambiar estados).

---

> **Recomendación para la siguiente sesión:** 
> Comenzar corrigiendo el archivo `src/types/index.ts` reemplazando los enums por objetos estáticos. Esto eliminará gran parte de los errores visuales en tu editor. Luego, podemos continuar integrando las queries faltantes en las páginas de Taquilla y Bodega.
