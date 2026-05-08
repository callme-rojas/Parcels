
# TRAVELL PARCELS — TASK LIST COMPLETA DE DESARROLLO
# Stack: NestJS + GraphQL + Prisma + PostgreSQL | React + TypeScript + Tailwind CSS | Monorepo

## FASE 0 — SETUP Y FUNDACIÓN (Semana 1 - Parte 1)

### INFRA-01: Configurar monorepo npm workspaces
- Agregar "workspaces": ["backend", "frontend"] en package.json raíz
- Crear script raíz: "dev:backend" y "dev:frontend"
- Crear .gitignore global
- Crear .env global con variables compartidas

### INFRA-02: Configurar Prisma en backend
- npm install prisma @prisma/client
- npx prisma init
- Configurar DATABASE_URL en backend/.env (PostgreSQL local)
- Verificar conexión con npx prisma db pull o migrate

### INFRA-03: Configurar GraphQL code-first en NestJS
- npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
- Configurar GraphQLModule en AppModule con autoSchemaFile
- Verificar playground en http://localhost:3000/graphql

### INFRA-04: Configurar frontend React + Vite + Tailwind
- npm create vite@latest frontend -- --template react-ts
- npm install tailwindcss @tailwindcss/vite (Tailwind v4)
- npm install @apollo/client graphql
- npm install react-router-dom
- Configurar vite.config.ts con proxy al backend

---

## FASE 1 — BASE DE DATOS: SCHEMA PRISMA COMPLETO

### DB-01: Modelos de usuarios e identidad
- Model Usuario (id, nombre, email, passwordHash, rol, activo, creadoEn)
- Enum Rol (ADMINISTRADOR, TAQUILLA, BODEGA, REMITENTE, DESTINATARIO)
- Model Sesion (id, usuarioId, token, expiresAt) — opcional para auditoría

### DB-02: Modelos de dominio principal
- Model Remitente (id, nombre, apellido, ci, telefono, email)
- Model Destinatario (id, nombre, apellido, ci, telefono, email)
- Model Oficina (id, nombre, ciudad, direccion, activa)
- Model Ruta (id, nombre, origenId, destinoId, activa)

### DB-03: Modelos de encomienda
- Model Encomienda (id, codigo, remitenteId, destinatarioId, rutaId, descripcion, peso, observaciones, estadoActual, creadoEn, actualizadoEn)
- Enum EstadoEncomienda (REGISTRADO, RECEPCIONADO, EN_TRANSITO, EN_DESTINO, DISPONIBLE, ENTREGADO, CANCELADO)
- Model EventoEstadoEncomienda (id, encomiendaId, estado, fechaHora, usuarioId, observacion)

### DB-04: Modelos de rastreo
- Model Bus (id, placa, modelo, activo)
- Model AsignacionBusRuta (id, busId, rutaId, fechaAsignacion)
- Model EventoTrackingBus (id, busId, latitud, longitud, timestamp, velocidad)
- Model AsignacionEncomiendaBus (id, encomiendaId, busId, fechaCarga, fechaDescarga)

### DB-05: Migraciones y seeds
- npx prisma migrate dev --name init
- Seed: crear usuario administrador por defecto
- Seed: crear rutas y oficinas de ejemplo (ej. Santa Cruz → La Paz)

---

## FASE 2 — BACKEND: AUTENTICACIÓN Y USUARIOS (Semana 1)

### BE-AUTH-01: Módulo de autenticación
- Instalar: @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
- Crear AuthModule, AuthService, AuthResolver
- Mutation login(email, password) → retorna accessToken + datos usuario
- Implementar hash de contraseña con bcrypt en creación de usuario
- Implementar JwtStrategy con validación del token

### BE-AUTH-02: Guards y decoradores
- Crear JwtAuthGuard (protege resolvers privados)
- Crear RolesGuard (valida rol del usuario autenticado)
- Crear decorador @Roles(...roles)
- Crear decorador @CurrentUser() para inyectar usuario en contexto GraphQL
- Query me() → retorna datos del usuario autenticado

