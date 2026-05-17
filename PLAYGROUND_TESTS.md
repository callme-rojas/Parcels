# Pruebas GraphQL — Playground

Manual de pruebas en **http://localhost:3000/graphql** (backend en `npm run start:dev`).

> **Para el equipo de frontend:** este archivo es la referencia del avance del **backend**. Cada fase incluye operaciones GraphQL listas para copiar, roles requeridos y datos seed. Conectar Apollo Client usando las mismas operaciones y tipos que aparecen aquí.

---

## Índice de fases (backend)

| Fase | Tema | Estado | Operaciones principales |
|------|------|--------|-------------------------|
| 1 | Auth, usuarios, encomiendas base | ✅ | `login`, `me`, `registerCliente`, `crearUsuario`, `createParcel`, `createParcelAuth`, `parcels`, `parcel`, `parcelByTracking`, `updateParcelStatus`, `confirmarRetiro` |
| 2 | Bodega (flujo operativo) | ✅ | `clasificarEncomienda`, `asignarBus`, `registrarCarga`, `registrarDescarga`, `marcarDisponible` |
| 3 | Buses y asignación real | ✅ | `buses`, `busesDisponibles`, `bus`, `asignarEncomiendaABus`, `crearBus`, `registrarCoordenadaBus`, `ultimaUbicacionBus`, `ubicacionBusPorEncomienda` |
| 4 | Reportes / Admin | ✅ | `resumenDashboard`, `indicadoresOperativos`, `reporteEncomiendas` |

### Roles GraphQL (`Rol`)

| Valor | Uso |
|-------|-----|
| `ADMINISTRADOR` | Dashboard, reportes, `crearUsuario`, `crearBus` |
| `TAQUILLA` | Recepción, `confirmarRetiro`, listados |
| `BODEGA` | Clasificar, asignar bus, carga/descarga |
| `CLIENTE` | `createParcelAuth`, `me`, registro público |

### Rutas disponibles (`routeCode`)

`SCZ-PQA`, `SCZ-SJC`, `SCZ-ROB`, `PQA-SCZ` — usadas en `createParcel`, filtros y validación de bus.

### Pantallas FE → queries sugeridas

| Ruta FE | Query / mutation backend |
|---------|--------------------------|
| `/dashboard` | `resumenDashboard` |
| `/reportes` | `indicadoresOperativos`, `reporteEncomiendas` |
| `/taquilla` | `parcels`, `updateParcelStatus`, `confirmarRetiro` |
| `/bodega` | `parcels`, `busesDisponibles`, `asignarEncomiendaABus`, `registrarCarga`, … |
| `/mis-envios` | `parcels` (filtro por usuario cuando se implemente) |
| Rastreo público | `parcelByTracking`, `ubicacionBusPorEncomienda` |

---

## Setup

```bash
cd backend
npm run start:dev
```

### Headers (cuando requiera auth)

Pestaña **Headers**:

```json
{
  "Authorization": "Bearer TU_TOKEN_AQUI"
}
```

Reemplaza `TU_TOKEN_AQUI` con el `accessToken` devuelto por `login`.

### Credenciales seed

| Rol | Email | Password |
|-----|-------|----------|
| ADMINISTRADOR | admin@travell.test | admin123 |
| TAQUILLA | taquilla@travell.test | taquilla123 |
| BODEGA | bodega@travell.test | bodega123 |
| CLIENTE | cliente@travell.test | cliente123 |

### Encomiendas seed (referencia)

| trackingNumber | status | recipientCi |
|----------------|--------|-------------|
| EX-2026-SCZ-0048217 | EN_TRANSITO | 7345678SC |
| EX-2026-SCZ-0048218 | RECEPCIONADO | 4321098SC |
| EX-2026-SCZ-0048219 | REGISTRADO | 6789012SC |
| EX-2026-PQA-0012340 | DISPONIBLE | 3456789SC |
| EX-2026-SCZ-0048220 | ENTREGADO | 9012345SC |
| EX-2026-SCZ-0048221 | EN_DESTINO | 5432109SC |

---

## FASE 1 — Auth, usuarios, encomiendas base

> Objetivo: `telefono` en usuario, login/me, registro, crear envío público/autenticado, filtros Taquilla, confirmar retiro.

### Checklist Fase 1

