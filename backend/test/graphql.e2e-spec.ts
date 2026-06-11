import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('GraphQL API — Pruebas de Integración E2E', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let bodegaToken: string;
  let taquillaToken: string;
  let createdParcelId: string;
  let createdTrackingNumber: string;
  let testBusId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════
  // 1. AUTENTICACIÓN Y CONTROL DE ACCESO
  // ═══════════════════════════════════════════════════════════════
  describe('1. Autenticación y Control de Acceso por Roles', () => {
    it('CP-01: Debería autenticar correctamente al Administrador y retornar JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation { login(input: { email: "admin@travell.test", password: "admin123" }) { accessToken user { nombre rol } } }`,
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.login.accessToken).toBeDefined();
      expect(res.body.data.login.user.rol).toBe('ADMINISTRADOR');
      expect(res.body.data.login.user.nombre).toBeDefined();
      adminToken = res.body.data.login.accessToken;
    });

    it('CP-02: Debería autenticar correctamente al Bodeguero', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation { login(input: { email: "bodega@travell.test", password: "bodega123" }) { accessToken user { rol } } }`,
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.login.user.rol).toBe('BODEGA');
      bodegaToken = res.body.data.login.accessToken;
    });

    it('CP-03: Debería autenticar correctamente al Taquillero', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation { login(input: { email: "taquilla@travell.test", password: "taquilla123" }) { accessToken user { rol } } }`,
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.login.user.rol).toBe('TAQUILLA');
      taquillaToken = res.body.data.login.accessToken;
    });

    it('CP-04: Debería rechazar credenciales inválidas con mensaje de error', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation { login(input: { email: "admin@travell.test", password: "clave_incorrecta" }) { accessToken } }`,
        })
        .expect(200);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('Credenciales inválidas');
    });

    it('CP-05: Debería denegar acceso a reportes sin token de autenticación', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `query { resumenDashboard { registradasHoy } }`,
        })
        .expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. REGISTRO DE ENCOMIENDA
  // ═══════════════════════════════════════════════════════════════
  describe('2. Registro de Encomienda y Generación de Código', () => {
    it('CP-06: Debería registrar una nueva encomienda con pago en efectivo y generar código de rastreo', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation CreateParcel($input: CreateParcelInput!) {
            createParcel(input: $input) {
              id trackingNumber status senderName recipientName
              routeCode costoEnvio estadoPago metodoPago createdAt
            }
          }`,
          variables: {
            input: {
              senderName: 'Carlos Mendoza',
              senderCi: '4523678',
              senderPhone: '+591 70112233',
              senderEmail: 'carlos.mendoza@gmail.com',
              recipientName: 'Ana Flores',
              recipientCi: '8876543',
              recipientPhone: '+591 69887766',
              content: 'Documentos legales y contratos',
              weight: 2.5,
              routeCode: 'SCZ-PQA',
              tipoPago: 'REMITENTE',
              metodoPago: 'EFECTIVO',
              categoria: 'DOCUMENTOS',
            },
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const parcel = res.body.data.createParcel;
      expect(parcel.id).toBeDefined();
      expect(parcel.trackingNumber).toMatch(/^EX-\d{4}-[A-Z]{3}-\d+$/);
      expect(parcel.status).toBe('REGISTRADO');
      expect(parcel.senderName).toBe('Carlos Mendoza');
      expect(parcel.recipientName).toBe('Ana Flores');
      expect(parcel.costoEnvio).toBeGreaterThan(0);
      expect(parcel.estadoPago).toBe('PENDIENTE');
      expect(parcel.metodoPago).toBe('EFECTIVO');

      createdParcelId = parcel.id;
      createdTrackingNumber = parcel.trackingNumber;
    });

    it('CP-07: Debería rechazar la creación de encomienda con ruta inválida', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation CreateParcel($input: CreateParcelInput!) {
            createParcel(input: $input) { id }
          }`,
          variables: {
            input: {
              senderName: 'Test',
              senderCi: '0000000',
              senderPhone: '70000000',
              senderEmail: 'test@test.com',
              recipientName: 'Test Dest',
              recipientCi: '0000001',
              recipientPhone: '70000001',
              content: 'Test',
              weight: 1.0,
              routeCode: 'RUTA-INVALIDA',
            },
          },
        });

      // La API debe devolver un error por ruta no válida o fallar en el procesamiento
      const hasError = res.body.errors !== undefined ||
                       res.status !== 200 ||
                       res.body.data?.createParcel === null;
      expect(hasError).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. GENERACIÓN DE ETIQUETA (CÓDIGO PDF417)
  // ═══════════════════════════════════════════════════════════════
  describe('3. Generación de Etiqueta con Código PDF417', () => {
    it('CP-08: Debería generar la etiqueta con código de barras PDF417 en base64', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `query GenerarEtiqueta($parcelId: String!) {
            generarEtiqueta(parcelId: $parcelId)
          }`,
          variables: { parcelId: createdParcelId },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const etiqueta = res.body.data.generarEtiqueta;
      expect(etiqueta).toBeDefined();
      expect(etiqueta).toContain('data:image/png;base64,');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. CONSULTA DE ESTADO Y RASTREO PÚBLICO
  // ═══════════════════════════════════════════════════════════════
  describe('4. Consulta de Estado y Rastreo Público', () => {
    it('CP-09: Debería consultar una encomienda por su código de rastreo', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `query ParcelByTracking($trackingNumber: String!) {
            parcelByTracking(trackingNumber: $trackingNumber) {
              id trackingNumber status senderName recipientName
              routeCode weight costoEnvio estadoPago
              events { id status note createdAt }
            }
          }`,
          variables: { trackingNumber: createdTrackingNumber },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const parcel = res.body.data.parcelByTracking;
      expect(parcel.trackingNumber).toBe(createdTrackingNumber);
      expect(parcel.status).toBe('REGISTRADO');
      expect(parcel.senderName).toBe('Carlos Mendoza');
      expect(parcel.events).toBeDefined();
      expect(Array.isArray(parcel.events)).toBe(true);
    });

    it('CP-10: Debería retornar error al buscar un código de rastreo inexistente', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `query { parcelByTracking(trackingNumber: "EX-0000-XXX-9999999") {
            id trackingNumber
          }}`,
        })
        .expect(200);

      expect(res.body.errors).toBeDefined();
    });

    it('CP-11: Debería listar encomiendas con filtro por estado', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `query Parcels($filter: ParcelsFilterInput) {
            parcels(filter: $filter) {
              id trackingNumber status senderName recipientName routeCode
            }
          }`,
          variables: { filter: { status: 'REGISTRADO' } },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const parcels = res.body.data.parcels;
      expect(Array.isArray(parcels)).toBe(true);
      expect(parcels.length).toBeGreaterThan(0);
      parcels.forEach((p: any) => expect(p.status).toBe('REGISTRADO'));
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. ACTUALIZACIÓN DE ESTADO OPERATIVO (CICLO DE VIDA COMPLETO)
  // ═══════════════════════════════════════════════════════════════
  describe('5. Actualización de Estado Operativo — Ciclo de Vida Completo', () => {
    it('CP-12: Debería listar buses disponibles para la ruta', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: `query { buses { id placa routeCode capacidad } }` })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const buses = res.body.data.buses;
      expect(buses.length).toBeGreaterThan(0);
      const matchingBus = buses.find((b: any) => b.routeCode === 'SCZ-PQA');
      expect(matchingBus).toBeDefined();
      testBusId = matchingBus.id;
    });

    it('CP-13: Debería recepcionar la encomienda → estado RECEPCIONADO', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query: `mutation UpdateStatus($input: UpdateParcelStatusInput!) {
            updateParcelStatus(input: $input) { id status }
          }`,
          variables: {
            input: {
              id: createdParcelId,
              status: 'RECEPCIONADO',
              note: 'Paquete recibido en bodega de origen',
            },
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateParcelStatus.status).toBe('RECEPCIONADO');
    });

    it('CP-14: Debería clasificar la encomienda en bodega', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query: `mutation Clasificar($input: ParcelActionInput!) {
            clasificarEncomienda(input: $input) { id status }
          }`,
          variables: { input: { parcelId: createdParcelId, note: 'Clasificado en bodega norte' } },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.clasificarEncomienda.status).toBe('RECEPCIONADO');
    });

    it('CP-15: Debería asignar la encomienda a un bus de la ruta', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query: `mutation AsignarBus($input: AsignarEncomiendaBusInput!) {
            asignarEncomiendaABus(input: $input) { id assignedBusId }
          }`,
          variables: { input: { parcelId: createdParcelId, busId: testBusId, note: 'Asignado' } },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.asignarEncomiendaABus.assignedBusId).toBe(testBusId);
    });

    it('CP-16: Debería registrar carga en bus → estado EN_TRANSITO', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query: `mutation RegistrarCarga($input: ParcelActionInput!) {
            registrarCarga(input: $input) { id status }
          }`,
          variables: { input: { parcelId: createdParcelId, note: 'Cargado en bus' } },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.registrarCarga.status).toBe('EN_TRANSITO');
    });

    it('CP-17: Debería registrar descarga en destino → estado EN_DESTINO', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query: `mutation RegistrarDescarga($input: ParcelActionInput!) {
            registrarDescarga(input: $input) { id status }
          }`,
          variables: { input: { parcelId: createdParcelId, note: 'Descargado en destino' } },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.registrarDescarga.status).toBe('EN_DESTINO');
    });

    it('CP-18: Debería marcar disponible para retiro → estado DISPONIBLE', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query: `mutation MarcarDisponible($input: ParcelActionInput!) {
            marcarDisponible(input: $input) { id status }
          }`,
          variables: { input: { parcelId: createdParcelId, note: 'Listo para retiro' } },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.marcarDisponible.status).toBe('DISPONIBLE');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. CONFIRMACIÓN DE RETIRO Y VALIDACIÓN DE ENTREGA
  // ═══════════════════════════════════════════════════════════════
  describe('6. Confirmación de Retiro y Validación de Entrega', () => {
    it('CP-19: Debería rechazar retiro con CI del destinatario incorrecta', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${taquillaToken}`)
        .send({
          query: `mutation ConfirmarRetiro($input: ConfirmarRetiroInput!) {
            confirmarRetiro(input: $input) { id status }
          }`,
          variables: { input: { parcelId: createdParcelId, recipientCi: 'CI_ERRONEA' } },
        })
        .expect(200);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('CI');
    });

    it('CP-20: Debería registrar pago en efectivo exitosamente', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation RegistrarPago($id: ID!, $metodoPago: String) {
            registrarPago(id: $id, metodoPago: $metodoPago) { id estadoPago metodoPago }
          }`,
          variables: { id: createdParcelId, metodoPago: 'EFECTIVO' },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.registrarPago.estadoPago).toBe('PAGADO');
      expect(res.body.data.registrarPago.metodoPago).toBe('EFECTIVO');
    });

    it('CP-21: Debería confirmar retiro con CI correcta → estado ENTREGADO', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${taquillaToken}`)
        .send({
          query: `mutation ConfirmarRetiro($input: ConfirmarRetiroInput!) {
            confirmarRetiro(input: $input) { id status deliveredAt }
          }`,
          variables: { input: { parcelId: createdParcelId, recipientCi: '8876543' } },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.confirmarRetiro.status).toBe('ENTREGADO');
      expect(res.body.data.confirmarRetiro.deliveredAt).toBeDefined();
    });

    it('CP-22: Debería verificar que el rastreo refleja el estado final ENTREGADO', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `query { parcelByTracking(trackingNumber: "${createdTrackingNumber}") {
            status estadoPago events { status note }
          }}`,
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const parcel = res.body.data.parcelByTracking;
      expect(parcel.status).toBe('ENTREGADO');
      expect(parcel.estadoPago).toBe('PAGADO');
      expect(parcel.events.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 7. REPORTES Y PANEL ADMINISTRATIVO
  // ═══════════════════════════════════════════════════════════════
  describe('7. Reportes y Panel Administrativo', () => {
    it('CP-23: Debería obtener el resumen del dashboard con KPIs operativos', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `query { resumenDashboard {
            registradasHoy enTransito disponiblesRetiro entregadasHoy fechaReferencia
            topRutas { routeCode routeLabel total }
            ultimasEncomiendas { id trackingNumber status senderName }
          }}`,
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const resumen = res.body.data.resumenDashboard;
      expect(typeof resumen.registradasHoy).toBe('number');
      expect(typeof resumen.enTransito).toBe('number');
      expect(typeof resumen.disponiblesRetiro).toBe('number');
      expect(typeof resumen.entregadasHoy).toBe('number');
      expect(resumen.fechaReferencia).toBeDefined();
      expect(Array.isArray(resumen.topRutas)).toBe(true);
      expect(Array.isArray(resumen.ultimasEncomiendas)).toBe(true);
    });

    it('CP-24: Debería obtener indicadores operativos con datos financieros', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `query { indicadoresOperativos {
            totalRegistradas totalEntregadas totalCanceladas tasaEntregaExitosa
            totalVentaEtiquetas montoTotalRegistrado montoTotalPagado montoTotalPendiente
            encomiendasPorRuta { routeCode total }
            fechaDesde fechaHasta
          }}`,
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const kpis = res.body.data.indicadoresOperativos;
      expect(kpis.totalRegistradas).toBeGreaterThan(0);
      expect(kpis.totalEntregadas).toBeGreaterThanOrEqual(0);
      expect(typeof kpis.tasaEntregaExitosa).toBe('number');
      expect(typeof kpis.totalVentaEtiquetas).toBe('number');
      expect(typeof kpis.montoTotalRegistrado).toBe('number');
      expect(typeof kpis.montoTotalPagado).toBe('number');
      expect(typeof kpis.montoTotalPendiente).toBe('number');
      expect(Array.isArray(kpis.encomiendasPorRuta)).toBe(true);
    });

    it('CP-25: Debería obtener reporte de encomiendas con paginación', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `query ReporteEncomiendas($filter: ReporteEncomiendasFilterInput) {
            reporteEncomiendas(filter: $filter) {
              items { id trackingNumber status costoEnvio estadoPago }
              total page pageSize totalPages
            }
          }`,
          variables: { filter: { pageSize: 5 } },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const reporte = res.body.data.reporteEncomiendas;
      expect(reporte.total).toBeGreaterThan(0);
      expect(reporte.items.length).toBeLessThanOrEqual(5);
      expect(reporte.page).toBe(1);
      expect(reporte.totalPages).toBeGreaterThanOrEqual(1);
    });
  });
});