### BE-AUTH-03: Módulo de usuarios
- Crear UsuarioModule, UsuarioService, UsuarioResolver
- Mutation crearUsuario(input) → solo accesible por ADMINISTRADOR
- Query listarUsuarios() → solo ADMINISTRADOR
- Mutation actualizarUsuario(id, input)
- Mutation desactivarUsuario(id)

---

## FASE 3 — BACKEND: ENCOMIENDAS (Semana 2)

### BE-ENC-01: Módulo de remitentes y destinatarios
- Crear RemitenteModule, DestinatarioModule
- Mutation crearRemitente(input), crearDestinatario(input)
- Query buscarRemitente(ci o email), buscarDestinatario(ci o email)

### BE-ENC-02: Mutation crearEncomienda
- Input: remitenteId o datos nuevos, destinatarioId o datos nuevos, rutaId, descripcion, peso, observaciones
- Generar código único alfanumérico (ej. TRV-2025-XXXXX)
- Crear primer EventoEstadoEncomienda con estado REGISTRADO
- Accesible por TAQUILLA o REMITENTE autenticado

### BE-ENC-03: Queries de encomienda
- Query obtenerEncomienda(id) → datos completos + estado actual
- Query obtenerEncomiendaPorCodigo(codigo) → pública sin auth
- Query listarEncomiendas(filtros: estado, ruta, fecha, remitente) → paginado

### BE-ENC-04: Mutation actualizarEstadoEncomienda
- Input: encomiendaId, nuevoEstado, observacion
- Validar transición de estado permitida
- Crear EventoEstadoEncomienda con fecha, hora y usuario responsable
- Accesible por TAQUILLA y BODEGA según el estado

### BE-ENC-05: Query historialEncomienda
- Retorna todos los EventoEstadoEncomienda de una encomienda ordenados por fecha
- Pública para consulta de seguimiento por código

---

## FASE 4 — BACKEND: ETIQUETA PDF417 (Semana 3)

### BE-ETI-01: Instalar y configurar bwip-js
- npm install bwip-js
- Crear EtiquetaModule, EtiquetaService

### BE-ETI-02: Query generarEtiqueta(encomiendaId)
- Generar código PDF417 con datos: código encomienda, remitente, destinatario, destino
- Retornar imagen como string base64 (PNG)
- Accesible por REMITENTE autenticado y TAQUILLA

### BE-ETI-03: Datos embebidos en el PDF417
- Código único de encomienda
- Ciudad origen y destino
- Nombre del destinatario
- Fecha de registro

---

## FASE 5 — BACKEND: RASTREO SIMULADO Y BUS (Semana 3-4)

### BE-RAS-01: Módulo de buses y rutas
- Mutation crearBus(placa, modelo)
- Mutation asignarBusARuta(busId, rutaId)
- Mutation asignarEncomiendaABus(encomiendaId, busId) → BODEGA
- Mutation registrarCargaEncomienda(encomiendaId, busId)
- Mutation registrarDescargaEncomienda(encomiendaId, busId)

### BE-RAS-02: Simulación de coordenadas GPS
- Mutation registrarCoordenadaBus(busId, latitud, longitud, velocidad)
- Query ultimaUbicacionBus(busId) → último EventoTrackingBus
- Query ubicacionBusPorEncomienda(encomiendaId) → encuentra el bus y retorna su última coordenada

### BE-RAS-03: Datos de prueba de rastreo
- Seed con ruta simulada Santa Cruz → Cochabamba con coordenadas reales del trayecto
- Script que inserta eventos de tracking cada X segundos (simulación)

---

## FASE 6 — BACKEND: RETIRO Y CIERRE (Semana 4)