| # | Prueba | OK | Notas |
|---|--------|----|-------|
| 1 | Login devuelve `telefono` | ☐ | |
| 2 | `me` con token | ☐ | |
| 3 | `registerCliente` con `telefono` | ☐ | |
| 4 | `createParcel` sin auth | ☐ | |
| 5 | `createParcelAuth` con cliente | ☐ | |
| 6 | `parcelByTracking` público | ☐ | |
| 7 | `parcels` filtro REGISTRADO / DISPONIBLE | ☐ | |
| 8 | `confirmarRetiro` CI correcto / incorrecto | ☐ | |
| 9 | Cliente no puede `updateParcelStatus` (403) | ☐ | |
| 10 | Admin `crearUsuario` staff | ☐ | |

---

### 1.1 Login (todos los roles)

**Auth:** ninguna

**Mutation:**

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    user {
      id
      nombre
      email
      telefono
      rol
      activo
    }
  }
}
```

**Variables (cliente):**

```json
{
  "input": {
    "email": "cliente@travell.test",
    "password": "cliente123"
  }
}
```

Repetir con: `admin@travell.test`, `taquilla@travell.test`, `bodega@travell.test`.

**Esperado:** `accessToken` + `user.telefono` (ej. cliente `+591 77123456`).

---

### 1.2 Query `me`

**Auth:** Bearer token de cualquier login

**Query:**

```graphql
query {
  me {
    id
    nombre
    email
    telefono
    rol
    activo
  }
}
```

**Esperado:** datos del usuario del token.

---

### 1.3 `registerCliente` con teléfono

**Auth:** ninguna

**Mutation:**

```graphql
mutation Register($input: RegisterClienteInput!) {
  registerCliente(input: $input) {
    accessToken
    user {
      id
      nombre
      email
      telefono
      rol
    }
  }
}
```

**Variables** (usar email nuevo cada vez):

```json
{
  "input": {
    "nombre": "Usuario Nuevo",
    "email": "nuevo.cliente@travell.test",
    "password": "nuevo123",
    "telefono": "+591 79998877"
  }
}
```

**Esperado:** `rol: CLIENTE`, `telefono` guardado.

---

### 1.4 Crear envío público (`createParcel`)

**Auth:** ninguna

**Mutation:**

```graphql
mutation CreateParcel($input: CreateParcelInput!) {
  createParcel(input: $input) {
    id
    trackingNumber
    senderName
    recipientName
    routeCode
    status
    createdAt
  }
}
```

**Variables:**

```json
{
  "input": {
    "senderName": "Rosa Mendez",
    "senderCi": "9102778SC",
    "senderPhone": "+591 77123456",
    "senderEmail": "rosa@email.com",
    "recipientName": "Juan Rojas",
    "recipientCi": "7345678SC",
    "recipientPhone": "+591 71234567",
    "recipientEmail": "jrojas@email.com",
    "content": "Repuestos",
    "weight": 3.2,
    "routeCode": "SCZ-PQA",
    "observations": "Fragil"
  }
}
```

**Esperado:** `status: REGISTRADO`, `trackingNumber` tipo `EX-2026-SCZ-...`.

**Guardar:** `id` y `trackingNumber` para pruebas siguientes.

---

### 1.5 Crear envío autenticado (`createParcelAuth`)

**Auth:** token de `cliente@travell.test`

**Mutation:**

```graphql
mutation CreateAuth($input: CreateParcelInput!) {
  createParcelAuth(input: $input) {
    id
    trackingNumber
    status
    events {
      status
      note
      usuarioId
    }
  }
}
```

**Variables:** mismos campos que 1.4 (otro email/CI si se desea).

**Esperado:** evento inicial con `usuarioId` del cliente logueado.

---

### 1.6 Rastreo público (`parcelByTracking`)

**Auth:** ninguna

**Query:**

```graphql
query {
  parcelByTracking(trackingNumber: "EX-2026-SCZ-0048217") {
    trackingNumber
    status
    senderName
    recipientName
    routeCode
    events {
      status
      note
      createdAt
    }
  }
}
```

**Esperado:** encomienda seed `EN_TRANSITO`.

---

### 1.7 Listar por estado (`parcels`)

**Auth:** token `taquilla@travell.test`

**REGISTRADOS:**

```graphql
query {
  parcels(filter: { status: REGISTRADO }) {
    id
    trackingNumber
    status
    senderName
    recipientName
  }
}
```

**Esperado:** incluye `EX-2026-SCZ-0048219`.

**DISPONIBLES (retiro):**

```graphql
query {
  parcels(filter: { status: DISPONIBLE }) {
    id
    trackingNumber
    recipientCi
    recipientName
    status
  }
}
```

**Esperado:** incluye `EX-2026-PQA-0012340`, `recipientCi: "3456789SC"`.

---

### 1.8 Actualizar estado (`updateParcelStatus`)

**Auth:** token taquilla o bodega

**Mutation:**

```graphql
mutation UpdateStatus($input: UpdateParcelStatusInput!) {
  updateParcelStatus(input: $input) {
    id
    trackingNumber
    status
    events {
      status
      note
    }
  }
}
```

**Variables (ejemplo recepcionar):**

```json
{
  "input": {
    "id": "PEGAR_UUID_AQUI",
    "status": "RECEPCIONADO",
    "note": "Recibido en taquilla SCZ"
  }
}
```

**Transiciones válidas:**

```
REGISTRADO     → RECEPCIONADO, CANCELADO
RECEPCIONADO   → EN_TRANSITO, CANCELADO
EN_TRANSITO    → EN_DESTINO, CANCELADO
EN_DESTINO     → DISPONIBLE
DISPONIBLE     → ENTREGADO (o usar confirmarRetiro)
```

---

### 1.9 Confirmar retiro (`confirmarRetiro`)

**Auth:** token taquilla

**Mutation:**

```graphql
mutation ConfirmarRetiro($input: ConfirmarRetiroInput!) {
  confirmarRetiro(input: $input) {
    id
    trackingNumber
    status
    deliveredAt
    recipientCi
  }
}
```

**Variables (seed — CI correcto):**

```json
{
  "input": {
    "parcelId": "PEGAR_UUID_DE_EX-2026-PQA-0012340",
    "recipientCi": "3456789SC"
  }
}
```

**Esperado:** `status: ENTREGADO`, `deliveredAt` con fecha.

**Variables (CI incorrecto — debe fallar):**

```json
{
  "input": {
    "parcelId": "MISMO_UUID",
    "recipientCi": "0000000XX"
  }
}
```

**Esperado:** error — CI no coincide.

---

### 1.10 Rol incorrecto (403)

**Auth:** token cliente

**Mutation:**

```graphql
mutation {
  updateParcelStatus(input: {
    id: "cualquier-uuid-valido-o-del-seed",
    status: RECEPCIONADO
  }) {
    id
  }
}
```

**Esperado:** `Forbidden` — cliente no puede cambiar estados.

---

### 1.11 Admin crea usuario staff (`crearUsuario`)

**Auth:** token admin

**Mutation:**

```graphql
mutation CrearUsuario($input: CrearUsuarioInput!) {
  crearUsuario(input: $input) {
    id
    nombre
    email
    telefono
    rol
  }
}
```

**Variables:**

```json
{
  "input": {
    "nombre": "Taquilla 2",
    "email": "taquilla2@travell.test",
    "password": "taquilla123",
    "telefono": "+591 71112233",
    "rol": "TAQUILLA"
  }
}
```

**Esperado:** usuario creado con rol `TAQUILLA`.

**Nota:** `crearUsuario` con `rol: CLIENTE` debe fallar — usar `registerCliente`.

---

## FASE 2 — Bodega (mutations dedicadas)

> Objetivo: flujo operativo de bodega con mutations específicas, asignación de bus (MVP estático) y campos `assignedBusPlaca` / `assignedBusFlota` en la encomienda.

**Auth habitual:** login `bodega@travell.test` / `bodega123` → Bearer en Headers.

**Encomienda recomendada para flujo completo:** `EX-2026-SCZ-0048218` (`RECEPCIONADO`, ruta `SCZ-PQA`).

### Checklist Fase 2

| # | Prueba | OK | Notas |
|---|--------|----|-------|
| 1 | Login bodega | ☐ | |
| 2 | `busesDisponibles` (todos / filtro ruta) | ☐ | |
| 3 | Obtener `parcelId` por tracking | ☐ | |
| 4 | `clasificarEncomienda` | ☐ | Sigue en RECEPCIONADO + evento |
| 5 | `asignarBus` | ☐ | Placa/flota en parcel + evento |
| 6 | `registrarCarga` → EN_TRANSITO | ☐ | |
| 7 | `registrarDescarga` (otra encomienda) | ☐ | Usar `EX-2026-SCZ-0048217` |
| 8 | `marcarDisponible` | ☐ | Usar `EX-2026-SCZ-0048221` |
| 9 | Estado inválido (error) | ☐ | ej. clasificar en REGISTRADO |
| 10 | Cliente sin permiso (403) | ☐ | |

---

### 2.1 Login bodega

Igual que **1.1**, con:

```json
{
  "input": {
    "email": "bodega@travell.test",
    "password": "bodega123"
  }
}
```

Guardar `accessToken` para el resto de la fase.

---

### 2.2 Query `busesDisponibles`

**Auth:** Bearer bodega (o admin)

**Query (todos):**

```graphql
query {
  busesDisponibles {
    id
    placa
    flota
    routeCode
    routeLabel
    capacidad
    cargados
    estado
  }
}
```

**Esperado:** buses activos en estado `CARGANDO` o `LISTO` (ver Fase 3 para lista completa en BD).

**Query (filtro por ruta):**

```graphql
query BusesPorRuta($routeCode: String) {
  busesDisponibles(routeCode: $routeCode) {
    placa
    flota
    routeCode
  }
}
```

**Variables:**

```json
{
  "routeCode": "SCZ-PQA"
}
```

**Esperado:** solo `2845-KCN` (Flota 18).

---

### 2.3 Obtener `parcelId` por tracking

**Auth:** ninguna (público)

```graphql
query ParcelTracking($trackingNumber: String!) {
  parcelByTracking(trackingNumber: $trackingNumber) {
    id
    trackingNumber
    status
    routeCode
    assignedBusPlaca
    assignedBusFlota
  }
}
```

**Variables:**

```json
{
  "trackingNumber": "EX-2026-SCZ-0048218"
}
```

Copiar `id` para las mutations siguientes.

---

### 2.4 `clasificarEncomienda`

**Auth:** Bearer bodega

```graphql
mutation Clasificar($input: ParcelActionInput!) {
  clasificarEncomienda(input: $input) {
    id
    trackingNumber
    status
    events {
      status
      note
      createdAt
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "parcelId": "PEGAR_UUID_AQUI",
    "note": "Clasificada en bodega SCZ"
  }
}
```

**Esperado:** `status` sigue `RECEPCIONADO`; nuevo evento con la nota.

---

### 2.5 `asignarBus`

**Auth:** Bearer bodega

```graphql
mutation AsignarBus($input: AsignarBusInput!) {
  asignarBus(input: $input) {
    id
    status
    assignedBusPlaca
    assignedBusFlota
    events {
      note
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "parcelId": "PEGAR_UUID_AQUI",
    "busPlaca": "2845-KCN",
    "busFlota": "Flota 18",
    "note": "Asignada para salida SCZ-PQA"
  }
}
```

**Esperado:** `status` = `RECEPCIONADO`; `assignedBusPlaca` = `2845-KCN`; `assignedBusFlota` = `Flota 18`.

---

### 2.6 `registrarCarga`

**Auth:** Bearer bodega

```graphql
mutation Carga($input: ParcelActionInput!) {
  registrarCarga(input: $input) {
    id
    trackingNumber
    status
    assignedBusPlaca
    assignedBusFlota
    events {
      status
      note
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "parcelId": "PEGAR_UUID_AQUI",
    "note": "Cargada en bus Flota 18"
  }
}
```

**Esperado:** `status` = `EN_TRANSITO`; evento con nota de carga.

> Si repites la prueba en la misma encomienda, vuelve a `RECEPCIONADO` con `updateParcelStatus` o re-ejecuta `npx prisma db seed`.

---

### 2.7 `registrarDescarga`

Usar encomienda en tránsito: **`EX-2026-SCZ-0048217`**.

**Auth:** Bearer bodega

```graphql
mutation Descarga($input: ParcelActionInput!) {
  registrarDescarga(input: $input) {
    id
    trackingNumber
    status
    events {
      status
      note
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "parcelId": "PEGAR_UUID_DE_0048217",
    "note": "Descargada en terminal PQA"
  }
}
```

**Esperado:** `status` = `EN_DESTINO`.

---

### 2.8 `marcarDisponible`

Usar encomienda en destino: **`EX-2026-SCZ-0048221`**.

**Auth:** Bearer bodega

```graphql
mutation Disponible($input: ParcelActionInput!) {
  marcarDisponible(input: $input) {
    id
    trackingNumber
    status
    events {
      status
      note
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "parcelId": "PEGAR_UUID_DE_0048221",
    "note": "Lista para retiro en ventanilla"
  }
}
```

**Esperado:** `status` = `DISPONIBLE` (luego Taquilla puede `confirmarRetiro` — Fase 1).

---

### 2.9 Errores esperados

**Clasificar en estado incorrecto** (ej. `EX-2026-SCZ-0048219` = `REGISTRADO`):

```json
{
  "input": {
    "parcelId": "UUID_DE_0048219",
    "note": "No debería permitirse"
  }
}
```

**Esperado:** error GraphQL — solo `RECEPCIONADO`.

**Cliente sin rol BODEGA** — token de `cliente@travell.test`, misma mutation `clasificarEncomienda`:

**Esperado:** `Forbidden` / 403.

---

### Flujo resumido (una encomienda)

```
RECEPCIONADO ──clasificar──► RECEPCIONADO (+ evento)
              ──asignarBus──► RECEPCIONADO (+ placa/flota)
              ──registrarCarga──► EN_TRANSITO
```

Descarga y disponible en encomiendas seed separadas para no pisar datos del flujo anterior.

---

## FASE 3 — Buses y asignación real

> Objetivo: buses persistidos en BD, `asignarEncomiendaABus` por `busId`, conteo `cargados`, tracking GPS simulado.

**Auth habitual:** `bodega@travell.test` / `bodega123` (admin para `crearBus`).

### Buses seed (referencia)

| placa | flota | routeCode | estado |
|-------|-------|-----------|--------|
| 2845-KCN | Flota 18 | SCZ-PQA | CARGANDO |
| 3190-BTZ | Flota 22 | SCZ-ROB | CARGANDO |
| 1876-MNP | Flota 05 | SCZ-SJC | EN_RUTA |
| 4521-ABZ | Flota 12 | PQA-SCZ | CARGANDO |

`EX-2026-SCZ-0048217` (EN_TRANSITO) ya viene asignada a `2845-KCN` tras el seed.

### Checklist Fase 3

| # | Prueba | OK | Notas |
|---|--------|----|-------|
| 1 | `buses` / `busesDisponibles` | ☐ | Incluye `cargados` |
| 2 | `bus(id)` | ☐ | |
| 3 | `asignarEncomiendaABus` | ☐ | Ruta SCZ-PQA + bus 2845-KCN |
| 4 | Error ruta distinta | ☐ | |
| 5 | `registrarCarga` sin bus (error) | ☐ | |
| 6 | `registrarCoordenadaBus` | ☐ | |
| 7 | `ultimaUbicacionBus` | ☐ | |
| 8 | `ubicacionBusPorEncomienda` | ☐ | Pública, parcel 0048217 |
| 9 | Admin `crearBus` | ☐ | |
| 10 | `asignarBus` legacy con placa en BD | ☐ | Delega a asignación real |

---

### 3.1 Query `busesDisponibles`

**Auth:** Bearer bodega

```graphql
query {
  busesDisponibles(routeCode: "SCZ-PQA") {
    id
    placa
    flota
    routeCode
    routeLabel
    capacidad
    cargados
    estado
    salidaProgramada
    conductor
  }
}
```

**Esperado:** al menos `2845-KCN` con `cargados >= 1` (encomienda en tránsito del seed).

---

### 3.2 Query `buses` (todos activos)

```graphql
query {
  buses {
    id
    placa
    flota
    routeCode
    cargados
    estado
    activo
  }
}
```

---

### 3.3 Query `bus` por ID

Obtener `id` desde `busesDisponibles`, luego:

```graphql
query Bus($id: ID!) {
  bus(id: $id) {
    id
    placa
    flota
    modelo
    conductor
    capacidad
    cargados
  }
}
```

---

### 3.4 `asignarEncomiendaABus`

Encomienda: `EX-2026-SCZ-0048218` (`RECEPCIONADO`, ruta `SCZ-PQA`).

**Auth:** Bearer bodega

```graphql
mutation Asignar($input: AsignarEncomiendaBusInput!) {
  asignarEncomiendaABus(input: $input) {
    id
    trackingNumber
    status
    assignedBusId
    assignedBusPlaca
    assignedBusFlota
    events {
      note
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "parcelId": "PEGAR_UUID_DE_0048218",
    "busId": "PEGAR_UUID_BUS_2845_KCN",
    "note": "Asignación Fase 3"
  }
}
```

**Esperado:** `assignedBusId` con UUID del bus; placa `2845-KCN`; estado `RECEPCIONADO`.

---

### 3.5 Error — ruta incompatible

Asignar encomienda `SCZ-PQA` a bus `3190-BTZ` (`SCZ-ROB`).

**Esperado:** error — rutas no coinciden.

---

### 3.6 `registrarCarga` sin bus previo

Encomienda `EX-2026-SCZ-0048219` (`REGISTRADO`, sin bus).

**Esperado:** error — debe asignar bus antes.

---

### 3.7 Tracking GPS

**Auth:** Bearer bodega

```graphql
mutation Track($input: RegistrarCoordenadaBusInput!) {
  registrarCoordenadaBus(input: $input) {
    busId
    lat
    lng
    velocidad
    recordedAt
  }
}
```

**Variables:**

```json
{
  "input": {
    "busId": "PEGAR_UUID_BUS_2845_KCN",
    "lat": -17.75,
    "lng": -63.15,
    "velocidad": 70
  }
}
```

**Query pública — ubicación por encomienda:**

```graphql
query Ubicacion($parcelId: ID!) {
  ubicacionBusPorEncomienda(parcelId: $parcelId) {
    lat
    lng
    velocidad
    recordedAt
  }
}
```

Usar `parcelId` de `EX-2026-SCZ-0048217`.

**Query última ubicación del bus:**

```graphql
query Ultima($busId: ID!) {
  ultimaUbicacionBus(busId: $busId) {
    lat
    lng
    recordedAt
  }
}
```

---

### 3.8 Admin — `crearBus`

**Auth:** Bearer admin

```graphql
mutation CrearBus($input: CrearBusInput!) {
  crearBus(input: $input) {
    id
    placa
    flota
    routeCode
    capacidad
    estado
  }
}
```

**Variables:**

```json
{
  "input": {
    "placa": "9999-TEST",
    "modelo": "Demo",
    "flota": "Flota 99",
    "routeCode": "SCZ-PQA",
    "capacidad": 15,
    "salidaProgramada": "20:00"
  }
}
```

---

### 3.9 `asignarBus` legacy (placa en BD)

Misma mutation Fase 2 (`asignarBus`) con `busPlaca: "2845-KCN"` — debe resolver el bus en BD y comportarse como 3.4.

---

### Nota Fase 2

`busesDisponibles` ahora lee de la tabla `buses` y devuelve tipo `Bus` (con `cargados`, `conductor`, enum `BusEstado`). Los IDs ya no son `b1`, `b2`… sino UUIDs del seed.

---

## FASE 4 — Reportes / Admin

> Objetivo: panel administrador — KPIs del día, indicadores por período y reporte paginado exportable. **Solo rol `ADMINISTRADOR`.**

**Auth:** login `admin@travell.test` / `admin123` → Bearer en Headers.

**Pantallas FE:** `DashboardPage.tsx` → `resumenDashboard`; `ReportesPage.tsx` → `indicadoresOperativos` + `reporteEncomiendas`.

### Checklist Fase 4

| # | Prueba | OK | Notas |
|---|--------|----|-------|
| 1 | Login admin | ☐ | |
| 2 | `resumenDashboard` | ☐ | KPIs hoy + últimas 5 |
| 3 | `indicadoresOperativos` (default 30 días) | ☐ | |
| 4 | `indicadoresOperativos` con rango custom | ☐ | |
| 5 | `reporteEncomiendas` sin filtros | ☐ | Paginación |
| 6 | `reporteEncomiendas` filtro estado/ruta | ☐ | |
| 7 | `reporteEncomiendas` filtro fechas | ☐ | |
| 8 | Bodega sin acceso (403) | ☐ | |
| 9 | Cliente sin acceso (403) | ☐ | |

---

### 4.1 Login admin

```json
{
  "input": {
    "email": "admin@travell.test",
    "password": "admin123"
  }
}
```

Mutation `login` (ver Fase 1.1).

---

### 4.2 `resumenDashboard`

**Auth:** Bearer admin

**Query:**

```graphql
query {
  resumenDashboard {
    fechaReferencia
    registradasHoy
    entregadasHoy
    enTransito
    disponiblesRetiro
    ultimasEncomiendas {
      id
      trackingNumber
      senderName
      recipientName
      routeCode
      routeLabel
      status
      createdAt
    }
    topRutas {
      routeCode
      routeLabel
      total
      porcentaje
    }
  }
}
```

**Esperado (con seed actual):**

- `enTransito` ≥ 1 (`EX-2026-SCZ-0048217`)
- `disponiblesRetiro` ≥ 1 (`EX-2026-PQA-0012340`)
- `ultimasEncomiendas` hasta 5 ítems ordenados por `createdAt` desc
- `topRutas` agrupación últimos 7 días

**Mapeo FE (DashboardPage mock):**

| Campo GraphQL | KPI mock FE |
|---------------|-------------|
| `registradasHoy` | Registradas Hoy |
| `enTransito` | En Tránsito |
| `entregadasHoy` | Entregadas Hoy |
| `disponiblesRetiro` | Disponibles Retiro |
| `ultimasEncomiendas` | tabla recientes |
| `topRutas` | barras por ruta |

---

### 4.3 `indicadoresOperativos`

**Auth:** Bearer admin

**Query (período por defecto: últimos 30 días):**

```graphql
query {
  indicadoresOperativos {
    fechaDesde
    fechaHasta
    totalRegistradas
    totalEntregadas
    totalEnTransito
    totalDisponibles
    totalCanceladas
    totalRecepcionadas
    totalEnDestino
    tasaEntregaExitosa
    encomiendasPorRuta {
      routeCode
      routeLabel
      total
      porcentaje
    }
  }
}
```

**Query con filtro de fechas:**

```graphql
query Indicadores($filter: IndicadoresFilterInput) {
  indicadoresOperativos(filter: $filter) {
    fechaDesde
    fechaHasta
    totalRegistradas
    totalEntregadas
    tasaEntregaExitosa
    encomiendasPorRuta {
      routeCode
      routeLabel
      total
      porcentaje
    }
  }
}
```

**Variables (ejemplo enero 2026):**

```json
{
  "filter": {
    "fechaDesde": "2026-01-01T00:00:00.000Z",
    "fechaHasta": "2026-05-31T23:59:59.000Z"
  }
}
```

**Notas:**

- Conteos por **estado** aplican a encomiendas **creadas** en el rango (`createdAt`).
- `tasaEntregaExitosa` = `totalEntregadas / totalRegistradas × 100` (0 si no hay registros).

---

### 4.4 `reporteEncomiendas` (paginado)

**Auth:** Bearer admin

```graphql
query Reporte($filter: ReporteEncomiendasFilterInput) {
  reporteEncomiendas(filter: $filter) {
    total
    page
    pageSize
    totalPages
    items {
      id
      trackingNumber
      status
      routeCode
      senderName
      recipientName
      weight
      createdAt
      deliveredAt
    }
  }
}
```

**Variables — listado completo página 1:**

```json
{
  "filter": {
    "page": 1,
    "pageSize": 20
  }
}
```

**Variables — filtro por estado y ruta:**

```json
{
  "filter": {
    "status": "RECEPCIONADO",
    "routeCode": "SCZ-PQA",
    "page": 1,
    "pageSize": 10
  }
}
```

**Variables — filtro por fechas + búsqueda:**

```json
{
  "filter": {
    "fechaDesde": "2026-05-01T00:00:00.000Z",
    "fechaHasta": "2026-05-31T23:59:59.000Z",
    "search": "SCZ",
    "page": 1,
    "pageSize": 50
  }
}
```

**Esperado:** `total` = total de filas que cumplen filtro; `items.length` ≤ `pageSize`; `totalPages` = `ceil(total / pageSize)`.

**Export CSV (FE):** iterar páginas con `page` 1…`totalPages` o subir `pageSize` (máx. 100).

---

### 4.5 Errores esperados

Token de `bodega@travell.test` o `cliente@travell.test` en cualquiera de las queries anteriores:

**Esperado:** `Forbidden` / 403.

---

### Tipos GraphQL nuevos (Fase 4)

```
ResumenDashboard
EncomiendaResumen
IndicadoresOperativos
RutaConteo
ReporteEncomiendasResult
ReporteEncomiendasFilterInput
IndicadoresFilterInput
```

---


## Notas / incidencias

| Fecha | Fase | Descripción |
|-------|------|-------------|
| | | |
