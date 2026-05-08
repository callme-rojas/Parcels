# 🔍 Análisis Tecnológico — Travell Encomiendas 2026 (Parcels)

## Arquitectura General

El proyecto es un **monorepo** con dos aplicaciones separadas:

```
Parcels/
├── backend/    → API GraphQL (NestJS)
├── frontend/   → SPA con mapa interactivo (React)
```

---

## 🖥️ Backend

| Categoría | Tecnología | Versión | Detalle |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | — | JavaScript runtime |
| **Framework** | NestJS | `^11.0.1` | Framework progresivo para Node.js |
| **Lenguaje** | TypeScript | `^5.7.3` | Strict mode habilitado (decorators, metadata) |
| **API** | GraphQL | `^16.13.2` | Enfoque **code-first** (auto-genera el schema) |
| **GraphQL Server** | Apollo Server | `^5.5.0` | Integrado vía `@nestjs/apollo` `^13.4.0` |
| **HTTP** | Express | `^5.0.0` | Plataforma subyacente (`@nestjs/platform-express`) |
| **UUID** | uuid | `^14.0.0` | Generación de IDs únicos |
| **Reactivity** | RxJS | `^7.8.1` | Programación reactiva (core de NestJS) |

### Herramientas de desarrollo (Backend)

| Herramienta | Versión | Uso |
|------------|---------|-----|
| NestJS CLI | `^11.0.0` | Generación de código y builds |
| Jest | `^30.0.0` | Testing unitario (con `ts-jest`) |
| Supertest | `^7.0.0` | Testing E2E de HTTP |
| ESLint | `^9.18.0` | Linting (con `typescript-eslint`) |
| Prettier | `^3.4.2` | Formateo de código |

### Patrones del Backend

- **Code-first GraphQL**: El schema se genera automáticamente desde decoradores TypeScript (`@ObjectType`, `@Field`, `@Resolver`, etc.)
- **Almacenamiento en memoria**: No hay base de datos conectada — los datos están hardcodeados en `parcels.service.ts` como un array en memoria
- **CORS habilitado**: Configurado para aceptar peticiones desde `http://localhost:5173`
- **GraphQL Playground**: Habilitado en `http://localhost:3000/graphql`

> [!IMPORTANT]
> **No hay base de datos real configurada.** El servicio usa un array in-memory con 3 paquetes de ejemplo. Cualquier dato se pierde al reiniciar el servidor.

---

## 🌐 Frontend

| Categoría | Tecnología | Versión | Detalle |
|-----------|-----------|---------|---------|
| **UI Library** | React | `^19.2.5` | Con `react-dom` `^19.2.5` |
| **Lenguaje** | JavaScript | ES Modules | Archivos `.jsx` |
| **Build Tool** | Vite | `^8.0.10` | Con `@vitejs/plugin-react` `^6.0.1` |
| **GraphQL Client** | Apollo Client | `^4.1.9` | Fetch policy: `cache-and-network` |
| **Mapas** | Mapbox GL JS | `^3.23.0` | Mapa interactivo con estilo `dark-v11` |
| **Routing** | React Router DOM | `^7.14.2` | Instalado pero **no utilizado** aún |
| **Estilos** | Vanilla CSS | — | Archivos `.css` por componente |

### Herramientas de desarrollo (Frontend)

| Herramienta | Versión | Uso |
|------------|---------|-----|
| ESLint | `^10.2.1` | Linting |
| eslint-plugin-react-hooks | `^7.1.1` | Reglas para hooks |
| eslint-plugin-react-refresh | `^0.5.2` | HMR seguro |

---

## 📁 Estructura de Archivos Detallada

### Backend (`backend/src/`)
```
src/
├── main.ts                          → Entry point, CORS, puerto 3000
├── app.module.ts                    → Módulo raíz, configura GraphQL (Apollo)
└── parcels/
    ├── parcels.module.ts            → Módulo de encomiendas
    ├── parcels.resolver.ts          → Resolver GraphQL (Queries + Mutations)
    ├── parcels.service.ts           → Lógica de negocio + datos in-memory
    ├── entities/
    │   └── parcel.entity.ts         → ObjectType GraphQL (Parcel + ParcelStatus enum)
    └── dto/
        ├── create-parcel.input.ts   → Input para crear encomiendas
        └── update-parcel-status.input.ts → Input para actualizar estado
```

### Frontend (`frontend/src/`)
```
src/
├── main.jsx                         → Entry point, ApolloProvider + StrictMode
├── App.jsx                          → Layout principal (header + sidebar + mapa)
├── index.css                        → Estilos globales
├── graphql/
│   ├── client.js                    → Configuración de Apollo Client
│   └── queries.js                   → Queries y Mutations GraphQL
└── components/
    ├── Map/
    │   ├── Map.jsx                  → Componente de mapa Mapbox con marcadores y rutas
    │   └── Map.css                  → Estilos del mapa
    └── ParcelList/
        ├── ParcelList.jsx           → Lista de encomiendas con estados
        └── ParcelList.css           → Estilos de la lista
```

---

## 🔌 API GraphQL — Operaciones Disponibles

### Queries
| Nombre | Descripción |
|--------|------------|
| `parcels` | Obtener todas las encomiendas |
| `parcel(id)` | Obtener una encomienda por ID |
| `parcelByTracking(trackingNumber)` | Buscar por número de tracking |

### Mutations
| Nombre | Descripción |
|--------|------------|
| `createParcel(input)` | Crear nueva encomienda |
| `updateParcelStatus(input)` | Actualizar estado (PENDING → IN_TRANSIT → DELIVERED) |
| `removeParcel(id)` | Eliminar encomienda |

---

## ⚙️ Variables de Entorno

### Backend (`backend/.env`)
| Variable | Valor |
|----------|-------|
| `PORT` | `3000` |
| `FRONTEND_URL` | `http://localhost:5173` |

### Frontend (`frontend/.env`)
| Variable | Valor |
|----------|-------|
| `VITE_GRAPHQL_URL` | `http://localhost:3000/graphql` |
| `VITE_MAPBOX_TOKEN` | `YOUR_MAPBOX_TOKEN_HERE` ⚠️ |

> [!WARNING]
> El token de Mapbox está sin configurar (`YOUR_MAPBOX_TOKEN_HERE`). El mapa no funcionará hasta que se configure un token válido.

---

## 📊 Resumen de Estado del Proyecto

| Aspecto | Estado |
|---------|--------|
| ✅ Backend funcional | API GraphQL operativa con datos de ejemplo |
| ✅ Frontend funcional | UI con lista + mapa interactivo |
| ✅ Comunicación Frontend ↔ Backend | Apollo Client conecta al servidor GraphQL |
| ⚠️ Base de datos | **No configurada** — datos en memoria |
| ⚠️ Mapbox token | **No configurado** — mapa no funciona |
| ⚠️ Autenticación | **No implementada** |
| ⚠️ React Router | Instalado pero **sin usar** |
| ⚠️ Testing | Configurado (Jest) pero sin tests reales visibles |

---

## 🛠️ Tecnologías NO Presentes (Posibles Próximos Pasos)

- **Base de datos**: No hay ORM (TypeORM, Prisma, etc.) ni conexión a PostgreSQL/Supabase
- **Autenticación/Autorización**: No hay auth, ni JWT, ni guards de NestJS
- **Validación**: No hay `class-validator` / `class-transformer` en el backend
- **Estado global frontend**: Solo `useState` local, sin Redux/Zustand
- **PWA / Service Workers**: No configurados
- **Docker**: No hay `Dockerfile` ni `docker-compose`
- **CI/CD**: No hay configuración de pipelines