### BE-RET-01: Mutation confirmarRetiro
- Input: encomiendaId, datosVerificacionDestinatario (ci o nombre)
- Validar que estado sea DISPONIBLE
- Validar que los datos del destinatario coincidan
- Actualizar estado a ENTREGADO
- Crear EventoEstadoEncomienda final con usuario TAQUILLA responsable
- Accesible solo por TAQUILLA

---

## FASE 7 — BACKEND: REPORTES Y PANEL ADMIN (Semana 5)

### BE-REP-01: Query reporteEncomiendas
- Filtros: rutaId, fechaDesde, fechaHasta, estado
- Retorna lista paginada con totales

### BE-REP-02: Query indicadoresOperativos
- Total encomiendas registradas (período)
- Total entregadas, en tránsito, disponibles, canceladas
- Tasa de entrega exitosa (%)
- Encomiendas por ruta (top rutas)

### BE-REP-03: Query resumenDashboard
- KPIs del día actual: registradas hoy, entregadas hoy, en tránsito
- Últimas 5 encomiendas registradas

---

## FASE 8 — FRONTEND: LAYOUT, AUTH Y ROUTING (Semana 1)

### FE-LAY-01: Estructura base del proyecto
- Configurar React Router con rutas anidadas
- Layout principal: Sidebar + Header + área de contenido
- Sidebar con navegación dinámica según rol del usuario
- Página 404 y página de acceso denegado

### FE-AUTH-01: Pantalla de Login
- Formulario: email + contraseña
- Llamada a mutation login GraphQL
- Guardar JWT en memoria (Context API o Zustand)
- Redirección automática según rol después del login
- Manejo de error de credenciales inválidas

### FE-AUTH-02: Contexto de autenticación
- AuthContext con: usuario actual, token, login(), logout()
- HOC o hook useAuth() para acceder al contexto
- Rutas protegidas: redirigen a /login si no hay sesión
- Rutas por rol: redirigen a /unauthorized si el rol no tiene acceso

---

## FASE 9 — FRONTEND: REGISTRO DE ENCOMIENDA (Semana 2)

### FE-ENC-01: Formulario de registro de encomienda
- Sección datos del remitente (buscar por CI o crear nuevo)
- Sección datos del destinatario (buscar por CI o crear nuevo)
- Sección datos de la encomienda: descripción, peso, observaciones, ruta/destino
- Validaciones en cliente (campos requeridos, formatos)
- Submit → mutation crearEncomienda

### FE-ENC-02: Feedback post-registro
- Toast de confirmación con código generado
- Botón directo a "Ver etiqueta" después del registro
- Manejo de errores del servidor

### FE-ENC-03: Listado de encomiendas
- Tabla con columnas: Código, Remitente, Destinatario, Destino, Estado, Fecha
- Filtros: por estado, por fecha, por ruta
- Paginación
- Click en fila → detalle de encomienda

### FE-ENC-04: Vista de detalle de encomienda
- Datos completos del envío
- Estado actual destacado visualmente
- Timeline / stepper del historial de estados
- Botón de acción según estado actual (actualizar estado, confirmar retiro, etc.)

---

## FASE 10 — FRONTEND: ETIQUETA PDF417 (Semana 3)

### FE-ETI-01: Vista de etiqueta imprimible
- Llamada a query generarEtiqueta(encomiendaId)
- Renderizar imagen base64 del PDF417 en pantalla
- Diseño de etiqueta: logo, código, datos del envío, código de barras
- Botón imprimir: usar window.print() con estilos CSS @media print
- Ocultar UI del sistema en impresión, mostrar solo etiqueta

---

## FASE 11 — FRONTEND: PANEL DE TAQUILLA (Semana 3)

### FE-TAQ-01: Módulo de recepción de encomienda
- Buscar encomienda por código (input + botón buscar)
- Mostrar datos del envío recuperado
- Botón "Recepcionar en origen" → actualiza estado a RECEPCIONADO

### FE-TAQ-02: Módulo de actualización de estado
- Dropdown con estados válidos según transición actual
- Confirmación con modal antes de actualizar
- Feedback visual del nuevo estado

### FE-TAQ-03: Módulo de confirmación de retiro
- Buscar encomienda por código
- Mostrar datos del destinatario registrado
- Campo para verificar CI del destinatario
- Botón confirmar retiro → mutation confirmarRetiro
- Confirmación visual y cierre del caso

---

## FASE 12 — FRONTEND: PANEL DE BODEGA (Semana 3-4)

### FE-BOD-01: Listado de encomiendas para clasificar
- Encomiendas en estado RECEPCIONADO asignadas a la oficina del usuario
- Botón "Clasificar" → actualiza estado

### FE-BOD-02: Asociación a bus
- Selector de bus disponible para la ruta
- Botón "Asignar a bus" → mutation asignarEncomiendaABus
- Confirmación visual

### FE-BOD-03: Registro de carga y descarga
- Lista de encomiendas asociadas al bus
- Botón "Registrar carga" → estado EN_TRANSITO
- Botón "Registrar descarga" → estado EN_DESTINO

---

## FASE 13 — FRONTEND: SEGUIMIENTO PÚBLICO (Semana 4)

### FE-SEG-01: Página pública de rastreo (sin login)
- Input para ingresar código de encomienda
- Mostrar: estado actual, historial de estados con fechas, datos básicos del envío
- Indicador visual de estado (íconos o colores)
- No requiere autenticación

### FE-SEG-02: Visualización de mapa con Mapbox GL JS
- Obtener token gratuito en mapbox.com
- Instalar mapbox-gl
- Mostrar marcador con última ubicación del bus asociado
- Si no hay datos de ubicación, mostrar mensaje informativo

### FE-SEG-03: Vista del destinatario
- Estado claro: "En tránsito / Disponible para retiro / Entregado"
- Indicación de oficina de destino donde retirar
- Visualización amigable para usuarios no técnicos

---

## FASE 14 — FRONTEND: PANEL DE ADMINISTRADOR (Semana 4-5)

### FE-ADM-01: Dashboard con KPIs
- Tarjetas: Total registradas, En tránsito, Disponibles para retiro, Entregadas hoy
- Últimas 5 encomiendas registradas
- Llamada a query resumenDashboard

### FE-ADM-02: Módulo de reportes
- Tabla filtrable: ruta, fecha desde/hasta, estado
- Totales y subtotales
- Exportar a CSV (opcional, semana 5)

### FE-ADM-03: Supervisión de indicadores
- Tasa de entrega exitosa
- Encomiendas por ruta (listado o tabla)
- Encomiendas pendientes más antiguas (alertas)

### FE-ADM-04: Gestión de usuarios
- Listado de usuarios del sistema
- Crear usuario con rol
- Activar/desactivar usuario

---

## FASE 15 — CIERRE Y PULIDO (Semana 5)

### QA-01: Prueba de flujo completo end-to-end
- Recorrer ciclo: Registro → Etiqueta → Recepción → Bodega → Bus → Tránsito → Destino → Retiro
- Verificar consistencia de estados en cada paso
- Verificar que la consulta pública refleje cada cambio en tiempo real

### QA-02: Revisión de UI y UX
- Consistencia de estilos Tailwind en todos los módulos
- Responsividad básica en las vistas principales
- Mensajes de error claros en todos los formularios

### QA-03: Seguridad básica
- Verificar que todos los resolvers privados tengan JwtAuthGuard
- Verificar que los resolvers de rol específico tengan RolesGuard
- No exponer datos sensibles en queries públicas

### QA-04: Variables de entorno y configuración final
- Revisar todos los .env de backend y frontend
- Asegurarse que el frontend apunte al endpoint correcto del backend
- Verificar que Prisma conecte correctamente a PostgreSQL local
